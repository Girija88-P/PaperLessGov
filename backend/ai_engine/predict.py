import joblib
import pandas as pd
import os
import re
import PyPDF2

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Load models once globally
type_model = None
priority_model = None
approval_model = None

def load_models():
    global type_model, priority_model, approval_model
    if type_model is None:
        try:
            type_model = joblib.load(os.path.join(MODELS_DIR, 'type_model.pkl'))
            priority_model = joblib.load(os.path.join(MODELS_DIR, 'priority_model.pkl'))
            approval_model = joblib.load(os.path.join(MODELS_DIR, 'approval_model.pkl'))
        except Exception as e:
            print(f"Error loading models: {e}")

def parse_and_check_document(file_path_abs):
    extracted_text = ""
    detected_errors = []
    
    try:
        # Check if it's a PDF
        if file_path_abs.lower().endswith('.pdf'):
            with open(file_path_abs, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    extracted_text += page.extract_text() + " "
        else:
            # Fallback for txt files
            with open(file_path_abs, 'r', encoding='utf-8') as f:
                extracted_text = f.read()
    except Exception as e:
        print(f"Failed to read file: {e}")
        extracted_text = "Error reading document."
        detected_errors.append("Unreadable file format or corrupted file.")
        
    # Mistake Detection Logic (Regex Rules)
    
    # Rule 1: Missing Signature Check
    # Looks for "Signature:" followed by nothing or just whitespace
    if re.search(r'Signature:\s*$', extracted_text, re.MULTILINE) or re.search(r'Signature:\s*___', extracted_text):
        detected_errors.append("Missing Signature: The signature field is blank.")
        
    # Rule 2: Missing Date Check
    if re.search(r'Date:\s*$', extracted_text, re.MULTILINE) or re.search(r'Date:\s*___', extracted_text):
        detected_errors.append("Missing Date: The document is not dated.")
        
    # Rule 3: Incomplete Fields Check
    if re.search(r'\[\s*\]', extracted_text) or re.search(r'___{3,}', extracted_text):
        detected_errors.append("Incomplete Fields: Found empty brackets or blank lines that must be filled.")

    return extracted_text, detected_errors

def get_predictions(file_paths, department):
    """Enhanced AI Engine with Decision Logic, History Patterns, and Medical Overrides."""
    load_models()
    
    if isinstance(file_paths, str):
        file_paths = [file_paths]
    
    all_text = []
    all_errors = []
    
    # Read main file
    main_text, main_errors = parse_and_check_document(file_paths[0])
    all_text.append(main_text)
    all_errors.extend(main_errors)
    
    # Read supporting files
    supp_text = []
    if len(file_paths) > 1:
        for path in file_paths[1:]:
            text, errors = parse_and_check_document(path)
            all_text.append(text)
            supp_text.append(text)
            all_errors.extend(errors)
    
    combined_text = "\n\n".join(all_text)
    combined_text_lower = combined_text.lower()
    
    # --- Scenario E: Cross-Reference Completeness Check ---
    main_text_lower = main_text.lower()
    attachment_keywords = ["attached", "enclosed", "supporting document", "annexure", "attachment", "receipt", "invoice"]
    mentions_attachments = any(word in main_text_lower for word in attachment_keywords)

    if mentions_attachments and len(file_paths) == 1:
        all_errors.append("Missing Attachments: The document mentions attachments but none were provided.")
    elif len(file_paths) > 1:
        # Relevance check: find overlap in significant words (length > 4) between main and supp docs
        main_words = set(re.findall(r'\b[a-z]{5,}\b', main_text_lower))
        supp_words = set(re.findall(r'\b[a-z]{5,}\b', " ".join(supp_text).lower()))
        common_words = main_words.intersection(supp_words)
        
        # If no significant overlap is found, flag as irrelevant
        if len(common_words) == 0:
            all_errors.append("Irrelevant Attachments: The provided supporting documents do not appear contextually related to the main file.")

    detected_errors = list(dict.fromkeys(all_errors))
    
    # 1. Base ML Analysis
    if type_model is None:
        return None

    df_type = pd.DataFrame([{'description': combined_text, 'department': department}])
    predicted_type = type_model.predict(df_type)[0]
    
    df_prio = pd.DataFrame([{'description': combined_text, 'department': department, 'file_type': predicted_type}])
    predicted_priority = priority_model.predict(df_prio)[0]
    
    df_app = pd.DataFrame([{
        'description': combined_text, 
        'department': department, 
        'file_type': predicted_type, 
        'priority': predicted_priority
    }])
    
    approval_probs = approval_model.predict_proba(df_app)[0]
    classes = list(approval_model.classes_)
    app_idx = classes.index(1) if 1 in classes else 1
    approval_probability = approval_probs[app_idx] * 100

    # 2. Advanced Decision Logic
    decision = "APPROVE"
    reason = "Standard request meets departmental criteria."
    key_factors = ["Policy compliance", "Document completeness"]
    flags = ""
    confidence = approval_probability

    # --- Scenario A: Medical Emergency Detection ---
    medical_keywords = ["surgery", "hospitalized", "accident", "heart", "icu", "medical", "doctor", "health issue", "treatment"]
    is_medical = any(word in combined_text_lower for word in medical_keywords)
    
    # --- Scenario B: Simulated History Pattern Matching ---
    # We look for "leave" and "days" in text
    days_match = re.search(r'(\d+)\s*days?', combined_text_lower)
    is_leave = "leave" in combined_text_lower
    
    if is_leave and days_match:
        days = int(days_match.group(1))
        # Rule: If > 10 days and not medical, government policy often rejects repeated long leaves
        if days >= 10:
            decision = "REJECT"
            reason = f"Request for {days} days exceeds standard personal leave threshold (10 days) without specific emergency justification."
            key_factors.append("Exceeds duration limit")
            confidence = 85.0
            
            # --- Scenario C: Pattern Override (The Medical Exception) ---
            if is_medical:
                decision = "ESCALATE"
                reason = "Request exceeds duration limit, but severe medical keywords detected. Forwarding for emergency adjudication."
                key_factors.append("Medical emergency override")
                flags = "Pattern override applied: Medical Exception"
                confidence = 70.0
                predicted_priority = "Critical"

    # --- Scenario D: Error/Missing Document Penalty ---
    if len(detected_errors) > 0:
        decision = "REJECT"
        if "Missing Attachments: The document mentions attachments but none were provided." in detected_errors:
            reason = "Document mentions supporting attachments, but none were provided."
        elif "Irrelevant Attachments: The provided supporting documents do not appear contextually related to the main file." in detected_errors:
            reason = "The provided supporting documents do not match the context of the main request."
        else:
            reason = "Required document fields are missing or incomplete."
            
        key_factors.extend(detected_errors)
        confidence = min(95.0, 50.0 + (len(detected_errors) * 10)) # High confidence in rejection if errors exist
        predicted_priority = "Urgent"

    # Evidence Bonus
    if len(file_paths) > 1 and decision != "REJECT":
        key_factors.append(f"Verified {len(file_paths)-1} contextually-related supporting document(s)")
        confidence = min(99.0, confidence + 10.0)

    return {
        'classification': predicted_type,
        'predicted_priority': predicted_priority,
        'approval_probability': round(confidence if decision == "APPROVE" else (100 - confidence), 2),
        'rejection_probability': round(confidence if decision == "REJECT" else (100 - confidence if decision == "APPROVE" else 50.0), 2),
        'detected_errors': "\n".join(detected_errors),
        'extracted_text': combined_text[:2000],
        'decision': decision,
        'reason': reason,
        'key_factors': ", ".join(key_factors),
        'flags': flags
    }
