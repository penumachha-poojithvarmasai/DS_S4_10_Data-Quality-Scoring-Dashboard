import pandas as pd
import numpy as np
import os

os.makedirs('sample_datasets', exist_ok=True)

# 1. General Sample Data
df_gen = pd.DataFrame({
    'customer_id': [101, 102, 103, 104, 105, 106, 107, 108, 108, 110],
    'full_name': [' Alice Smith ', 'Bob Jones', 'Charlie Brown', 'David Miller', None, 'Frank Wright', ' Grace Lee ', 'Hannah Abbott', 'Hannah Abbott', 'Jack Daniels'],
    'signup_date': ['2023-01-15', '2023-02-20', '03/15/2023', '2023-04-10', '2023-05-12', 'invalid-date', '2023-07-01', '2023-08-15', '2023-08-15', '2023-10-05'],
    'age': [25, 34, 45, 999, 29, 31, None, 42, 42, 28],
    'income': [55000, 62000, 78000, 120000, None, 48000, 85000, 91000, 91000, 5000000]
})
df_gen.to_csv('sample_datasets/general_sample.csv', index=False)

# 2. Healthcare Sample Data
df_health = pd.DataFrame({
    'patient_id': [5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010],
    'patient_name': [' John Doe', 'Jane Smith', ' Robert Paul', None, 'Mary Johnson', 'James Wilson', 'Patricia Taylor', 'Linda Anderson', 'Barbara Thomas', 'Elizabeth Jackson'],
    'diagnosis_code': ['E11.9', 'I10', None, 'J45.909', 'E11.9', None, 'I10', 'E11.9', 'J45.909', 'I10'],
    'systolic_bp': [120, 135, 140, None, 118, 125, 130, 290, 122, 115],
    'diastolic_bp': [80, 85, 90, 82, None, 80, 84, 180, 78, 75],
    'admission_date': ['2024-01-10', '2024-01-12', '2024-01-15', '2024-01-18', '2024-01-20', '2024/01/22', '2024-01-25', '2024-01-28', '2024-02-01', '2024-02-05']
})
df_health.to_csv('sample_datasets/healthcare_sample.csv', index=False)

# 3. Finance Sample Data
df_fin = pd.DataFrame({
    'txn_id': ['TXN1001', 'TXN1002', 'TXN1003', 'TXN1004', 'TXN1004', 'TXN1005', 'TXN1006', 'TXN1007', 'TXN1008', 'TXN1009'],
    'account_no': ['ACC-9901', 'ACC-9902', 'ACC-9903', 'ACC-9904', 'ACC-9904', 'ACC-9905', 'ACC-9906', 'ACC-9907', 'ACC-9908', 'ACC-9909'],
    'txn_amount': [150.00, 2500.50, 45.20, 9999.00, 9999.00, 12.00, 50.00, 850.00, 1200000.00, 310.40],
    'txn_type': ['DEBIT', 'CREDIT', 'DEBIT', 'TRANSFER', 'TRANSFER', 'DEBIT', 'debit', 'CREDIT', 'DEBIT', 'TRANSFER'],
    'txn_timestamp': ['2024-03-01T10:15:00', '2024-03-01T11:20:00', '2024-03-01T12:05:00', '2024-03-01T14:30:00', '2024-03-01T14:30:00', '03-01-2024 15:00', '2024-03-01T16:10:00', '2024-03-01T17:45:00', '2024-03-01T19:00:00', '2024-03-01T20:15:00']
})
df_fin.to_csv('sample_datasets/finance_sample.csv', index=False)

# 4. E-Commerce Sample Data
df_ecom = pd.DataFrame({
    'product_id': ['P101', 'P102', 'P103', 'P104', 'P104', 'P105', 'P106', 'P107', 'P108', 'P109'],
    'category': ['Electronics', ' Apparel', 'Home & Kitchen', 'Electronics', 'Electronics', 'Sports', 'Beauty', 'Electronics', 'Toys', 'Books'],
    'price': [299.99, 49.99, 15.50, 899.00, 899.00, 120.00, None, 45.00, 19.99, 15000.00],
    'rating': [4.5, 3.8, 4.2, 5.0, 5.0, 4.0, 4.8, None, 3.5, 4.1],
    'stock_qty': [50, 120, 300, 15, 15, 80, 45, 200, None, 10]
})
df_ecom.to_csv('sample_datasets/ecommerce_sample.csv', index=False)

print("Sample datasets created successfully.")
