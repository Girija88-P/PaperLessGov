import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paperless_backend.settings')
django.setup()

from core.models import File, AIPrediction
from ai_engine.predict import get_predictions

def re_run_ai():
    files = File.objects.all()
    count = 0
    print(f"Re-running AI predictions for {files.count()} files...")
    
    for f in files:
        try:
            # Gather all physical file paths for this document
            file_paths_to_scan = [f.file_path.path]
            for sd in f.supporting_documents.all():
                file_paths_to_scan.append(sd.file_path.path)
                
            # Call updated AI logic
            predictions = get_predictions(file_paths_to_scan, f.department)
            
            if predictions:
                # Update AIPrediction record
                AIPrediction.objects.filter(file=f).update(
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
                
                # Update File priority based on new prediction
                f.priority = predictions['predicted_priority']
                f.save(update_fields=['priority'])
                
                count += 1
                
        except Exception as e:
            print(f"Failed to process file ID {f.id}: {e}")

    print(f"Successfully updated AI predictions for {count} files!")

if __name__ == '__main__':
    re_run_ai()
