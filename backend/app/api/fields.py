import uuid as _uuid
from datetime import date as DateType
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database import get_db
from app.models.enums import ResourceType
from app.models.field import Field
from app.models.task import Task, TaskStatus, TaskCategory
from app.models.user import User
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.models.work_order_resource import WorkOrderResource
from app.schemas.field import FieldCreate, FieldUpdate, FieldResponse
from app.utils.id_generator import generate_task_id, generate_work_order_id

router = APIRouter(prefix="/api/fields", tags=["fields"])


# ── Shared response schemas ────────────────────────────────────────────────────

class FieldWithPrepCost(BaseModel):
    field_id: str
    name: str
    area_acre: float
    village: Optional[str] = None
    prep_cost: float

    class Config:
        from_attributes = True


class ResourceLineOut(BaseModel):
    name: str
    resource_type: str
    cost: float


class PrepWorkOrderItem(BaseModel):
    work_order_id: str
    task_id: str
    work_order_number: str
    description: str
    prep_season: Optional[str]
    prep_crop_year: Optional[int]
    cost: float
    resources: List[ResourceLineOut]


class FieldPrepWorkResponse(BaseModel):
    field_id: str
    name: str
    area_acre: float
    total_prep_cost: float
    work_orders: List[PrepWorkOrderItem]


# ── Request schemas ────────────────────────────────────────────────────────────

class ResourceLineIn(BaseModel):
    name: str
    resource_type: str = "other"
    cost: float

    @field_validator("cost")
    @classmethod
    def cost_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("लागत 0 से ज़्यादा होनी चाहिए")
        return v


class PrepWorkCreate(BaseModel):
    description: str
    prep_season: str
    prep_crop_year: int
    resources: List[ResourceLineIn]
    work_date: Optional[DateType] = None

    @field_validator("resources")
    @classmethod
    def at_least_one(cls, v: list) -> list:
        if not v:
            raise ValueError("कम से कम एक लागत लाइन होनी चाहिए")
        return v


# ── Helpers ───────────────────────────────────────────────────────────────────

def _field_prep_cost(db: Session, field_id: str) -> float:
    result = (
        db.query(func.coalesce(func.sum(WorkOrderResource.cost), 0))
        .join(WorkOrder, WorkOrder.work_order_id == WorkOrderResource.work_order_id)
        .join(Task, Task.task_id == WorkOrder.task_id)
        .filter(Task.field_id == field_id, Task.crop_cycle_id.is_(None))
        .scalar()
    )
    return float(result or 0)


def _build_wo_item(task: Task, wo: WorkOrder) -> PrepWorkOrderItem:
    resources = [
        ResourceLineOut(
            name=r.name or "",
            resource_type=r.resource_type.value if hasattr(r.resource_type, "value") else str(r.resource_type),
            cost=float(r.cost or 0),
        )
        for r in wo.resources
    ]
    wo_cost = sum(r.cost for r in resources)
    return PrepWorkOrderItem(
        work_order_id=str(wo.work_order_id),
        task_id=str(task.task_id),
        work_order_number=wo.work_order_number,
        description=wo.short_description or wo.work_order_number,
        prep_season=task.prep_season,
        prep_crop_year=task.prep_crop_year,
        cost=wo_cost,
        resources=resources,
    )


