import anthropic
import os
import json

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def extract_vocabulary(text: str) -> list[dict]:
    """Extract vocabulary list with readings and meanings from Japanese text."""
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Extract the 10 most important vocabulary words from this Japanese text.
Return ONLY a JSON array, no other text. Format:
[{{"word": "日本語", "reading": "にほんご", "meaning": "Japanese language"}}]

Text: {text}"""
            }
        ]
    )
    raw = response.content[0].text
    clean = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)

def analyze_grammar(text: str) -> list[dict]:
    """Analyze grammar patterns found in Japanese text."""
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Analyze the key grammar patterns in this Japanese text.
Return ONLY a JSON array, no other text. Format:
[{{"pattern": "〜ている", "explanation": "indicates ongoing action", "example": "食べている"}}]

Text: {text}"""
            }
        ]
    )
    raw = response.content[0].text
    clean = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)

def assess_jlpt_level(text: str) -> dict:
    """Assess the JLPT difficulty level of Japanese text."""
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": f"""Assess the JLPT level of this Japanese text.
Return ONLY a JSON object, no other text. Format:
{{"level": "N3", "reason": "Contains N3 grammar patterns such as..."}}

Text: {text}"""
            }
        ]
    )
    raw = response.content[0].text
    clean = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)

def generate_quiz(text: str) -> list[dict]:
    """Generate multiple choice quiz questions based on Japanese text."""
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Generate 5 multiple choice quiz questions based on this Japanese text.
Return ONLY a JSON array, no other text. Format:
[{{
    "question": "「食べる」の意味は何ですか？",
    "choices": ["to eat", "to drink", "to sleep", "to run"],
    "answer": "to eat"
}}]

Text: {text}"""
            }
        ]
    )
    raw = response.content[0].text
    clean = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)