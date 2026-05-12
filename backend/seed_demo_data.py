import os
import sys
import django
import shutil
import random
from datetime import datetime, timedelta
from django.core.files.base import ContentFile

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paperless_backend.settings')
django.setup()

from core.models import User, File, Status, AIPrediction, SupportingDocument, FileRequest
from ai_engine.predict import get_predictions

def clear_data():
    print("Clearing old files and requests...")
    FileRequest.objects.all().delete()
    File.objects.all().delete()
    
    media_uploads = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media', 'uploads')
    if os.path.exists(media_uploads):
        shutil.rmtree(media_uploads)
    os.makedirs(media_uploads, exist_ok=True)
    os.makedirs(os.path.join(media_uploads, 'supporting'), exist_ok=True)
    print("Old data cleared.")

def create_file_with_ai(name, dept, priority, desc, uploader, text_content, citizen_email=None, citizen_phone=None, support_files=None, initial_stage='Officer Review', remarks="File uploaded and sent for review."):
    f = File.objects.create(
        name=name,
        department=dept,
        priority=priority,
        description=desc,
        uploaded_by=uploader,
        citizen_email=citizen_email,
        citizen_phone=citizen_phone
    )
    # create dummy physical file
    f.file_path.save(f"{name.replace(' ', '_')}.txt", ContentFile(text_content))
    
    file_paths_to_scan = [f.file_path.path]
    
    if support_files:
        for sf_name, sf_text in support_files:
            sd = SupportingDocument.objects.create(
                file=f,
                name=sf_name
            )
            sd.file_path.save(f"{sf_name.replace(' ', '_')}.txt", ContentFile(sf_text))
            file_paths_to_scan.append(sd.file_path.path)
            
    # Run AI
    predictions = get_predictions(file_paths_to_scan, dept)
    
    final_initial_stage = initial_stage
    final_remarks = remarks
    
    if predictions:
        f.description = predictions.get('extracted_text', '')[:1000]
        
        # If the file has detected errors, the AI logic auto-returns it in real scenario
        # But if we explicitly want a specific stage for demo, we can force it, 
        # except when testing the 'Returned to Clerk' feature
        if predictions.get('detected_errors') and initial_stage == 'Officer Review':
            final_initial_stage = 'Returned to Clerk'
            final_remarks = "AI Auto-Reject: " + predictions['detected_errors']
            
        AIPrediction.objects.create(
            file=f,
            classification=predictions['classification'],
            predicted_priority=predictions['predicted_priority'],
            approval_probability=predictions['approval_probability'],
            rejection_probability=predictions['rejection_probability'],
            detected_errors=predictions.get('detected_errors', ''),
            decision=predictions.get('decision', 'ESCALATE'),
            reason=predictions.get('reason', ''),
            key_factors=predictions.get('key_factors', ''),
            flags=predictions.get('flags', '')
        )
        
        f.priority = predictions['predicted_priority']
        f.save()
        
    Status.objects.create(
        file=f,
        current_stage=final_initial_stage,
        remarks=final_remarks
    )
    return f

