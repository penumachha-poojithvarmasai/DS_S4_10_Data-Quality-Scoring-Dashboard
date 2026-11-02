import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import AnalyticsCharts from './components/AnalyticsCharts';
import IssuesRemediation from './components/IssuesRemediation';
import DatasetComparator from './components/DatasetComparator';
import DataPreviewTable from './components/DataPreviewTable';

import { 
  fetchSampleDataset, 
  uploadDatasetFile, 
  fetchScoreMetrics, 
  fetchIssues, 
  compareDatasets, 
  remediateDataset 
} from './api';

import { LayoutDashboard, Wand2, GitCompare, Table, RefreshCw, AlertCircle } from 'lucide-react';

function App() {
  const [currentDomain, setCurrentDomain] = useState('general');
  const [sessionId, setSessionId] = useState('sample_general');
  
  // Dashboard state
  const [evaluation, setEvaluation] = useState(null);
  const [issues, setIssues] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [datasetSummary, setDatasetSummary] = useState(null);
  
  // Remediation State
  const [remediatedResult, setRemediatedResult] = useState(null);
  const [isRemediating, setIsRemediating] = useState(false);

  // Comparison State
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // General Loading & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'remediation' | 'compare' | 'explorer'

  // Initial demo data load on mount
  useEffect(() => {
    loadSampleDomain('general');
  }, []);

  const loadSampleDomain = async (domain) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchSampleDataset(domain);
      if (data.success) {
        setCurrentDomain(domain);
        setSessionId(data.session_id);
        setEvaluation(data.evaluation);
        setIssues(data.issues);
        setSampleRows(data.sample_rows);
        setDatasetSummary(data.evaluation.dataset_summary);
        setRemediatedResult(null); // reset prior remediation
        setComparisonResult(null);
      } else {
        setErrorMsg(data.error || 'Failed to load sample dataset.');
      }
    } catch (err) {
      setErrorMsg(`Backend Server Offline or Unreachable: ${err.message}. Please ensure app.py is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDomainChange = async (newDomain) => {
    setCurrentDomain(newDomain);
    if (evaluation) {
      setIsLoading(true);
      try {
        const scoreRes = await fetchScoreMetrics({
          domain: newDomain,
          session_id: sessionId
        });
        if (scoreRes.success) {
          setEvaluation(scoreRes.evaluation);
        }
      } catch (err) {
        setErrorMsg(`Failed to recalculate score for domain ${newDomain}: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await uploadDatasetFile(file, currentDomain);
      if (res.success) {
        setSessionId(res.session_id);
        setEvaluation(res.evaluation);
        setIssues(res.issues);
        setSampleRows(res.sample_rows);
        setDatasetSummary(res.dataset_summary);
        setRemediatedResult(null);
        setComparisonResult(null);
      } else {
        setErrorMsg(res.error || 'Failed to process dataset file.');
      }
    } catch (err) {
      setErrorMsg(`Upload error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRemediation = async (params) => {
    setIsRemediating(true);
    try {
      const res = await remediateDataset({
        domain: currentDomain,
        session_id: sessionId,
        parameters: params
      });
      if (res.success) {
        setRemediatedResult(res);
      } else {
        setErrorMsg(res.error || 'Remediation failed.');
      }
    } catch (err) {
      setErrorMsg(`Remediation execution error: ${err.message}`);
    } finally {
      setIsRemediating(false);
    }
  };

  const handleRunComparison = async (formDataOrJson) => {
    setIsComparing(true);
    try {
      // Pass domain and session_id
      let payload = formDataOrJson;
      if (!(formDataOrJson instanceof FormData)) {
        payload = {
          domain: currentDomain,
          session_id: sessionId
        };
      } else {
        formDataOrJson.append('domain', currentDomain);
        formDataOrJson.append('session_id', sessionId);
      }

      const res = await compareDatasets(payload);
      if (res.success) {
        setComparisonResult(res.comparison);
      } else {
        setErrorMsg(res.error || 'Comparison failed.');
      }
    } catch (err) {
      setErrorMsg(`Comparison execution error: ${err.message}`);
    } finally {
      setIsComparing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Executive Profiling & Analytics', icon: LayoutDashboard },
    { id: 'remediation', label: '"What-If" Remediation Sandbox', icon: Wand2 },
    { id: 'compare', label: 'Temporal Drift Comparison', icon: GitCompare },
    { id: 'explorer', label: 'Dataset Explorer & Export', icon: Table },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* Header Bar */}
      <Header 
        currentDomain={currentDomain}
        onDomainChange={handleDomainChange}
        onFileUpload={handleFileUpload}
        onLoadSample={loadSampleDomain}
        isLoading={isLoading}
        datasetSummary={datasetSummary}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Error Alert Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="text-slate-400 hover:text-white text-xs font-mono underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Dataset Status Bar */}
        {datasetSummary && (
          <div className="mb-6 glass-panel rounded-xl px-5 py-3 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="text-slate-500 font-semibold">Active Session:</span>
                <span className="font-mono text-blue-400 font-bold">{sessionId}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="text-slate-500 font-semibold">Rows:</span>
                <span className="font-mono text-white font-bold">{datasetSummary.rows}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="text-slate-500 font-semibold">Columns:</span>
                <span className="font-mono text-white font-bold">{datasetSummary.columns}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="text-slate-500 font-semibold">Total Data Cells:</span>
                <span className="font-mono text-white font-bold">{datasetSummary.total_cells}</span>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center space-x-2 text-blue-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Engine Calculation...</span>
              </div>
            )}
          </div>
        )}

        {/* Top Executive Metric Gauge Cards */}
        <MetricCards evaluation={remediatedResult?.new_evaluation || evaluation} />

        {/* Navigation Tab Bar */}
        <div className="flex items-center space-x-2 border-b border-slate-800 mb-6 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Content Views */}
        <div className="transition-all duration-300">
          
          {/* Tab 1: Executive Analytics */}
          {activeTab === 'overview' && (
            <AnalyticsCharts evaluation={remediatedResult?.new_evaluation || evaluation} />
          )}

          {/* Tab 2: Remediation Sandbox */}
          {activeTab === 'remediation' && (
            <IssuesRemediation 
              issues={remediatedResult?.new_issues || issues}
              evaluation={evaluation}
              onApplyRemediation={handleApplyRemediation}
              remediatedResult={remediatedResult}
              isRemediating={isRemediating}
            />
          )}

          {/* Tab 3: Temporal Drift Comparator */}
          {activeTab === 'compare' && (
            <DatasetComparator 
              onRunComparison={handleRunComparison}
              comparisonResult={comparisonResult}
              isLoading={isComparing}
            />
          )}

          {/* Tab 4: Dataset Explorer & Export */}
          {activeTab === 'explorer' && (
            <DataPreviewTable 
              sampleRows={sampleRows}
              summary={datasetSummary}
              remediatedResult={remediatedResult}
              onDownloadCSV={() => {
                if (remediatedResult?.csv_content) {
                  const blob = new Blob([remediatedResult.csv_content], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'cleaned_export.csv';
                  link.click();
                }
              }}
            />
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Data Quality Scoring Dashboard &copy; 2026 • Production Enterprise Platform</span>
          <span className="font-mono">Python Flask + Pandas + React + Recharts</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
