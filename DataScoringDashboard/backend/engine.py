import pandas as pd
import numpy as np
import re
import math
from typing import Dict, List, Any, Tuple, Optional

DOMAIN_PRESETS = {
    'general': {'C': 0.30, 'U': 0.25, 'K': 0.25, 'V': 0.20, 'name': 'General Domain'},
    'healthcare': {'C': 0.45, 'U': 0.20, 'K': 0.20, 'V': 0.15, 'name': 'Healthcare / Clinical'},
    'finance': {'U': 0.40, 'K': 0.30, 'V': 0.20, 'C': 0.10, 'name': 'Financial Transactions'},
    'ecommerce': {'C': 0.25, 'U': 0.35, 'K': 0.20, 'V': 0.20, 'name': 'E-Commerce / Marketing'}
}

def get_tier(score: float) -> Dict[str, str]:
    if score >= 90.0:
        return {'tier': 'Tier 1', 'label': 'Excellent', 'color': 'emerald', 'bg': 'bg-emerald-500/10', 'text': 'text-emerald-400', 'border': 'border-emerald-500/30'}
    elif score >= 75.0:
        return {'tier': 'Tier 2', 'label': 'Good', 'color': 'blue', 'bg': 'bg-blue-500/10', 'text': 'text-blue-400', 'border': 'border-blue-500/30'}
    elif score >= 50.0:
        return {'tier': 'Tier 3', 'label': 'Average', 'color': 'amber', 'bg': 'bg-amber-500/10', 'text': 'text-amber-400', 'border': 'border-amber-500/30'}
    else:
        return {'tier': 'Tier 4', 'label': 'Poor', 'color': 'rose', 'bg': 'bg-rose-500/10', 'text': 'text-rose-400', 'border': 'border-rose-500/30'}


