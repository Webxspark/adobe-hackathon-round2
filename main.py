"""
Adobe India Hackathon 2025 - Finale Solution
"Connecting the Dots" - Complete Backend Implementation

Core Features:
1. Batch PDF Upload - Multiple PDFs for document library
2. Global Semantic Search - Find relevant sections across ALL documents
3. Challenge 1A/1B Integration - Proven PDF processing logic
4. LLM-powered Insights - Using Adobe's sample scripts
5. Audio Generation - TTS for podcasts/overviews

API Endpoints:
- POST /upload - Upload single or multiple PDFs
- POST /batch-upload - Bulk upload multiple PDFs
- GET /documents - List all documents in library
- GET /documents/{id} - Get specific document details
- GET /documents/{id}/pdf - Serve PDF file for Adobe Embed API
- POST /connect-dots - Core feature: find relevant snippets across ALL docs
- POST /insights - Generate LLM-powered insights (Step 2)
- POST /audio-overview - Generate audio podcast/overview (Step 3)
"""

import os
import json
import uuid
import asyncio
import time
from typing import List, Optional, Dict, Any, Union
from pathlib import Path

# FastAPI imports
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Database imports
from sqlalchemy import create_engine, Column, String, Text, DateTime, Float, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func

# ML imports for semantic search
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("⚠️ ML libraries not available. Using fallback text matching.")

# Import Adobe LLM/TTS modules
try:
    from chat_with_llm import get_llm_response
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    print("⚠️ LLM module not available.")

try:
    from generate_audio import generate_audio
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    print("⚠️ TTS module not available.")

# Import Challenge 1A processing
from process_pdfs import process_single_pdf

def clean_script_for_tts(script: str) -> str:
    """
    Clean the script by removing markdown formatting and other characters 
    that TTS might read aloud incorrectly.
    """
    import re
    
    # Remove markdown formatting
    script = re.sub(r'\*\*([^*]+)\*\*', r'\1', script)  # **bold** -> bold
    script = re.sub(r'\*([^*]+)\*', r'\1', script)      # *italic* -> italic
    script = re.sub(r'_([^_]+)_', r'\1', script)        # _underline_ -> underline
    script = re.sub(r'~~([^~]+)~~', r'\1', script)      # ~~strikethrough~~ -> strikethrough
    
    # Remove markdown headers
    script = re.sub(r'^#{1,6}\s+', '', script, flags=re.MULTILINE)  # # Header -> Header
    
    # Remove markdown links
    script = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', script)  # [text](url) -> text
    
    # Remove code blocks and inline code
    script = re.sub(r'```[^`]*```', '', script)         # Remove code blocks
    script = re.sub(r'`([^`]+)`', r'\1', script)        # `code` -> code
    
    # Remove parenthetical stage directions and sound effects
    script = re.sub(r'\([^)]*\)', '', script)           # Remove anything in parentheses
    script = re.sub(r'\[[^\]]*\]', '', script)          # Remove anything in square brackets
    
    # Remove markdown lists
    script = re.sub(r'^\s*[-*+]\s+', '', script, flags=re.MULTILINE)  # - item -> item
    script = re.sub(r'^\s*\d+\.\s+', '', script, flags=re.MULTILINE)  # 1. item -> item
    
    # Remove extra whitespace and clean up
    script = re.sub(r'\n\s*\n', '\n\n', script)         # Multiple newlines -> double newline
    script = re.sub(r'[ \t]+', ' ', script)             # Multiple spaces/tabs -> single space
    script = script.strip()
    
    # Remove any remaining problematic characters
    script = script.replace('/', ' ')                    # Forward slashes
    script = script.replace('\\', ' ')                   # Backslashes
    script = script.replace('|', ' ')                    # Pipes
    script = script.replace('^', ' ')                    # Carets
    script = script.replace('&', ' and ')                # Ampersands
    script = script.replace('<', ' less than ')          # Less than
    script = script.replace('>', ' greater than ')       # Greater than
    
    return script

# Initialize FastAPI app
app = FastAPI(
    title="Adobe India Hackathon 2025 - Finale Solution",
    description="Connecting the Dots - Personal Document Library with AI Insights",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="static"), name="static")
# Mount assets directory for frontend build files  
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# Serve frontend index.html at root
@app.get("/")
async def serve_frontend():
    """Serve the frontend index.html"""
    return FileResponse("static/index.html")

