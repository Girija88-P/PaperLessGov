import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paperless_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

users_data = [
    ("SysAdmin_HQ", "Common", "Admin", "System", "Administrator"),
    ("Minister_Shantala", "Common", "Head", "Cabinet", "Minister"),
    ("Secretary_Priya", "Common", "Higher Authority", "Chief", "Secretary"),
    ("JointSec_Jane", "Common", "Officer", "Joint", "Secretary"),
    ("SecClerk_John", "Common", "Clerk", "Secretariat", "Clerk"),

    ("FinanceDirector_Raghavan", "Finance", "Head", "Director", "of Finance"),
    ("TreasuryCtrl_Meera", "Finance", "Higher Authority", "Treasury", "Controller"),
    ("AccountsOfficer_Suresh", "Finance", "Officer", "Accounts", "Officer"),
    ("FinanceAsst_Praveen", "Finance", "Clerk", "Finance", "Assistant"),

    ("MedicalDirector_Manoj", "Health", "Head", "Medical", "Director"),
    ("CMO_Ananya", "Health", "Higher Authority", "Chief", "Medical Officer"),
    ("HealthOfficer_Deepak", "Health", "Officer", "Health", "Officer"),
    ("HealthClerk_Suman", "Health", "Clerk", "Health", "Desk Clerk"),

    ("Commissioner_Sanjay", "Transport", "Head", "Transport", "Commissioner"),
    ("RTO_Nisha", "Transport", "Higher Authority", "Regional", "Transport Officer"),
    ("Enforcement_Vikram", "Transport", "Officer", "Enforcement", "Officer"),
    ("TransportAsst_Rudra", "Transport", "Clerk", "Transport", "Assistant"),

    ("EduDirector_Aruna", "Education", "Head", "Director", "of Education"),
    ("DEO_Sunil", "Education", "Higher Authority", "District", "Education Officer"),
    ("BEO_Kiran", "Education", "Officer", "Block", "Education Officer"),
    ("EduAsst_Sanju", "Education", "Clerk", "Education", "Assistant"),

    ("ChiefPlanner_Sreedharan", "Urban Planning", "Head", "Chief", "Town Planner"),
    ("UDA_Isha", "Urban Planning", "Higher Authority", "Urban", "Development Authority"),
    ("Planner_Rohan", "Urban Planning", "Officer", "Planning", "Officer"),
    ("PlanningAsst_Anush", "Urban Planning", "Clerk", "Planning", "Assistant")
]

# Wipe old users that might have conflicting emails or similar (except superuser if needed, but we rely on these 25)
# Actually, just update or create them based on the new usernames
for username, dept, role, fname, lname in users_data:
    user, created = User.objects.get_or_create(username=username)
    user.department = dept
    user.role = role
    user.first_name = fname
    user.last_name = lname
    user.set_password("pass1234")
    user.save()
    print(f"Verified & Saved: {username} ({dept})")

print("All 25 users have been successfully written and passwords set to 'pass1234'.")
