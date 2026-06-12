import sqlite3
import json
from typing import List, Dict
from contextlib import contextmanager

DB_PATH = "sessions.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sources (
            session_id TEXT,
            data TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS history (
            session_id TEXT,
            role TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
    finally:
        conn.close()


def save_source(session_id: str, source: dict):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO sources (session_id, data) VALUES (?, ?)",
            (session_id, json.dumps(source)),
        )
        conn.commit()


def load_sources(session_id: str) -> List[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT data FROM sources WHERE session_id = ?", (session_id,)
        ).fetchall()
        return [json.loads(r[0]) for r in rows]


def clear_sources(session_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM sources WHERE session_id = ?", (session_id,))
        conn.commit()


def save_message(session_id: str, role: str, content: str):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO history (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, role, content),
        )
        conn.commit()


def load_history(session_id: str) -> List[Dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT role, content FROM history WHERE session_id = ? ORDER BY created_at",
            (session_id,),
        ).fetchall()
        return [{"role": r[0], "content": r[1]} for r in rows]


def clear_history(session_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM history WHERE session_id = ?", (session_id,))
        conn.commit()