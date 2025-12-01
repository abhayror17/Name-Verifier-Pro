import React from 'react';
import { ProcessedNameEntry, GroundingSource } from '../types';
import { CheckCircle2, XCircle, Search, ExternalLink, AlertTriangle } from 'lucide-react';

interface ResultsTableProps {
  entries: ProcessedNameEntry[];
  sources: GroundingSource[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ entries, sources }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      
      {/* Main Results */}
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/50 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Verification Results</h2>
            <p className="text-sm text-slate-400">
              Found {entries.length} unique entities from input list
            </p>
          </div>
          <div className="flex gap-3 text-sm text-slate-400">
             <span className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></span> Verified
             </span>
             <span className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/20"></span> Unsure
             </span>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-xs uppercase tracking-wider text-slate-400 font-medium border-b border-slate-700">
                <th className="px-6 py-4 w-1/4">Correct Entity</th>
                <th className="px-6 py-4 w-1/4">Description</th>
                <th className="px-6 py-4 w-1/2">Variations Found in File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start gap-3">
                      {entry.isVerified ? (
                        <div className="mt-0.5 p-1 bg-green-500/10 text-green-400 rounded-full shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="mt-0.5 p-1 bg-amber-500/10 text-amber-400 rounded-full shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className={`font-semibold text-base ${entry.isVerified ? 'text-green-400' : 'text-amber-400'}`}>
                          {entry.correctName}
                        </div>
                        {entry.isVerified && (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[10px] font-medium bg-green-950/30 text-green-400 border border-green-900/50">
                             Verified by Search
                           </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-300">
                    {entry.description || <span className="text-slate-500 italic">No description available</span>}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {entry.originalVariations.length > 0 ? (
                        entry.originalVariations.map((variation, idx) => (
                          <span 
                            key={idx}
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                              variation === entry.correctName
                                ? 'bg-slate-700/50 text-slate-400 border-slate-600 opacity-70'
                                : 'bg-red-950/20 text-red-400 border-red-900/30'
                            }`}
                          >
                            {variation !== entry.correctName && <XCircle className="w-3 h-3 mr-1.5 opacity-60" />}
                            {variation}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-xs italic">No duplicates found</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grounding Sources */}
      {sources.length > 0 && (
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
              Verified Sources (Google Search)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-slate-700/50 transition-all group bg-slate-900/50"
              >
                <div className="p-1.5 bg-slate-800 rounded-md text-slate-500 group-hover:text-blue-400 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-400">
                    {source.title}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5 group-hover:text-slate-400">
                    {source.uri}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};