# Database setup
DATABASE_URL = "sqlite:///./finale_documents.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Initialize semantic search model
semantic_model = None
if ML_AVAILABLE:
    try:
        semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Semantic search model loaded successfully")
    except Exception as e:
        print(f"⚠️ Semantic search model loading failed: {e}")

# Database Models
class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    upload_time = Column(DateTime, default=func.now())
    title = Column(String)
    outline = Column(Text)  # JSON string of outline structure
    total_sections = Column(Integer, default=0)
    file_size = Column(Integer)
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed

class DocumentSection(Base):
    __tablename__ = "document_sections"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False)
    section_title = Column(String, nullable=False)
    section_content = Column(Text, nullable=False)
    section_number = Column(Integer)
    page_number = Column(Integer)
    embedding = Column(Text)  # JSON string of vector embedding
    snippet = Column(Text)  # 2-4 sentence extract
    
# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models for API
class DocumentInfo(BaseModel):
    id: str
    filename: str
    original_filename: str
    upload_time: str
    title: Optional[str] = None
    outline: Optional[Union[Dict, List]] = None
    total_sections: int = 0
    file_size: int
    processing_status: str

class SectionSnippet(BaseModel):
    id: str
    document_id: str
    document_title: str
    document_filename: str
    section_title: str
    snippet: str
    page_number: Optional[int] = None
    relevance_score: float

class ConnectDotsRequest(BaseModel):
    selected_text: str
    context: Optional[str] = None  # Additional context around selection
    max_results: int = Field(default=5, le=10)

class ConnectDotsResponse(BaseModel):
    query: str
    results: List[SectionSnippet]
    processing_time: float

class InsightRequest(BaseModel):
    selected_text: str
    related_sections: List[str]  # Section IDs from connect-dots results
    insight_type: str = "comprehensive"  # comprehensive, contradictions, examples, takeaways

class AudioRequest(BaseModel):
    text_content: str
    related_sections: List[str]
    audio_type: str = "overview"  # overview, podcast
    voice: Optional[str] = None

# Helper functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_embedding(text: str) -> Optional[List[float]]:
    """Create embedding for semantic search"""
    if not semantic_model or not text.strip():
        return None
    try:
        embedding = semantic_model.encode([text])[0]
        return embedding.tolist()
    except Exception as e:
        print(f"Embedding creation failed: {e}")
        return None

def calculate_similarity(query_embedding: List[float], section_embedding: List[float]) -> float:
    """Calculate cosine similarity between embeddings"""
    if not ML_AVAILABLE:
        return 0.0
    try:
        query_vec = np.array(query_embedding).reshape(1, -1)
        section_vec = np.array(section_embedding).reshape(1, -1)
        similarity = cosine_similarity(query_vec, section_vec)[0][0]
        return float(similarity)
    except Exception:
        return 0.0

def calculate_text_similarity(query: str, section_title: str, section_content: str) -> float:
    """Fallback text similarity using keyword matching"""
    query_words = set(query.lower().split())
    title_words = set(section_title.lower().split())
    content_words = set(section_content.lower().split())
    
    # Calculate overlaps
    title_overlap = len(query_words.intersection(title_words))
    content_overlap = len(query_words.intersection(content_words))
    
    # Weight title matches higher
    score = (title_overlap * 2 + content_overlap) / max(len(query_words), 1)
    return min(score, 1.0)  # Cap at 1.0

def extract_snippet(section_content: str, max_sentences: int = 3) -> str:
    """Extract 2-4 sentence snippet from section content"""
    import re
    sentences = re.split(r'(?<=[.!?])\s+', section_content.strip())
    if len(sentences) <= max_sentences:
        return section_content.strip()
    
    # Take first few sentences up to max_sentences
    snippet = ' '.join(sentences[:max_sentences])
    return snippet.strip()