def generate_dept_files(dept_name, clerk, stages):
    """Generate ~10-12 files for a department covering all stages and cases."""
    print(f"--- Generating files for {dept_name} ---")
    
    # 1. Normal Uploaded (Officer Review) - Waiting for officer
    create_file_with_ai(
        name=f"Routine Monthly Report - {dept_name}",
        dept=dept_name,
        priority="Normal",
        desc="Standard monthly activity report.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nAll attached forms are verified and compliant with regulations.\nSignature: Clerk Name",
        initial_stage='Officer Review'
    )
    
    # 2. Higher Authority Review
    create_file_with_ai(
        name=f"Equipment Procurement Request - {dept_name}",
        dept=dept_name,
        priority="Normal",
        desc="Request to purchase office equipment.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nAll attached forms are verified and compliant with regulations.\nSignature: Clerk Name",
        initial_stage='Higher Authority Review',
        remarks="Verified by Officer. Forwarded to Higher Authority."
    )
    
    # 3. Head Approval
    create_file_with_ai(
        name=f"Annual Budget Proposal - {dept_name}",
        dept=dept_name,
        priority="Normal",
        desc="Proposal for next financial year budget.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nAll attached forms are verified and compliant with regulations.\nSignature: Clerk Name",
        initial_stage='Head Approval',
        remarks="Reviewed by Higher Authority. Forwarded to Head."
    )
    
    # 4. Final Approval
    create_file_with_ai(
        name=f"Staff Training Schedule - {dept_name}",
        dept=dept_name,
        priority="Normal",
        desc="Training schedule for the upcoming quarter.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nAll attached forms are verified and compliant with regulations.\nSignature: Clerk Name",
        initial_stage='Final Approval',
        remarks="Approved by Head."
    )
    
    # 5. Rejected
    create_file_with_ai(
        name=f"Unauthorized Expense Claim - {dept_name}",
        dept=dept_name,
        priority="Normal",
        desc="Expense claim outside of policy.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nAll attached forms are verified and compliant with regulations.\nSignature: Clerk Name",
        initial_stage='Rejected',
        remarks="Claim denied due to policy violation."
    )
    
    # 6. Returned for Correction (Manual return by Officer)
    create_file_with_ai(
        name=f"Vendor Contract Renewal - {dept_name}",
        dept=dept_name,
        priority="Normal",
        desc="Contract renewal missing pages.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nAll attached forms are verified and compliant with regulations.\nSignature: Clerk Name",
        initial_stage='Returned for Correction',
        remarks="Please attach the missing annexure pages."
    )
    
    # 7. Escalated
    create_file_with_ai(
        name=f"Major Infrastructure Policy - {dept_name}",
        dept=dept_name,
        priority="Urgent",
        desc="Policy requiring state-level clearance.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nAll attached forms are verified and compliant with regulations. Critical deadline approaching, process immediately.\nSignature: Clerk Name",
        initial_stage='Escalated',
        remarks="Escalated to State Govt for final decision."
    )
    
    # 8. AI Penalty / Missing Info (Auto-Reject)
    create_file_with_ai(
        name=f"Incomplete Application - {dept_name}",
        dept=dept_name,
        priority="Normal",
        desc="Application missing mandatory fields.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nThis document appears incomplete.\nSignature: ___",
        initial_stage='Officer Review' # Will be auto-rejected by AI
    )
    
    # 9. History/Policy Rejection - 15 days leave
    create_file_with_ai(
        name=f"Extended Leave Request - {dept_name} Staff",
        dept=dept_name,
        priority="Normal",
        desc="Requesting 15 days leave for vacation.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nI am requesting a 15 days leave for personal reasons.\nAll attached forms are verified and compliant with regulations.\nSignature: Staff",
        initial_stage='Higher Authority Review',
        remarks="Officer forwarded despite AI warning."
    )
    
    # 10. Medical Emergency Override
    create_file_with_ai(
        name=f"Medical Leave Request - {dept_name}",
        dept=dept_name,
        priority="Urgent",
        desc="Requesting 15 days leave for surgery.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nI am requesting a 15 days leave because I am hospitalized for a heart surgery.\nAll attached forms are verified and compliant with regulations.\nSignature: Staff",
        initial_stage='Officer Review'
    )
    
    # 11. Citizen Portal File
    cit_file = create_file_with_ai(
        name=f"Public Grievance - {dept_name}",
        dept=dept_name,
        priority="Normal",
        desc="Grievance filed by a citizen.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nThe applicant has provided all necessary documentation, completely verified.\nSignature: Citizen",
        citizen_email=f"citizen_{dept_name.lower().replace(' ', '')}@example.com",
        citizen_phone="9876543210",
        initial_stage='Higher Authority Review',
        remarks="Verified by Officer."
    )
    
    # Add multiple statuses to citizen file to show timeline
    Status.objects.create(file=cit_file, current_stage="Officer Review", remarks="File received.")
    Status.objects.create(file=cit_file, current_stage="Higher Authority Review", remarks="Forwarded to authority.")
    
    # 12. Evidence Bonus (File with supporting docs)
    create_file_with_ai(
        name=f"Complex Reimbursement - {dept_name}",
        dept=dept_name,
        priority="Urgent",
        desc="Reimbursement with multiple receipts.",
        uploader=clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nTo the {dept_name} Department,\nReimbursement request.\nSignature: Staff",
        support_files=[
            ("Travel Receipt", "Amount: $500. Verified."),
            ("Hotel Bill", "Amount: $300. Verified.")
        ],
        initial_stage='Head Approval',
        remarks="Reviewed and approved by lower levels."
    )

def seed():
    clear_data()
    
    departments = ['Finance', 'Health', 'Transport', 'Education', 'Urban Planning']
    
    # Validate users exist
    for dept in departments:
        if not User.objects.filter(department=dept, role='Clerk').exists():
            print(f"Error: No Clerk found for {dept}. Please run seed_staff.py first.")
            return

    print("Seeding ~12 Demo Files per Department (Total ~60 files)...")

    for dept in departments:
        clerk = User.objects.filter(department=dept, role='Clerk').first()
        generate_dept_files(dept, clerk, [])
        
    print("Creating Inter-departmental Requests...")
    finance_clerk = User.objects.filter(department='Finance', role='Clerk').first()
    finance_officer = User.objects.filter(department='Finance', role='Officer').first()
    health_clerk = User.objects.filter(department='Health', role='Clerk').first()
    edu_clerk = User.objects.filter(department='Education', role='Clerk').first()

    # Pending Request
    FileRequest.objects.create(
        requesting_user=health_clerk,
        requesting_department='Health',
        target_department='Finance',
        subject='Healthcare Budget Allocation Details FY25',
        purpose='To align state health schemes with allocated budget.',
        confidentiality='Confidential',
        status='Pending'
    )
    
    # Approved Request
    req = FileRequest.objects.create(
        requesting_user=finance_officer,
        requesting_department='Finance',
        target_department='Education',
        subject='Education Infrastructure Audit',
        purpose='Verification of funds utilized.',
        confidentiality='Simple',
        status='Approved',
        remarks='Document attached and released.'
    )
    
    f_audit = create_file_with_ai(
        name="Infrastructure Audit Report (Shared)",
        dept="Education",
        priority="Normal",
        desc="Audit report shared via request.",
        uploader=edu_clerk,
        text_content=f"Date: {datetime.now().strftime('%Y-%m-%d')}\nAll attached forms are verified and compliant with regulations.\nSignature: Auditor",
        initial_stage="Final Approval"
    )
    req.file = f_audit
    req.save()

    print("Demo data seeded successfully! 60+ files generated.")

if __name__ == '__main__':
    seed()
