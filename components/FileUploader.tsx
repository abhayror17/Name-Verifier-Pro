import React, { useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { parseFile } from '../utils/excelParser';

interface FileUploaderProps {
  onFileLoaded: (names: string[]) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const names = await parseFile(file);
      if (names.length === 0) {
        setError("No names found in the file.");
        return;
      }
      onFileLoaded(names);
    } catch (err) {
      console.error(err);
      setError("Failed to read file. Please ensure it is a valid Excel or CSV file.");
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 
          ${isLoading 
            ? 'bg-slate-800/50 border-slate-700 cursor-not-allowed' 
            : 'bg-slate-800 border-indigo-500/30 hover:border-indigo-500 hover:bg-slate-700/50'
          }`}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-indigo-500/10 rounded-full">
            <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Upload your list</h3>
            <p className="text-sm text-slate-400">
              Supports .xlsx, .xls, .csv files containing names
            </p>
          </div>

          <label className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button 
              type="button"
              className={`px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20
                hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4" />
              Select File
            </button>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 text-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};