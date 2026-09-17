import sqlite3
conn = sqlite3.connect('recovery_path.db')
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", tables)
if any('users' in t for t in [str(x) for x in tables]):
    users = conn.execute("SELECT id, username, role FROM users LIMIT 5").fetchall()
    print("Users:", users)
conn.close()