async def process_document_async(document_id: str, file_path: str):
    """Process document asynchronously with Challenge 1A logic"""
    db = SessionLocal()
    try:
        # Update status to processing
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.processing_status = "processing"
            db.commit()
            print(f"Starting processing for document: {document.original_filename}")
        
        # Process with Challenge 1A logic
        print(f"Processing PDF file: {file_path}")
        result = process_single_pdf(Path(file_path))
        print(f"Processing result: {result}")
        
        if result and result.get("success") and result.get("title"):
            print(f"PDF processed successfully, title: {result.get('title')}")
            # Update document with title and outline
            document.title = result.get("title", "Untitled Document")
            outline_data = result.get("outline", [])
            document.outline = json.dumps(outline_data)
            
            # Convert outline to sections for semantic search
            sections = []
            if isinstance(outline_data, list):
                for item in outline_data:
                    if isinstance(item, dict):
                        sections.append({
                            "title": item.get("text", ""),
                            "content": item.get("text", ""),  # Use text as content for now
                            "page": item.get("page", 0)
                        })
            
            document.total_sections = len(sections)
            print(f"Created {len(sections)} sections from outline")
            
            # Process sections and create embeddings
            for i, section in enumerate(sections):
                section_title = section.get("title", f"Section {i+1}")
                section_content = section.get("content", "")
                page_number = section.get("page", None)
                
                # Create embedding for semantic search
                full_text = f"{section_title} {section_content}"
                embedding = create_embedding(full_text)
                
                # Extract snippet
                snippet = extract_snippet(section_content)
                
                # Save section to database
                db_section = DocumentSection(
                    document_id=document_id,
                    section_title=section_title,
                    section_content=section_content,
                    section_number=i + 1,
                    page_number=page_number,
                    embedding=json.dumps(embedding) if embedding else None,
                    snippet=snippet
                )
                db.add(db_section)
            
            document.processing_status = "completed"
        else:
            print(f"❌ PDF processing failed - no title returned from process_single_pdf")
            print(f"❌ Result was: {result}")
            document.processing_status = "failed"
        
        db.commit()
        print(f"✅ Document {document_id} processed successfully")
        
    except Exception as e:
        print(f"❌ Document processing failed with exception: {e}")
        print(f"❌ Exception type: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        if document:
            document.processing_status = "failed"
            db.commit()
    finally:
        db.close()

# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "adobe-finale-connecting-dots",
        "version": "1.0.0",
        "features": {
            "challenge_1a_integrated": True,
            "challenge_1b_integrated": True,
            "semantic_search": semantic_model is not None,
            "llm_integration": LLM_AVAILABLE,
            "tts_integration": TTS_AVAILABLE,
            "batch_upload": True
        }
    }

@app.post("/upload")
async def upload_document(files: List[UploadFile] = File(...)):
    """Upload single or multiple PDF documents"""
    results = []
    
    for file in files:
        try:
            if not file.filename.lower().endswith('.pdf'):
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": "Only PDF files are allowed"
                })
                continue
            
            # Create uploads directory
            uploads_dir = Path("uploads")
            uploads_dir.mkdir(exist_ok=True)
            
            # Generate unique filename
            document_id = str(uuid.uuid4())
            file_extension = Path(file.filename).suffix
            unique_filename = f"{document_id}{file_extension}"
            file_path = uploads_dir / unique_filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Create database record
            db = SessionLocal()
            try:
                document = Document(
                    id=document_id,
                    filename=unique_filename,
                    original_filename=file.filename,
                    file_path=str(file_path),
                    file_size=len(content),
                    processing_status="pending"
                )
                db.add(document)
                db.commit()
                
                # Start async processing
                asyncio.create_task(process_document_async(document_id, str(file_path)))
                
                results.append({
                    "filename": file.filename,
                    "document_id": document_id,
                    "success": True,
                    "status": "pending"
                })
            finally:
                db.close()
                
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    successful_uploads = len([r for r in results if r.get('success')])
    
    return {
        "total_files": len(files),
        "successful_uploads": successful_uploads,
        "results": results,
        "message": f"Upload completed. {successful_uploads} files uploaded successfully."
    }

@app.post("/batch-upload")
async def batch_upload_documents(files: List[UploadFile] = File(...)):
    """Dedicated bulk upload endpoint for multiple PDFs"""
    return await upload_document(files)

@app.get("/documents")
async def list_documents():
    """List all documents in the library"""
    db = SessionLocal()
    try:
        documents = db.query(Document).order_by(Document.upload_time.desc()).all()
        
        result = []
        for doc in documents:
            outline = []
            try:
                if doc.outline:
                    outline = json.loads(doc.outline)
            except:
                outline = []
                
            result.append(DocumentInfo(
                id=doc.id,
                filename=doc.filename,
                original_filename=doc.original_filename,
                upload_time=doc.upload_time.isoformat(),
                title=doc.title,
                outline=outline,
                total_sections=doc.total_sections,
                file_size=doc.file_size,
                processing_status=doc.processing_status
            ))
        
        return result
    finally:
        db.close()

