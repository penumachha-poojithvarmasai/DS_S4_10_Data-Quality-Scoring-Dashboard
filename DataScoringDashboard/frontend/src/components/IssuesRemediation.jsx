import React, { useState, useEffect } from 'react';
import { 
  Wand2, Sliders, AlertCircle, AlertTriangle, Info, Play, Download, 
  Check, RefreshCw, Zap, Sparkles, Filter 
} from 'lucide-react';

const IssuesRemediation = ({ 
  issues, 
  evaluation, 
  onApplyRemediation, 
  remediatedResult, 
  isRemediating 
}) => {
  // Remediation Parameters State
  const [imputeStrategy, setImputeStrategy] = useState('median');
  const [duplicatePolicy, setDuplicatePolicy] = useState('keep_first');
  const [outlierPolicy, setOutlierPolicy] = useState('clip');
  const [textCleanPolicy, setTextCleanPolicy] = useState('strip');
  const [constantValue, setConstantValue] = useState(0);

  // Projected Score Simulator Calculation
  const [projectedScore, setProjectedScore] = useState(0);
  const [projectedGain, setProjectedGain] = useState(0);

  useEffect(() => {
    if (!evaluation) return;
    const currScore = evaluation.overall_score;

    let simulatedGain = 0;
    
    // Calculate potential gain from missing values if imputed
    if (imputeStrategy !== 'none') {
      const missingPct = evaluation.dimensions.completeness.details.total_missing / (evaluation.dataset_summary.total_cells || 1);
      const wC = evaluation.weights.C;
      simulatedGain += (missingPct * 100) * wC;
    }

    // Calculate potential gain from duplicate removal
    if (duplicatePolicy !== 'none') {
      const dupPct = evaluation.dimensions.uniqueness.details.duplicate_percentage / 100;
      const wU = evaluation.weights.U;
      simulatedGain += (dupPct * 100) * wU;
    }

    // Calculate potential gain from text cleaning
    if (textCleanPolicy !== 'none') {
      const consScore = evaluation.dimensions.consistency.score;
      const potentialConsGain = Math.min(100 - consScore, 15);
      const wK = evaluation.weights.K;
      simulatedGain += potentialConsGain * wK;
    }

    // Calculate potential gain from outlier clipping/trimming
    if (outlierPolicy !== 'none') {
      const outlierRatio = (evaluation.dimensions.validity.details.outlier_ratio || 0) / 100;
      const wV = evaluation.weights.V;
      simulatedGain += (outlierRatio * 100) * wV;
    }

    const projected = Math.min(100.0, roundVal(currScore + simulatedGain));
    const gain = roundVal(projected - currScore);

    setProjectedScore(projected);
    setProjectedGain(gain);
  }, [imputeStrategy, duplicatePolicy, outlierPolicy, textCleanPolicy, evaluation]);

  const roundVal = (num) => Math.round(num * 10) / 10;

  const handleRunRemediation = () => {
    onApplyRemediation({
      impute_strategy: imputeStrategy,
      duplicate_policy: duplicatePolicy,
      outlier_policy: outlierPolicy,
      text_clean_policy: textCleanPolicy,
      constant_value: constantValue
    });
  };

  const downloadCSV = () => {
    if (!remediatedResult || !remediatedResult.csv_content) return;
    const blob = new Blob([remediatedResult.csv_content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sanitized_dataset_cleaned.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'Critical') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3 h-3" />
          <span>Critical</span>
        </span>
      );
    }
    if (sev === 'Warning') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          <span>Warning</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Info className="w-3 h-3" />
        <span>Info</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      
      {/* Left Column: Interactive Anomaly Issue Table */}
      <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Detected Data Anomalies & Recommendations</span>
              </h2>
              <p className="text-xs text-slate-400">Automated severity classification and granular remediation advice</p>
            </div>
            
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
              {issues ? issues.length : 0} Issues Detected
            </span>
          </div>

          {/* Anomaly Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="px-3.5 py-3">Severity</th>
                  <th className="px-3.5 py-3">Category / Column</th>
                  <th className="px-3.5 py-3">Defect Description</th>
                  <th className="px-3.5 py-3">Recommended Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {issues && issues.length > 0 ? (
                  issues.map((iss, idx) => (
                    <tr key={iss.id || idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {getSeverityBadge(iss.severity)}
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-slate-200 whitespace-nowrap">
                        <span className="text-blue-400 font-mono text-[11px] block">{iss.category}</span>
                        {iss.column}
                      </td>
                      <td className="px-3.5 py-3 text-slate-300">
                        {iss.description}
                      </td>
                      <td className="px-3.5 py-3 text-slate-400 font-medium">
                        {iss.recommended_fix}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500 italic">
                      No critical quality issues detected in dataset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {remediatedResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <div>
              <div className="font-bold flex items-center space-x-1.5 text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Remediation Complete!</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {remediatedResult.applied_actions.join(" • ")}
              </p>
            </div>
            
            <button
              onClick={downloadCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 text-xs transition-all active:scale-95 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Interactive "What-If" Remediation Playground */}
      <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Wand2 className="w-4 h-4 text-blue-400" />
                <span>"What-If" Remediation Playground</span>
              </h2>
              <p className="text-xs text-slate-400">Configure cleaning parameters and simulate projected score gain</p>
            </div>

            {/* Live Score Gain Simulator Badge */}
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Projected Gain</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                +{projectedGain}% ({projectedScore}%)
              </span>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="space-y-4 text-xs">
            
            {/* 1. Missing Value Imputation Strategy */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <label className="block font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>1. Imputation Strategy (Completeness)</span>
                <span className="text-[10px] text-blue-400 font-mono">Current: {evaluation?.dimensions.completeness.score}%</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {['mean', 'median', 'mode', 'constant', 'none'].map((strat) => (
                  <button
                    key={strat}
                    onClick={() => setImputeStrategy(strat)}
                    className={`py-1.5 px-2 rounded-lg font-medium text-[11px] capitalize transition-all border ${
                      imputeStrategy === strat 
                        ? 'bg-blue-600 text-white border-blue-500 shadow' 
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {strat}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Duplicate Row Elimination */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <label className="block font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>2. Deduplication Policy (Uniqueness)</span>
                <span className="text-[10px] text-blue-400 font-mono">Duplicates: {evaluation?.dimensions.uniqueness.details.duplicate_rows}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'keep_first', label: 'Keep First' },
                  { id: 'keep_last', label: 'Keep Last' },
                  { id: 'drop_all', label: 'Drop All' },
                  { id: 'none', label: 'None' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDuplicatePolicy(item.id)}
                    className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all border ${
                      duplicatePolicy === item.id 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow' 
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Outlier Handling */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <label className="block font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>3. Outlier Trimming (Validity)</span>
                <span className="text-[10px] text-blue-400 font-mono">1.5x IQR Filter</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'clip', label: 'Clip to IQR Bounds' },
                  { id: 'drop_rows', label: 'Drop Outlier Rows' },
                  { id: 'none', label: 'Ignore Outliers' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOutlierPolicy(item.id)}
                    className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all border ${
                      outlierPolicy === item.id 
                        ? 'bg-amber-600 text-white border-amber-500 shadow' 
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Text Sanitization */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <label className="block font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>4. Text Formatting & Whitespace (Consistency)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'strip', label: 'Trim Whitespaces' },
                  { id: 'strip_lowercase', label: 'Trim + Lowercase' },
                  { id: 'none', label: 'None' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTextCleanPolicy(item.id)}
                    className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all border ${
                      textCleanPolicy === item.id 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow' 
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-slate-800">
          <button
            onClick={handleRunRemediation}
            disabled={isRemediating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isRemediating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Pipeline Transformations...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Apply Remediation & Generate Clean Dataset (+{projectedGain}% Score)</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};

export default IssuesRemediation;
