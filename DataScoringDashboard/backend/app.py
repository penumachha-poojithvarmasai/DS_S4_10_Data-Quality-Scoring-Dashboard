import os
import json
import io
from typing import Tuple, Optional
import pandas as pd
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from engine import DataQualityEngine, DatasetComparator, remediate_dataset, DOMAIN_PRESETS

app = Flask(__name__)
CORS(app)

# In-memory storage for active working session datasets
ACTIVE_DATASETS = {}

def parse_incoming_file(req) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
    """Helper to parse CSV or Excel from request.files or JSON payload."""
    if 'file' in req.files:
        uploaded_file = req.files['file']
        filename = uploaded_file.filename.lower()
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(uploaded_file)
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(uploaded_file)
            else:
                return None, "Unsupported file format. Please upload a .csv or .xlsx file."
            return df, None
        except Exception as e:
            return None, f"Error reading file: {str(e)}"
    
    # Check if JSON payload contains raw data / sample dataset name
    data = req.get_json(silent=True) or {}
    if 'data' in data and isinstance(data['data'], list):
        try:
            df = pd.DataFrame(data['data'])
            return df, None
        except Exception as e:
            return None, f"Error parsing JSON data: {str(e)}"
    
    if 'session_id' in data and data['session_id'] in ACTIVE_DATASETS:
        return ACTIVE_DATASETS[data['session_id']], None

    return None, "No file uploaded or dataset session found."


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'app': 'Data Quality Scoring Dashboard Backend',
        'available_domains': list(DOMAIN_PRESETS.keys())
    })


