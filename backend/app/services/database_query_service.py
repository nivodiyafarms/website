"""
Database Query Service for Chatbot
Provides structured data queries for AI to format into natural language
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from app.models.crop_cycle import CropCycle, CropStage, CropCycleStatus
from app.models.task import Task, TaskStatus
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.models.work_order_resource import WorkOrderResource
from app.models.user import User


class DatabaseQueryService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_crop_cycles(
        self,
        incident_no: Optional[str] = None,
        field_code: Optional[str] = None,
        status: Optional[str] = None,
        current_stage: Optional[str] = None,
        crop_name: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Query crop cycles with filters
        
        Returns:
            List of crop cycle dictionaries with key information
        """
        query = self.db.query(CropCycle)
        
        if incident_no:
            query = query.filter(CropCycle.incident_no.ilike(f"%{incident_no}%"))
        if field_code:
            query = query.filter(CropCycle.field_code.ilike(f"%{field_code}%"))
        if status:
            query = query.filter(CropCycle.status == status.lower())
        if current_stage:
            query = query.filter(CropCycle.current_stage == current_stage.lower())
        if crop_name:
            query = query.filter(CropCycle.crop_name.ilike(f"%{crop_name}%"))
        
        cycles = query.order_by(CropCycle.created_at.desc()).limit(limit).all()
        
        result = []
        for cycle in cycles:
            result.append({
                "incident_id": str(cycle.id),
                "incident_no": cycle.incident_no,
                "field_code": cycle.field_code,
                "crop_name": cycle.crop_name,
                "crop_variety": cycle.seed_category,
                "season": cycle.season,
                "sowing_date": cycle.sowing_date.isoformat() if cycle.sowing_date else None,
                "expected_harvest_date": cycle.expected_harvest_date.isoformat() if cycle.expected_harvest_date else None,
                "current_stage": cycle.current_stage,
                "status": cycle.status,
                "cultivated_area": float(cycle.cultivated_area) if cycle.cultivated_area else None,
                "short_description": cycle.short_description,
                "description": cycle.description,
                "total_expense": float(cycle.total_expense) if cycle.total_expense else 0.0,
                "total_revenue": float(cycle.total_revenue) if cycle.total_revenue else 0.0,
                "profit": float(cycle.profit) if cycle.profit else 0.0,
                "created_at": cycle.created_at.isoformat() if cycle.created_at else None
            })
        
        return result
    
    def get_tasks(
        self,
        crop_cycle_id: Optional[UUID] = None,
        incident_no: Optional[str] = None,
        task_no: Optional[str] = None,
        task_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Query tasks with filters
        
        Returns:
            List of task dictionaries with key information
        """
        query = self.db.query(Task)
        
        if crop_cycle_id:
            query = query.filter(Task.crop_cycle_id == crop_cycle_id)
        elif incident_no:
            # Find crop cycle by incident_no first
            cycle = self.db.query(CropCycle).filter(CropCycle.incident_no == incident_no).first()
            if cycle:
                query = query.filter(Task.crop_cycle_id == cycle.id)
            else:
                return []  # No cycle found, return empty
        
        if task_no:
            query = query.filter(Task.task_no.ilike(f"%{task_no}%"))
        if task_type:
            query = query.filter(Task.type.ilike(f"%{task_type}%"))
        if status:
            query = query.filter(Task.status == status.lower())
        
        tasks = query.order_by(Task.created_at.desc()).limit(limit).all()
        
        result = []
        for task in tasks:
            result.append({
                "task_id": str(task.id),
                "task_no": task.task_no,
                "crop_cycle_id": str(task.crop_cycle_id) if task.crop_cycle_id else None,
                "task_type": task.type,
                "sub_type": task.sub_type,
                "short_description": task.short_description,
                "description": task.description,
                "status": task.status,
                "severity": task.severity,
                "occurred_at": task.occurred_at.isoformat() if task.occurred_at else None,
                "resolved_at": task.resolved_at.isoformat() if task.resolved_at else None,
                "cost": float(task.cost) if task.cost else 0.0,
                "created_at": task.created_at.isoformat() if task.created_at else None
            })
        
        return result
    
    def get_work_orders(
        self,
        task_id: Optional[UUID] = None,
        work_order_no: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Query work orders with filters
        
        Returns:
            List of work order dictionaries with key information
        """
        query = self.db.query(WorkOrder)
        
        if task_id:
            query = query.filter(WorkOrder.task_id == task_id)
        if work_order_no:
            query = query.filter(WorkOrder.work_order_no.ilike(f"%{work_order_no}%"))
        if status:
            query = query.filter(WorkOrder.status == status.lower())
        
        work_orders = query.order_by(WorkOrder.created_at.desc()).limit(limit).all()
        
        result = []
        for wo in work_orders:
            # Calculate total cost from resources
            total_cost = 0.0
            if wo.resources:
                total_cost = sum(float(r.cost) if r.cost else 0.0 for r in wo.resources)
            
            result.append({
                "work_order_id": str(wo.id),
                "work_order_no": wo.work_order_no,
                "task_id": str(wo.task_id) if wo.task_id else None,
                "title": wo.title,
                "description": wo.description,
                "status": wo.status,
                "due_date": wo.due_date.isoformat() if wo.due_date else None,
                "total_cost": total_cost,
                "created_at": wo.created_at.isoformat() if wo.created_at else None
            })
        
        return result
    
    def get_crop_cycle_expenditure(self, incident_id: UUID) -> Dict[str, Any]:
        """
        Calculate total expenditure for a crop cycle
        
        Returns:
            Dictionary with expenditure breakdown
        """
        cycle = self.db.query(CropCycle).filter(CropCycle.id == incident_id).first()
        if not cycle:
            return {"error": "Crop cycle not found"}
        
        # Get all tasks for this cycle
        tasks = self.db.query(Task).filter(Task.crop_cycle_id == incident_id).all()
        
        # Calculate task costs
        task_costs = sum(float(task.cost) if task.cost else 0.0 for task in tasks)
        
        # Get all work orders for tasks in this cycle
        task_ids = [task.id for task in tasks]
        work_orders = []
        if task_ids:
            work_orders = self.db.query(WorkOrder).filter(WorkOrder.task_id.in_(task_ids)).all()
        
        # Calculate work order resource costs
        work_order_costs = 0.0
        for wo in work_orders:
            if wo.resources:
                work_order_costs += sum(float(r.cost) if r.cost else 0.0 for r in wo.resources)
        
        total_expenditure = task_costs + work_order_costs
        
        return {
            "incident_id": str(incident_id),
            "incident_no": cycle.incident_no,
            "crop_name": cycle.crop_name,
            "field_code": cycle.field_code,
            "task_costs": task_costs,
            "work_order_costs": work_order_costs,
            "total_expenditure": total_expenditure,
            "total_expense_from_cycle": float(cycle.total_expense) if cycle.total_expense else 0.0,
            "task_count": len(tasks),
            "work_order_count": len(work_orders)
        }
    
    def get_crop_cycle_summary(self, incident_id: UUID) -> Dict[str, Any]:
        """
        Get comprehensive summary of a crop cycle
        
        Returns:
            Dictionary with complete cycle information including tasks and work orders
        """
        cycle = self.db.query(CropCycle).filter(CropCycle.id == incident_id).first()
        if not cycle:
            return {"error": "Crop cycle not found"}
        
        # Get tasks
        tasks = self.db.query(Task).filter(Task.crop_cycle_id == incident_id).all()
        task_list = []
        for task in tasks:
            task_list.append({
                "task_id": str(task.id),
                "task_no": task.task_no,
                "task_type": task.type,
                "short_description": task.short_description,
                "status": task.status,
                "cost": float(task.cost) if task.cost else 0.0,
                "occurred_at": task.occurred_at.isoformat() if task.occurred_at else None
            })
        
        # Get work orders
        task_ids = [task.id for task in tasks]
        work_orders = []
        if task_ids:
            work_orders_query = self.db.query(WorkOrder).filter(WorkOrder.task_id.in_(task_ids))
            work_orders_list = work_orders_query.all()
            for wo in work_orders_list:
                total_cost = 0.0
                if wo.resources:
                    total_cost = sum(float(r.cost) if r.cost else 0.0 for r in wo.resources)
                
                work_orders.append({
                    "work_order_id": str(wo.id),
                    "work_order_no": wo.work_order_no,
                    "title": wo.title,
                    "status": wo.status,
                    "total_cost": total_cost
                })
        
        # Calculate expenditure
        expenditure = self.get_crop_cycle_expenditure(incident_id)
        
        return {
            "incident_id": str(incident_id),
            "incident_no": cycle.incident_no,
            "field_code": cycle.field_code,
            "crop_name": cycle.crop_name,
            "crop_variety": cycle.seed_category,
            "season": cycle.season,
            "sowing_date": cycle.sowing_date.isoformat() if cycle.sowing_date else None,
            "expected_harvest_date": cycle.expected_harvest_date.isoformat() if cycle.expected_harvest_date else None,
            "current_stage": cycle.current_stage,
            "status": cycle.status,
            "cultivated_area": float(cycle.cultivated_area) if cycle.cultivated_area else None,
            "short_description": cycle.short_description,
            "description": cycle.description,
            "tasks": task_list,
            "work_orders": work_orders,
            "expenditure": expenditure,
            "total_expense": float(cycle.total_expense) if cycle.total_expense else 0.0,
            "total_revenue": float(cycle.total_revenue) if cycle.total_revenue else 0.0,
            "profit": float(cycle.profit) if cycle.profit else 0.0
        }
    
    def get_task_by_no(self, task_no: str) -> Optional[Dict[str, Any]]:
        """
        Get task by task number
        
        Returns:
            Task dictionary or None if not found
        """
        task = self.db.query(Task).filter(Task.task_no == task_no).first()
        if not task:
            return None
        
        return {
            "task_id": str(task.id),
            "task_no": task.task_no,
            "crop_cycle_id": str(task.crop_cycle_id) if task.crop_cycle_id else None,
            "task_type": task.type,
            "short_description": task.short_description,
            "description": task.description,
            "status": task.status,
            "severity": task.severity,
            "cost": float(task.cost) if task.cost else 0.0,
            "occurred_at": task.occurred_at.isoformat() if task.occurred_at else None
        }
    
    def get_available_users(self) -> List[Dict[str, Any]]:
        """
        Get list of available users for assignment
        
        Returns:
            List of user dictionaries
        """
        users = self.db.query(User).all()
        return [
            {
                "user_id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
            for user in users
        ]
    
    def get_available_fields(self) -> List[Dict[str, Any]]:
        """
        Get list of available fields
        
        Returns:
            List of field dictionaries
        """
        # Get unique field codes from crop cycles
        field_codes = self.db.query(CropCycle.field_code).distinct().all()
        return [{"field_code": code[0]} for code in field_codes]

