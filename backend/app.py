import os
import re
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

CONTACT_EMAIL = "roshnie1101@gmail.com"
PHONE_NUMBER_CANDIDATE = re.compile(r"(?<!\w)\+?\d[\d\s().-]{7,}\d(?!\w)")
CONTACT_PRIVACY_REPLY = f"For privacy, please contact Roshni by email: {CONTACT_EMAIL}."


def protect_phone_number(text: str) -> str:
    if any(len(re.sub(r"\D", "", candidate)) >= 10 for candidate in PHONE_NUMBER_CANDIDATE.findall(text)):
        return CONTACT_PRIVACY_REPLY
    return text

RESUME_CONTEXT = """
Name: Roshni Dubey
Contact email: roshnie1101@gmail.com
Professional summary: AI Engineer with experience in Generative AI, Machine Learning, Deep Learning, and LLMs. Skilled in agentic AI solutions, MCP tool integrations, SDLC automation, RAG applications, and LLM training using RLHF.
Class 10: 93.6% from St. Thomas School, Ballia, Uttar Pradesh, India.
Class 12: 97.8% from St. Xavier's School, Ballia, Uttar Pradesh, India.
Experience:
- Infosys, Digital Specialist Engineer, April 2026 to present, Bengaluru.
- Working with the Infosys Agent Control Framework to develop agentic AI solutions that automate the SDLC through specialized AI agents and orchestrated workflows.
- Designing MCP tools for external tools, APIs, and development environments.
- Building reusable Agent Skills for requirements analysis, development, code review, and testing.
- VDOIT, AI Intern, January 2025 to May 2025, Gurugram.
- Optimized ML models, reducing training time by 20% and improving predictive analytics.
- Improved real-time application accuracy by 15%.
- Delivered AI training with 95% client satisfaction.
- Invisible Technologies, Advanced AI Data Trainer, March 2024 to November 2024, remote.
- Trained and fine-tuned 5+ LLMs using RLHF.
- Evaluated AI-generated responses and guided teams on AI projects.

Projects:
- Agentic Clinical Discharge Audit System using Python, LangGraph, FastAPI, OCR, and pdfplumber.
- Uses Monitor and Extractor agents, SHA-256 file tracking, JSON manifests, PDF/DOCX/image extraction, and Tesseract OCR.
- Achieved 95% precision.
- AI Incident Detection and Root Cause Analysis using Python, LangGraph, FastAPI, and LLMs.
- Detects anomalies, performs tool-calling root cause analysis, and supports human-in-the-loop approval.
- Achieved 96% accuracy.

Skills:
- Python, Java, SQL, R
- Machine Learning, Deep Learning, NLP, TensorFlow, PyTorch, Scikit-learn, RLHF
- LLMs, RAG, Prompt Engineering, Tool Calling, MCP, Agent Skills, Guardrails, Agentic AI, ACF
- FastAPI, Flask, Spring Boot, HTML, CSS
- PostgreSQL, MongoDB, Git, GitHub, Jira, Power BI, Excel, Data Analysis, Data Visualization

Education:
- B.Tech in Computer Science and Engineering (AI & ML), Guru Jambheshwar University of Science and Technology, Hisar, 2021-2025, CGPA 7.99/10.

Achievements:
- IIT Mandi Catalyst Hackathon: top 9 among 960 teams.
- Top 3 host and influential speaker at university events including Talaash and Samvaad.
"""

app = FastAPI(title="Roshni Portfolio API")
allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
allowed_origins.extend(
    [
        "https://portfolio-frontend-rho-lilac.vercel.app",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    history: list[dict] = Field(default_factory=list)


@app.get("/api/health")
async def health():
    return {"status": "ok", "cohere_configured": bool(os.getenv("COHERE_API_KEY"))}


@app.post("/api/chat")
async def chat(payload: ChatRequest):
    api_key = os.getenv("COHERE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Chat is not configured. Add COHERE_API_KEY to the root .env file.")

    history = []
    for item in payload.history[-8:]:
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and isinstance(content, str):
            history.append({"role": role, "content": content[:500]})

    preamble = (
        "You are Roshni Dubey's professional portfolio assistant. "
        "Answer only from the resume context below. If a detail is not in the context, "
        "say that you do not have that information. Be concise and speak in third person. "
        f"If asked for Roshni's phone number or contact details, provide only her email address: {CONTACT_EMAIL}. "
        "Never disclose, repeat, infer, or invent a phone number. "
        "Answer education questions, including Class 10 and Class 12 marks, using the resume facts. "
        "If the user only greets you, reply with a short friendly greeting and ask what they would like to know. "
        "Do not invent facts, dates, metrics, skills, or projects.\n\n"
        f"{RESUME_CONTEXT}"
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.cohere.com/v2/chat",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": os.getenv("COHERE_MODEL", "command-r-08-2024"),
                        "messages": [
                            {"role": "system", "content": preamble},
                            *history,
                            {"role": "user", "content": payload.message},
                        ],
                    "temperature": 0.2,
                    "max_tokens": 500,
                },
            )
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="The AI service is temporarily unavailable.")

    if response.status_code >= 400:
        provider_detail = ""
        try:
            provider_detail = str(response.json().get("message", ""))[:180]
        except Exception:
            provider_detail = response.text[:180]
        raise HTTPException(
            status_code=502,
            detail=f"Cohere HTTP {response.status_code}: {provider_detail}".strip(),
        )

    result = response.json()
    content = result.get("message", {}).get("content", [])
    answer = "".join(part.get("text", "") for part in content).strip()
    answer = answer or result.get("text") or "I could not generate an answer."
    return {"answer": protect_phone_number(answer)}
