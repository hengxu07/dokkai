import sqlite3
import json
from datetime import datetime
from typing import Optional, List


DB_PATH = "dokkai.db"

def init_db():
    """Initialize database and create tables if they don't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            doc_id TEXT PRIMARY KEY,
            content TEXT,
            level TEXT,
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id TEXT,
            question TEXT,
            choices TEXT,
            answer TEXT,
            created_at TEXT,
            FOREIGN KEY (doc_id) REFERENCES documents (doc_id)
        )
    """)

    conn.commit()
    conn.close()

def save_document(doc_id: str, content: str):
    """Save document content to database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO documents (doc_id, content, created_at) VALUES (?, ?, ?)",
        (doc_id, content, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def get_document(doc_id: str) -> Optional[str]:
    """Get document content by doc_id."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM documents WHERE doc_id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def save_quizzes(doc_id: str, quizzes: list[dict]):
    """Save generated quiz questions to database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    for quiz in quizzes:
        cursor.execute(
            "INSERT INTO quizzes (doc_id, question, choices, answer, created_at) VALUES (?, ?, ?, ?, ?)",
            (doc_id, quiz["question"], json.dumps(quiz["choices"]), quiz["answer"], datetime.now().isoformat())
        )
    conn.commit()
    conn.close()

def get_quizzes(doc_id: str) -> Optional[List[dict]]:
    """Get saved quizzes for a document. Returns None if no quizzes exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT question, choices, answer FROM quizzes WHERE doc_id = ?", (doc_id,))
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        return None
    return [
        {"question": row[0], "choices": json.loads(row[1]), "answer": row[2]}
        for row in rows
    ]

def update_document_level(doc_id: str, level: str):
    """Update JLPT level for a document."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE documents SET level = ? WHERE doc_id = ?", (level, doc_id))
    conn.commit()
    conn.close()