import os
import json
from groq import Groq
from typing import List, Generator
from config import get_settings
from prompts.chat_prompt import (
    build_rag_prompt,
    QUIZ_PROMPT_TEMPLATE,
    SUMMARY_PROMPT_TEMPLATE,
    FLASHCARD_PROMPT_TEMPLATE,
)

settings = get_settings()
_client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL = "llama-3.3-70b-versatile"


def stream_answer(question: str, chunks: List[dict], history: List[dict]) -> Generator:
    if not chunks:
        yield "I couldn't find relevant information in the provided sources to answer this question."
        return
    messages = build_rag_prompt(question, chunks, history)
    stream = _client.chat.completions.create(
        model=MODEL,
        messages=messages,
        stream=True,
        max_tokens=1024,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


def generate_quiz(content: str) -> str:
    prompt = QUIZ_PROMPT_TEMPLATE.format(content=content[:3000])
    response = _client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )
    return response.choices[0].message.content


def generate_summary(text: str) -> str:
    prompt = SUMMARY_PROMPT_TEMPLATE.format(content=text[:3000])
    response = _client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256,
    )
    return response.choices[0].message.content


def generate_flashcards(content: str) -> list:
    prompt = FLASHCARD_PROMPT_TEMPLATE.format(content=content[:3000])
    response = _client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )
    text = response.choices[0].message.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)