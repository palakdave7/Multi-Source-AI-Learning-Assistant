import os
from groq import Groq
from typing import List, Generator

_client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL = "llama-3.3-70b-versatile"


def build_messages(question: str, chunks: List[dict], history: List[dict]) -> list:
    context = "\n\n".join(f"[{c['ref']}]\n{c['text']}" for c in chunks)

    system = f"""You are a helpful learning assistant. Answer ONLY based on the provided source material.
If the question cannot be answered from the sources, say "This topic is not covered in the provided material."
Always cite the source reference (e.g. "from slide 4" or "at 3:22 in the video") when answering.

SOURCE MATERIAL:
{context}"""

    messages = [{"role": "system", "content": system}]
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})
    return messages


def stream_answer(question: str, chunks: List[dict], history: List[dict]) -> Generator:
    if not chunks:
        yield "I couldn't find relevant information in the provided sources to answer this question."
        return

    messages = build_messages(question, chunks, history)
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


def generate_quiz(sources_text: str) -> str:
    prompt = f"""Based on the following content, generate 5 multiple choice questions to quiz the learner.
Format each question as:
Q1. [question]
a) [option]  b) [option]  c) [option]  d) [option]
Answer: [correct option letter]

CONTENT:
{sources_text[:3000]}"""

    response = _client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )
    return response.choices[0].message.content


def generate_summary(text: str) -> str:
    response = _client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": f"Summarize the following in 3-4 sentences for a learner:\n\n{text[:3000]}"}],
        max_tokens=256,
    )
    return response.choices[0].message.content