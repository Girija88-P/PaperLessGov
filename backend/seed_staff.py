import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paperless_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def create_staff():
    # Mapping of Department to its existing Clerk username
    clerks_map = {
        'Finance': 'Finance_Clerk_Praveen',
        'Health': 'Health_Clerk_Suman',
        'Transport': 'Transport_Clerk_Rudra',
        'Education': 'Education_clerk_Sanju',
        'Urban Planning': 'UrbanPlanning_clerk_Anush'
    }

    # Data to seed: (First Name, Last Name, Username, Role, Department)
    staff_data = [
        # Finance
        ('Suresh', 'Kumar', 'Finance_Officer_Suresh', 'Officer', 'Finance'),
        ('Meera', 'Nair', 'Finance_HA_Meera', 'Higher Authority', 'Finance'),
        ('Raghavan', 'Chidambaram', 'Finance_Head_Raghavan', 'Head', 'Finance'),
        
        # Health
        ('Deepak', 'Sharma', 'Health_Officer_Deepak', 'Officer', 'Health'),
        ('Ananya', 'Rao', 'Health_HA_Ananya', 'Higher Authority', 'Health'),
        ('Manoj', 'Deshmukh', 'Health_Head_Manoj', 'Head', 'Health'),
        
        # Transport
        ('Vikram', 'Singh', 'Transport_Officer_Vikram', 'Officer', 'Transport'),
        ('Nisha', 'Patel', 'Transport_HA_Nisha', 'Higher Authority', 'Transport'),
        ('Sanjay', 'Rathore', 'Transport_Head_Sanjay', 'Head', 'Transport'),
        
        # Education
        ('Kiran', 'Bedi', 'Education_Officer_Kiran', 'Officer', 'Education'),
        ('Sunil', 'Dutt', 'Education_HA_Sunil', 'Higher Authority', 'Education'),
        ('Aruna', 'Roy', 'Education_Head_Aruna', 'Head', 'Education'),
        
        # Urban Planning
        ('Rohan', 'Mehra', 'Urban_Officer_Rohan', 'Officer', 'Urban Planning'),
        ('Isha', 'Ambani', 'Urban_HA_Isha', 'Higher Authority', 'Urban Planning'),
        ('E.', 'Sreedharan', 'Urban_Head_Sreedharan', 'Head', 'Urban Planning'),
    ]

    count = 0
    for first, last, uname, role, dept in staff_data:
        # Get the clerk who "added" them
        clerk_uname = clerks_map.get(dept)
        created_by_user = User.objects.filter(username=clerk_uname).first()
        
        if not User.objects.filter(username=uname).exists():
            u = User.objects.create(
                username=uname,
                first_name=first,
                last_name=last,
                email=f"{uname.lower()}@gov.in",
                role=role,
                department=dept,
                created_by=created_by_user
            )
            # Standard password for all new staff for testing
            u.set_password('staff123')
            u.save()
            print(f"Created {role}: {first} {last} ({dept}) - Added by {clerk_uname}")
            count += 1
        else:
            print(f"User {uname} already exists.")

    print(f"\nBulk creation complete. {count} new staff members added.")

if __name__ == '__main__':
    create_staff()
