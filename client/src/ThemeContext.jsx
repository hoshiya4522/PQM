import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pqm-theme') || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('pqm-theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    themes: [
      { id: 'default', name: 'Default', icon: '🎨' },
      { id: 'light', name: 'Light', icon: '☀️' },
      { id: 'dark', name: 'Dark', icon: '🌙' },
      { id: 'amoled', name: 'AMOLED', icon: '🕶️' },
      { id: 'paper', name: 'Paper', icon: '📄' },
    ]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