def _get_field_or_404(db: Session, field_id: str) -> Field:
    f = db.query(Field).filter(Field.field_id == field_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Field not found")
    return f


def _prep_work_response(db: Session, field: Field) -> FieldPrepWorkResponse:
    tasks = (
        db.query(Task)
        .filter(Task.field_id == field.field_id, Task.crop_cycle_id.is_(None))
        .all()
    )
    items: List[PrepWorkOrderItem] = []
    total = 0.0
    for task in tasks:
        for wo in task.work_orders:
            item = _build_wo_item(task, wo)
            total += item.cost
            items.append(item)
    items.sort(key=lambda x: (x.prep_crop_year or 0, x.work_order_number), reverse=True)
    return FieldPrepWorkResponse(
        field_id=field.field_id,
        name=field.name,
        area_acre=field.area_acre,
        total_prep_cost=total,
        work_orders=items,
    )


def _resource_type_from_str(rt: str) -> ResourceType:
    try:
        return ResourceType(rt)
    except ValueError:
        return ResourceType.other


# ── Fields CRUD (existing) ────────────────────────────────────────────────────

@router.get("/", response_model=List[FieldResponse])
def get_fields(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Field).all()


@router.get("/summary", response_model=List[FieldWithPrepCost])
def get_fields_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fields list with live prep cost for each field."""
    fields = db.query(Field).order_by(Field.name).all()
    return [
        FieldWithPrepCost(
            field_id=f.field_id, name=f.name, area_acre=f.area_acre,
            village=f.village, prep_cost=_field_prep_cost(db, f.field_id),
        )
        for f in fields
    ]


# ── Prep-work CRUD — all must come BEFORE /{field_id} ────────────────────────

@router.get("/{field_id}/prep-work", response_model=FieldPrepWorkResponse)
def get_field_prep_work(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = _get_field_or_404(db, field_id)
    return _prep_work_response(db, field)


@router.post("/{field_id}/prep-work", response_model=FieldPrepWorkResponse, status_code=201)
def create_prep_work(
    field_id: str,
    body: PrepWorkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atomically create prep task + WO + resources for a field."""
    field = _get_field_or_404(db, field_id)

    task = Task(
        task_id           = _uuid.uuid4(),
        task_number       = generate_task_id(db),
        crop_cycle_id     = None,               # prep task — no crop cycle
        field_id          = field_id,
        short_description = body.description,
        status            = TaskStatus.CLOSED,
        category          = TaskCategory.SOWING,
        prep_season       = body.prep_season,
        prep_crop_year    = body.prep_crop_year,
        assigned_to_id    = current_user.user_id,
        created_by_id     = current_user.user_id,  # TODO(auth): Slice 6
    )
    db.add(task); db.flush()

    wo = WorkOrder(
        work_order_id     = _uuid.uuid4(),
        work_order_number = generate_work_order_id(db),
        task_id           = task.task_id,
        short_description = body.description,
        status            = WorkOrderStatus.CLOSED,
        due_date          = body.work_date,
    )
    db.add(wo); db.flush()

    for line in body.resources:
        db.add(WorkOrderResource(
            work_order_resources_id = _uuid.uuid4(),
            work_order_id           = wo.work_order_id,
            resource_type           = _resource_type_from_str(line.resource_type),
            name                    = line.name,
            qty                     = 1,
            unit                    = "lot",
            rate                    = None,
            cost                    = line.cost,
        ))

    db.commit()
    db.refresh(field)
    return _prep_work_response(db, field)


@router.put("/{field_id}/prep-work/{work_order_id}", response_model=FieldPrepWorkResponse)
def update_prep_work(
    field_id: str,
    work_order_id: str,
    body: PrepWorkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Replace description, season tag, and resource lines for a prep WO."""
    field = _get_field_or_404(db, field_id)

    wo = db.query(WorkOrder).filter(
        WorkOrder.work_order_id == _uuid.UUID(work_order_id)
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    task = wo.task
    if not task or task.field_id != field_id or task.crop_cycle_id is not None:
        raise HTTPException(status_code=400, detail="Not a prep WO for this field")

    # Update task season tag + description
    task.short_description = body.description
    task.prep_season       = body.prep_season
    task.prep_crop_year    = body.prep_crop_year

    # Update WO description
    wo.short_description = body.description
    if body.work_date:
        wo.due_date = body.work_date

    # Replace resource lines — delete old, insert new
    db.query(WorkOrderResource).filter(
        WorkOrderResource.work_order_id == wo.work_order_id
    ).delete(synchronize_session=False)

    for line in body.resources:
        db.add(WorkOrderResource(
            work_order_resources_id = _uuid.uuid4(),
            work_order_id           = wo.work_order_id,
            resource_type           = _resource_type_from_str(line.resource_type),
            name                    = line.name,
            qty                     = 1,
            unit                    = "lot",
            rate                    = None,
            cost                    = line.cost,
        ))

    db.commit()
    db.refresh(field)
    return _prep_work_response(db, field)


@router.delete("/{field_id}/prep-work/{work_order_id}", status_code=204)
def delete_prep_work(
    field_id: str,
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(
        WorkOrder.work_order_id == _uuid.UUID(work_order_id)
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    task = wo.task
    if not task or task.field_id != field_id or task.crop_cycle_id is not None:
        raise HTTPException(status_code=400, detail="Not a prep WO for this field")

    # WO cascade deletes resources; delete task after WO
    task_obj = task
    db.delete(wo)
    db.flush()
    db.delete(task_obj)
    db.commit()


# ── Fields CRUD (existing, must come AFTER prep-work routes) ──────────────────

@router.get("/{field_id}", response_model=FieldResponse)
def get_field(field_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    field = db.query(Field).filter(Field.field_id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@router.post("/", response_model=FieldResponse, status_code=status.HTTP_201_CREATED)
def create_field(field: FieldCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_field = db.query(Field).filter(Field.field_id == field.field_id).first()
    if db_field:
        raise HTTPException(status_code=400, detail="Field ID already exists")
    db_field = Field(**field.model_dump())
    db.add(db_field); db.commit(); db.refresh(db_field)
    return db_field


@router.put("/{field_id}", response_model=FieldResponse)
def update_field(
    field_id: str, field_update: FieldUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    db_field = db.query(Field).filter(Field.field_id == field_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Field not found")
    for key, value in field_update.model_dump(exclude_unset=True).items():
        setattr(db_field, key, value)
    db.commit(); db.refresh(db_field)
    return db_field


@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_field(field_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_field = db.query(Field).filter(Field.field_id == field_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Field not found")
    db.delete(db_field); db.commit()
