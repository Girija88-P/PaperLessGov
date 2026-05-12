import hmac
import hashlib
import json
from django.conf import settings
from django.http import JsonResponse
import os

class APIRequestSignatureMiddleware:
    """
    Middleware to verify HMAC-SHA256 signatures on incoming API requests.
    This prevents man-in-the-middle tampering of request bodies.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        # Enabled via environment variable for production only (to not break local demo)
        self.enforce = os.environ.get('DJANGO_ENFORCE_SIGNATURE', 'False') == 'True'

    def __call__(self, request):
        if self.enforce and request.path.startswith('/api/') and request.method in ['POST', 'PUT', 'PATCH']:
            # Skip signature check for file uploads as multipart/form-data is complex to hash consistently
            if not request.content_type.startswith('multipart/form-data'):
                signature = request.headers.get('X-API-Signature')
                if not signature:
                    return JsonResponse({'error': 'Missing X-API-Signature header'}, status=403)
                
                # Reconstruct payload hash
                payload = request.body
                expected_signature = hmac.new(
                    settings.SECRET_KEY.encode('utf-8'),
                    payload,
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(expected_signature, signature):
                    return JsonResponse({'error': 'Invalid API signature. Payload tampered.'}, status=403)

        response = self.get_response(request)
        return response
