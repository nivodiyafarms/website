from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from uuid import UUID

from app.database import get_db
from app.models.general_expense import GeneralExpense, ExpenseReviewStatus
from app.models.user import User
from app.schemas.general_expense import (
    GeneralExpenseCreate,
    GeneralExpenseUpdate,
    GeneralExpenseResponse,
)
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/general-expenses", tags=["general-expenses"])


def _to_response(e: GeneralExpense) -> GeneralExpenseResponse:
    return GeneralExpenseResponse(
        general_expense_id=e.general_expense_id,
        expense_no=e.expense_no,
        category=e.category,
        subcategory=e.subcategory,
        description=e.description,
        date=e.date,
        qty=float(e.qty) if e.qty is not None else None,
        unit=e.unit,
        unit_rate=float(e.unit_rate) if e.unit_rate is not None else None,
        total_cost=float(e.total_cost) if e.total_cost is not None else None,
        review_status=e.review_status.value if e.review_status else "unreviewed",
        void_reason=e.void_reason,
        payment_mode=e.payment_mode,
        payment_mode_custom=e.payment_mode_custom,
        created_by=e.created_by,
        created_at=e.created_at,
    )


def _next_expense_no(db: Session) -> str:
    max_no = db.execute(
        __import__('sqlalchemy').text(
            "SELECT MAX(expense_no) FROM general_expense WHERE expense_no ~ '^GE[0-9]+$'"
        )
    ).scalar()
    if max_no:
        n = int(max_no[2:]) + 1
    else:
        n = 1
    return f"GE{n:04d}"


VALID_PAYMENT_MODES = {"firm_account", "cash", "personal_upi", "other"}


@router.get("/", response_model=List[GeneralExpenseResponse])
def get_general_expenses(
    date_from:     Optional[date] = Query(None, description="Inclusive start date (expense.date)"),
    date_to:       Optional[date] = Query(None, description="Inclusive end date (expense.date)"),
    review_status: Optional[str]  = Query(None, description="unreviewed | verified | void"),
    payment_mode:  Optional[str]  = Query(None, description="firm_account | cash | personal_upi | other"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(GeneralExpense)
    if date_from:
        q = q.filter(GeneralExpense.date >= date_from)
    if date_to:
        q = q.filter(GeneralExpense.date <= date_to)
    if review_status and review_status in ("unreviewed", "verified", "void"):
        q = q.filter(GeneralExpense.review_status == ExpenseReviewStatus(review_status))
    if payment_mode and payment_mode in VALID_PAYMENT_MODES:
        q = q.filter(GeneralExpense.payment_mode == payment_mode)
    expenses = q.order_by(GeneralExpense.created_at.desc()).all()
    return [_to_response(e) for e in expenses]


@router.get("/{expense_id}", response_model=GeneralExpenseResponse)
def get_general_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    e = db.query(GeneralExpense).filter(GeneralExpense.general_expense_id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="General expense not found")
    return _to_response(e)


@router.post("/", response_model=GeneralExpenseResponse, status_code=201)
def create_general_expense(
    payload: GeneralExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.total_cost or payload.total_cost <= 0:
        raise HTTPException(status_code=400, detail="राशि 0 से ज़्यादा होनी चाहिए")

    e = GeneralExpense(
        expense_no=_next_expense_no(db),
        category=payload.category,
        subcategory=payload.subcategory,
        description=payload.description,
        date=payload.date or date.today(),
        qty=payload.qty,
        unit=payload.unit,
        unit_rate=payload.unit_rate,
        total_cost=payload.total_cost,
        payment_mode=payload.payment_mode,
        payment_mode_custom=payload.payment_mode_custom,
        review_status=ExpenseReviewStatus.UNREVIEWED,
        created_by=None,  # TODO(auth-slice-6): set from current_user
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return _to_response(e)


@router.put("/{expense_id}", response_model=GeneralExpenseResponse)
def update_general_expense(
    expense_id: UUID,
    payload: GeneralExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    e = db.query(GeneralExpense).filter(GeneralExpense.general_expense_id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="General expense not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "total_cost" in update_data and (update_data["total_cost"] is None or update_data["total_cost"] <= 0):
        raise HTTPException(status_code=400, detail="राशि 0 से ज़्यादा होनी चाहिए")

    for key, value in update_data.items():
        setattr(e, key, value)

    db.commit()
    db.refresh(e)
    return _to_response(e)


@router.patch("/{expense_id}/verify", response_model=GeneralExpenseResponse)
def verify_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    e = db.query(GeneralExpense).filter(GeneralExpense.general_expense_id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="General expense not found")
    if e.review_status == ExpenseReviewStatus.VOID:
        raise HTTPException(status_code=400, detail="रद्द किया गया खर्च सत्यापित नहीं हो सकता")

    e.review_status = ExpenseReviewStatus.VERIFIED
    # TODO(auth-slice-6): e.reviewed_by = current_user.worker_id (once users↔workers linked)
    db.commit()
    db.refresh(e)
    return _to_response(e)


@router.patch("/{expense_id}/void", response_model=GeneralExpenseResponse)
def void_expense(
    expense_id: UUID,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="रद्द करने का कारण बताओ")

    e = db.query(GeneralExpense).filter(GeneralExpense.general_expense_id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="General expense not found")

    e.review_status = ExpenseReviewStatus.VOID
    e.void_reason = reason.strip()
    db.commit()
    db.refresh(e)
    return _to_response(e)


@router.delete("/{expense_id}", status_code=204)
def delete_general_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    e = db.query(GeneralExpense).filter(GeneralExpense.general_expense_id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="General expense not found")
    db.delete(e)
    db.commit()
