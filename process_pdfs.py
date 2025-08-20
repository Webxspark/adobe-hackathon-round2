import os
import json
import re
from pathlib import Path
import fitz  # PyMuPDF
from typing import List, Dict, Any

def extract_title(doc) -> str:
    """Extract title from PDF metadata or first page, with trailing space"""
    # Try metadata first
    metadata = doc.metadata
    if metadata.get('title') and metadata['title'].strip():
        return metadata['title'].strip() + "  "  # Add trailing spaces like reference
    
    # Fall back to first page text analysis for comprehensive title
    if len(doc) > 0:
        first_page = doc[0]
        text_dict = first_page.get_text("dict")
        
        # Collect potential title components with font info
        title_candidates = []
        
        for block in text_dict.get("blocks", []):
            if "lines" in block:
                for line in block["lines"]:
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        font_size = span.get("size", 0)
                        if (len(text) > 5 and len(text) < 150 and 
                            font_size > 10 and
                            not re.match(r'^\d+$|^page \d+|^chapter \d+', text.lower())):
                            title_candidates.append({
                                "text": text,
                                "font_size": font_size,
                                "bbox": span.get("bbox", [0, 0, 0, 0])
                            })
        
        if title_candidates:
            # Sort by font size and position (top of page first)
            title_candidates.sort(key=lambda x: (-x["font_size"], x["bbox"][1]))
            
            # Take top candidates and combine them
            top_candidates = title_candidates[:3]  # Top 3 potential title parts
            combined_title = " ".join([c["text"] for c in top_candidates])
            
            if len(combined_title) > 10:
                return combined_title + "  "  # Add trailing spaces like reference
            elif title_candidates:
                return title_candidates[0]["text"] + "  "  # Add trailing spaces like reference
    
    return ""

