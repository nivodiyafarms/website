from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from uuid import UUID

from app.database import get_db
from app.models.general_expense import GeneralExpense
from app.models.user import User
from app.schemas.general_expense import (
    GeneralExpenseCreate,
    GeneralExpenseUpdate,
    GeneralExpenseResponse,
)
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/general-expenses", tags=["general-expenses"])


# -----------------------------------------------------
# Helper: Map frontend payload to DB structure
# -----------------------------------------------------
def _map_frontend_to_db(data: GeneralExpenseCreate) -> dict:
    expense_dict = {}

    expense_dict["category"] = data.resource_type or data.category
    expense_dict["subcategory"] = (
        data.resource_code or data.expense_code or data.subcategory
    )

    expense_dict["qty"] = data.quantity or data.qty
    expense_dict["unit_rate"] = data.rate or data.unit_rate
    expense_dict["total_cost"] = data.total_amount or data.total_cost
    expense_dict["date"] = data.expense_date or data.date
    expense_dict["unit"] = data.unit

    # Build description
    description_parts = []
    if data.notes:
        description_parts.append(f"Notes: {data.notes}")
    if data.vendor_name:
        description_parts.append(f"Vendor: {data.vendor_name}")
    if data.invoice_no:
        description_parts.append(f"Invoice: {data.invoice_no}")

    expense_dict["description"] = (
        " | ".join(description_parts) if description_parts else data.description
    )

    expense_dict["related_type"] = data.related_type
    expense_dict["related_id"] = data.related_id

    # TEMP: until auth fully integrated
    expense_dict["created_by"] = None

    return expense_dict


# -----------------------------------------------------
# GET ALL
# -----------------------------------------------------
@router.get("/", response_model=List[GeneralExpenseResponse])
def get_general_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        expenses = (
            db.query(GeneralExpense)
            .order_by(GeneralExpense.created_at.desc())
            .all()
        )

        return [
            GeneralExpenseResponse(
                general_expense_id=e.general_expense_id,
                category=e.category,
                subcategory=e.subcategory,
                description=e.description,
                date=e.date,
                qty=float(e.qty) if e.qty is not None else None,
                unit=e.unit,
                unit_rate=float(e.unit_rate) if e.unit_rate is not None else None,
                total_cost=float(e.total_cost) if e.total_cost is not None else None,
                related_type=e.related_type,
                related_id=e.related_id,
                created_by=e.created_by,
                created_at=e.created_at,
            )
            for e in expenses
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching expenses: {str(e)}",
        )


# -----------------------------------------------------
# GET ONE
# -----------------------------------------------------
@router.get("/{expense_id}", response_model=GeneralExpenseResponse)
def get_general_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = (
        db.query(GeneralExpense)
        .filter(GeneralExpense.general_expense_id == expense_id)
        .first()
    )

    if not expense:
        raise HTTPException(status_code=404, detail="General expense not found")

    return GeneralExpenseResponse(
        general_expense_id=expense.general_expense_id,
        category=expense.category,
        subcategory=expense.subcategory,
        description=expense.description,
        date=expense.date,
        qty=float(expense.qty) if expense.qty is not None else None,
        unit=expense.unit,
        unit_rate=float(expense.unit_rate) if expense.unit_rate is not None else None,
        total_cost=float(expense.total_cost) if expense.total_cost is not None else None,
        related_type=expense.related_type,
        related_id=expense.related_id,
        created_by=expense.created_by,
        created_at=expense.created_at,
    )


# -----------------------------------------------------
# CREATE
# -----------------------------------------------------
@router.post("/", response_model=GeneralExpenseResponse, status_code=201)
def create_general_expense(
    expense: GeneralExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense_dict = _map_frontend_to_db(expense)

    db_expense = GeneralExpense(**expense_dict)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    return GeneralExpenseResponse(
        general_expense_id=db_expense.general_expense_id,
        category=db_expense.category,
        subcategory=db_expense.subcategory,
        description=db_expense.description,
        date=db_expense.date,
        qty=float(db_expense.qty) if db_expense.qty is not None else None,
        unit=db_expense.unit,
        unit_rate=float(db_expense.unit_rate) if db_expense.unit_rate is not None else None,
        total_cost=float(db_expense.total_cost) if db_expense.total_cost is not None else None,
        related_type=db_expense.related_type,
        related_id=db_expense.related_id,
        created_by=db_expense.created_by,
        created_at=db_expense.created_at,
    )


# -----------------------------------------------------
# UPDATE
# -----------------------------------------------------
@router.put("/{expense_id}", response_model=GeneralExpenseResponse)
def update_general_expense(
    expense_id: UUID,
    expense_update: GeneralExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_expense = (
        db.query(GeneralExpense)
        .filter(GeneralExpense.general_expense_id == expense_id)
        .first()
    )

    if not db_expense:
        raise HTTPException(status_code=404, detail="General expense not found")

    update_dict = expense_update.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(db_expense, key, value)

    db.commit()
    db.refresh(db_expense)

    return GeneralExpenseResponse(
        general_expense_id=db_expense.general_expense_id,
        category=db_expense.category,
        subcategory=db_expense.subcategory,
        description=db_expense.description,
        date=db_expense.date,
        qty=float(db_expense.qty) if db_expense.qty is not None else None,
        unit=db_expense.unit,
        unit_rate=float(db_expense.unit_rate) if db_expense.unit_rate is not None else None,
        total_cost=float(db_expense.total_cost) if db_expense.total_cost is not None else None,
        related_type=db_expense.related_type,
        related_id=db_expense.related_id,
        created_by=db_expense.created_by,
        created_at=db_expense.created_at,
    )


# -----------------------------------------------------
# DELETE
# -----------------------------------------------------
@router.delete("/{expense_id}", status_code=204)
def delete_general_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_expense = (
        db.query(GeneralExpense)
        .filter(GeneralExpense.general_expense_id == expense_id)
        .first()
    )

    if not db_expense:
        raise HTTPException(status_code=404, detail="General expense not found")

    db.delete(db_expense)
    db.commit()