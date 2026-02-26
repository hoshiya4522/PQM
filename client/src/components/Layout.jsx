import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, Monitor, Palette, Maximize2, Minimize2, Timer, Search, X, Clock } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTheme } from '../ThemeContext';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();
  const themeMenuRef = useRef(null);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => setTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus Search: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
      }
      // Focus Mode: F
      if (e.key === 'f' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        setIsFocusMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close theme menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 bg-bg-main text-text-main font-sans`}>
      {/* Sidebar */}
      {!isFocusMode && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${!isFocusMode ? 'md:ml-64' : 'ml-0'}`}>
        
        {/* Top Header / QOL Bar */}
        <header className="sticky top-0 z-40 bg-bg-surface/80 backdrop-blur-md border-b border-border-main px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isFocusMode && (
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-bg-main rounded-lg">
                <Menu size={20} />
              </button>
            )}
            {isFocusMode && (
              <button 
                onClick={() => setIsFocusMode(false)}
                className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold shadow-sm"
              >
                <Minimize2 size={14} /> Exit Focus
              </button>
            )}
            
            {/* Quick Stats/Timer */}
            <div className="hidden sm:flex items-center gap-3 bg-bg-main p-1.5 rounded-xl border border-border-main shadow-inner">
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${isTimerRunning ? 'bg-primary text-white shadow-lg shadow-primary/20 animate-pulse' : 'hover:bg-bg-surface text-text-muted'}`}
                title={isTimerRunning ? "Pause Timer" : "Start Timer"}
              >
                <Clock size={14} />
                <span className="text-xs font-black font-mono">{formatTime(time)}</span>
              </button>
              {time > 0 && (
                <button 
                    onClick={() => { setTime(0); setIsTimerRunning(false); }} 
                    className="p-1 text-text-muted hover:text-red-500 transition-colors mr-1"
                    title="Reset Timer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Focus Toggle */}
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-2 rounded-lg transition-colors ${isFocusMode ? 'bg-primary text-white' : 'hover:bg-bg-main text-text-muted'}`}
              title="Focus Mode (Press F)"
            >
              <Maximize2 size={20} />
            </button>

            {/* Theme Selector */}
            <div className="relative" ref={themeMenuRef}>
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-lg hover:bg-bg-main text-text-muted transition-colors flex items-center gap-2"
                title="Change Theme"
              >
                <Palette size={20} />
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-bg-surface border border-border-main rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-main mb-1">
                    Select Theme
                  </div>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTheme(t.id); setShowThemeMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-bg-main transition-colors ${theme === t.id ? 'text-primary font-bold bg-accent/50' : 'text-text-main'}`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`p-4 md:p-8 flex-1 overflow-y-auto ${isFocusMode ? 'max-w-4xl mx-auto w-full' : ''}`}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}