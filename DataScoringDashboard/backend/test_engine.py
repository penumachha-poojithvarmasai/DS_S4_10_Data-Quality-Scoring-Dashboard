import unittest
import pandas as pd
import numpy as np
from engine import DataQualityEngine, DatasetComparator, remediate_dataset

class TestDataQualityEngine(unittest.TestCase):

    def setUp(self):
        self.df = pd.DataFrame({
            'id': [1, 2, 3, 4, 4],
            'name': [' Alice ', 'Bob', 'Charlie', 'David', 'David'],
            'score': [85.0, None, 95.0, 1000.0, 1000.0],
            'date': ['2023-01-01', '2023-01-02', 'invalid-date', '2023-01-04', '2023-01-04']
        })

    def test_completeness(self):
        engine = DataQualityEngine(self.df)
        res = engine.calculate_completeness()
        # 1 missing value out of 20 total cells (5 rows * 4 cols) = 19/20 = 95.0%
        self.assertEqual(res['total_missing'], 1)
        self.assertEqual(res['score'], 95.0)

    def test_uniqueness(self):
        engine = DataQualityEngine(self.df)
        res = engine.calculate_uniqueness()
        # 1 duplicate row out of 5 rows = 4/5 = 80.0%
        self.assertEqual(res['duplicate_rows'], 1)
        self.assertEqual(res['score'], 80.0)

    def test_consistency(self):
        engine = DataQualityEngine(self.df)
        res = engine.calculate_consistency()
        self.assertTrue('column_consistency' in res)
        self.assertGreater(res['score'], 0.0)

    def test_validity(self):
        df_out = pd.DataFrame({
            'score': [85.0, 88.0, 90.0, 92.0, 94.0, 10000.0]
        })
        engine = DataQualityEngine(df_out)
        res = engine.calculate_validity()
        self.assertGreaterEqual(res['total_outliers'], 1)

    def test_domain_presets(self):
        engine = DataQualityEngine(self.df)
        gen_res = engine.evaluate_all('general')
        health_res = engine.evaluate_all('healthcare')
        self.assertIn('tier', gen_res)
        self.assertIn('overall_score', gen_res)
        self.assertNotEqual(gen_res['weights']['C'], health_res['weights']['C'])

    def test_remediation(self):
        engine = DataQualityEngine(self.df)
        cleaned_df, actions = remediate_dataset(self.df, {
            'duplicate_policy': 'keep_first',
            'impute_strategy': 'median',
            'text_clean_policy': 'strip'
        })
        self.assertEqual(len(cleaned_df), 4) # Deduplicated
        self.assertEqual(cleaned_df['score'].isna().sum(), 0) # Imputed
        self.assertTrue(len(actions) >= 2)

    def test_comparator(self):
        base_df = self.df.copy()
        curr_df = self.df.drop(columns=['date'])
        comparator = DatasetComparator(base_df, curr_df)
        comp_res = comparator.compare()
        self.assertIn('date', comp_res['schema_changes']['dropped_columns'])
        self.assertTrue(comp_res['schema_changes']['has_mismatch'])

if __name__ == '__main__':
    unittest.main()
