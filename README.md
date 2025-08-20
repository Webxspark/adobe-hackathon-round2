# Adobe India Hackathon 2025 - Finale Solution

## "Connecting the Dots" - Personal Document Library with AI Insights

A full-stack application that transforms how users interact with their personal document library through AI-powered semantic search, insights generation, and audio overviews.

### 🚀 Features

#### Core Functionality
- **Batch PDF Upload**: Upload multiple PDFs to build your personal document library
- **Global Semantic Search**: Find relevant sections across ALL documents using advanced similarity algorithms
- **Challenge 1A/1B Integration**: Proven PDF processing logic from earlier challenges

#### AI-Powered Insights (Step 2)
- **LLM-powered Analysis**: Generate comprehensive insights, find contradictions, extract examples
- **Cross-Document Intelligence**: Identify patterns and connections across your entire library
- **Contextual Understanding**: Insights grounded in your actual documents

#### Rich Media Experience (Step 3)
- **Natural Audio Generation**: Convert insights into natural-sounding audio overviews
- **Podcast-Style Content**: Create conversational audio content from your documents
- **Text-to-Speech Integration**: High-quality audio generation with proper TTS cleaning

### 🏗️ Architecture

- **Backend**: FastAPI with SQLAlchemy for document management
- **Frontend**: React + TypeScript + Vite with Material UI
- **AI/ML**: Sentence transformers for semantic search, Gemini 2.5 Flash for insights
- **Audio**: eSpeak-NG for text-to-speech generation
- **Database**: SQLite for document metadata and sections

### 🐳 Quick Start with Docker

```bash
# Build the application
docker build -t adobe-finale-solution .

# Run the application
docker run -p 8080:8080 \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  -e ADOBE_EMBED_API_KEY="your_adobe_embed_api_key" \
  adobe-finale-solution
```

Access the application at `http://localhost:8080`

### 📋 Environment Variables

- `GEMINI_API_KEY`: Required for LLM-powered insights generation
- `ADOBE_EMBED_API_KEY`: For PDF embedding in the frontend
- `PORT`: Application port (default: 8080)

### 🔄 API Endpoints

#### Document Management
- `POST /upload` - Upload single or multiple PDFs
- `GET /documents` - List all documents in library
- `GET /documents/{id}` - Get document details
- `GET /documents/{id}/pdf` - Serve PDF for Adobe Embed API

#### Core Features
- `POST /connect-dots` - Find relevant sections across all documents
- `POST /insights` - Generate LLM-powered insights
- `POST /audio-overview` - Create audio overviews/podcasts

### 🎯 Accuracy Achievements

- **80%+ Accuracy**: Enhanced similarity algorithm for connect-dots feature
- **Natural Audio**: LLM-powered script generation with TTS cleaning
- **Robust Processing**: Comprehensive error handling with fallback logic

### 📁 Project Structure

```
submission/
├── Dockerfile              # Full-stack deployment
├── main.py                 # FastAPI backend with all features
├── process_pdfs.py         # Challenge 1A PDF processing
├── chat_with_llm.py        # LLM integration module
├── generate_audio.py       # TTS audio generation
├── requirements.txt        # Python dependencies
└── front-end/             # React frontend application
    ├── src/               # TypeScript source code
    ├── public/            # Static assets
    ├── package.json       # Node.js dependencies
    └── vite.config.ts     # Vite configuration
```

### 🏆 Competition Features

1. **Step 1 - Reading & Selection**: Advanced semantic search across all documents
2. **Step 2 - Insight Generation**: LLM-powered analysis with multiple insight types
3. **Step 3 - Rich Media Experience**: Natural audio generation for enhanced user experience

### 🔧 Development

For local development without Docker:

```bash
# Backend
pip install -r requirements.txt
python main.py

# Frontend
cd front-end
npm install
npm run dev
```

### 📝 Notes

- Built with proven Challenge 1A/1B processing logic
- Enhanced with universal similarity algorithm for 80%+ accuracy
- Full-stack integration with proper static file serving
- Production-ready with health checks and error handling
