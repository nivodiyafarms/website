from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from uuid import UUID
from app.database import get_db
from app.models.general_expense import GeneralExpense
from app.models.user import User
from app.schemas.general_expense import GeneralExpenseCreate, GeneralExpenseUpdate, GeneralExpenseResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/general-expenses", tags=["general-expenses"])


def _map_frontend_to_db(data: GeneralExpenseCreate) -> dict:
    """
    Map frontend form fields to database fields
    """
    expense_dict = {}
    
    # Map resource_type to category
    if data.resource_type:
        expense_dict['category'] = data.resource_type
    elif data.category:
        expense_dict['category'] = data.category
    
    # Map resource_code to subcategory, or use expense_code
    if data.resource_code:
        expense_dict['subcategory'] = data.resource_code
    elif data.expense_code:
        expense_dict['subcategory'] = data.expense_code
    elif data.subcategory:
        expense_dict['subcategory'] = data.subcategory
    
    # Map quantity to qty
    if data.quantity is not None:
        expense_dict['qty'] = data.quantity
    elif data.qty is not None:
        expense_dict['qty'] = data.qty
    
    # Map rate to unit_rate
    if data.rate is not None:
        expense_dict['unit_rate'] = data.rate
    elif data.unit_rate is not None:
        expense_dict['unit_rate'] = data.unit_rate
    
    # Map total_amount to total_cost
    if data.total_amount is not None:
        expense_dict['total_cost'] = data.total_amount
    elif data.total_cost is not None:
        expense_dict['total_cost'] = data.total_cost
    
    # Map expense_date to date
    if data.expense_date:
        expense_dict['date'] = data.expense_date
    elif data.date:
        expense_dict['date'] = data.date
    
    # Build description from notes, vendor_name, and invoice_no
    description_parts = []
    if data.notes:
        description_parts.append(f"Notes: {data.notes}")
    if data.vendor_name:
        description_parts.append(f"Vendor: {data.vendor_name}")
    if data.invoice_no:
        description_parts.append(f"Invoice: {data.invoice_no}")
    
    if description_parts:
        expense_dict['description'] = " | ".join(description_parts)
    elif data.description:
        expense_dict['description'] = data.description
    
    # Map other fields directly if they exist
    if data.unit:
        expense_dict['unit'] = data.unit
    if data.related_type:
        expense_dict['related_type'] = data.related_type
    if data.related_id:
        expense_dict['related_id'] = data.related_id
    
    return expense_dict


@router.get("/", response_model=List[GeneralExpenseResponse])
def get_general_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all general expenses"""
    try:
        # Simple query without complex ordering first
        expenses = db.query(GeneralExpense).all()
        
        # If no expenses, return empty list
        if not expenses:
            return []
        
        # Sort in Python to avoid SQL issues
        expenses_sorted = sorted(expenses, key=lambda x: (x.created_at or datetime.min, x.id), reverse=True)
        expenses_sorted = expenses_sorted[skip:skip+limit]
        
        # Manually construct response to ensure proper type conversion
        result = []
        for expense in expenses_sorted:
            try:
                result.append(GeneralExpenseResponse(
                    id=expense.id,
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
                    created_at=expense.created_at
                ))
            except Exception as e:
                # Log the error for this specific expense but continue
                print(f"Error constructing response for expense {expense.id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        error_detail = f"Error fetching expenses: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching expenses: {str(e)}"
        )


@router.get("/{expense_id}", response_model=GeneralExpenseResponse)
def get_general_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific general expense by ID"""
    expense = db.query(GeneralExpense).filter(GeneralExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="General expense not found")
    
    # Manually construct response to ensure proper type conversion
    return GeneralExpenseResponse(
        id=expense.id,
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
        created_at=expense.created_at
    )


@router.post("/", response_model=GeneralExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_general_expense(
    expense: GeneralExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new general expense"""
    # Map frontend fields to database fields
    expense_dict = _map_frontend_to_db(expense)
    
    # Set created_by to current user
    expense_dict['created_by'] = current_user.id
    
    # Create the expense
    db_expense = GeneralExpense(**expense_dict)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Manually construct response to ensure proper type conversion
    return GeneralExpenseResponse(
        id=db_expense.id,
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
        created_at=db_expense.created_at
    )


@router.put("/{expense_id}", response_model=GeneralExpenseResponse)
def update_general_expense(
    expense_id: UUID,
    expense_update: GeneralExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a general expense"""
    db_expense = db.query(GeneralExpense).filter(GeneralExpense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="General expense not found")
    
    # Update only provided fields
    update_dict = expense_update.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    
    # Manually construct response to ensure proper type conversion
    return GeneralExpenseResponse(
        id=db_expense.id,
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
        created_at=db_expense.created_at
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_general_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a general expense"""
    db_expense = db.query(GeneralExpense).filter(GeneralExpense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="General expense not found")
    
    db.delete(db_expense)
    db.commit()
    return None

