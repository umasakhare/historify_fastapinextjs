from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
import pytz
import logging
from app.database.database import SessionLocal
from app.models.watchlist import WatchlistItem
from app.models.scheduler_job import SchedulerJob
from app.utils.data_fetcher import fetch_historical_data

IST = pytz.timezone('Asia/Kolkata')

class SchedulerManager:
    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone=IST)
        self.jobs = {}
        
    def init_app(self):
        """Initialize scheduler"""
        try:
            if not self.scheduler.running:
                self.scheduler.start()
                logging.info("Scheduler started with IST timezone")
            else:
                logging.info("Scheduler already running")
            
            self._load_persisted_jobs()
                
        except Exception as e:
            logging.error(f"Failed to start scheduler: {str(e)}")
        
    def add_daily_download_job(self, time_str, symbols=None, exchanges=None, interval='D', job_id=None, persist=True):
        """Add a daily download job at specified IST time"""
        try:
            hour, minute = map(int, time_str.split(':'))
            
            if job_id is None:
                job_id = f"daily_download_{time_str.replace(':', '')}"
            
            def download_job():
                self._execute_download(symbols, exchanges, interval)
            
            job = self.scheduler.add_job(
                func=download_job,
                trigger=CronTrigger(hour=hour, minute=minute, timezone=IST),
                id=job_id,
                replace_existing=True,
                name=f"Daily Download at {time_str} IST"
            )
            
            self.jobs[job_id] = {
                'type': 'daily',
                'time': time_str,
                'symbols': symbols,
                'exchanges': exchanges,
                'interval': interval,
                'next_run': job.next_run_time.isoformat() if job.next_run_time else None
            }
            
            logging.info(f"Added daily download job at {time_str} IST")
            
            if persist:
                db = SessionLocal()
                try:
                    scheduler_job = db.query(SchedulerJob).filter(SchedulerJob.id == job_id).first()
                    if not scheduler_job:
                        scheduler_job = SchedulerJob(id=job_id)
                    
                    scheduler_job.name = f"Daily Download at {time_str} IST"
                    scheduler_job.job_type = 'daily'
                    scheduler_job.time = time_str
                    scheduler_job.set_symbols(symbols)
                    scheduler_job.set_exchanges(exchanges)
                    scheduler_job.interval = interval
                    scheduler_job.is_paused = False
                    
                    db.add(scheduler_job)
                    db.commit()
                finally:
                    db.close()
            
            return job_id
            
        except Exception as e:
            logging.error(f"Error adding daily download job: {str(e)}")
            raise
    
    def add_interval_download_job(self, minutes, symbols=None, exchanges=None, interval='D', job_id=None, persist=True):
        """Add a recurring download job that runs every N minutes"""
        try:
            if job_id is None:
                job_id = f"interval_download_{minutes}min"
            
            def download_job():
                self._execute_download(symbols, exchanges, interval)
            
            job = self.scheduler.add_job(
                func=download_job,
                trigger=IntervalTrigger(minutes=minutes),
                id=job_id,
                replace_existing=True,
                name=f"Download every {minutes} minutes"
            )
            
            self.jobs[job_id] = {
                'type': 'interval',
                'minutes': minutes,
                'symbols': symbols,
                'exchanges': exchanges,
                'interval': interval,
                'next_run': job.next_run_time.isoformat() if job.next_run_time else None
            }
            
            logging.info(f"Added interval download job every {minutes} minutes")
            
            if persist:
                db = SessionLocal()
                try:
                    scheduler_job = db.query(SchedulerJob).filter(SchedulerJob.id == job_id).first()
                    if not scheduler_job:
                        scheduler_job = SchedulerJob(id=job_id)
                    
                    scheduler_job.name = f"Download every {minutes} minutes"
                    scheduler_job.job_type = 'interval'
                    scheduler_job.minutes = minutes
                    scheduler_job.set_symbols(symbols)
                    scheduler_job.set_exchanges(exchanges)
                    scheduler_job.interval = interval
                    scheduler_job.is_paused = False
                    
                    db.add(scheduler_job)
                    db.commit()
                finally:
                    db.close()
            
            return job_id
            
        except Exception as e:
            logging.error(f"Error adding interval download job: {str(e)}")
            raise
    
    def add_market_close_job(self, job_id=None):
        """Add a job that runs after market close (3:35 PM IST for NSE)"""
        job_id = job_id or "market_close_download"
        return self.add_daily_download_job("15:35", job_id=job_id, persist=True)
    
    def add_pre_market_job(self, job_id=None):
        """Add a job that runs before market open (8:30 AM IST)"""
        job_id = job_id or "pre_market_download"
        return self.add_daily_download_job("08:30", job_id=job_id, persist=True)
    
    def _execute_download(self, symbols=None, exchanges=None, interval='D'):
        """Execute the actual download process"""
        try:
            logging.info(f"Starting scheduled download at {datetime.now(IST).strftime('%Y-%m-%d %H:%M:%S IST')}")
            
            db = SessionLocal()
            try:
                if symbols is None:
                    watchlist_items = db.query(WatchlistItem).all()
                    symbols = [item.symbol for item in watchlist_items]
                    exchanges = [item.exchange for item in watchlist_items]
                
                if not symbols:
                    logging.warning("No symbols to download")
                    return
                
                success_count = 0
                failed_count = 0
                
                for symbol, exchange in zip(symbols, exchanges):
                    try:
                        end_date = datetime.now().strftime('%Y-%m-%d')
                        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                        
                        historical_data = fetch_historical_data(symbol, start_date, end_date, interval=interval, exchange=exchange)
                        
                        if historical_data:
                            # Store data logic here
                            success_count += 1
                            logging.info(f"Successfully downloaded data for {symbol}")
                        
                    except Exception as e:
                        failed_count += 1
                        logging.error(f"Failed to download data for {symbol}: {str(e)}")
                
                logging.info(f"Scheduled download completed: {success_count} success, {failed_count} failed")
                
            finally:
                db.close()
            
        except Exception as e:
            logging.error(f"Error in scheduled download: {str(e)}")
    
    def remove_job(self, job_id):
        """Remove a scheduled job"""
        try:
            self.scheduler.remove_job(job_id)
            if job_id in self.jobs:
                del self.jobs[job_id]
            
            db = SessionLocal()
            try:
                scheduler_job = db.query(SchedulerJob).filter(SchedulerJob.id == job_id).first()
                if scheduler_job:
                    db.delete(scheduler_job)
                    db.commit()
            finally:
                db.close()
            
            logging.info(f"Removed job: {job_id}")
            return True
        except Exception as e:
            logging.error(f"Error removing job {job_id}: {str(e)}")
            return False
    
    def pause_job(self, job_id):
        """Pause a scheduled job"""
        try:
            self.scheduler.pause_job(job_id)
            if job_id in self.jobs:
                self.jobs[job_id]['paused'] = True
            
            db = SessionLocal()
            try:
                scheduler_job = db.query(SchedulerJob).filter(SchedulerJob.id == job_id).first()
                if scheduler_job:
                    scheduler_job.is_paused = True
                    db.commit()
            finally:
                db.close()
            
            logging.info(f"Paused job: {job_id}")
            return True
        except Exception as e:
            logging.error(f"Error pausing job {job_id}: {str(e)}")
            return False
    
    def resume_job(self, job_id):
        """Resume a paused job"""
        try:
            self.scheduler.resume_job(job_id)
            if job_id in self.jobs:
                self.jobs[job_id]['paused'] = False
            
            db = SessionLocal()
            try:
                scheduler_job = db.query(SchedulerJob).filter(SchedulerJob.id == job_id).first()
                if scheduler_job:
                    scheduler_job.is_paused = False
                    db.commit()
            finally:
                db.close()
            
            logging.info(f"Resumed job: {job_id}")
            return True
        except Exception as e:
            logging.error(f"Error resuming job {job_id}: {str(e)}")
            return False
    
    def get_jobs(self):
        """Get all scheduled jobs"""
        jobs_list = []
        try:
            if self.scheduler and self.scheduler.running:
                for job in self.scheduler.get_jobs():
                    job_info = {
                        'id': job.id,
                        'name': job.name,
                        'next_run': job.next_run_time.isoformat() if job.next_run_time else None,
                        'paused': job.next_run_time is None
                    }
                    
                    if job.id in self.jobs:
                        job_info.update(self.jobs[job.id])
                    
                    jobs_list.append(job_info)
            else:
                logging.warning("Scheduler is not running")
        except Exception as e:
            logging.error(f"Error getting jobs: {str(e)}")
        
        return jobs_list
    
    def _load_persisted_jobs(self):
        """Load persisted jobs from database on startup"""
        try:
            logging.info("Loading persisted scheduler jobs from database")
            db = SessionLocal()
            try:
                jobs = db.query(SchedulerJob).all()
                
                for job in jobs:
                    try:
                        if job.job_type == 'daily':
                            self.add_daily_download_job(
                                time_str=job.time,
                                symbols=job.get_symbols(),
                                exchanges=job.get_exchanges(),
                                interval=job.interval,
                                job_id=job.id,
                                persist=False
                            )
                        elif job.job_type == 'interval':
                            self.add_interval_download_job(
                                minutes=job.minutes,
                                symbols=job.get_symbols(),
                                exchanges=job.get_exchanges(),
                                interval=job.interval,
                                job_id=job.id,
                                persist=False
                            )
                        elif job.job_type == 'market_close':
                            self.add_market_close_job(job_id=job.id)
                        elif job.job_type == 'pre_market':
                            self.add_pre_market_job(job_id=job.id)
                        
                        if job.is_paused:
                            self.pause_job(job.id)
                        
                        logging.info(f"Loaded persisted job: {job.id}")
                        
                    except Exception as e:
                        logging.error(f"Error loading persisted job {job.id}: {str(e)}")
                        
                logging.info(f"Loaded {len(jobs)} persisted jobs")
                
            finally:
                db.close()
            
        except Exception as e:
            logging.error(f"Error loading persisted jobs: {str(e)}")
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logging.info("Scheduler shut down")

# Create global scheduler instance
scheduler_manager = SchedulerManager()