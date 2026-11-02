import React, { useState } from 'react';
import { 
  GitCompare, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, 
  Layers, Upload, CheckCircle2, FileSpreadsheet, RefreshCw 
} from 'lucide-react';

const DatasetComparator = ({ 
  onRunComparison, 
  comparisonResult, 
  isLoading 
}) => {
  const [baseFile, setBaseFile] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  const handleBaseUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBaseFile(e.target.files[0]);
    }
  };

  const handleCurrentUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentFile(e.target.files[0]);
    }
  };

  const handleSubmitComparison = (e) => {
    e.preventDefault();
    if (baseFile && currentFile) {
      const formData = new FormData();
      formData.append('base_file', baseFile);
      formData.append('current_file', currentFile);
      onRunComparison(formData);
    } else {
      // Demo run using active session comparison
      onRunComparison({});
    }
  };

  const renderDeltaBadge = (delta, direction, suffix = '%') => {
    if (delta > 0) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+{delta}{suffix}</span>
        </span>
      );
    }
    if (delta < 0) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>{delta}{suffix}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
        <Minus className="w-3.5 h-3.5" />
        <span>0{suffix}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 mb-8">
      
      {/* Upper Panel: Dataset Comparator Upload Controls */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              <span>Temporal Snapshot & Dataset Comparison Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              Upload Base (Historical) and Current datasets to detect quality score degradation, schema mutations, and missingness shifts.
            </p>
          </div>

          <button
            onClick={handleSubmitComparison}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <GitCompare className="w-4 h-4" />
            )}
            <span>Run Temporal Drift Comparison</span>
          </button>
        </div>

        {/* File Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Base File Upload Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Base Dataset (Baseline)</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {baseFile ? baseFile.name : 'Using Active Workspace Session'}
                </span>
              </div>
            </div>

            <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700">
              Choose File
              <input type="file" accept=".csv, .xlsx" className="hidden" onChange={handleBaseUpload} />
            </label>
          </div>

          {/* Current File Upload Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Current Dataset (Temporal Snapshot)</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentFile ? currentFile.name : 'Using Simulated Current Drift'}
                </span>
              </div>
            </div>

            <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700">
              Choose File
              <input type="file" accept=".csv, .xlsx" className="hidden" onChange={handleCurrentUpload} />
            </label>
          </div>

        </div>
      </div>

      {/* Comparison Results Section */}
      {comparisonResult && (
        <div className="space-y-6">
          
          {/* Metric Delta Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Score Delta Card */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Quality Score Delta ($\Delta$)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {comparisonResult.current_summary.overall_score}%
                </span>
                {renderDeltaBadge(
                  comparisonResult.deltas.score_delta, 
                  comparisonResult.deltas.score_direction
                )}
              </div>
              <span className="text-[11px] text-slate-500 block mt-2">
                Baseline Score: {comparisonResult.base_summary.overall_score}%
              </span>
            </div>

            {/* Missing Value Shift */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Missing Value Shift</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {comparisonResult.deltas.missing_shift > 0 ? `+${comparisonResult.deltas.missing_shift}` : comparisonResult.deltas.missing_shift}
                </span>
                <span className="text-xs font-mono text-slate-400">cells</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-2">
                Shift in missing cells over time
              </span>
            </div>

            {/* Row Growth */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Row Expansion</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {comparisonResult.current_summary.rows}
                </span>
                {renderDeltaBadge(comparisonResult.deltas.row_growth, 'growth', ' rows')}
              </div>
              <span className="text-[11px] text-slate-500 block mt-2">
                Baseline Rows: {comparisonResult.base_summary.rows}
              </span>
            </div>

            {/* Column Growth */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Column Expansion</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {comparisonResult.current_summary.columns}
                </span>
                {renderDeltaBadge(comparisonResult.deltas.col_growth, 'growth', ' cols')}
              </div>
              <span className="text-[11px] text-slate-500 block mt-2">
                Baseline Columns: {comparisonResult.base_summary.columns}
              </span>
            </div>

          </div>

          {/* Schema Mismatch Warnings Panel */}
          {comparisonResult.schema_changes.has_mismatch && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <div className="font-bold flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Schema Mismatch & Structural Mutation Detected!</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {comparisonResult.schema_changes.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Column-wise Shift Comparison Table */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-white mb-3">Column-Level Quality Drift Breakdown</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Column Name</th>
                    <th className="px-4 py-3">Base Missing %</th>
                    <th className="px-4 py-3">Current Missing %</th>
                    <th className="px-4 py-3">Missing Shift ($\Delta$)</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {comparisonResult.column_drifts.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-sans font-bold text-slate-200">{row.column}</td>
                      <td className="px-4 py-2.5 text-slate-400">{row.base_missing_pct}%</td>
                      <td className="px-4 py-2.5 text-slate-200">{row.current_missing_pct}%</td>
                      <td className="px-4 py-2.5">
                        {row.missing_shift_pct > 0 ? (
                          <span className="text-rose-400 font-bold">+{row.missing_shift_pct}%</span>
                        ) : row.missing_shift_pct < 0 ? (
                          <span className="text-emerald-400 font-bold">{row.missing_shift_pct}%</span>
                        ) : (
                          <span className="text-slate-500">0.0%</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-sans font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          row.status === 'Degraded' 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : row.status === 'Improved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default DatasetComparator;
