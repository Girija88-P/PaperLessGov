from django.db import models
from django.conf import settings

class FileRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Forwarded', 'Forwarded to Officer'),
        ('Approved', 'Approved'),
        ('Denied', 'Denied'),
    ]
    
    CONFIDENTIALITY_CHOICES = [
        ('Simple', 'Simple'),
        ('Confidential', 'Confidential'),
    ]

    file = models.ForeignKey('core.File', on_delete=models.CASCADE, related_name='requests')
    requesting_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_requests')
    requesting_department = models.CharField(max_length=100)
    target_department = models.CharField(max_length=100)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    confidentiality = models.CharField(max_length=20, choices=CONFIDENTIALITY_CHOICES, default='Simple')
    
    purpose = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request for {self.file.name} from {self.requesting_department}"