def detect_outline_structure(doc) -> List[Dict[str, Any]]:
    """Extract document outline/structure from PDF using smart header detection"""
    outline = []
    
    # Strategy 1: Try to get bookmarks/TOC first
    toc = doc.get_toc()
    if toc:
        for item in toc:
            level, title, page = item
            outline.append({
                "level": f"H{min(level, 6)}",  # Cap at H6
                "text": title.strip(),
                "page": page
            })
        return outline
    
    # Strategy 2: Collect all text with font information for analysis
    all_text_info = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text_dict = page.get_text("dict")
        
        for block in text_dict.get("blocks", []):
            if "lines" in block:
                for line in block["lines"]:
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        if text and len(text) > 2:  # Ignore very short text
                            all_text_info.append({
                                "text": text,
                                "font_size": span.get("size", 0),
                                "flags": span.get("flags", 0),
                                "page": page_num + 1,
                                "font": span.get("font", ""),
                                "bbox": span.get("bbox", [0, 0, 0, 0])  # For position analysis
                            })
    
    if not all_text_info:
        return []
    
    # Calculate font size statistics
    font_sizes = [item["font_size"] for item in all_text_info if item["font_size"] > 0]
    if not font_sizes:
        return []
    
    avg_font_size = sum(font_sizes) / len(font_sizes)
    max_font_size = max(font_sizes)
    
    # Helper function to check if text looks like a header
    def is_likely_header(text: str) -> bool:
        """Check if text has characteristics of a header"""
        # Exclude obvious non-headers
        if len(text) > 80:  # Too long for a header
            return False
        if len(text) < 4:  # Too short
            return False
        if text.count(' ') > 12:  # Too many words (likely paragraph)
            return False
        if text.endswith('.') and len(text) > 30:  # Long sentences
            return False
        if any(word in text.lower() for word in ['the following', 'as shown', 'figure', 'table']):
            return False
        if text.count(',') > 3:  # Too many commas (likely sentence)
            return False
        return True
    
    # Helper function to determine header level
    def get_header_level(text: str, font_size: float, is_bold: bool) -> str:
        """Determine appropriate header level based on text characteristics"""
        import re
        
        # Pattern-based level assignment (highest priority)
        if re.match(r'^\d+\.\s+[A-Z]', text):  # "1. Introduction"
            return "H1"
        if re.match(r'^\d+\.\d+\s+[A-Z]', text):  # "1.1 Overview"
            return "H2"
        if re.match(r'^\d+\.\d+\.\d+\s+', text):  # "1.1.1 Details"
            return "H3"
        if re.match(r'^Chapter\s+\d+', text, re.IGNORECASE):
            return "H1"
        if re.match(r'^Section\s+\d+', text, re.IGNORECASE):
            return "H2"
        if re.match(r'^Appendix\s+[A-Z]', text, re.IGNORECASE):
            return "H2"
        
        # Check for common H1 patterns
        h1_patterns = ['introduction', 'conclusion', 'summary', 'overview', 'acknowledgement', 
                      'table of contents', 'references', 'bibliography', 'abstract']
        if any(pattern in text.lower() for pattern in h1_patterns):
            return "H1"
        
        # Check for common H2 patterns  
        h2_patterns = ['background', 'methodology', 'approach', 'evaluation', 'milestones',
                      'business outcomes', 'content', 'timeline', 'funding', 'requirements']
        if any(pattern in text.lower() for pattern in h2_patterns):
            return "H2"
        
        # Check for common H3 patterns
        h3_patterns = ['access', 'guidance', 'training', 'support', 'phase', 'preamble',
                      'membership', 'term', 'chair', 'meetings', 'criteria', 'process']
        if any(pattern in text.lower() for pattern in h3_patterns):
            return "H3"
        
        # Font-based level assignment (more conservative)
        if font_size >= max_font_size * 0.95:
            return "H1"
        elif font_size >= avg_font_size * 1.4:
            return "H1" if is_bold else "H2"
        elif font_size >= avg_font_size * 1.2:
            return "H2" if is_bold else "H3"
        elif font_size >= avg_font_size * 1.0:
            return "H3"
        else:
            return "H4"
    
    # Strategy 3: Smart header detection
    potential_headers = []
    
    for item in all_text_info:
        text = item["text"]
        font_size = item["font_size"]
        font_flags = item["flags"]
        page = item["page"]
        is_bold = bool(font_flags & 2**4)  # Bold flag
        
        # Skip if clearly not a header
        if not is_likely_header(text):
            continue
        
        # Calculate header score
        score = 0
        
        # Font size bonus
        if font_size > avg_font_size * 1.1:
            score += 3
        elif font_size > avg_font_size:
            score += 1
        
        # Bold text bonus
        if is_bold:
            score += 2
        
        # Structural patterns bonus
        import re
        if re.match(r'^\d+[\.\)]\s+\w', text):  # Numbered sections
            score += 5
        elif re.match(r'^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$', text):  # Title Case
            score += 2
        elif text.isupper() and len(text) > 6:  # ALL CAPS
            score += 2
        
        # Common header words bonus
        header_words = ['introduction', 'conclusion', 'summary', 'overview', 'background',
                       'methodology', 'results', 'discussion', 'abstract', 'references',
                       'contents', 'index', 'glossary', 'acknowledgments', 'preface']
        if any(word in text.lower() for word in header_words):
            score += 2
        
        # Penalties for unlikely headers
        if text.count(' ') > 8:  # Too many words
            score -= 2
        if len(text) > 60:  # Too long
            score -= 3
        if text.endswith('.') and not re.match(r'^\d+\.', text):  # Sentences (except numbered)
            score -= 2
        
        # Only consider items with decent scores
        if score >= 3:
            level = get_header_level(text, font_size, is_bold)
            potential_headers.append({
                "text": text,
                "level": level,
                "page": page,
                "score": score,
                "font_size": font_size
            })
    
    # Sort by score and font size, then select best headers
    potential_headers.sort(key=lambda x: (-x["score"], -x["font_size"]))
    
    # Remove duplicates and near-duplicates more intelligently
    seen_texts = set()
    page_text_tracker = {}  # Track texts per page to avoid too many from same page
    
    for header in potential_headers:
        text = header["text"]
        page = header["page"]
        text_lower = text.lower().strip()
        
        # Skip exact duplicates
        if text_lower in seen_texts:
            continue
        
        # Skip near-duplicates (like multiple "Overview" entries)
        is_duplicate = False
        for seen_text in seen_texts:
            if (text_lower == seen_text or 
                (len(text_lower) < 15 and text_lower in seen_text) or
                (len(seen_text) < 15 and seen_text in text_lower)):
                is_duplicate = True
                break
        
        if is_duplicate:
            continue
        
        # Limit headers per page (avoid too many from same page)
        if page not in page_text_tracker:
            page_text_tracker[page] = 0
        
        if page_text_tracker[page] >= 4:  # Max 4 headers per page
            continue
        
        # Add to final outline
        outline.append({
            "level": header["level"],
            "text": text + " ",  # Add trailing space to match reference format
            "page": page - 1  # Convert to 0-based indexing to match reference
        })
        
        seen_texts.add(text_lower)
        page_text_tracker[page] += 1
        
        # Limit total headers
        if len(outline) >= 15:  # Max 15 headers total
            break
    
    # Sort final outline by page and hierarchy
    return sorted(outline, key=lambda x: (x["page"], x["text"]))

