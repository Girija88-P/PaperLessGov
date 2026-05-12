import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paperless_backend.settings')
django.setup()

from core.models import File, Status

def migrate_stages():
    files = File.objects.all()
    count = 0
    for f in files:
        latest_status = f.statuses.order_by('-timestamp').first()
        if not latest_status: continue
        
        old_stage = latest_status.current_stage
        new_stage = None
        
        if old_stage in ['Uploaded', 'Under Review']:
            new_stage = 'Officer Review'
        elif old_stage == 'Escalated':
            new_stage = 'Higher Authority Review'
        elif old_stage == 'Approved':
            new_stage = 'Final Approval'
        elif old_stage == 'Returned for Correction':
            new_stage = 'Returned to Clerk'
            
        if new_stage and new_stage != old_stage:
            Status.objects.create(
                file=f,
                current_stage=new_stage,
                remarks="Automated hierarchy migration."
            )
            print(f"Updated {f.name}: {old_stage} -> {new_stage}")
            count += 1
            
    print(f"Migration complete. {count} files updated.")

if __name__ == '__main__':
    migrate_stages()
