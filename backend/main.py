# main.py
# Add these imports at the top
import google.generativeai as genai
from pydantic import BaseModel
import json
import os

from fastapi import Form, File, UploadFile, HTTPException
from typing import Optional
from parsers import parse_pdf, parse_docx, parse_pptx

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import quiz_results_collection, flashcard_sessions_collection
from typing import List

from dotenv import load_dotenv

load_dotenv() # Loads variables from .env file

# Configure the Gemini API client
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel(
    'gemini-1.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

app = FastAPI()

# CORS Middleware: Allows your frontend to talk to your backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # The origin of your Next.js app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ping")
def read_root():
    return {"message": "Pong! The EduGenie backend is running."}

# Pydantic models for request and response validation
class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5
    difficulty: str = ""

class FlashcardSession(BaseModel):
    user_id: str
    source_name: str
    card_count: int

@app.post("/api/submit-flashcard-session")
async def submit_flashcard_session(session: FlashcardSession):
    """
    Receives data about a completed flashcard session and saves it to the database.
    """
    await flashcard_sessions_collection.insert_one(session.model_dump())
    return {"status": "success", "message": "Flashcard session saved."}


@app.post("/api/generate-quiz") # The name stays for simplicity, but it's now a content generator
async def generate_content( # Renamed function for clarity
    mode: str = Form("quiz"), # NEW: 'quiz' or 'flashcard'
    num_questions: int = Form(5),
    difficulty: str = Form(""),
    topic: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    context = ""
    source_name = ""

    if file:
        contents = await file.read()
        filename = file.filename.lower()
        source_name = file.filename
        if filename.endswith(".pdf"): context = parse_pdf(contents)
        elif filename.endswith(".docx"): context = parse_docx(contents)
        elif filename.endswith(".pptx"): context = parse_pptx(contents)
        else: raise HTTPException(status_code=400, detail="Unsupported file type.")
    elif topic:
        context = topic
        source_name = topic
    else:
        raise HTTPException(status_code=400, detail="Please provide either a topic or upload a file.")

    max_context_length = 15000
    if len(context) > max_context_length:
        context = context[:max_context_length]

    difficulty_prompt_part = f"The questions should be suitable for a {difficulty} level." if difficulty else ""
    
    prompt = ""
    # --- NEW: Logic to switch between Quiz and Flashcard prompts ---
    if mode == "flashcard":
        # Prompt for generating flashcards
        prompt = f"""
        You are an expert learning assistant. Based on the following source material, generate {num_questions} flashcards.
        Each flashcard should have a 'term' (a key concept, name, or question) and a 'definition' (the explanation).
        The source material is about: "{source_name}".
        
        Source content to use:
        ---
        {context}
        ---
        
        Return the output ONLY as a valid JSON object. Do not include any text or code markers before or after the JSON.
        The JSON object must have a key "flashcards" which is an array of objects.
        Each object must have the keys "term" and "definition".
        
        Example Format:
        {{
          "flashcards": [
            {{
              "term": "Mitochondria",
              "definition": "Known as the powerhouse of the cell, it generates most of the cell's supply of ATP, used as a source of chemical energy."
            }},
            {{
              "term": "What is Photosynthesis?",
              "definition": "The process used by plants, algae, and some bacteria to convert light energy into chemical energy, through a process that converts carbon dioxide and water into glucose and oxygen."
            }}
          ]
        }}
        """
    else: # Default to quiz mode
        # Existing prompt for generating a quiz
        prompt_intro = f"Based on the following document text, generate a {num_questions}-question multiple-choice quiz." if file else f"Generate a {num_questions}-question multiple-choice quiz on the topic of '{source_name}'."
        prompt = f"""
        {prompt_intro}
        {difficulty_prompt_part}

        The source material is:
        ---
        {context}
        ---

        Return the output ONLY as a valid JSON object. Do not include any text, code block markers, or explanations before or after the JSON.
        The JSON object must have a key "questions" which is an array of objects. Each object must have keys: "questionText", "options", "correctAnswer", and "explanation".
        """

    try:
        response = model.generate_content(prompt)
        json_response_text = response.text.strip().replace("```json", "").replace("```", "")
        generated_data = json.loads(json_response_text)
        generated_data["source_name"] = source_name
        generated_data["mode"] = mode # Add mode to response so frontend knows what it got
        return generated_data
    except Exception as e:
        print(f"Error generating content: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate content from AI. Error: {str(e)}")
    

class QuizResult(BaseModel):
    user_id: str # For a hackathon, we can hardcode this on the frontend
    topic: str
    score: int
    total_questions: int

@app.post("/api/submit-result")
async def submit_result(result: QuizResult):
    await quiz_results_collection.insert_one(result.model_dump())
    return {"status": "success", "message": "Result saved."}

@app.get("/api/dashboard/{user_id}", response_model=List[QuizResult])
async def get_dashboard_data(user_id: str):
    results = await quiz_results_collection.find({"user_id": user_id}).to_list(100)
    return results