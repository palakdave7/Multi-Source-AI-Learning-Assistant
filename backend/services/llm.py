import os
from groq import Groq
from typing import List, Generator
from config import get_settings

settings = get_settings()
_client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL = "llama-3.3-70b-versatile"


def build_messages(question: str, chunks: List[dict], history: List[dict]) -> list:
    context = "\n\n".join(f"[{c['ref']}]\n{c['text']}" for c in chunks)

    system = f"""You are an expert learning assistant for Samasocial, an educational platform.

Your job is to help learners understand content from their uploaded materials.

STRICT RULES:
1. Answer ONLY from the source material provided below. Never use outside knowledge.
2. Always cite your source reference naturally in the answer (e.g. "According to slide 4...", "At 3:22 in the video...", "From the PDF page 2...").
3. If asked to "explain in simple terms", use analogies and plain language a beginner would understand.
4. If a question cannot be answered from the sources, respond exactly: "This topic isn't covered in your uploaded materials. Try adding a source that covers it."
5. For follow-up questions, use conversation history to maintain context.
6. Be concise but complete. Use bullet points for lists, steps, or comparisons.

SOURCE MATERIAL:
{context}"""

    messages = [{"role": "system", "content": system}]
    for msg in history[-8:]:
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