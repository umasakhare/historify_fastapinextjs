from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.scheduler_job import SchedulerJobCreate, SchedulerJobResponse
from app.utils.scheduler import scheduler_manager
from typing import List
import logging

router = APIRouter()

@router.get("/jobs", response_model=List[dict])
async def get_scheduler_jobs():
    """Get all scheduled jobs"""
    try:
        jobs = scheduler_manager.get_jobs()
        return jobs
    except Exception as e:
        logging.error(f"Error in get_scheduler_jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs")
async def create_scheduler_job(job_data: SchedulerJobCreate):
    """Create a new scheduled job"""
    try:
        if job_data.type == 'daily':
            if not job_data.time:
                raise HTTPException(status_code=400, detail='Time is required for daily jobs')
            
            job_id = scheduler_manager.add_daily_download_job(
                time_str=job_data.time,
                symbols=job_data.symbols,
                exchanges=job_data.exchanges,
                interval=job_data.interval,
                job_id=job_data.job_id
            )
            
        elif job_data.type == 'interval':
            if not job_data.minutes:
                raise HTTPException(status_code=400, detail='Minutes is required for interval jobs')
            
            job_id = scheduler_manager.add_interval_download_job(
                minutes=job_data.minutes,
                symbols=job_data.symbols,
                exchanges=job_data.exchanges,
                interval=job_data.interval,
                job_id=job_data.job_id
            )
            
        elif job_data.type == 'market_close':
            job_id = scheduler_manager.add_market_close_job(job_id=job_data.job_id)
            
        elif job_data.type == 'pre_market':
            job_id = scheduler_manager.add_pre_market_job(job_id=job_data.job_id)
            
        else:
            raise HTTPException(status_code=400, detail='Invalid job type')
        
        return {
            'job_id': job_id,
            'message': 'Job created successfully'
        }
        
    except Exception as e:
        logging.error(f"Error creating scheduler job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/jobs/{job_id}")
async def delete_scheduler_job(job_id: str):
    """Delete a scheduled job"""
    try:
        success = scheduler_manager.remove_job(job_id)
        if success:
            return {'message': 'Job deleted successfully'}
        else:
            raise HTTPException(status_code=400, detail='Failed to delete job')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs/{job_id}/pause")
async def pause_scheduler_job(job_id: str):
    """Pause a scheduled job"""
    try:
        success = scheduler_manager.pause_job(job_id)
        if success:
            return {'message': 'Job paused successfully'}
        else:
            raise HTTPException(status_code=400, detail='Failed to pause job')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs/{job_id}/resume")
async def resume_scheduler_job(job_id: str):
    """Resume a paused job"""
    try:
        success = scheduler_manager.resume_job(job_id)
        if success:
            return {'message': 'Job resumed successfully'}
        else:
            raise HTTPException(status_code=400, detail='Failed to resume job')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs/{job_id}/run")
async def run_scheduler_job_now(job_id: str):
    """Run a job immediately"""
    try:
        # Get job info
        jobs = scheduler_manager.get_jobs()
        job_info = next((j for j in jobs if j['id'] == job_id), None)
        
        if not job_info:
            raise HTTPException(status_code=404, detail='Job not found')
        
        # Execute the download
        scheduler_manager._execute_download(
            symbols=job_info.get('symbols'),
            exchanges=job_info.get('exchanges'),
            interval=job_info.get('interval', 'D')
        )
        
        return {'message': 'Job executed successfully'}
        
    except Exception as e:
        logging.error(f"Error running job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))