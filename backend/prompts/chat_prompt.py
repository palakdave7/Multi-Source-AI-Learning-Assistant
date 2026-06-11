from typing import List


def build_rag_prompt(question: str, chunks: List[dict], history: List[dict]) -> list:
    context = "\n\n".join(
        f"[{c['ref']}]\n{c['text']}" for c in chunks
    )

    system = f"""You are an expert learning assistant for Samasocial, an educational platform.

Your job is to help learners understand content from their uploaded materials.

STRICT RULES:
1. Answer ONLY from the source material provided below. Never use outside knowledge.
2. Always cite your source reference naturally in the answer (e.g. "According to slide 4...", "At 3:22 in the video...", "From page 2 of the PDF...").
3. If asked to "explain in simple terms", use analogies and plain language a complete beginner would understand.
4. If a question cannot be answered from the sources, respond: "This topic isn't covered in your uploaded materials. Try adding a source that covers it."
5. For follow-up questions, use conversation history to maintain context.
6. Be concise but complete. Use bullet points for lists, steps, or comparisons.
7. Never make up information not present in the source material.

SOURCE MATERIAL:
{context}"""

    messages = [{"role": "system", "content": system}]
    for msg in history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})
    return messages


QUIZ_PROMPT_TEMPLATE = """Based on the following content, generate 5 multiple choice questions to quiz the learner.
Format each question as:
Q1. [question]
a) [option]  b) [option]  c) [option]  d) [option]
Answer: [correct option letter]

CONTENT:
{content}"""


SUMMARY_PROMPT_TEMPLATE = """Summarize the following content in 3-4 sentences for a learner. 
Focus on the main topics and key concepts covered:

{content}"""


FLASHCARD_PROMPT_TEMPLATE = """Based on the following content, generate 8 flashcards for a learner.
Return ONLY a JSON array, no markdown, no explanation. Format:
[
  {{"front": "question or concept", "back": "answer or explanation"}},
  ...
]

CONTENT:
{content}"""