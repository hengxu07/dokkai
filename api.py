from fastapi import FastAPI, UploadFile, File, HTTPException
from pypdf import PdfReader
import io
import database
import ai

app = FastAPI(title="Dokkai API", description="AI-powered Japanese reading assistant")

# Initialize database on startup
@app.on_event("startup")
def startup():
    database.init_db()

# ===== Helper =====
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    reader = PdfReader(io.BytesIO(file_bytes))
    return "\n".join(
        page.extract_text() for page in reader.pages if page.extract_text()
    )

# ===== Routes =====
@app.post("/upload/{doc_id}")
async def upload_document(doc_id: str, file: UploadFile = File(...)):
    """Upload a Japanese PDF or text file."""
    file_bytes = await file.read()
    if file.filename.endswith(".pdf"):
        content = extract_text_from_pdf(file_bytes)
    else:
        content = file_bytes.decode("utf-8")
    database.save_document(doc_id, content)
    return {"doc_id": doc_id, "characters": len(content)}

@app.get("/vocabulary/{doc_id}")
def get_vocabulary(doc_id: str):
    """Extract vocabulary list from uploaded document."""
    content = database.get_document(doc_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    vocabulary = ai.extract_vocabulary(content)
    return {"doc_id": doc_id, "vocabulary": vocabulary}

@app.get("/grammar/{doc_id}")
def get_grammar(doc_id: str):
    """Analyze grammar patterns in uploaded document."""
    content = database.get_document(doc_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    grammar = ai.analyze_grammar(content)
    return {"doc_id": doc_id, "grammar": grammar}

@app.get("/level/{doc_id}")
def get_level(doc_id: str):
    """Assess JLPT difficulty level of uploaded document."""
    content = database.get_document(doc_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    result = ai.assess_jlpt_level(content)
    database.update_document_level(doc_id, result["level"])
    return {"doc_id": doc_id, "level": result["level"], "reason": result["reason"]}

@app.post("/quiz/{doc_id}")
def get_quiz(doc_id: str):
    """Generate or retrieve quiz questions for uploaded document."""
    # Check if quiz already exists
    existing = database.get_quizzes(doc_id)
    if existing:
        return {"doc_id": doc_id, "source": "cache", "quiz": existing}

    # Generate new quiz
    content = database.get_document(doc_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    quizzes = ai.generate_quiz(content)
    database.save_quizzes(doc_id, quizzes)
    return {"doc_id": doc_id, "source": "generated", "quiz": quizzes}