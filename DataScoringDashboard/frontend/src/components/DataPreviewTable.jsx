import React, { useState } from 'react';
import { Table, Search, ChevronLeft, ChevronRight, FileSpreadsheet, Download } from 'lucide-react';

const DataPreviewTable = ({ 
  sampleRows, 
  summary, 
  onDownloadCSV, 
  remediatedResult 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  const dataToDisplay = remediatedResult?.remediated_sample || sampleRows || [];

  if (!dataToDisplay || dataToDisplay.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-500 text-xs italic">
        No dataset rows available for preview. Please upload a dataset or select a sample domain.
      </div>
    );
  }

  const columns = Object.keys(dataToDisplay[0] || {});

  // Search Filter
  const filteredRows = dataToDisplay.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some(
      val => val !== null && val !== undefined && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 mb-8">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <span>Interactive Data Table & Cell Profiler</span>
            {remediatedResult && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Sanitized View
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            Preview raw vs remediated rows with missing value highlights
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search values..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/90 text-xs text-slate-200 rounded-xl border border-slate-800 pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-48"
            />
          </div>

          {/* Export CSV Button */}
          {onDownloadCSV && (
            <button
              onClick={onDownloadCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5 text-slate-500 w-12">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3.5 py-2.5 font-sans text-slate-200 font-bold whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30">
                <td className="px-3.5 py-2 text-slate-500 font-sans">{startIndex + idx + 1}</td>
                {columns.map((col) => {
                  const val = row[col];
                  const isNull = val === null || val === undefined || val === '';
                  return (
                    <td key={col} className="px-3.5 py-2 whitespace-nowrap">
                      {isNull ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 font-sans italic border border-rose-500/20">
                          NaN / NULL
                        </span>
                      ) : (
                        <span className="text-slate-300">{String(val)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
        <span>
          Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredRows.length)} of {filteredRows.length} rows
        </span>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-200">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default DataPreviewTable;
