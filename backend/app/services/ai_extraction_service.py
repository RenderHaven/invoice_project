"""
AI Document Extraction Service using Google Gemini Vision.
Uploads a document (PDF/image) to Gemini and extracts structured financial data.
"""
import json
import base64
from typing import Optional
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

EXTRACTION_PROMPT = """
You are a financial document parser. Extract all information from the provided document and return a JSON object with this exact structure:

{
  "document_type": "invoice | quotation | receipt | bill",
  "vendor": {
    "name": "",
    "gst_number": "",
    "email": "",
    "phone": "",
    "address": ""
  },
  "customer": {
    "name": "",
    "gst_number": "",
    "email": "",
    "phone": ""
  },
  "document_number": "",
  "document_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "line_items": [
    {
      "description": "",
      "quantity": 0,
      "unit_price": 0,
      "gst_rate": 0,
      "gst_amount": 0,
      "line_total": 0
    }
  ],
  "subtotal": 0,
  "gst_amount": 0,
  "total_amount": 0,
  "notes": ""
}

Return ONLY valid JSON. Use null for any missing fields.
"""


async def extract_document(file_bytes: bytes, mime_type: str) -> dict:
    """
    Send a document to Gemini Vision and extract structured data.
    Returns extracted_data dict and a confidence_score.
    """
    if not settings.GEMINI_API_KEY:
        return {
            "extracted_data": None,
            "confidence_score": 0.0,
            "error": "GEMINI_API_KEY not configured",
        }

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        b64_data = base64.b64encode(file_bytes).decode("utf-8")

        response = model.generate_content(
            [
                {"inline_data": {"mime_type": mime_type, "data": b64_data}},
                EXTRACTION_PROMPT,
            ],
            generation_config={"response_mime_type": "application/json"},
        )

        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        extracted = json.loads(text)
        return {"extracted_data": extracted, "confidence_score": 0.85}

    except json.JSONDecodeError as e:
        return {"extracted_data": None, "confidence_score": 0.0, "error": f"JSON parse error: {str(e)}"}
    except Exception as e:
        return {"extracted_data": None, "confidence_score": 0.0, "error": str(e)}
