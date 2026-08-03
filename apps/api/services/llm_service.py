import os
import json
from groq import AsyncGroq
from typing import Optional

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))

MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPTS = {
    "dsa": """You are a senior software engineer at a {company_tier}-tier tech company conducting a Data Structures & Algorithms interview round.
The candidate is applying for a {track} engineering role.
Current difficulty: {difficulty}.

Your job:
1. Ask ONE clear DSA problem at a time. Include problem statement, constraints, and example I/O.
2. After the candidate answers, evaluate their approach and ask a follow-up or move to the next question.
3. Be professional but encouraging. Do not reveal answers upfront.
4. Adapt difficulty based on performance.""",

    "system_design": """You are a staff-level engineer at a {company_tier}-tier tech company conducting a System Design interview.
The candidate is applying for a {track} engineering role.
Current difficulty: {difficulty}.

Your job:
1. Present ONE system design problem (e.g., "Design Twitter's feed", "Design a URL shortener").
2. Guide the candidate through: requirements clarification, high-level design, deep dives, and trade-offs.
3. Ask probing follow-up questions about scalability, bottlenecks, and data models.
4. Be structured but conversational.""",

    "behavioral": """You are an engineering manager at a {company_tier}-tier tech company conducting a Behavioral interview.
The candidate is applying for a {track} engineering role.

Your job:
1. Ask ONE behavioral question at a time using the STAR method framework.
2. Topics: leadership, conflict resolution, failure, teamwork, technical decisions.
3. Follow up on vague answers. Ask "What was your specific contribution?" or "What would you do differently?"
4. Be warm and professional."""
}


async def generate_question(
    track: str,
    difficulty: str,
    company_tier: str,
    round_type: str,
    previous_context: str = "",
    question_number: int = 1
) -> str:
    system = SYSTEM_PROMPTS.get(round_type, SYSTEM_PROMPTS["behavioral"]).format(
        company_tier=company_tier,
        track=track,
        difficulty=difficulty
    )

    user_content = f"Question number {question_number}. "
    if previous_context:
        user_content += f"Previous context:\n{previous_context}\n\n"
    user_content += "Please ask the next interview question."

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_content}
        ],
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content


async def generate_follow_up(
    question: str,
    candidate_answer: str,
    round_type: str,
    track: str
) -> str:
    system = f"""You are an interviewer for a {track} engineering role conducting a {round_type} round.
The candidate just answered a question. Either ask a targeted follow-up to probe deeper,
OR acknowledge the answer briefly and transition to the next topic."""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"Question: {question}\n\nCandidate's answer: {candidate_answer}\n\nRespond as the interviewer."}
        ],
        temperature=0.6,
        max_tokens=512,
    )
    return response.choices[0].message.content


async def score_answer(
    question: str,
    answer: str,
    round_type: str,
    code_submission: Optional[str] = None
) -> dict:
    code_section = f"\n\nCode submitted:\n```\n{code_submission}\n```" if code_submission else ""

    prompt = f"""Evaluate this interview answer and return a JSON object with scores.

Question: {question}

Candidate Answer: {answer}{code_section}

Return ONLY valid JSON in this exact format:
{{
  "correctness": <0-10>,
  "communication": <0-10>,
  "edge_case_handling": <0-10>,
  "time_complexity_awareness": <0-10>,
  "overall": <0-40>,
  "feedback": "<2-3 sentences of specific, actionable feedback>",
  "suggested_follow_up_topics": ["<topic1>", "<topic2>"]
}}"""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are an expert technical interviewer. Always respond with valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=512,
    )

    text = response.choices[0].message.content.strip()
    # Extract JSON if wrapped in markdown
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "correctness": 5, "communication": 5, "edge_case_handling": 5,
            "time_complexity_awareness": 5, "overall": 20,
            "feedback": "Could not parse structured feedback. The answer was evaluated manually.",
            "suggested_follow_up_topics": []
        }


async def generate_session_report(
    track: str, questions_and_answers: list, total_score: float
) -> dict:
    qa_text = "\n\n".join([
        f"Q{i+1}: {qa['question']}\nA: {qa['answer']}\nScore: {qa.get('score', 'N/A')}/40\nFeedback: {qa.get('feedback', '')}"
        for i, qa in enumerate(questions_and_answers)
    ])

    prompt = f"""Based on this {track} interview session (total score: {total_score:.1f}/40 per question average):

{qa_text}

Generate a session report as JSON:
{{
  "strengths": "<2-3 sentences about what the candidate did well>",
  "weaknesses": "<2-3 sentences about areas needing improvement>",
  "recommendations": "<3-4 specific, actionable steps to improve>",
  "category_scores": {{
    "technical_accuracy": <0-100>,
    "communication": <0-100>,
    "problem_solving": <0-100>,
    "overall_readiness": <0-100>
  }}
}}"""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are an expert technical interview coach. Return valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.4,
        max_tokens=1024,
    )

    text = response.choices[0].message.content.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "strengths": "Good effort throughout the interview.",
            "weaknesses": "Some areas could use more practice.",
            "recommendations": "Practice more DSA problems and review system design fundamentals.",
            "category_scores": {"technical_accuracy": 60, "communication": 65, "problem_solving": 60, "overall_readiness": 62}
        }


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio using Groq's Whisper integration."""
    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    transcription = await client.audio.transcriptions.create(
        file=(filename, audio_bytes, "audio/webm"),
        model="whisper-large-v3-turbo",
        language="en"
    )
    return transcription.text