class DataQualityEngine:
    """
    Extensible Data Quality Profiling & Scoring Engine.
    Evaluates 4 Dimensions: Completeness (C), Uniqueness (U), Consistency (K), Validity (V).
    """

    def __init__(self, df: pd.DataFrame):
        # Work on a copy of the dataframe
        self.df = df.copy()
        self.rows, self.cols = self.df.shape
        self.total_cells = self.rows * self.cols if self.rows > 0 and self.cols > 0 else 1

    def calculate_completeness(self) -> Dict[str, Any]:
        """Formula: (1 - (Total Missing Values / Total Data Cells)) * 100"""
        if self.total_cells == 0:
            return {'score': 100.0, 'total_missing': 0, 'column_missingness': {}}

        total_missing = int(self.df.isna().sum().sum())
        completeness_ratio = 1.0 - (total_missing / self.total_cells)
        score = max(0.0, min(100.0, round(completeness_ratio * 100.0, 2)))

        col_missing = {}
        for col in self.df.columns:
            cnt = int(self.df[col].isna().sum())
            pct = round((cnt / self.rows * 100.0), 2) if self.rows > 0 else 0.0
            col_missing[col] = {'count': cnt, 'percentage': pct}

        return {
            'score': score,
            'total_missing': total_missing,
            'total_cells': self.total_cells,
            'column_missingness': col_missing
        }

    def calculate_uniqueness(self) -> Dict[str, Any]:
        """Formula: (1 - (Duplicate Rows / Total Rows)) * 100"""
        if self.rows == 0:
            return {'score': 100.0, 'duplicate_rows': 0, 'duplicate_percentage': 0.0}

        duplicate_rows = int(self.df.duplicated().sum())
        uniqueness_ratio = 1.0 - (duplicate_rows / self.rows)
        score = max(0.0, min(100.0, round(uniqueness_ratio * 100.0, 2)))
        dup_pct = round((duplicate_rows / self.rows * 100.0), 2)

        return {
            'score': score,
            'duplicate_rows': duplicate_rows,
            'total_rows': self.rows,
            'duplicate_percentage': dup_pct
        }

    def calculate_consistency(self) -> Dict[str, Any]:
        """
        Validates uniform data types within columns, regex-based date formatting,
        and text pattern conformity (whitespace, mixed types, formatting).
        """
        if self.rows == 0 or self.cols == 0:
            return {'score': 100.0, 'column_consistency': {}}

        col_scores = []
        col_details = {}

        date_patterns = [
            r'^\d{4}-\d{2}-\d{2}$',                # YYYY-MM-DD
            r'^\d{4}/\d{2}/\d{2}$',                # YYYY/MM/DD
            r'^\d{2}/\d{2}/\d{4}$',                # MM/DD/YYYY or DD/MM/YYYY
            r'^\d{2}-\d{2}-\d{4}$',                # MM-DD-YYYY
            r'^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}' # ISO timestamp
        ]

        for col in self.df.columns:
            non_null_series = self.df[col].dropna()
            if len(non_null_series) == 0:
                col_details[col] = {'score': 100.0, 'issues': []}
                col_scores.append(100.0)
                continue

            col_issues = []
            type_violations = 0
            whitespace_violations = 0
            date_format_violations = 0
            total_validations = len(non_null_series)

            # Check 1: Mixed data types inside string/object columns
            types_in_col = set()
            for val in non_null_series:
                # Classify type
                if isinstance(val, (int, np.integer)):
                    types_in_col.add('int')
                elif isinstance(val, (float, np.floating)):
                    types_in_col.add('float')
                elif isinstance(val, bool):
                    types_in_col.add('bool')
                elif isinstance(val, str):
                    types_in_col.add('str')
                else:
                    types_in_col.add('other')

            if len(types_in_col) > 1:
                # Mixed types found
                col_issues.append(f"Mixed data types detected: {list(types_in_col)}")
                # Penalize slightly based on dominant type
                type_counts = pd.Series([type(v).__name__ for v in non_null_series]).value_counts()
                dominant_cnt = type_counts.iloc[0]
                type_violations = len(non_null_series) - dominant_cnt

            # Check 2: Whitespace and pattern consistency for string columns
            if pd.api.types.is_string_dtype(self.df[col]) or self.df[col].dtype == object:
                for val in non_null_series:
                    if isinstance(val, str):
                        if val != val.strip():
                            whitespace_violations += 1

                if whitespace_violations > 0:
                    col_issues.append(f"{whitespace_violations} values contain leading or trailing whitespaces")

                # Date pattern check if column name sounds like a date or has date-like strings
                is_date_col = 'date' in col.lower() or 'time' in col.lower() or 'created' in col.lower() or 'updated' in col.lower()
                if is_date_col:
                    invalid_dates = 0
                    for val in non_null_series:
                        val_str = str(val).strip()
                        if not any(re.match(pat, val_str) for pat in date_patterns):
                            invalid_dates += 1
                    if invalid_dates > 0:
                        date_format_violations = invalid_dates
                        col_issues.append(f"{invalid_dates} values violate standard date pattern (YYYY-MM-DD / ISO format)")

            total_penalty_count = type_violations + whitespace_violations + date_format_violations
            penalty_ratio = min(1.0, total_penalty_count / (total_validations * 2.0))
            col_score = round(max(0.0, (1.0 - penalty_ratio) * 100.0), 2)

            col_details[col] = {
                'score': col_score,
                'issues': col_issues,
                'type_violations': type_violations,
                'whitespace_violations': whitespace_violations
            }
            col_scores.append(col_score)

        avg_score = round(float(np.mean(col_scores)), 2) if col_scores else 100.0
        return {
            'score': avg_score,
            'column_consistency': col_details
        }

    def calculate_validity(self) -> Dict[str, Any]:
        """
        Calculates statistical anomalies on numeric columns using Interquartile Range
        (IQR = Q3 - Q1; bounds: [Q1 - 1.5*IQR, Q3 + 1.5*IQR]) and Z-score outlier ratios (|Z| > 3).
        """
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0 or self.rows == 0:
            return {
                'score': 100.0,
                'total_numeric_cells': 0,
                'total_outliers': 0,
                'outlier_ratio': 0.0,
                'column_outliers': {}
            }

        total_numeric_cells = 0
        total_outliers = 0
        column_outliers = {}

        for col in numeric_cols:
            series = self.df[col].dropna()
            n_obs = len(series)
            if n_obs < 4:
                # Not enough points for IQR
                column_outliers[col] = {'iqr_outliers': 0, 'z_outliers': 0, 'bounds': [None, None], 'outlier_count': 0}
                total_numeric_cells += n_obs
                continue

            q1 = float(series.quantile(0.25))
            q3 = float(series.quantile(0.75))
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr

            iqr_mask = (series < lower_bound) | (series > upper_bound)
            iqr_count = int(iqr_mask.sum())

            # Z-Score computation
            std = float(series.std())
            mean = float(series.mean())
            if std > 0:
                z_scores = np.abs((series - mean) / std)
                z_mask = z_scores > 3.0
                z_count = int(z_mask.sum())
            else:
                z_count = 0

            # Use maximum detected outliers between IQR and Z-score for conservatism
            col_outliers = max(iqr_count, z_count)
            total_outliers += col_outliers
            total_numeric_cells += n_obs

            column_outliers[col] = {
                'iqr_outliers': iqr_count,
                'z_outliers': z_count,
                'outlier_count': col_outliers,
                'q1': round(q1, 2),
                'q3': round(q3, 2),
                'iqr': round(iqr, 2),
                'lower_bound': round(lower_bound, 2),
                'upper_bound': round(upper_bound, 2),
                'mean': round(mean, 2),
                'std': round(std, 2)
            }

        outlier_ratio = total_outliers / total_numeric_cells if total_numeric_cells > 0 else 0.0
        score = max(0.0, min(100.0, round((1.0 - outlier_ratio) * 100.0, 2)))

        return {
            'score': score,
            'total_numeric_cells': total_numeric_cells,
            'total_outliers': total_outliers,
            'outlier_ratio': round(outlier_ratio * 100.0, 2),
            'column_outliers': column_outliers
        }

    def evaluate_all(self, domain_preset: str = 'general') -> Dict[str, Any]:
        """Calculates dimension scores and overall composite score using domain weights."""
        preset = DOMAIN_PRESETS.get(domain_preset.lower(), DOMAIN_PRESETS['general'])

        comp_res = self.calculate_completeness()
        uniq_res = self.calculate_uniqueness()
        cons_res = self.calculate_consistency()
        valid_res = self.calculate_validity()

        score_c = comp_res['score']
        score_u = uniq_res['score']
        score_k = cons_res['score']
        score_v = valid_res['score']

        w_c = preset['C']
        w_u = preset['U']
        w_k = preset['K']
        w_v = preset['V']

        overall_score = round((score_c * w_c) + (score_u * w_u) + (score_k * w_k) + (score_v * w_v), 2)
        tier_info = get_tier(overall_score)

        return {
            'overall_score': overall_score,
            'domain_preset': domain_preset,
            'domain_name': preset['name'],
            'weights': {'C': w_c, 'U': w_u, 'K': w_k, 'V': w_v},
            'tier': tier_info,
            'dimensions': {
                'completeness': {
                    'score': score_c,
                    'weight': int(w_c * 100),
                    'weighted_score': round(score_c * w_c, 2),
                    'details': comp_res
                },
                'uniqueness': {
                    'score': score_u,
                    'weight': int(w_u * 100),
                    'weighted_score': round(score_u * w_u, 2),
                    'details': uniq_res
                },
                'consistency': {
                    'score': score_k,
                    'weight': int(w_k * 100),
                    'weighted_score': round(score_k * w_k, 2),
                    'details': cons_res
                },
                'validity': {
                    'score': score_v,
                    'weight': int(w_v * 100),
                    'weighted_score': round(score_v * w_v, 2),
                    'details': valid_res
                }
            },
            'dataset_summary': {
                'rows': self.rows,
                'columns': self.cols,
                'total_cells': self.total_cells,
                'column_names': list(self.df.columns),
                'dtypes': {col: str(dtype) for col, dtype in self.df.dtypes.items()}
            }
        }
    def get_issues(self) -> List[Dict[str, Any]]:
        issues = []

        # 1. Missingness issues
        comp = self.calculate_completeness()
        for col, meta in comp['column_missingness'].items():
            pct = meta['percentage']
            cnt = meta['count']
            if pct > 25.0:
                issues.append({
                    'id': f'iss_miss_crit_{col}',
                    'severity': 'Critical',
                    'category': 'Completeness',
                    'column': col,
                    'title': f'High Missingness in column "{col}"',
                    'description': f'Column "{col}" has {cnt} missing values ({pct}% missing).',
                    'recommended_fix': f'Impute missing values using Mean/Median or drop column if non-essential.',
                    'quick_fix_action': 'impute_mean'
                })
            elif pct > 5.0:
                issues.append({
                    'id': f'iss_miss_warn_{col}',
                    'severity': 'Warning',
                    'category': 'Completeness',
                    'column': col,
                    'title': f'Moderate Missingness in column "{col}"',
                    'description': f'Column "{col}" has {cnt} missing values ({pct}% missing).',
                    'recommended_fix': f'Impute missing values using Median or Mode.',
                    'quick_fix_action': 'impute_median'
                })

        # 2. Duplicate rows issue
        uniq = self.calculate_uniqueness()
        dup_pct = uniq['duplicate_percentage']
        dup_cnt = uniq['duplicate_rows']
        if dup_pct > 15.0:
            issues.append({
                'id': 'iss_dup_crit',
                'severity': 'Critical',
                'category': 'Uniqueness',
                'column': 'All Columns (Rows)',
                'title': 'High Duplicate Row Ratio',
                'description': f'Detected {dup_cnt} duplicate rows ({dup_pct}% of dataset).',
                'recommended_fix': 'Deduplicate dataset by keeping the first occurrence.',
                'quick_fix_action': 'drop_duplicates'
            })
        elif dup_cnt > 0:
            issues.append({
                'id': 'iss_dup_warn',
                'severity': 'Warning',
                'category': 'Uniqueness',
                'column': 'All Columns (Rows)',
                'title': 'Duplicate Rows Present',
                'description': f'Detected {dup_cnt} duplicate rows ({dup_pct}% of dataset).',
                'recommended_fix': 'Deduplicate dataset by keeping first occurrence.',
                'quick_fix_action': 'drop_duplicates'
            })

        # 3. Consistency issues
        cons = self.calculate_consistency()
        for col, meta in cons['column_consistency'].items():
            for issue_desc in meta['issues']:
                issues.append({
                    'id': f'iss_cons_{col}_{hash(issue_desc) % 10000}',
                    'severity': 'Warning' if 'whitespaces' in issue_desc else 'Critical',
                    'category': 'Consistency',
                    'column': col,
                    'title': f'Consistency Anomaly in "{col}"',
                    'description': issue_desc,
                    'recommended_fix': 'Strip leading/trailing spaces and standardize data formatting.',
                    'quick_fix_action': 'clean_text'
                })

        # 4. Validity / Outlier issues
        val = self.calculate_validity()
        for col, meta in val['column_outliers'].items():
            out_cnt = meta['outlier_count']
            if out_cnt > 0:
                pct = round(out_cnt / self.rows * 100.0, 2)
                sev = 'Critical' if pct > 10.0 else 'Warning'
                issues.append({
                    'id': f'iss_out_{col}',
                    'severity': sev,
                    'category': 'Validity',
                    'column': col,
                    'title': f'Statistical Outliers in "{col}"',
                    'description': f'Found {out_cnt} statistical outliers ({pct}% of rows) outside IQR bounds [{meta["lower_bound"]}, {meta["upper_bound"]}].',
                    'recommended_fix': f'Clip extreme values to IQR bounds or trim outlier rows.',
                    'quick_fix_action': 'trim_outliers'
                })

        if len(issues) == 0:
            issues.append({
                'id': 'iss_clean',
                'severity': 'Info',
                'category': 'General',
                'column': 'N/A',
                'title': 'High Dataset Health',
                'description': 'No severe quality defects detected in current profiling pass.',
                'recommended_fix': 'Dataset is ready for downstream analytical pipelines.',
                'quick_fix_action': 'none'
            })

        return issues


