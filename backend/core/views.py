from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import File, Status, AIPrediction, SupportingDocument, FileRequest, Notification
from .serializers import UserSerializer, FileSerializer, StatusSerializer, FileRequestSerializer, NotificationSerializer
import sys
import os

# Add ai_engine to path to import predict module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ai_engine.predict import get_predictions
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

def send_notification(user, title, message):
    """Helper to create DB notification AND send a real email."""
    # 1. Save to database (for in-portal notifications)
    Notification.objects.create(user=user, title=title, message=message)
    
    # 2. Print to server console (for demo visibility)
    print(f"\n--- [NOTIFICATION SENT TO {user.email}] ---")
    print(f"TITLE: {title}")
    print(f"MESSAGE: {message}")
    print("-------------------------------------------\n")
    
    # 3. Send REAL email if configured
    if user.email and hasattr(settings, 'EMAIL_HOST_USER') and 'YOUR_GMAIL' not in settings.EMAIL_HOST_USER:
        try:
            send_mail(
                subject=f"PaperLessGov - {title}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            print(f"✅ REAL EMAIL SENT to {user.email}")
        except Exception as e:
            print(f"⚠️ Email failed (check settings.py credentials): {e}")

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_dept = user.department or 'Common'
        if user_dept == 'Common' or user.role == 'Admin':
            return User.objects.all().order_by('username')
        return User.objects.filter(department__iexact=user_dept).order_by('username')

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = File.objects.all().order_by('-upload_date')

        # 1. Citizen Access: Only their own submitted files
        if user.role == 'Citizen':
            return qs.filter(citizen_email=user.email)

        # 2. Departmental Security Isolation
        user_dept = user.department or 'Common'
        if user_dept != 'Common':
            qs = qs.filter(
                Q(department__iexact=user_dept) | 
                Q(requests__requesting_department__iexact=user_dept, requests__status='Approved')
            ).distinct()
            
        return qs

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Secure file download — citizens can only download their own files."""
        from django.http import FileResponse
        file_obj = self.get_object()
        
        # Security: Citizens can only download files linked to their email
        if request.user.role == 'Citizen' and file_obj.citizen_email != request.user.email:
            return Response({'error': 'Unauthorized: This file is not linked to your account.'}, status=403)
        
        if file_obj.file_path and os.path.exists(file_obj.file_path.path):
            return FileResponse(
                open(file_obj.file_path.path, 'rb'),
                as_attachment=True,
                filename=os.path.basename(file_obj.file_path.name)
            )
        return Response({'error': 'File not found on server.'}, status=404)

    @action(detail=True, url_path='download_support/(?P<doc_id>[0-9]+)', methods=['get'])
    def download_support(self, request, pk=None, doc_id=None):
        """Download a specific supporting document."""
        from django.http import FileResponse
        file_obj = self.get_object()
        
        if request.user.role == 'Citizen' and file_obj.citizen_email != request.user.email:
            return Response({'error': 'Unauthorized'}, status=403)
        
        try:
            sd = SupportingDocument.objects.get(id=doc_id, file=file_obj)
            if sd.file_path and os.path.exists(sd.file_path.path):
                return FileResponse(
                    open(sd.file_path.path, 'rb'),
                    as_attachment=True,
                    filename=os.path.basename(sd.file_path.name)
                )
        except SupportingDocument.DoesNotExist:
            pass
        return Response({'error': 'Document not found.'}, status=404)

    @action(detail=False, methods=['get'])
    def my_files(self, request):
        """Citizens can fetch all files linked to their email."""
        user = request.user
        if user.role != 'Citizen':
            return Response({'error': 'This endpoint is for citizens only.'}, status=403)
        
        files = File.objects.filter(citizen_email=user.email).order_by('-upload_date')
        serializer = self.get_serializer(files, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def catalog(self, request):
        user = request.user
        user_dept = user.department or 'Common'
        
        files = File.objects.all()
        if user_dept != 'Common':
            files = files.filter(department__iexact=user_dept)
            
        files = files.order_by('-upload_date')
        data = []
        for f in files:
            data.append({
                'id': f.id,
                'name': f.name,
                'department': f.department,
                'priority': f.priority,
                'uploaded_by_name': f.uploaded_by.username,
                'upload_date': f.upload_date,
                'description': f.description[:150] + '...' if f.description else ''
            })
        return Response(data)

    # SECURITY: Allowed file extensions whitelist
    ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    def _validate_file(self, uploaded_file):
        """Server-side file validation to prevent malicious uploads."""
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"File type '{ext}' is not allowed. Permitted: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        if uploaded_file.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"File size ({uploaded_file.size // (1024*1024)}MB) exceeds the 10MB limit."
            )
            
        # SECURITY HOOK: ClamAV Virus Scanning
        # Requires ClamAV daemon installed on the production server (e.g., via pyclamd)
        # import pyclamd
        # cd = pyclamd.ClamdNetworkSocket()
        # if cd.ping():
        #     scan_result = cd.instream(uploaded_file.read())
        #     uploaded_file.seek(0)
        #     if scan_result and scan_result['stream'][0] == 'FOUND':
        #         raise serializers.ValidationError("Malware detected! File rejected.")

    def perform_create(self, serializer):
        # SECURITY: Validate main file before saving
        main_file = self.request.FILES.get('file_path')
        if main_file:
            self._validate_file(main_file)

        # Save file and set uploaded_by
        file_obj = serializer.save(uploaded_by=self.request.user)
        
        # Save supporting documents if any
        supporting_files = self.request.FILES.getlist('supporting_documents')
        file_paths_to_scan = [file_obj.file_path.path]
        
        for sf in supporting_files:
            self._validate_file(sf)  # SECURITY: Validate each supporting document
            supp_doc = SupportingDocument.objects.create(
                file=file_obj,
                name=sf.name,
                file_path=sf
            )
            file_paths_to_scan.append(supp_doc.file_path.path)
        
        # Call AI Prediction with the physical file paths
        predictions = get_predictions(file_paths_to_scan, file_obj.department)
        
        initial_status = 'Officer Review'
        remarks = 'File uploaded successfully.'
        
        if predictions:
            # Save the description extracted by the AI so we can see it in DB
            file_obj.description = predictions.get('extracted_text', '')[:1000] # store summary of text
            
            # Check for hard errors to auto-route back
            if predictions.get('detected_errors'):
                initial_status = 'Returned to Clerk'
                remarks = "AI Auto-Reject: " + predictions['detected_errors']
            
            AIPrediction.objects.create(
                file=file_obj,
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
            
            # Update priority based on AI
            file_obj.priority = predictions['predicted_priority']
            file_obj.save()

        # Initial Status Log with IP Tracking
        Status.objects.create(
            file=file_obj,
            current_stage=initial_status,
            remarks=remarks,
            ip_address=get_client_ip(self.request)
        )

        # Check for citizen contact integration
        citizen_email = file_obj.citizen_email
        if citizen_email:
            user_exists = User.objects.filter(email=citizen_email).exists()
            temp_pass = file_obj.citizen_phone if file_obj.citizen_phone else "Citizen123"
            
            # Build document list for transparency
            doc_list = f"1. {os.path.basename(file_obj.file_path.name)} (Main Document)"
            for idx, sd in enumerate(file_obj.supporting_documents.all(), 2):
                doc_list += f"\n{idx}. {sd.name} (Supporting Document)"
            
            if not user_exists:
                citizen_user = User.objects.create_user(
                    username=citizen_email,
                    email=citizen_email,
                    password=temp_pass,
                    role='Citizen',
                    first_name="Citizen"
                )
                welcome_msg = (
                    f"GOVERNMENT OF INDIA\n"
                    f"PaperLessGov - Digital Seva Portal\n"
                    f"{'='*50}\n\n"
                    f"OFFICIAL ACKNOWLEDGEMENT\n"
                    f"Reference No: PLG/{file_obj.department[:3].upper()}/{file_obj.id}\n"
                    f"Date: {file_obj.upload_date.strftime('%d-%b-%Y %I:%M %p')}\n\n"
                    f"Dear Citizen,\n\n"
                    f"Your application has been successfully received by the "
                    f"{file_obj.department} Department and is now under official review.\n\n"
                    f"APPLICATION DETAILS:\n"
                    f"  File ID         : #{file_obj.id}\n"
                    f"  Subject         : {file_obj.name}\n"
                    f"  Department      : {file_obj.department}\n"
                    f"  Priority        : {file_obj.priority}\n"
                    f"  Submitted By    : {file_obj.uploaded_by.first_name} {file_obj.uploaded_by.last_name}\n"
                    f"  Current Status  : {initial_status}\n\n"
                    f"DOCUMENTS RECEIVED:\n"
                    f"  {doc_list}\n\n"
                    f"CITIZEN PORTAL LOGIN CREDENTIALS:\n"
                    f"  Portal    : PaperLessGov Citizen Portal\n"
                    f"  Username  : {citizen_email}\n"
                    f"  Password  : {temp_pass}\n\n"
                    f"HOW TO TRACK YOUR APPLICATION:\n"
                    f"  Step 1 : Open the Citizen Portal link below\n"
                    f"  Step 2 : Enter your registered email as Username\n"
                    f"  Step 3 : Enter your phone number as Password\n"
                    f"  Step 4 : Click 'Login to Portal'\n"
                    f"  Step 5 : Go to 'Notifications' tab to see updates\n"
                    f"  Step 6 : Go to 'Document Tracking' tab and enter\n"
                    f"           File ID #{file_obj.id} to view status and\n"
                    f"           download your documents\n\n"
                    f"CITIZEN PORTAL LINK:\n"
                    f"  https://paper-less-gov.vercel.app/citizen-portal\n\n"
                    f"You will receive notifications at every stage of the\n"
                    f"review process until final approval or rejection.\n\n"
                    f"This is a system-generated notification. Please do not reply.\n\n"
                    f"Regards,\n"
                    f"{file_obj.department} Department\n"
                    f"PaperLessGov e-Governance Portal\n"
                    f"Government of India"
                )
                send_notification(citizen_user, f"Application #{file_obj.id} Received - {file_obj.department} Dept.", welcome_msg)
            else:
                citizen_user = User.objects.get(email=citizen_email)
                received_msg = (
                    f"GOVERNMENT OF INDIA\n"
                    f"PaperLessGov - Digital Seva Portal\n"
                    f"{'='*50}\n\n"
                    f"OFFICIAL ACKNOWLEDGEMENT\n"
                    f"Reference No: PLG/{file_obj.department[:3].upper()}/{file_obj.id}\n"
                    f"Date: {file_obj.upload_date.strftime('%d-%b-%Y %I:%M %p')}\n\n"
                    f"Dear Citizen,\n\n"
                    f"A new application has been filed on your behalf and is now under review.\n\n"
                    f"APPLICATION DETAILS:\n"
                    f"  File ID         : #{file_obj.id}\n"
                    f"  Subject         : {file_obj.name}\n"
                    f"  Department      : {file_obj.department}\n"
                    f"  Priority        : {file_obj.priority}\n"
                    f"  Submitted By    : {file_obj.uploaded_by.first_name} {file_obj.uploaded_by.last_name}\n"
                    f"  Current Status  : {initial_status}\n\n"
                    f"DOCUMENTS RECEIVED:\n"
                    f"  {doc_list}\n\n"
                    f"HOW TO TRACK YOUR APPLICATION:\n"
                    f"  Step 1 : Open the Citizen Portal link below\n"
                    f"  Step 2 : Enter your registered email as Username\n"
                    f"  Step 3 : Enter your phone number as Password\n"
                    f"  Step 4 : Go to 'Document Tracking' tab, enter File ID #{file_obj.id}\n\n"
                    f"CITIZEN PORTAL LINK:\n"
                    f"  https://paper-less-gov.vercel.app/citizen-portal\n\n"
                    f"You will be notified at every stage of the review process.\n\n"
                    f"Regards,\n"
                    f"{file_obj.department} Department\n"
                    f"PaperLessGov e-Governance Portal"
                )
                send_notification(citizen_user, f"Application #{file_obj.id} Received - {file_obj.department} Dept.", received_msg)

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        file_obj = self.get_object()
        user = request.user
        
        user_dept = getattr(user, 'department', 'Common')
        if user_dept != 'Common' and user_dept != file_obj.department:
            return Response({'error': 'Unauthorized: This file belongs to another department.'}, status=403)

        decision = request.data.get('decision') # 'approve', 'reject', 'return', 'escalate'
        remarks = request.data.get('remarks', '')

        # Define Hierarchy Order
        HIERARCHY = {
            'Clerk': 'Officer Review',
            'Officer': 'Higher Authority Review',
            'Higher Authority': 'Head Approval',
            'Head': 'Final Approval',
            'Admin': 'Final Approval'
        }

        if decision == 'escalate':
            next_stage = HIERARCHY.get(user.role, 'Closed')
        elif decision == 'approve':
            if user.role in ['Head', 'Admin']:
                next_stage = 'Final Approval'
            else:
                next_stage = HIERARCHY.get(user.role, 'Under Review')
        elif decision == 'return':
            next_stage = 'Returned to Clerk'
        elif decision == 'reject':
            next_stage = 'Rejected'
        else:
            return Response({'error': 'Invalid decision'}, status=400)

        Status.objects.create(
            file=file_obj,
            current_stage=next_stage,
            approved_by=user,
            remarks=remarks,
            ip_address=get_client_ip(request)
        )

        # NOTIFY CITIZEN OF STATUS CHANGE
        if file_obj.citizen_email:
            citizen_user = User.objects.filter(email=file_obj.citizen_email).first()
            if citizen_user:
                # Build document list
                doc_list = f"1. {os.path.basename(file_obj.file_path.name)} (Main Document)"
                for idx, sd in enumerate(file_obj.supporting_documents.all(), 2):
                    doc_list += f"\n  {idx}. {sd.name} (Supporting Document)"
                
                # Build full status timeline
                all_statuses = Status.objects.filter(file=file_obj).order_by('timestamp')
                timeline = ""
                for s in all_statuses:
                    by_name = s.approved_by.username if s.approved_by else "System"
                    timeline += f"  {s.timestamp.strftime('%d-%b-%Y %I:%M %p')} | {s.current_stage} | By: {by_name}\n"
                
                # Context-specific messages
                if decision == 'return':
                    action_text = (
                        f"IMPORTANT: Your application has been RETURNED FOR CORRECTION.\n\n"
                        f"REASON FOR RETURN:\n"
                        f"  {remarks if remarks else 'Please contact the department for details.'}\n\n"
                        f"ACTION REQUIRED:\n"
                        f"  The concerned clerk will update your documents as per the\n"
                        f"  instructions above and resubmit for review. You will be\n"
                        f"  notified once the corrected application is resubmitted.\n"
                    )
                elif decision == 'reject':
                    action_text = (
                        f"NOTICE: Your application has been REJECTED.\n\n"
                        f"REASON FOR REJECTION:\n"
                        f"  {remarks if remarks else 'Application did not meet departmental criteria.'}\n\n"
                        f"NEXT STEPS:\n"
                        f"  You may file a fresh application with corrected documents\n"
                        f"  or contact the {file_obj.department} Department for further assistance.\n"
                    )
                elif next_stage == 'Final Approval':
                    action_text = (
                        f"CONGRATULATIONS: Your application has been APPROVED.\n\n"
                        f"Your application has completed all stages of review and has\n"
                        f"received final approval from the Department Head.\n\n"
                        f"APPROVED BY: {user.first_name} {user.last_name} ({user.role})\n"
                    )
                else:
                    action_text = (
                        f"UPDATE: Your application has been moved to the next stage.\n\n"
                        f"REVIEWED BY : {user.first_name} {user.last_name} ({user.role})\n"
                        f"NEW STATUS  : {next_stage}\n"
                        f"REMARKS     : {remarks if remarks else 'No additional remarks.'}\n"
                    )
                
                status_msg = (
                    f"GOVERNMENT OF INDIA\n"
                    f"PaperLessGov - Digital Seva Portal\n"
                    f"{'='*50}\n\n"
                    f"STATUS UPDATE NOTIFICATION\n"
                    f"Reference No: PLG/{file_obj.department[:3].upper()}/{file_obj.id}\n\n"
                    f"Dear Citizen,\n\n"
                    f"{action_text}\n"
                    f"APPLICATION DETAILS:\n"
                    f"  File ID         : #{file_obj.id}\n"
                    f"  Subject         : {file_obj.name}\n"
                    f"  Department      : {file_obj.department}\n"
                    f"  Priority        : {file_obj.priority}\n\n"
                    f"DOCUMENTS ON FILE:\n"
                    f"  {doc_list}\n\n"
                    f"COMPLETE STATUS HISTORY:\n"
                    f"{timeline}\n"
                    f"TRACK & DOWNLOAD YOUR DOCUMENTS:\n"
                    f"  Portal Link : https://paper-less-gov.vercel.app/citizen-portal\n"
                    f"  Login       : Use your registered email as Username\n"
                    f"                and your phone number as Password\n"
                    f"  File ID     : #{file_obj.id}\n\n"
                    f"This is a system-generated notification. Please do not reply.\n\n"
                    f"Regards,\n"
                    f"{file_obj.department} Department\n"
                    f"PaperLessGov e-Governance Portal\n"
                    f"Government of India"
                )
                send_notification(citizen_user, f"Status Update: Application #{file_obj.id} - {next_stage}", status_msg)
        
        # NOTIFY UPLOADER (CLERK)
        if file_obj.uploaded_by != user:
            send_notification(
                file_obj.uploaded_by,
                f"Action Taken: {file_obj.name}",
                f"{user.first_name} {user.last_name} ({user.role}) has moved file #{file_obj.id} to '{next_stage}'.\nDecision: {decision.upper()}\nRemarks: {remarks if remarks else 'None'}"
            )

        return Response({'status': 'Workflow transitioned', 'next_stage': next_stage})

    @action(detail=True, methods=['post'])
    def resubmit(self, request, pk=None):
        file_obj = self.get_object()
        
        file_obj.name = request.data.get('name', file_obj.name)
        file_obj.department = request.data.get('department', file_obj.department)
        file_obj.priority = request.data.get('priority', file_obj.priority)
        file_obj.description = request.data.get('description', file_obj.description)
        
        if 'file_path' in request.FILES:
            file_obj.file_path = request.FILES['file_path']
            
        file_obj.save()

        delete_ids = request.data.getlist('delete_supporting_ids')
        if delete_ids:
            SupportingDocument.objects.filter(file=file_obj, id__in=delete_ids).delete()

        supporting_files = request.FILES.getlist('supporting_documents')
        if supporting_files:
            for sf in supporting_files:
                SupportingDocument.objects.create(
                    file=file_obj,
                    name=sf.name,
                    file_path=sf
                )
        
        any_changes = 'file_path' in request.FILES or supporting_files or delete_ids
        
        if any_changes:
            file_paths_to_scan = [file_obj.file_path.path]
            for sd in file_obj.supporting_documents.all():
                if sd.file_path and os.path.exists(sd.file_path.path):
                    file_paths_to_scan.append(sd.file_path.path)
            
            predictions = get_predictions(file_paths_to_scan, file_obj.department)
            if predictions:
                AIPrediction.objects.update_or_create(
                    file=file_obj,
                    defaults={
                        'classification': predictions['classification'],
                        'predicted_priority': predictions['predicted_priority'],
                        'approval_probability': predictions['approval_probability'],
                        'rejection_probability': predictions['rejection_probability'],
                        'detected_errors': predictions.get('detected_errors', ''),
                        'decision': predictions.get('decision', 'ESCALATE'),
                        'reason': predictions.get('reason', ''),
                        'key_factors': predictions.get('key_factors', ''),
                        'flags': predictions.get('flags', '')
                    }
                )
        
        Status.objects.create(
            file=file_obj,
            current_stage='Officer Review',
            remarks=request.data.get('remarks', 'File updated and resubmitted.'),
            ip_address=get_client_ip(request)
        )

        # NOTIFY CITIZEN OF RESUBMISSION
        if file_obj.citizen_email:
            citizen_user = User.objects.filter(email=file_obj.citizen_email).first()
            if citizen_user:
                doc_list = f"1. {os.path.basename(file_obj.file_path.name)} (Main Document)"
                for idx, sd in enumerate(file_obj.supporting_documents.all(), 2):
                    doc_list += f"\n  {idx}. {sd.name} (Supporting Document)"
                
                resubmit_msg = (
                    f"GOVERNMENT OF INDIA\n"
                    f"PaperLessGov - Digital Seva Portal\n"
                    f"{'='*50}\n\n"
                    f"RESUBMISSION NOTIFICATION\n"
                    f"Reference No: PLG/{file_obj.department[:3].upper()}/{file_obj.id}\n\n"
                    f"Dear Citizen,\n\n"
                    f"Good news! Your application has been corrected and resubmitted\n"
                    f"for review. The concerned officer will review the updated\n"
                    f"documents shortly.\n\n"
                    f"APPLICATION DETAILS:\n"
                    f"  File ID         : #{file_obj.id}\n"
                    f"  Subject         : {file_obj.name}\n"
                    f"  Department      : {file_obj.department}\n"
                    f"  New Status      : Officer Review (Resubmitted)\n\n"
                    f"UPDATED DOCUMENTS ON FILE:\n"
                    f"  {doc_list}\n\n"
                    f"TRACK & DOWNLOAD YOUR DOCUMENTS:\n"
                    f"  Portal Link : https://paper-less-gov.vercel.app/citizen-portal\n"
                    f"  Login       : Use your registered email as Username\n"
                    f"                and your phone number as Password\n"
                    f"  File ID     : #{file_obj.id}\n\n"
                    f"You will be notified once the officer completes the review.\n\n"
                    f"Regards,\n"
                    f"{file_obj.department} Department\n"
                    f"PaperLessGov e-Governance Portal\n"
                    f"Government of India"
                )
                send_notification(citizen_user, f"Application #{file_obj.id} Resubmitted for Review", resubmit_msg)

        return Response({'status': 'File updated and transitioned to Officer Review'})

class FileRequestViewSet(viewsets.ModelViewSet):
    serializer_class = FileRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_dept = user.department or 'Common'
        
        if user.role == 'Admin' or user_dept == 'Common':
            return FileRequest.objects.all().order_by('-created_at')
        
        return FileRequest.objects.filter(
            Q(requesting_department__iexact=user_dept) | Q(target_department__iexact=user_dept)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        target_dept = self.request.data.get('target_department')
        user_dept = self.request.user.department or 'Common'
        serializer.save(
            requesting_user=self.request.user,
            requesting_department=user_dept,
            target_department=target_dept
        )

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        req_obj = self.get_object()
        user = request.user
        decision = request.data.get('decision') # 'approve', 'deny', 'forward', 'link'
        remarks = request.data.get('remarks', '')
        file_id = request.data.get('file_id')

        user_dept = getattr(user, 'department', 'Common')
        if user_dept != 'Common' and user_dept != req_obj.target_department:
            return Response({'error': 'Unauthorized'}, status=403)

        if decision == 'link' and file_id:
            try:
                file_to_link = File.objects.get(id=file_id)
                if file_to_link.department != req_obj.target_department and user_dept != 'Common':
                    return Response({'error': 'You can only link files from your own department.'}, status=400)
                
                req_obj.file = file_to_link
                # Target department sets the confidentiality level
                req_obj.confidentiality = request.data.get('confidentiality', req_obj.confidentiality)
                remarks = remarks or f"Linked file: {file_to_link.name} (Classified as {req_obj.confidentiality})"
            except File.DoesNotExist:
                return Response({'error': 'File not found'}, status=404)

        if decision == 'forward':
            req_obj.status = 'Forwarded'
        elif decision == 'escalate':
            req_obj.status = 'Escalated'
        elif decision == 'approve':
            if not req_obj.file:
                return Response({'error': 'You must link a file before approving.'}, status=400)
            req_obj.status = 'Approved'
        elif decision == 'deny':
            req_obj.status = 'Denied'
        
        req_obj.remarks = remarks
        req_obj.save()
        return Response({'status': f'Request {req_obj.status}', 'file_id': req_obj.file.id if req_obj.file else None})

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'read'})

class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all().order_by('-timestamp')
    serializer_class = StatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_dept = user.department or 'Common'
        qs = Status.objects.all().order_by('-timestamp')
        
        if user_dept == 'Common' or user.role == 'Admin':
            return qs
            
        return qs.filter(file__department__iexact=user_dept)
