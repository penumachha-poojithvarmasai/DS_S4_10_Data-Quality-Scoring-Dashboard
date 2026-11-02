import React from 'react';
import { Award, CheckCircle2, Copy, Sparkles, ShieldAlert, BarChart2 } from 'lucide-react';

const CircularProgress = ({ score, tier }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getGradientId = () => {
    if (score >= 90) return 'grad-emerald';
    if (score >= 75) return 'grad-blue';
    if (score >= 50) return 'grad-amber';
    return 'grad-rose';
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-36 h-36 transform -rotate-90">
        <defs>
          <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="grad-rose" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="10"
          fill="transparent"
        />

        {/* Animated Progress Circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke={`url(#${getGradientId()})`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
          {score}%
        </span>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">
          Composite Score
        </span>
      </div>
    </div>
  );
};

const MetricCards = ({ evaluation }) => {
  if (!evaluation) return null;

  const { overall_score, tier, dimensions, domain_name } = evaluation;

  const dims = [
    {
      key: 'completeness',
      label: 'Completeness Score (C)',
      icon: CheckCircle2,
      data: dimensions.completeness,
      subtext: `${dimensions.completeness.details.total_missing} Missing Cells`
    },
    {
      key: 'uniqueness',
      label: 'Uniqueness Score (U)',
      icon: Copy,
      data: dimensions.uniqueness,
      subtext: `${dimensions.uniqueness.details.duplicate_rows} Duplicate Rows (${dimensions.uniqueness.details.duplicate_percentage}%)`
    },
    {
      key: 'consistency',
      label: 'Consistency Score (K)',
      icon: Sparkles,
      data: dimensions.consistency,
      subtext: `Evaluates Types & Date Formatting`
    },
    {
      key: 'validity',
      label: 'Validity & Outlier Score (V)',
      icon: ShieldAlert,
      data: dimensions.validity,
      subtext: `${dimensions.validity.details.total_outliers || 0} Outliers Detected (IQR / Z-Score)`
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
      
      {/* Primary Composite Score Hero Card */}
      <div className="lg:col-span-4 glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-blue-500/20 shadow-xl shadow-blue-950/20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Overall Quality Health
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">{domain_name}</h2>
            </div>
            
            {/* Tier Badge */}
            <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center space-x-1.5 ${tier.bg} ${tier.text} ${tier.border}`}>
              <Award className="w-3.5 h-3.5" />
              <span>{tier.tier}: {tier.label}</span>
            </div>
          </div>

          <div className="py-2 flex items-center justify-center">
            <CircularProgress score={overall_score} tier={tier} />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Target Benchmark: <strong className="text-slate-200">90.0%</strong></span>
          <span className="flex items-center text-slate-300 font-medium">
            Weighted Dynamic Matrix
          </span>
        </div>
      </div>

      {/* 4 Dimension Score Cards Grid */}
      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dims.map((dim) => {
          const Icon = dim.icon;
          const score = dim.data.score;
          const weight = dim.data.weight;

          let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          let barBg = 'bg-emerald-500';
          if (score < 50) {
            colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            barBg = 'bg-rose-500';
          } else if (score < 75) {
            colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            barBg = 'bg-amber-500';
          } else if (score < 90) {
            colorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            barBg = 'bg-blue-500';
          }

          return (
            <div 
              key={dim.key} 
              className="glass-panel-interactive rounded-2xl p-5 flex flex-col justify-between border border-slate-800/80 relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-xl border ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      {dim.label}
                    </span>
                  </div>
                  
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800">
                    Weight: {weight}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2 mb-2">
                  <span className="text-2xl font-extrabold text-white font-sans">
                    {score}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Weighted: {dim.data.weighted_score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900/90 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${barBg}`}
                    style={{ width: `${Math.max(2, score)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 truncate">
                {dim.subtext}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default MetricCards;
