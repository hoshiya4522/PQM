import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-bg-surface p-10 rounded-[3rem] shadow-2xl border border-border-main max-w-2xl w-full text-center space-y-8">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle size={48} strokeWidth={1.5} />
            </div>
            
            <div className="space-y-3">
                <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase">System Malfunction</h1>
                <p className="text-text-muted font-medium leading-relaxed">
                    A critical error occurred while processing the archives. The interface has encountered an unexpected state.
                </p>
            </div>

            <div className="bg-bg-main p-4 rounded-2xl border border-border-main text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-red-500/70 whitespace-pre-wrap">
                    {this.state.error?.toString()}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                    onClick={() => window.location.reload()}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
                >
                    <RefreshCw size={18} />
                    Reboot Interface
                </button>
                <a 
                    href="/"
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-bg-main text-text-main rounded-2xl font-black uppercase tracking-widest text-xs border border-border-main hover:bg-bg-surface active:scale-95 transition-all"
                >
                    <Home size={18} />
                    Safe Mode (Dashboard)
                </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