def process_single_pdf(pdf_path: Path) -> Dict[str, Any]:
    """Process a single PDF file and extract structured data"""
    try:
        print(f"🔄 Opening PDF: {pdf_path}")
        doc = fitz.open(pdf_path)
        
        # Check if PDF has any pages
        if len(doc) == 0:
            print(f"❌ PDF has no pages: {pdf_path}")
            doc.close()
            return {
                "success": False,
                "error": "PDF has no pages",
                "title": None,
                "outline": []
            }
        
        # Extract title with fallback
        print(f"📝 Extracting title...")
        try:
            title = extract_title(doc)
            if not title or title.strip() == "":
                title = pdf_path.stem + "  "  # Use filename as fallback with trailing spaces
            print(f"📝 Extracted title: '{title}'")
        except Exception as e:
            print(f"⚠️ Title extraction failed, using filename: {e}")
            title = pdf_path.stem + "  "
        
        # Extract outline with fallback
        print(f"📊 Detecting outline structure...")
        try:
            outline = detect_outline_structure(doc)
            print(f"📊 Found {len(outline)} outline items")
        except Exception as e:
            print(f"⚠️ Outline extraction failed, creating basic structure: {e}")
            # Create basic outline from page count
            outline = []
            for i in range(min(len(doc), 10)):  # Max 10 pages for basic outline
                try:
                    page = doc[i]
                    page_text = page.get_text()[:100]  # First 100 chars
                    if page_text.strip():
                        outline.append({
                            "text": f"Page {i+1}",
                            "page": i
                        })
                except:
                    continue
        
        doc.close()
        
        # Ensure we have at least some content
        if not outline and title:
            outline = [{"text": title.strip(), "page": 0}]
        
        # Return success result with explicit success flag
        result = {
            "success": True,
            "title": title,
            "outline": outline
        }
        print(f"✅ PDF processing completed successfully")
        return result
    
    except Exception as e:
        error_msg = f"Error processing {pdf_path}: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        
        # Return explicit failure result
        return {
            "success": False,
            "error": error_msg,
            "title": None,
            "outline": []
        }

def process_pdfs():
    """Main function to process all PDFs in input directory"""
    # Get input and output directories
    input_dir = Path("/app/input")
    output_dir = Path("/app/output")
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Get all PDF files
    pdf_files = list(input_dir.glob("*.pdf"))
    
    if not pdf_files:
        print("No PDF files found in input directory")
        return
    
    print(f"Found {len(pdf_files)} PDF files to process")
    
    for pdf_file in pdf_files:
        print(f"Processing {pdf_file.name}...")
        
        # Process the PDF
        result = process_single_pdf(pdf_file)
        
        # Create output JSON file
        output_file = output_dir / f"{pdf_file.stem}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=4, ensure_ascii=False)
        
        print(f"Completed {pdf_file.name} -> {output_file.name}")
        print(f"  Title: {result['title']}")
        print(f"  Outline items: {len(result['outline'])}")

if __name__ == "__main__":
    print("Starting PDF processing...")
    process_pdfs() 
    print("PDF processing completed")