class DatasetComparator:
    """
    Temporal Snapshot & Dataset Comparison Engine.
    Compares a Base Dataset against a Current Dataset to identify quality drift and schema changes.
    """

    def __init__(self, base_df: pd.DataFrame, current_df: pd.DataFrame, domain_preset: str = 'general'):
        self.base_df = base_df.copy()
        self.current_df = current_df.copy()
        self.domain_preset = domain_preset

        self.base_engine = DataQualityEngine(self.base_df)
        self.current_engine = DataQualityEngine(self.current_df)

    def compare(self) -> Dict[str, Any]:
        base_eval = self.base_engine.evaluate_all(self.domain_preset)
        current_eval = self.current_engine.evaluate_all(self.domain_preset)

        score_delta = round(current_eval['overall_score'] - base_eval['overall_score'], 2)
        row_delta = current_eval['dataset_summary']['rows'] - base_eval['dataset_summary']['rows']
        col_delta = current_eval['dataset_summary']['columns'] - base_eval['dataset_summary']['columns']

        # Missingness Shift
        base_missing = base_eval['dimensions']['completeness']['details']['total_missing']
        curr_missing = current_eval['dimensions']['completeness']['details']['total_missing']
        missing_shift = curr_missing - base_missing

        # Schema Mismatch Warnings
        base_cols = set(self.base_df.columns)
        curr_cols = set(self.current_df.columns)

        added_cols = list(curr_cols - base_cols)
        dropped_cols = list(base_cols - curr_cols)
        common_cols = list(base_cols.intersection(curr_cols))

        type_altered_cols = []
        for col in common_cols:
            b_type = str(self.base_df[col].dtype)
            c_type = str(self.current_df[col].dtype)
            if b_type != c_type:
                type_altered_cols.append({'column': col, 'base_type': b_type, 'current_type': c_type})

        schema_warnings = []
        if added_cols:
            schema_warnings.append(f"New columns introduced: {added_cols}")
        if dropped_cols:
            schema_warnings.append(f"Columns removed/missing: {dropped_cols}")
        if type_altered_cols:
            schema_warnings.append(f"Column data types altered: {[t['column'] for t in type_altered_cols]}")

        # Column dimension score drift
        column_drifts = []
        for col in common_cols:
            # Base completeness vs curr completeness
            b_miss = self.base_df[col].isna().sum() / len(self.base_df) * 100 if len(self.base_df) > 0 else 0
            c_miss = self.current_df[col].isna().sum() / len(self.current_df) * 100 if len(self.current_df) > 0 else 0
            miss_diff = round(c_miss - b_miss, 2)

            column_drifts.append({
                'column': col,
                'base_missing_pct': round(b_miss, 2),
                'current_missing_pct': round(c_miss, 2),
                'missing_shift_pct': miss_diff,
                'status': 'Degraded' if miss_diff > 2.0 else ('Improved' if miss_diff < -2.0 else 'Stable')
            })

        return {
            'base_summary': {
                'overall_score': base_eval['overall_score'],
                'tier': base_eval['tier'],
                'rows': base_eval['dataset_summary']['rows'],
                'columns': base_eval['dataset_summary']['columns'],
                'dimensions': {k: v['score'] for k, v in base_eval['dimensions'].items()}
            },
            'current_summary': {
                'overall_score': current_eval['overall_score'],
                'tier': current_eval['tier'],
                'rows': current_eval['dataset_summary']['rows'],
                'columns': current_eval['dataset_summary']['columns'],
                'dimensions': {k: v['score'] for k, v in current_eval['dimensions'].items()}
            },
            'deltas': {
                'score_delta': score_delta,
                'score_direction': 'improved' if score_delta > 0 else ('degraded' if score_delta < 0 else 'unchanged'),
                'row_growth': row_delta,
                'col_growth': col_delta,
                'missing_shift': missing_shift
            },
            'schema_changes': {
                'added_columns': added_cols,
                'dropped_columns': dropped_cols,
                'type_altered_columns': type_altered_cols,
                'has_mismatch': len(added_cols) > 0 or len(dropped_cols) > 0 or len(type_altered_cols) > 0,
                'warnings': schema_warnings
            },
            'column_drifts': column_drifts
        }


