import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell
} from 'recharts';
import { BarChart3, PieChart as RadarIcon, AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
        <p className="font-bold text-slate-200 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="flex items-center space-x-2 font-mono" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsCharts = ({ evaluation }) => {
  if (!evaluation) return null;

  const { dimensions } = evaluation;

  // 1. Radar Chart Data
  const radarData = [
    { dimension: 'Completeness', score: dimensions.completeness.score, benchmark: 100 },
    { dimension: 'Uniqueness', score: dimensions.uniqueness.score, benchmark: 100 },
    { dimension: 'Consistency', score: dimensions.consistency.score, benchmark: 100 },
    { dimension: 'Validity', score: dimensions.validity.score, benchmark: 100 },
  ];

  // 2. Column-wise Missingness Data
  const colMissingMap = dimensions.completeness.details.column_missingness || {};
  const missingnessData = Object.keys(colMissingMap).map(col => ({
    column: col.length > 14 ? `${col.slice(0, 12)}...` : col,
    full_col: col,
    missing_pct: colMissingMap[col].percentage,
    missing_cnt: colMissingMap[col].count
  }));

  // 3. Outlier Density Data
  const colOutlierMap = dimensions.validity.details.column_outliers || {};
  const outlierData = Object.keys(colOutlierMap).map(col => ({
    column: col.length > 14 ? `${col.slice(0, 12)}...` : col,
    full_col: col,
    iqr_outliers: colOutlierMap[col].iqr_outliers || 0,
    z_outliers: colOutlierMap[col].z_outliers || 0,
    outliers: colOutlierMap[col].outlier_count || 0
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      
      {/* 1. Radar Chart: Dimensions vs Benchmark */}
      <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <RadarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Quality Dimensions Radar</h3>
              <p className="text-[11px] text-slate-400">Current Health vs Ideal 100% Benchmark</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis dataKey="dimension" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
              
              <Radar
                name="Benchmark"
                dataKey="benchmark"
                stroke="#64748b"
                fill="#64748b"
                fillOpacity={0.15}
                strokeDasharray="3 3"
              />
              <Radar
                name="Current Score"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.5}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center space-x-6 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Current Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span>Benchmark (100%)</span>
          </div>
        </div>
      </div>

      {/* 2. Column-wise Missingness Bar Chart */}
      <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Column Missingness (%)</h3>
              <p className="text-[11px] text-slate-400">Null Cell Percentage per Attribute</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={missingnessData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="column" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={0}
                angle={-30}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="missing_pct" name="Missing %" radius={[4, 4, 0, 0]}>
                {missingnessData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.missing_pct > 20 ? '#f43f5e' : (entry.missing_pct > 0 ? '#f59e0b' : '#10b981')} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Total Missing Cells: <strong className="text-amber-400">{dimensions.completeness.details.total_missing}</strong></span>
          <span>Deduplication Deficit: <strong className="text-rose-400">{dimensions.uniqueness.details.duplicate_rows} rows</strong></span>
        </div>
      </div>

      {/* 3. Numeric Outlier Density Bar Chart */}
      <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Outlier Density per Attribute</h3>
              <p className="text-[11px] text-slate-400">Statistical Anomalies (IQR Bounds & Z-Score)</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {outlierData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outlierData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="column" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="iqr_outliers" name="IQR Outliers" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="z_outliers" name="Z-Score (>3)" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
              No numeric attributes present for outlier analysis.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Outlier Cells Ratio: <strong className="text-indigo-400">{dimensions.validity.details.outlier_ratio}%</strong></span>
          <span>IQR Multiplier: <strong className="text-slate-300">1.5x</strong></span>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsCharts;
