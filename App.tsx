import React, { useState } from 'react';
import { EntityCategory, ProcessingResult, ProcessingStatus } from './types';
import { verifyNames } from './services/geminiService';
import { FileUploader } from './components/FileUploader';
import { ResultsTable } from './components/ResultsTable';
import { Search, Loader2, Wand2, ArrowRight, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { downloadAsExcel, downloadAsHtml } from './utils/exportUtils';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [rawNames, setRawNames] = useState<string[]>([]);
  const [category, setCategory] = useState<EntityCategory>(EntityCategory.ANCHOR);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFileLoaded = (names: string[]) => {
    setRawNames(names);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
    setProgress(null);
  };

  const handleProcess = async () => {
    if (rawNames.length === 0) return;

    setStatus('processing');
    setErrorMessage(null);
    setResult({ entries: [], groundingSources: [] }); // Initialize empty results
    
    try {
      // Pass all names; the service handles batching
      const finalData = await verifyNames(
        rawNames, 
        category, 
        (partialResult, prog) => {
          // This callback fires after every batch
          setResult(partialResult);
          setProgress(prog);
        }
      );
      // Final update
      setResult(finalData);
      setStatus('complete');
    } catch (error) {
      console.error(error);
      setErrorMessage("An error occurred while communicating with Gemini. Please try again.");
      setStatus('error');
    } finally {
      setProgress(null);
    }
  };

  const handleDownloadExcel = () => {
    if (result && result.entries.length > 0) {
      downloadAsExcel(result.entries);
    }
  };

  const handleDownloadHtml = () => {
    if (result && result.entries.length > 0) {
      downloadAsHtml(result.entries, result.groundingSources);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
               <Search className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Name Verifier Pro</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700">
               <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
               Powered by Gemini Flash Lite
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          
          {/* Hero / Intro */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Verify and Clean Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Name Lists</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Upload an Excel file with messy, duplicate names. We'll use Google Search to find the correct spellings, verify identities, and group them automatically.
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-slate-800 rounded-2xl shadow-xl shadow-black/20 border border-slate-700 p-6 sm:p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
              
              {/* Left Col: Upload */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-[10px]">1</span>
                    Upload Data
                  </h3>
                  <FileUploader onFileLoaded={handleFileLoaded} isLoading={status === 'processing'} />
                </div>
                
                {rawNames.length > 0 && (
                  <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                    <p className="text-sm text-indigo-200 font-medium">
                      File loaded: {rawNames.length} unique names found.
                    </p>
                    <p className="text-xs text-indigo-400 mt-1">
                      Ready to process.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Col: Configuration */}
              <div className="space-y-6 lg:border-l lg:border-slate-700 lg:pl-12 flex flex-col justify-between">
                <div>
                   <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                     <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-[10px]">2</span>
                     Configure
                   </h3>
                   <p className="text-slate-400 text-sm mb-6">Select the category for better accuracy.</p>
                   
                   <label className="block text-sm font-medium text-slate-300 mb-2">
                     Entity Category
                   </label>
                   <div className="relative">
                     <select
                       value={category}
                       onChange={(e) => setCategory(e.target.value as EntityCategory)}
                       disabled={status === 'processing'}
                       className="w-full pl-4 pr-10 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-slate-200 transition-shadow shadow-sm disabled:opacity-50"
                     >
                       {Object.values(EntityCategory).map((cat) => (
                         <option key={cat} value={cat}>{cat}</option>
                       ))}
                     </select>
                     <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                     </div>
                   </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleProcess}
                    disabled={rawNames.length === 0 || status === 'processing'}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white shadow-lg transition-all
                      ${rawNames.length === 0 || status === 'processing' 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none' 
                        : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                      }`}
                  >
                    {status === 'processing' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {progress ? `Processing Batch ${progress.current}/${progress.total}` : 'Processing...'}
                      </>
                    ) : (
                      <>
                        Start Verification
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  {status === 'processing' && progress && (
                    <div className="mt-3 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-xl text-center">
              {errorMessage}
            </div>
          )}

          {/* Action Bar for Results (Downloads) */}
          {result && result.entries.length > 0 && (
             <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                <div>
                   <h3 className="text-white font-medium">Export Results</h3>
                   <p className="text-xs text-slate-400">Download the verified list in your preferred format</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleDownloadHtml}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-600"
                  >
                    <FileJson className="w-4 h-4 text-orange-400" />
                    Download HTML
                  </button>
                  <button 
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-600"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-400" />
                    Download Excel
                  </button>
                </div>
             </div>
          )}

          {/* Results Area */}
          {result && result.entries.length > 0 && (
             <ResultsTable entries={result.entries} sources={result.groundingSources} />
          )}

        </div>
      </main>
    </div>
  );
};

export default App;