from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
import io
import database
import ai
import auth

app = FastAPI(title="Dokkai API", description="AI-powered Japanese reading assistant")

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ===== Startup =====
@app.on_event("startup")
def startup():
    database.init_db()

# ===== Auth helper =====
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Extract and validate user_id from JWT token."""
    user_id = auth.decode_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id

# ===== Auth routes =====
class AuthRequest(BaseModel):
    username: str
    password: str

@app.post("/register")
def register(body: AuthRequest):
    """Register a new user."""
    hashed = auth.hash_password(body.password)
    user_id = database.create_user(body.username, hashed)
    if not user_id:
        raise HTTPException(status_code=400, detail="Username already exists")
    token = auth.create_access_token(user_id)
    return {"token": token, "username": body.username}

@app.post("/login")
def login(body: AuthRequest):
    """Login and receive a JWT token."""
    user = database.get_user_by_username(body.username)
    if not user or not auth.verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = auth.create_access_token(user["id"])
    return {"token": token, "username": body.username}

# ===== Helper =====
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    reader = PdfReader(io.BytesIO(file_bytes))
    return "\n".join(
        page.extract_text() for page in reader.pages if page.extract_text()
    )

# ===== Document routes =====
@app.post("/upload/{doc_id}")
async def upload_document(
    doc_id: str,
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user)
):
    """Upload a Japanese PDF or text file."""
    file_bytes = await file.read()
    if file.filename.endswith(".pdf"):
        content = extract_text_from_pdf(file_bytes)
    else:
        content = file_bytes.decode("utf-8")
    database.save_document(doc_id, content, user_id)
    return {"doc_id": doc_id, "characters": len(content)}

@app.get("/vocabulary/{doc_id}")
def get_vocabulary(doc_id: str, user_id: int = Depends(get_current_user)):
    """Extract vocabulary list from uploaded document."""
    content = database.get_document(doc_id, user_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    vocabulary = ai.extract_vocabulary(content)
    return {"doc_id": doc_id, "vocabulary": vocabulary}

@app.get("/grammar/{doc_id}")
def get_grammar(doc_id: str, user_id: int = Depends(get_current_user)):
    """Analyze grammar patterns in uploaded document."""
    content = database.get_document(doc_id, user_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    grammar = ai.analyze_grammar(content)
    return {"doc_id": doc_id, "grammar": grammar}

@app.get("/level/{doc_id}")
def get_level(doc_id: str, user_id: int = Depends(get_current_user)):
    """Assess JLPT difficulty level of uploaded document."""
    content = database.get_document(doc_id, user_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    result = ai.assess_jlpt_level(content)
    database.update_document_level(doc_id, user_id, result["level"])
    return {"doc_id": doc_id, "level": result["level"], "reason": result["reason"]}

@app.post("/quiz/{doc_id}")
def get_quiz(doc_id: str, user_id: int = Depends(get_current_user)):
    """Generate or retrieve quiz questions for uploaded document."""
    existing = database.get_quizzes(doc_id, user_id)
    if existing:
        return {"doc_id": doc_id, "source": "cache", "quiz": existing}
    content = database.get_document(doc_id, user_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    quizzes = ai.generate_quiz(content)
    database.save_quizzes(doc_id, user_id, quizzes)
    return {"doc_id": doc_id, "source": "generated", "quiz": quizzes}