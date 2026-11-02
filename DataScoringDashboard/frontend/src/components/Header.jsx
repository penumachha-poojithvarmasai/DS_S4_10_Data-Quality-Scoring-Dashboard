import React from 'react';
import { ShieldCheck, Upload, RefreshCw, Sparkles, Database, FileSpreadsheet } from 'lucide-react';

const Header = ({ 
  currentDomain, 
  onDomainChange, 
  onFileUpload, 
  onLoadSample, 
  isLoading, 
  datasetSummary 
}) => {
  const domains = [
    { id: 'general', name: 'General Business Profile', desc: 'C:30% | U:25% | K:25% | V:20%' },
    { id: 'healthcare', name: 'Healthcare / Clinical Diagnostics', desc: 'C:45% | U:20% | K:20% | V:15% (Zero Missing Diagnostics)' },
    { id: 'finance', name: 'Financial Transactions & Ledgers', desc: 'U:40% | K:30% | V:20% | C:10% (Zero Duplicate Transactions)' },
    { id: 'ecommerce', name: 'E-Commerce & Marketing Catalogs', desc: 'C:25% | U:35% | K:20% | V:20% (Catalog & Price Integrity)' }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Platform Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 font-sans tracking-tight">
                Data Quality Scoring Dashboard
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO ENGINE v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated Quality Profiling, Drift Analysis & Interactive Remediation Platform
            </p>
          </div>
        </div>

        {/* Right: Controls & Presets */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Domain Selector */}
          <div className="relative">
            <label htmlFor="domain-select" className="sr-only">Domain Profile</label>
            <select
              id="domain-select"
              value={currentDomain}
              onChange={(e) => onDomainChange(e.target.value)}
              className="bg-slate-900/90 text-slate-200 text-xs rounded-xl border border-slate-700/80 px-3.5 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-inner font-medium cursor-pointer"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Demo Sample Loader */}
          <div className="flex items-center space-x-1.5 bg-slate-900/80 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => onLoadSample('general')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                currentDomain === 'general' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Demo General
            </button>
            <button
              onClick={() => onLoadSample('healthcare')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                currentDomain === 'healthcare' 
                  ? 'bg-emerald-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Healthcare
            </button>
            <button
              onClick={() => onLoadSample('finance')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                currentDomain === 'finance' 
                  ? 'bg-amber-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Finance
            </button>
          </div>

          {/* Upload Button */}
          <label className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-blue-500/40 shadow-lg shadow-blue-600/20 cursor-pointer transition-all active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV / XLSX</span>
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls" 
              className="hidden" 
              onChange={onFileUpload} 
            />
          </label>

        </div>
      </div>
    </header>
  );
};

export default Header;