@app.route('/api/sample/<domain>', methods=['GET'])
def get_sample_dataset(domain):
    domain = domain.lower()
    filepath = f"sample_datasets/{domain}_sample.csv"
    if not os.path.exists(filepath):
        # Fallback to general
        filepath = "sample_datasets/general_sample.csv"
        domain = 'general'
    
    try:
        df = pd.read_csv(filepath)
        engine = DataQualityEngine(df)
        evaluation = engine.evaluate_all(domain)
        issues = engine.get_issues()
        
        # Store in session memory
        session_id = f"sample_{domain}"
        ACTIVE_DATASETS[session_id] = df

        return jsonify({
            'success': True,
            'session_id': session_id,
            'domain': domain,
            'evaluation': evaluation,
            'issues': issues,
            'sample_rows': df.head(15).replace({pd.NA: None, float('nan'): None}).to_dict(orient='records')
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/upload', methods=['POST'])
def upload_dataset():
    """1. POST /api/upload: Ingests .csv or .xlsx, runs profiling, returns summary stats, types & sample rows."""
    df, err = parse_incoming_file(request)
    if err:
        return jsonify({'success': False, 'error': err}), 400

    domain = request.form.get('domain', 'general')
    session_id = request.form.get('session_id', 'current_session')
    ACTIVE_DATASETS[session_id] = df

    engine = DataQualityEngine(df)
    evaluation = engine.evaluate_all(domain)
    issues = engine.get_issues()

    # Clean nan for JSON safety
    cleaned_sample = df.head(20).where(pd.notnull(df), None).to_dict(orient='records')

    return jsonify({
        'success': True,
        'session_id': session_id,
        'domain': domain,
        'dataset_summary': evaluation['dataset_summary'],
        'evaluation': evaluation,
        'issues': issues,
        'sample_rows': cleaned_sample
    })


@app.route('/api/score', methods=['POST'])
def calculate_score():
    """2. POST /api/score: Calculates dimension scores & composite score based on chosen domain preset."""
    data = request.get_json(silent=True) or {}
    domain = data.get('domain', 'general')
    session_id = data.get('session_id', 'current_session')

    # If dataset sent in request body or session
    if 'data' in data:
        df = pd.DataFrame(data['data'])
    elif session_id in ACTIVE_DATASETS:
        df = ACTIVE_DATASETS[session_id]
    else:
        df, err = parse_incoming_file(request)
        if err:
            return jsonify({'success': False, 'error': 'Dataset not found.'}), 400

    engine = DataQualityEngine(df)
    evaluation = engine.evaluate_all(domain)

    return jsonify({
        'success': True,
        'evaluation': evaluation
    })


@app.route('/api/issues', methods=['POST'])
def get_issues_route():
    """3. POST /api/issues: Returns detected granular issues categorized by severity (Critical, Warning, Info)."""
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id', 'current_session')

    if 'data' in data:
        df = pd.DataFrame(data['data'])
    elif session_id in ACTIVE_DATASETS:
        df = ACTIVE_DATASETS[session_id]
    else:
        df, err = parse_incoming_file(request)
        if err:
            return jsonify({'success': False, 'error': 'Dataset not found.'}), 400

    engine = DataQualityEngine(df)
    issues = engine.get_issues()

    return jsonify({
        'success': True,
        'issues': issues,
        'issue_counts': {
            'critical': sum(1 for i in issues if i['severity'] == 'Critical'),
            'warning': sum(1 for i in issues if i['severity'] == 'Warning'),
            'info': sum(1 for i in issues if i['severity'] == 'Info'),
            'total': len(issues)
        }
    })


@app.route('/api/compare', methods=['POST'])
def compare_datasets_route():
    """4. POST /api/compare: Compares Base Dataset vs Current Dataset and returns drift metrics."""
    domain = request.form.get('domain', 'general')
    
    # Try parsing file uploads or JSON payloads
    base_df, curr_df = None, None

    if 'base_file' in request.files and 'current_file' in request.files:
        try:
            base_file = request.files['base_file']
            curr_file = request.files['current_file']
            base_df = pd.read_csv(base_file) if base_file.filename.endswith('.csv') else pd.read_excel(base_file)
            curr_df = pd.read_csv(curr_file) if curr_file.filename.endswith('.csv') else pd.read_excel(curr_file)
        except Exception as e:
            return jsonify({'success': False, 'error': f"Error parsing uploaded comparison files: {str(e)}"}), 400
    else:
        data = request.get_json(silent=True) or {}
        if 'base_data' in data and 'current_data' in data:
            base_df = pd.DataFrame(data['base_data'])
            curr_df = pd.DataFrame(data['current_data'])

    if base_df is None or curr_df is None:
        # Fallback to comparing current session vs sample degrade for demonstration
        session_id = request.form.get('session_id', 'current_session')
        if session_id in ACTIVE_DATASETS:
            base_df = ACTIVE_DATASETS[session_id]
            # Create a synthetic drift dataset for demo
            curr_df = base_df.copy()
            # Introduce missing values and duplicates
            if len(curr_df) > 2:
                curr_df.iloc[0, 1] = None
                curr_df = pd.concat([curr_df, curr_df.iloc[[0]]], ignore_index=True)
        else:
            return jsonify({'success': False, 'error': 'Please upload both Base Dataset and Current Dataset to compare.'}), 400

    comparator = DatasetComparator(base_df, curr_df, domain_preset=domain)
    comparison_results = comparator.compare()

    return jsonify({
        'success': True,
        'comparison': comparison_results
    })


@app.route('/api/remediate', methods=['POST'])
def remediate_route():
    """
    5. POST /api/remediate: Executes specified transformations, returns updated score metrics,
    and produces exportable CSV artifact.
    """
    data = request.get_json(silent=True) or {}
    domain = data.get('domain', 'general')
    session_id = data.get('session_id', 'current_session')

    if 'data' in data:
        df = pd.DataFrame(data['data'])
    elif session_id in ACTIVE_DATASETS:
        df = ACTIVE_DATASETS[session_id]
    else:
        return jsonify({'success': False, 'error': 'Dataset not found for remediation.'}), 400

    params = data.get('parameters', {})
    remediated_df, actions = remediate_dataset(df, params)

    # Re-evaluate remediated data
    engine = DataQualityEngine(remediated_df)
    new_evaluation = engine.evaluate_all(domain)
    new_issues = engine.get_issues()

    # Convert remediated data to CSV string and json sample
    csv_buffer = io.StringIO()
    remediated_df.to_csv(csv_buffer, index=False)
    csv_string = csv_buffer.getvalue()

    cleaned_sample = remediated_df.head(20).where(pd.notnull(remediated_df), None).to_dict(orient='records')

    return jsonify({
        'success': True,
        'applied_actions': actions,
        'new_evaluation': new_evaluation,
        'new_issues': new_issues,
        'remediated_sample': cleaned_sample,
        'csv_content': csv_string,
        'remediated_summary': new_evaluation['dataset_summary']
    })


if __name__ == '__main__':
    # Ensure sample datasets exist
    if not os.path.exists('sample_datasets/general_sample.csv'):
        import sample_data
    
    print("Starting Data Quality Scoring Dashboard Flask Backend on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)
