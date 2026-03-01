import sqlite3

def migrate():
    conn = sqlite3.connect('localai.db')
    cursor = conn.cursor()
    
    # Check current table definition
    cursor.execute("PRAGMA table_info(tasks)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Current columns in 'tasks' table: {columns}")
    
    # Missing columns we added to models/__init__.py
    needed = {
        'source': 'TEXT',
        'calendar_event': 'JSON'
    }
    
    for col, data_type in needed.items():
        if col not in columns:
            print(f"Adding missing column: {col}...")
            # SQLite added JSON type in newer versions, but we can treat it as TEXT if needed.
            # However, SQLAlchemy's JSON uses TEXT under the hood in SQLite.
            try:
                cursor.execute(f"ALTER TABLE tasks ADD COLUMN {col} {data_type}")
                print(f"Column '{col}' successfully added.")
            except sqlite3.OperationalError as e:
                print(f"Error adding {col}: {e}")
        else:
            print(f"Column '{col}' already exists.")
            
    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