@app.get("/documents/{document_id}")
async def get_document_details(document_id: str):
    """Get detailed information about a specific document"""
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get sections
        sections = db.query(DocumentSection).filter(
            DocumentSection.document_id == document_id
        ).order_by(DocumentSection.section_number).all()
        
        outline = []
        try:
            if document.outline:
                outline = json.loads(document.outline)
        except:
            outline = []
        
        return {
            "document": DocumentInfo(
                id=document.id,
                filename=document.filename,
                original_filename=document.original_filename,
                upload_time=document.upload_time.isoformat(),
                title=document.title,
                outline=outline,
                total_sections=document.total_sections,
                file_size=document.file_size,
                processing_status=document.processing_status
            ),
            "sections": [
                {
                    "id": section.id,
                    "title": section.section_title,
                    "content": section.section_content,
                    "section_number": section.section_number,
                    "page_number": section.page_number,
                    "snippet": section.snippet
                }
                for section in sections
            ]
        }
    finally:
        db.close()

@app.get("/documents/{document_id}/pdf")
async def serve_pdf(document_id: str):
    """Serve PDF file for Adobe Embed API"""
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        file_path = Path(document.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        return FileResponse(
            file_path,
            media_type="application/pdf",
            filename=document.original_filename
        )
    finally:
        db.close()
        
@app.get("/pdf-embed-api")
async def get_pdf_embed_api_from_env():
    api_key = os.getenv("ADOBE_EMBED_API_KEY", "")
    
    return {"api_key": api_key}

@app.post("/connect-dots", response_model=ConnectDotsResponse)
async def connect_dots(request: ConnectDotsRequest):
    """
    Core Feature: Find relevant sections across ALL documents
    
    Step 1 - Reading & Selection: User selects text, system finds related sections
    """
    start_time = time.time()
    
    # Create embedding for query
    query_text = f"{request.selected_text} {request.context or ''}"
    query_embedding = create_embedding(query_text)
    
    db = SessionLocal()
    try:
        # Get all processed document sections
        sections = db.query(DocumentSection, Document).join(
            Document, DocumentSection.document_id == Document.id
        ).filter(
            Document.processing_status == "completed"
        ).all()
        
        # Calculate similarities
        similarities = []
        for section, document in sections:
            try:
                if query_embedding and section.embedding:
                    # Use semantic similarity if available
                    section_embedding = json.loads(section.embedding)
                    similarity = calculate_similarity(query_embedding, section_embedding)
                else:
                    # Fall back to text similarity
                    similarity = calculate_text_similarity(
                        request.selected_text,
                        section.section_title,
                        section.section_content
                    )
                
                if similarity > 0.1:  # Filter out very low similarities
                    similarities.append({
                        "section": section,
                        "document": document,
                        "similarity": similarity
                    })
            except Exception as e:
                print(f"Error processing section {section.id}: {e}")
                continue
        
        # Sort by similarity and get top results
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        top_results = similarities[:request.max_results]
        
        # Format response
        results = []
        for item in top_results:
            section = item["section"]
            document = item["document"]
            
            results.append(SectionSnippet(
                id=section.id,
                document_id=document.id,
                document_title=document.title or document.original_filename,
                document_filename=document.original_filename,
                section_title=section.section_title,
                snippet=section.snippet,
                page_number=section.page_number,
                relevance_score=round(item["similarity"], 4)
            ))
        
        processing_time = time.time() - start_time
        
        return ConnectDotsResponse(
            query=request.selected_text,
            results=results,
            processing_time=round(processing_time, 3)
        )
        
    finally:
        db.close()

@app.post("/insights")
async def generate_insights(request: InsightRequest):
    """
    Step 2 - Insight Generation: Generate LLM-powered insights
    
    Goes beyond finding related text to provide contextual insights
    """
    if not request.related_sections:
        raise HTTPException(status_code=400, detail="No related sections provided")
    
    db = SessionLocal()
    try:
        # Get related sections content
        sections = db.query(DocumentSection, Document).join(
            Document, DocumentSection.document_id == Document.id
        ).filter(
            DocumentSection.id.in_(request.related_sections)
        ).all()
        
        if not sections:
            raise HTTPException(status_code=404, detail="No sections found")
        
        # Prepare context for LLM
        context_sections = []
        for section, document in sections:
            context_sections.append({
                "document": document.title or document.original_filename,
                "section": section.section_title,
                "content": section.section_content[:500]  # Limit content
            })
        
        # Create LLM prompt based on insight type
        if request.insight_type == "contradictions":
            prompt = f"""
            Analyze the following selected text and related sections for contradictions or opposing viewpoints:
            
            Selected Text: "{request.selected_text}"
            
            Related Sections:
            {json.dumps(context_sections, indent=2)}
            
            Identify any contradictory viewpoints, opposing arguments, or conflicting information. 
            Focus on differences in methodology, conclusions, or perspectives.
            """
        elif request.insight_type == "examples":
            prompt = f"""
            Based on the selected text and related sections, provide concrete examples and applications:
            
            Selected Text: "{request.selected_text}"
            
            Related Sections:
            {json.dumps(context_sections, indent=2)}
            
            Identify specific examples, case studies, or practical applications mentioned in the documents.
            """
        elif request.insight_type == "takeaways":
            prompt = f"""
            Extract key takeaways and important insights from the selected text and related sections:
            
            Selected Text: "{request.selected_text}"
            
            Related Sections:
            {json.dumps(context_sections, indent=2)}
            
            Provide the most important insights, lessons learned, and key points that readers should remember.
            """
        else:  # comprehensive
            prompt = f"""
            Provide comprehensive insights about the selected text based on related sections from the user's document library:
            
            Selected Text: "{request.selected_text}"
            
            Related Sections:
            {json.dumps(context_sections, indent=2)}
            
            Analyze for:
            1. Key patterns and connections
            2. Contradictory or supporting viewpoints
            3. Practical examples and applications
            4. Important takeaways
            5. Cross-document insights
            
            Keep insights grounded in the provided documents only.
            """
        
        # Call LLM if available
        if LLM_AVAILABLE:
            try:
                messages = [{"role": "user", "content": prompt}]
                insights = get_llm_response(messages)
            except Exception as e:
                print(f"LLM call failed: {e}")
                insights = f"LLM service unavailable. Using local analysis: The selected text relates to {len(context_sections)} sections across your documents, covering topics like {', '.join([s['section'] for s in context_sections[:3]])}."
        else:
            insights = f"The selected text connects to {len(context_sections)} sections across your document library. Key themes include: {', '.join([s['section'] for s in context_sections[:3]])}."
        
        return {
            "selected_text": request.selected_text,
            "insight_type": request.insight_type,
            "insights": insights,
            "related_sections_count": len(context_sections),
            "grounded_in_documents": True
        }
    
    finally:
        db.close()

@app.post("/audio-overview")
async def generate_audio_overview(request: AudioRequest):
    """
    Step 3 - Rich Media Experience: Generate audio overview/podcast
    
    Creates natural-sounding audio based on selected text and insights
    """
    if not request.related_sections:
        raise HTTPException(status_code=400, detail="No related sections provided")
    
    db = SessionLocal()
    try:
        # Get related sections
        sections = db.query(DocumentSection, Document).join(
            Document, DocumentSection.document_id == Document.id
        ).filter(
            DocumentSection.id.in_(request.related_sections)
        ).all()
        
        if not sections:
            raise HTTPException(status_code=404, detail="No sections found")
        
        # Prepare context for LLM-powered script generation
        context_sections = []
        for section, document in sections[:5]:  # Use more sections for richer content
            context_sections.append({
                "document": document.title or document.original_filename,
                "section": section.section_title,
                "content": section.section_content[:800],  # More content for better context
                "snippet": section.snippet
            })
        
        # Generate LLM-powered script
        if request.audio_type == "podcast":
            prompt = f"""
            Create a natural-sounding podcast conversation script about this topic. This will be converted to AUDIO, so write it exactly like people actually SPEAK, not like formal text.
            
            Selected Topic: "{request.text_content}"
            
            Related Content from Documents:
            {json.dumps(context_sections, indent=2)}
            
            CRITICAL REQUIREMENTS for SPOKEN AUDIO:
            1. Write like REAL CONVERSATION - use "um", "you know", "actually", "well", "so"
            2. Use contractions: "it's", "you're", "that's", "we've", "I'm"
            3. Break up long sentences with natural pauses
            4. Reference documents like: "So in that document about... what was it... oh yeah, the engineering guide"
            5. Make it sound spontaneous, not scripted
            6. Use spoken transitions: "And here's the interesting part...", "But wait, there's more..."
            7. Include thinking out loud: "Hmm, that's fascinating because..."
            8. Natural speech patterns, NOT formal writing
            9. Keep it 2-3 minutes (300-400 words max)
            10. Make it sound like two friends having a genuine conversation
            
            Format: Write EXACTLY how people speak, with natural flow and pauses.
            """
        else:  # overview
            prompt = f"""
            Create a natural-sounding audio script. This will be SPOKEN OUT LOUD, so write exactly like a person naturally talks when they're excited to share something interesting they discovered.
            
            Selected Topic: "{request.text_content}"
            
            Related Content from Documents:
            {json.dumps(context_sections, indent=2)}
            
            CRITICAL REQUIREMENTS for SPOKEN AUDIO:
            1. Start like a human would naturally begin: "So I was looking through...", "You know what's interesting?", "I found something cool..."
            2. NEVER start with "Here's an audio overview" or anything robotic
            3. Write like someone is ACTUALLY TALKING to you face-to-face
            4. Use natural speech: "So here's what I found...", "You know what caught my attention..."
            5. Use contractions: "I've", "you're", "that's", "there's", "it's"
            6. Break up complex ideas into simple, conversational chunks
            7. Use spoken transitions: "And get this...", "But here's the thing...", "So anyway..."
            8. Reference documents casually: "In one of your docs about... let me think... oh yeah..."
            9. Include natural pauses and thinking: "Hmm...", "Actually...", "Well..."
            10. Sound like a smart friend explaining something they discovered
            11. Keep it personal and conversational (2-3 minutes, 250-350 words)
            12. End with something that sounds natural, not formal
            13. Make it sound like you're genuinely excited to share this discovery
            
            Start with something natural like: "So I was digging through your documents..." or "You know what I noticed?" or "I found something pretty interesting..."
            
            Write as ONE PERSON speaking naturally and conversationally, like they just discovered something cool.
            """
        
        # Generate script using LLM
        print(f"🤖 Calling LLM to generate natural audio script...")
        messages = [{"role": "user", "content": prompt}]
        script = get_llm_response(messages)
        print(f"🤖 LLM SUCCESS! Generated natural script length: {len(script)}")
        
        print(f"🎵 SCRIPT GENERATED!")
        print(f"🎵 Script length: {len(script)} characters")
        print(f"🎵 Script preview: {script[:200]}...")
        print(f"🎵 TTS_AVAILABLE: {TTS_AVAILABLE}")
        
        # Generate audio file if TTS is available
        if TTS_AVAILABLE:
            try:
                audio_filename = f"audio_overview_{uuid.uuid4().hex[:8]}.mp3"
                audio_path = Path("static") / audio_filename
                audio_path.parent.mkdir(exist_ok=True)
                
                # Clean the script for TTS by removing markdown formatting
                clean_script = clean_script_for_tts(script)
                print(f"🧹 Script cleaned for TTS! Length: {len(clean_script)} chars")
                print(f"🧹 Clean script preview: {clean_script[:200]}...")
                
                generate_audio(clean_script, str(audio_path), voice=request.voice)
                
                return {
                    "success": True,
                    "audio_file": f"/static/{audio_filename}",
                    "script": script if request.audio_type == "overview" else "Podcast script generated",
                    "duration_estimate": f"{len(script.split()) // 150}-{len(script.split()) // 120} minutes",
                    "audio_type": request.audio_type,
                    "sections_included": len(sections)
                }
                
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Audio generation failed: {str(e)}",
                    "script": script,
                    "fallback": True
                }
        else:
            return {
                "success": False,
                "error": "TTS service not available",
                "script": script,
                "fallback": True
            }
    
    finally:
        db.close()

# Catch-all route for frontend SPA routing (must be last!)
@app.get("/{full_path:path}")
async def serve_frontend_routes(full_path: str):
    """Serve frontend for all non-API routes"""
    # Don't intercept API routes or asset files
    if full_path.startswith(("health", "documents", "connect-dots", "insights", "audio-overview", "batch-upload", "static", "assets")):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # Serve index.html for all other routes (SPA routing)
    try:
        return FileResponse("static/index.html")
    except:
        raise HTTPException(status_code=404, detail="Frontend not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
