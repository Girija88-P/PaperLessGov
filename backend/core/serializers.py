from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import File, Status, AIPrediction, SupportingDocument, FileRequest, Notification

User = get_user_model()

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'department', 'first_name', 'last_name', 'password', 'created_by_name', 'date_joined']

class StatusSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')

    class Meta:
        model = Status
        fields = ['id', 'current_stage', 'approved_by', 'approved_by_name', 'remarks', 'timestamp']
        read_only_fields = ['timestamp']

class AIPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPrediction
        fields = '__all__'

class SupportingDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportingDocument
        fields = '__all__'

class FileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.username')
    statuses = StatusSerializer(many=True, read_only=True)
    ai_prediction = AIPredictionSerializer(read_only=True)
    supporting_documents = SupportingDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = File
        fields = [
            'id', 'name', 'description', 'department', 'upload_date',
            'uploaded_by', 'uploaded_by_name', 'priority', 'file_path',
            'statuses', 'ai_prediction', 'supporting_documents',
            'citizen_email', 'citizen_phone'
        ]
        read_only_fields = ['upload_date', 'uploaded_by']

class FileRequestSerializer(serializers.ModelSerializer):
    file_details = FileSerializer(source='file', read_only=True)
    requesting_user_name = serializers.ReadOnlyField(source='requesting_user.username')
    requesting_user_role = serializers.ReadOnlyField(source='requesting_user.role')
    requesting_user_dept = serializers.ReadOnlyField(source='requesting_user.department')

    class Meta:
        model = FileRequest
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'requesting_user', 'requesting_department', 'target_department']
