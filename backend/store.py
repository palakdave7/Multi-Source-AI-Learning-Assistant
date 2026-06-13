from db import (
    create_session, save_source, load_sources, clear_sources,
    save_message, load_history, clear_history, init_db
)

init_db()


def add_source(session_id: str, source: dict) -> str:
    return save_source(session_id, source)


def get_sources(session_id: str):
    return load_sources(session_id)


def get_history(session_id: str):
    return load_history(session_id)


def append_history(session_id: str, role: str, content: str):
    save_message(session_id, role, content)


def clear_session(session_id: str):
    clear_sources(session_id)
    clear_history(session_id)