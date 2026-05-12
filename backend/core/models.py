from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Clerk', 'Clerk'),
        ('Officer', 'Officer'),
        ('Higher Authority', 'Higher Authority'),
        ('Head', 'Head'),
        ('Admin', 'Admin'),
        ('Citizen', 'Citizen'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Clerk')
    department = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='users_added')

    def __str__(self):
        return f"{self.username} - {self.role}"

class File(models.Model):
    PRIORITY_CHOICES = [
        ('Normal', 'Normal'),
        ('Urgent', 'Urgent'),
        ('Critical', 'Critical'),
    ]
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    department = models.CharField(max_length=100, blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Normal')
    file_path = models.FileField(upload_to='uploads/')
    citizen_email = models.EmailField(max_length=255, blank=True, null=True)
    citizen_phone = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return self.name

class SupportingDocument(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='supporting_documents')
    name = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='uploads/supporting/')
    upload_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Support: {self.name} for {self.file.name}"

class Status(models.Model):
    STAGE_CHOICES = [
        ('Uploaded', 'Uploaded'),
        ('Under Review', 'Under Review'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Escalated', 'Escalated'),
        ('Returned for Correction', 'Returned for Correction'),
    ]
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='statuses')
    current_stage = models.CharField(max_length=50, choices=STAGE_CHOICES, default='Uploaded')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='status_updates')
    remarks = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True) # SECURITY: Audit IP tracking
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file.name} - {self.current_stage}"

class AIPrediction(models.Model):
    file = models.OneToOneField(File, on_delete=models.CASCADE, related_name='ai_prediction')
    approval_probability = models.FloatField(null=True, blank=True)
    rejection_probability = models.FloatField(null=True, blank=True)
    predicted_priority = models.CharField(max_length=20, null=True, blank=True)
    classification = models.CharField(max_length=100, null=True, blank=True)
    detected_errors = models.TextField(blank=True)
    
    # New AI Decision Fields
    decision = models.CharField(max_length=20, default='ESCALATE') # APPROVE / REJECT / ESCALATE
    reason = models.TextField(blank=True)
    key_factors = models.TextField(blank=True) # JSON or Comma separated
    flags = models.TextField(blank=True) # e.g. "Pattern override applied"


class FileRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Forwarded', 'Forwarded to Officer'),
        ('Escalated', 'Escalated to State Govt'),
        ('Approved', 'Approved'),
        ('Denied', 'Denied'),
    ]
    
    CONFIDENTIALITY_CHOICES = [
        ('Simple', 'Simple'),
        ('Confidential', 'Confidential'),
    ]

    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='requests', null=True, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    requesting_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    requesting_department = models.CharField(max_length=100)
    target_department = models.CharField(max_length=100)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    confidentiality = models.CharField(max_length=20, choices=CONFIDENTIALITY_CHOICES, default='Simple')
    
    purpose = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request for {self.subject or 'File'} from {self.requesting_department}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
