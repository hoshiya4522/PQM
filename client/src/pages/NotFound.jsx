import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="relative mb-8">
        <div className="text-[12rem] font-black text-primary/5 select-none leading-none">404</div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-bg-surface p-6 rounded-[2.5rem] shadow-2xl border border-border-main rotate-3 hover:rotate-0 transition-transform duration-500">
                <HelpCircle size={80} className="text-primary" strokeWidth={1.5} />
            </div>
        </div>
      </div>

      <div className="text-center space-y-4 max-w-md px-6">
        <h1 className="text-4xl font-black text-text-main tracking-tighter uppercase">Path Lost in Archives</h1>
        <p className="text-text-muted font-medium leading-relaxed">
          The coordinates you've entered do not match any known records in the QuestionBank. It may have been relocated or purged.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-12">
        <Link 
            to="/" 
            className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
        >
            <Home size={18} />
            Return to Dashboard
        </Link>
        <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-3 px-8 py-4 bg-bg-surface text-text-main rounded-2xl font-black uppercase tracking-widest text-xs border border-border-main hover:bg-bg-main active:scale-95 transition-all"
        >
            <ArrowLeft size={18} />
            Previous Record
        </button>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-2xl px-6 opacity-40">
        <div className="flex flex-col items-center text-center gap-2">
            <div className="w-1 h-8 bg-border-main rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Integrity Check</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
            <div className="w-1 h-8 bg-border-main rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Archive Sync</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
            <div className="w-1 h-8 bg-border-main rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Node Status</span>
        </div>
      </div>
    </div>
  );
}
