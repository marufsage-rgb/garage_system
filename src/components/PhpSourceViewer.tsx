import React, { useState } from 'react';
import { PHP_ERP_FILES, SourceFile } from '../phpFilesData';
import { FileCode, Download, Copy, Check, Terminal, FolderArchive } from 'lucide-react';
import JSZip from 'jszip';

export const PhpSourceViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SourceFile>(PHP_ERP_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      PHP_ERP_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'apex-erp-php-mysql-html-css.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <FolderArchive className="w-4 h-4" />
            <span>Pure Technology Stack: HTML5 • CSS3 • PHP 8 • MySQL</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Complete PHP & MySQL ERP Source Package
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Zero external frontend framework dependencies. 100% pure procedural & object-oriented PHP with PDO, prepared SQL statements, transactional integrity, and print-ready CSS stylesheets. Ready to run on XAMPP, WAMP, Docker, or any LAMP stack.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Bundling Archive...' : 'Download Project ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* File Navigator List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden lg:col-span-1">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>Project Files ({PHP_ERP_FILES.length})</span>
            </span>
            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">/apex-erp</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {PHP_ERP_FILES.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-l-4 border-indigo-600 text-indigo-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700 border-l-4 border-transparent'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-mono text-[12px] truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{file.description}</div>
                  </div>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                      file.language === 'php'
                        ? 'bg-purple-100 text-purple-700'
                        : file.language === 'sql'
                        ? 'bg-emerald-100 text-emerald-700'
                        : file.language === 'css'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Content Preview */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden lg:col-span-3 flex flex-col">
          {/* Editor Header */}
          <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-mono font-bold text-white ml-2">{selectedFile.name}</span>
              <span className="text-[11px] text-slate-500">({selectedFile.description})</span>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Syntax Code Box */}
          <div className="p-4 overflow-x-auto max-h-[600px] font-mono text-xs text-slate-200 leading-relaxed select-text">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Encoding: UTF-8 • Line Endings: LF</span>
            <span>Language: {selectedFile.language.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
