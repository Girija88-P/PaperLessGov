import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

def train_all_models():
    if not os.path.exists('dataset/synthetic_gov_data.csv'):
        print("Dataset not found. Please run data_generator.py first.")
        return

    df = pd.read_csv('dataset/synthetic_gov_data.csv')
    
    os.makedirs('models', exist_ok=True)

    print("Training File Type Model...")
    X_type = df[['description', 'department']]
    y_type = df['file_type']
    
    preprocessor_type = ColumnTransformer(transformers=[
        ('text', TfidfVectorizer(max_features=1000), 'description'),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['department'])
    ])
    
    type_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_type),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=42))
    ])
    
    type_pipeline.fit(X_type, y_type)
    joblib.dump(type_pipeline, 'models/type_model.pkl')
    print("File Type Model saved.")

    print("Training Priority Model...")
    X_prio = df[['description', 'department', 'file_type']]
    y_prio = df['priority']
    
    preprocessor_prio = ColumnTransformer(transformers=[
        ('text', TfidfVectorizer(max_features=1000), 'description'),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['department', 'file_type'])
    ])
    
    prio_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_prio),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=42))
    ])
    
    prio_pipeline.fit(X_prio, y_prio)
    joblib.dump(prio_pipeline, 'models/priority_model.pkl')
    print("Priority Model saved.")

    print("Training Approval Model...")
    X_app = df[['description', 'department', 'file_type', 'priority']]
    y_app = df['is_approved']
    
    preprocessor_app = ColumnTransformer(transformers=[
        ('text', TfidfVectorizer(max_features=1000), 'description'),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['department', 'file_type', 'priority'])
    ])
    
    app_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_app),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=42))
    ])
    
    app_pipeline.fit(X_app, y_app)
    joblib.dump(app_pipeline, 'models/approval_model.pkl')
    print("Approval Model saved.")
    
    print("All models trained successfully!")

if __name__ == "__main__":
    train_all_models()
