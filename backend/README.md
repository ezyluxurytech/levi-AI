# Levi AI — Python FastAPI Backend

Open Source AI-powered learning and document-understanding assistant.

## Setup & Running

1. **Create virtual environment**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Run the FastAPI server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive API docs will be available at `http://localhost:8000/docs`.

## Architecture & Features

- **PyMuPDF Document Extraction**: Extracts selectable text, page boundaries, and structured blocks. Accurately reports image-only / scanned documents without silently failing.
- **Passage-Grounded Q&A**: Splits documents into semantically scoped chunks and retrieves the most relevant passages for question answering.
- **Replaceable AI Provider**: `BaseAIProvider` interface decouples the web application from any single AI vendor or open-weight model.
- **Language Support**: Yoruba, Igbo, Hausa, and English translation with cultural tone retention.
