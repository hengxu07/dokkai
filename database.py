import sqlite3
import json
from datetime import datetime
from typing import Optional, List


DB_PATH = "dokkai.db"

DB_PATH = "dokkai.db"

def init_db():
    """Initialize database and create tables if they don't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            hashed_password TEXT,
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            doc_id TEXT,
            user_id INTEGER,
            content TEXT,
            level TEXT,
            created_at TEXT,
            PRIMARY KEY (doc_id, user_id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id TEXT,
            user_id INTEGER,
            question TEXT,
            choices TEXT,
            answer TEXT,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    conn.commit()
    conn.close()

# ===== User functions =====
def create_user(username: str, hashed_password: str) -> Optional[int]:
    """Create a new user. Returns user_id or None if username already exists."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, hashed_password, created_at) VALUES (?, ?, ?)",
            (username, hashed_password, datetime.now().isoformat())
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_username(username: str) -> Optional[dict]:
    """Get user by username."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, hashed_password FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "hashed_password": row[2]}

# ===== Document functions =====
def save_document(doc_id: str, content: str, user_id: int):
    """Save document content to database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO documents (doc_id, user_id, content, created_at) VALUES (?, ?, ?, ?)",
        (doc_id, user_id, content, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def get_document(doc_id: str, user_id: int) -> Optional[str]:
    """Get document content by doc_id and user_id."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM documents WHERE doc_id = ? AND user_id = ?", (doc_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

# ===== Quiz functions =====
def save_quizzes(doc_id: str, user_id: int, quizzes: List[dict]):
    """Save generated quiz questions to database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    for quiz in quizzes:
        cursor.execute(
            "INSERT INTO quizzes (doc_id, user_id, question, choices, answer, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (doc_id, user_id, quiz["question"], json.dumps(quiz["choices"]), quiz["answer"], datetime.now().isoformat())
        )
    conn.commit()
    conn.close()

def get_quizzes(doc_id: str, user_id: int) -> Optional[List[dict]]:
    """Get saved quizzes for a document. Returns None if no quizzes exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT question, choices, answer FROM quizzes WHERE doc_id = ? AND user_id = ?", (doc_id, user_id))
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        return None
    return [
        {"question": row[0], "choices": json.loads(row[1]), "answer": row[2]}
        for row in rows
    ]

def update_document_level(doc_id: str, user_id: int, level: str):
    """Update JLPT level for a document."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE documents SET level = ? WHERE doc_id = ? AND user_id = ?", (level, doc_id, user_id))
    conn.commit()
    conn.close()