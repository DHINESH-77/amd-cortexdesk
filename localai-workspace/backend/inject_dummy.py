import sqlite3
import json
import datetime

def inject():
    conn = sqlite3.connect('localai.db')
    
    # Tomorrow is March 2, 2026
    event = {
        "date": "2026-03-02",
        "time": "10:00",
        "duration": 120,
        "notes": "Urgent bug fix before client demo.",
        "scheduledAt": datetime.datetime.utcnow().isoformat()
    }
    
    task_data = (
        'Fix Login Bug & Client Demo Preparedness',
        'Critical bug fix extracted for your demo tomorrow.',
        'To Do',
        'Dhinesh',
        'High', 
        'Direct DB Injection',
        json.dumps(event),
        datetime.datetime.utcnow().isoformat()
    )
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tasks (title, description, status, owner, risk_level, source, calendar_event, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, task_data)
    
    conn.commit()
    conn.close()
    print("SUCCESS: Injected dummy task for tomorrow (2026-03-02)")

if __name__ == "__main__":
    inject()
