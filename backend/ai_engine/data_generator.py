import pandas as pd
import numpy as np
import random
import os
import datetime

def generate_document_text(file_type, department, is_good, is_urgent):
    positive_sentences = [
        "All attached forms are verified and compliant with regulations.",
        "The applicant has provided all necessary documentation, completely verified.",
        "This submission is in full accordance with official guidelines."
    ]
    negative_sentences = [
        "Please note there is a missing signature on page 2.",
        "This document appears incomplete and contains unverified claims.",
        "Warning: The attached invoice shows signs of fraudulent activity."
    ]
    urgent_sentences = [
        "This requires immediate attention.",
        "Please expedite this request as it is highly urgent.",
        "Critical deadline approaching, process immediately."
    ]
    
    # Simulating the mandatory fields that the AI regex will check
    date_field = f"Date: {datetime.date.today()}" if is_good else "Date: ___"
    sig_field = "Signature: John Doe" if is_good else "Signature: ___"

    keyword_sentence = random.choice(positive_sentences) if is_good else random.choice(negative_sentences)
    urgency_sentence = random.choice(urgent_sentences) if is_urgent else ""

    if file_type == 'complaint':
        template = (
            "{date}\n"
            "To the {dept} Department,\n\n"
            "I am writing to formally lodge a complaint regarding recent services. "
            "{keyword_sentence} {urgency_sentence} I expect a prompt resolution to this matter "
            "as it has caused significant disruption.\n\n"
            "Sincerely,\nConcerned Citizen\n\n{sig}"
        )
    elif file_type == 'invoice':
        template = (
            "INVOICE SUMMARY - {dept} Department\n"
            "{date}\n\n"
            "Billing Period: Q3\n"
            "Services Rendered: Contractor consultation.\n"
            "{keyword_sentence} {urgency_sentence}\n"
            "Please remit payment within 30 days.\n\n{sig}"
        )
    else: # application or request
        template = (
            "Official Submission Form - {dept}\n"
            "{date}\n\n"
            "This document serves as a formal submission for review. "
            "The contents below outline the request in detail. "
            "{keyword_sentence} {urgency_sentence}\n"
            "Awaiting your final approval.\n\n{sig}"
        )

    return template.format(
        date=date_field,
        dept=department, 
        keyword_sentence=keyword_sentence, 
        urgency_sentence=urgency_sentence,
        sig=sig_field
    )

def generate_dataset(num_samples=5000):
    np.random.seed(42)
    random.seed(42)

    departments = ['Finance', 'Health', 'Transport', 'Education', 'Urban Planning']
    file_types = ['application', 'complaint', 'request', 'invoice', 'report']

    data = []
    
    for _ in range(num_samples):
        dept = random.choice(departments)
        ftype = random.choice(file_types)
        
        # 70% chance it's a good file
        is_good = random.random() > 0.3
        
        if ftype == 'complaint':
            is_urgent = random.random() > 0.3
        else:
            is_urgent = random.random() > 0.8
            
        description = generate_document_text(ftype, dept, is_good, is_urgent)
        
        priority = 'Critical' if is_urgent and random.random() > 0.5 else ('Urgent' if is_urgent else 'Normal')
            
        approval = 1 if is_good else 0
        if random.random() < 0.05: # 5% noise
            approval = 1 - approval
            
        data.append({
            'department': dept,
            'file_type': ftype,
            'description': description, # Keeping column name 'description' so train_models.py works without change
            'priority': priority,
            'is_approved': approval
        })
        
    df = pd.DataFrame(data)
    
    os.makedirs('dataset', exist_ok=True)
    df.to_csv('dataset/synthetic_gov_data.csv', index=False)
    print(f"Generated {num_samples} FULL DOCUMENT records and saved to dataset/synthetic_gov_data.csv")

if __name__ == "__main__":
    generate_dataset()
