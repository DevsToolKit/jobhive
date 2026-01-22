from datetime import datetime, timedelta
from typing import Dict, List
from database.connection import get_db

class AnalyticsService:
    
    def get_dashboard_stats(self) -> Dict:
        """Get overall statistics for dashboard"""
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Total sessions
            cursor.execute("SELECT COUNT(*) as count FROM sessions")
            total_sessions = cursor.fetchone()['count']
            
            # Total jobs scraped
            cursor.execute("SELECT COUNT(*) as count FROM jobs")
            total_jobs = cursor.fetchone()['count']
            
            # Sessions by status
            cursor.execute("""
                SELECT status, COUNT(*) as count
                FROM sessions
                GROUP BY status
            """)
            status_breakdown = {row['status']: row['count'] for row in cursor.fetchall()}
            
            # Jobs by site
            cursor.execute("""
                SELECT site, COUNT(*) as count
                FROM jobs
                GROUP BY site
                ORDER BY count DESC
            """)
            jobs_by_site = {row['site']: row['count'] for row in cursor.fetchall()}
            
            # Recent activity (last 7 days)
            seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM sessions
                WHERE created_at > ?
            """, (seven_days_ago,))
            recent_sessions = cursor.fetchone()['count']
            
            return {
                "total_sessions": total_sessions,
                "total_jobs": total_jobs,
                "status_breakdown": status_breakdown,
                "jobs_by_site": jobs_by_site,
                "recent_sessions_7d": recent_sessions
            }
    
    def get_session_timeline(self, days: int = 30) -> List[Dict]:
        """Get session activity over time"""
        with get_db() as conn:
            cursor = conn.cursor()
            
            start_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            cursor.execute("""
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM sessions
                WHERE created_at > ?
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            """, (start_date,))
            
            return [
                {"date": row['date'], "count": row['count']}
                for row in cursor.fetchall()
            ]
    
    def get_popular_searches(self, limit: int = 10) -> List[Dict]:
        """Get most popular search terms"""
        with get_db() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT search_term, location, COUNT(*) as count
                FROM sessions
                GROUP BY search_term, location
                ORDER BY count DESC
                LIMIT ?
            """, (limit,))
            
            return [
                {
                    "search_term": row['search_term'],
                    "location": row['location'],
                    "count": row['count']
                }
                for row in cursor.fetchall()
            ]
    
    def get_job_statistics(self) -> Dict:
        """Get job-level statistics"""
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Average salary by job type
            cursor.execute("""
                SELECT 
                    job_type,
                    AVG(CASE WHEN interval = 'yearly' THEN max_amount ELSE NULL END) as avg_yearly_salary,
                    COUNT(*) as count
                FROM jobs
                WHERE job_type IS NOT NULL AND max_amount IS NOT NULL
                GROUP BY job_type
            """)
            salary_by_type = [
                {
                    "job_type": row['job_type'],
                    "avg_salary": row['avg_yearly_salary'],
                    "count": row['count']
                }
                for row in cursor.fetchall()
            ]
            
            # Remote vs on-site distribution
            cursor.execute("""
                SELECT is_remote, COUNT(*) as count
                FROM jobs
                GROUP BY is_remote
            """)
            remote_dist = {
                "remote": 0,
                "onsite": 0
            }
            for row in cursor.fetchall():
                if row['is_remote']:
                    remote_dist['remote'] = row['count']
                else:
                    remote_dist['onsite'] = row['count']
            
            # Top locations
            cursor.execute("""
                SELECT location_city, location_state, COUNT(*) as count
                FROM jobs
                WHERE location_city IS NOT NULL
                GROUP BY location_city, location_state
                ORDER BY count DESC
                LIMIT 10
            """)
            top_locations = [
                {
                    "city": row['location_city'],
                    "state": row['location_state'],
                    "count": row['count']
                }
                for row in cursor.fetchall()
            ]
            
            return {
                "salary_by_type": salary_by_type,
                "remote_distribution": remote_dist,
                "top_locations": top_locations
            }