import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paperless_backend.settings')
django.setup()

from core.models import User

admin_user = User.objects.filter(username='admin').first()
if not admin_user:
    # If admin doesn't exist, use the first superuser
    admin_user = User.objects.filter(is_superuser=True).first()

if admin_user:
    # Update John Doe and Jane Smith (case insensitive check on name)
    users_to_update = User.objects.filter(first_name__in=['John', 'Jane'])
    for u in users_to_update:
        if u.created_by is None:
            u.created_by = admin_user
            u.save()
            print(f"Updated {u.username} (Added By set to {admin_user.username})")
else:
    print("No admin user found to assign as creator.")
