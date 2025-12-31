"""
Utility functions for generating sequential IDs
Format: IN0001, TA0001, WO0001, etc.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional


def generate_incident_id(db: Session) -> str:
    """
    Generate the next sequential incident ID (IN0001, IN0002, etc.)
    
    Args:
        db: Database session
        
    Returns:
        str: Next incident ID (e.g., "IN0001")
    """
    return _generate_sequential_id(db, "crop_cycles", "incident_no", "IN")


def generate_task_id(db: Session) -> str:
    """
    Generate the next sequential task ID (TA0001, TA0002, etc.)
    
    Args:
        db: Database session
        
    Returns:
        str: Next task ID (e.g., "TA0001")
    """
    return _generate_sequential_id(db, "tasks", "task_no", "TA")


def generate_work_order_id(db: Session) -> str:
    """
    Generate the next sequential work order ID (WO0001, WO0002, etc.)
    
    Args:
        db: Database session
        
    Returns:
        str: Next work order ID (e.g., "WO0001")
    """
    return _generate_sequential_id(db, "work_orders", "work_order_no", "WO")


def _generate_sequential_id(db: Session, table_name: str, column_name: str, prefix: str) -> str:
    """
    Generate a sequential ID by finding the highest existing number and incrementing.
    
    Args:
        db: Database session
        table_name: Name of the database table
        column_name: Name of the column storing the ID
        prefix: Prefix for the ID (e.g., "IN", "TA", "WO")
        
    Returns:
        str: Next sequential ID (e.g., "IN0001")
    """
    try:
        # Query to find the maximum number from existing IDs
        # Extract numeric part from IDs like IN0001, IN0002, etc.
        query = text(f"""
            SELECT COALESCE(MAX(
                CAST(
                    SUBSTRING({column_name} FROM '{prefix}([0-9]+)') AS INTEGER
                )
            ), 0) as max_num
            FROM {table_name}
            WHERE {column_name} IS NOT NULL 
            AND {column_name} ~ '^{prefix}[0-9]+$'
        """)
        
        result = db.execute(query).scalar()
        max_num = result if result is not None else 0
        
        # Increment and format
        next_num = max_num + 1
        next_id = f"{prefix}{next_num:04d}"  # Format as 4-digit number with leading zeros
        
        return next_id
        
    except Exception as e:
        # Fallback: if query fails, try a simpler approach
        # Get all existing IDs and find the max
        try:
            query = text(f"SELECT {column_name} FROM {table_name} WHERE {column_name} IS NOT NULL")
            results = db.execute(query).fetchall()
            
            max_num = 0
            for row in results:
                id_value = row[0] if isinstance(row, tuple) else getattr(row, column_name, None)
                if id_value and id_value.startswith(prefix):
                    try:
                        # Extract number part (after prefix)
                        num_str = id_value[len(prefix):]
                        num = int(num_str)
                        max_num = max(max_num, num)
                    except (ValueError, IndexError):
                        continue
            
            next_num = max_num + 1
            next_id = f"{prefix}{next_num:04d}"
            return next_id
            
        except Exception as fallback_error:
            # Last resort: start from 1
            return f"{prefix}0001"







