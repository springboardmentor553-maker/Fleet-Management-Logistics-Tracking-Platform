from datetime import datetime, timedelta
import re

class ETAService:
    @staticmethod
    def calculate_eta(start_time: datetime, duration_str: str) -> datetime:
        """
        Calculates the estimated time of arrival based on a start_time and a duration string.
        Duration string format example: '5 mins' or '2 hours 15 mins' or '1 hour'
        """
        if not duration_str:
            return start_time
            
        minutes = 0
        
        # Extract hours
        hour_match = re.search(r'(\d+)\s*hour', duration_str, re.IGNORECASE)
        if hour_match:
            minutes += int(hour_match.group(1)) * 60
            
        # Extract minutes
        min_match = re.search(r'(\d+)\s*min', duration_str, re.IGNORECASE)
        if min_match:
            minutes += int(min_match.group(1))
            
        return start_time + timedelta(minutes=minutes)