def remediate_dataset(df: pd.DataFrame, params: Dict[str, Any]) -> Tuple[pd.DataFrame, List[str]]:
    """
    Executes specifies cleaning & remediation parameters on a DataFrame.
    Returns remediated DataFrame and list of applied transformation actions.
    """
    cleaned_df = df.copy()
    actions = []

    # 1. Deduplication
    dup_policy = params.get('duplicate_policy', 'none')
    if dup_policy == 'keep_first' and cleaned_df.duplicated().sum() > 0:
        n_before = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates(keep='first')
        actions.append(f"Removed {n_before - len(cleaned_df)} duplicate rows (kept first occurrence).")
    elif dup_policy == 'keep_last' and cleaned_df.duplicated().sum() > 0:
        n_before = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates(keep='last')
        actions.append(f"Removed {n_before - len(cleaned_df)} duplicate rows (kept last occurrence).")
    elif dup_policy == 'drop_all' and cleaned_df.duplicated().sum() > 0:
        n_before = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates(keep=False)
        actions.append(f"Removed {n_before - len(cleaned_df)} duplicate rows (dropped all instances).")

    # 2. Text Cleaning
    text_clean = params.get('text_clean_policy', 'none')
    if text_clean in ['strip', 'strip_lowercase']:
        str_cols = cleaned_df.select_dtypes(include=['object', 'string']).columns
        strip_cnt = 0
        for col in str_cols:
            cleaned_df[col] = cleaned_df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
            if text_clean == 'strip_lowercase':
                cleaned_df[col] = cleaned_df[col].apply(lambda x: x.lower() if isinstance(x, str) else x)
            strip_cnt += 1
        actions.append(f"Cleaned string formatting and spaces across {strip_cnt} text columns.")

    # 3. Imputation Strategy
    impute_strat = params.get('impute_strategy', 'none')
    if impute_strat in ['mean', 'median', 'mode', 'constant']:
        num_cols = cleaned_df.select_dtypes(include=[np.number]).columns
        cat_cols = cleaned_df.select_dtypes(exclude=[np.number]).columns
        imp_count = 0

        for col in num_cols:
            if cleaned_df[col].isna().sum() > 0:
                imp_count += cleaned_df[col].isna().sum()
                if impute_strat == 'mean':
                    val = cleaned_df[col].mean()
                elif impute_strat == 'median':
                    val = cleaned_df[col].median()
                elif impute_strat == 'mode':
                    val = cleaned_df[col].mode()[0] if not cleaned_df[col].mode().empty else 0
                else: # constant
                    val = params.get('constant_value', 0)
                cleaned_df[col] = cleaned_df[col].fillna(val)

        for col in cat_cols:
            if cleaned_df[col].isna().sum() > 0:
                imp_count += cleaned_df[col].isna().sum()
                mode_val = cleaned_df[col].mode()[0] if not cleaned_df[col].mode().empty else 'Unknown'
                cleaned_df[col] = cleaned_df[col].fillna(mode_val)

        if imp_count > 0:
            actions.append(f"Imputed {imp_count} missing values using strategy: {impute_strat.upper()}.")

    # 4. Outlier Trimming / Clipping
    outlier_policy = params.get('outlier_policy', 'none')
    if outlier_policy in ['clip', 'drop_rows']:
        num_cols = cleaned_df.select_dtypes(include=[np.number]).columns
        clipped_cnt = 0
        dropped_rows = 0

        for col in num_cols:
            s = cleaned_df[col].dropna()
            if len(s) >= 4:
                q1 = s.quantile(0.25)
                q3 = s.quantile(0.75)
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr

                if outlier_policy == 'clip':
                    out_mask = (cleaned_df[col] < lower) | (cleaned_df[col] > upper)
                    clipped_cnt += out_mask.sum()
                    cleaned_df[col] = cleaned_df[col].clip(lower=lower, upper=upper)
                elif outlier_policy == 'drop_rows':
                    valid_mask = (cleaned_df[col] >= lower) & (cleaned_df[col] <= upper) | cleaned_df[col].isna()
                    n_before = len(cleaned_df)
                    cleaned_df = cleaned_df[valid_mask]
                    dropped_rows += (n_before - len(cleaned_df))

        if outlier_policy == 'clip' and clipped_cnt > 0:
            actions.append(f"Clipped {clipped_cnt} statistical outliers to 1.5x IQR boundaries.")
        elif outlier_policy == 'drop_rows' and dropped_rows > 0:
            actions.append(f"Dropped {dropped_rows} outlier rows outside 1.5x IQR boundaries.")

    if not actions:
        actions.append("No transformation rules applied (Default state).")

    return cleaned_df, actions
