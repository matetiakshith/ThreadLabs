import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
const ThemeContext = createContext(null);
function storedPreference() {
  try { const value = localStorage.getItem('threadlabsTheme'); return value === 'light' || value === 'dark' ? value : null; }
  catch { return null; }
}
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(storedPreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = preference || (systemDark ? 'dark' : 'light');
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const change = event => setSystemDark(event.matches);
    const storage = event => { if (event.key === 'threadlabsTheme' || event.key === null) setPreference(storedPreference()); };
    media.addEventListener('change', change); window.addEventListener('storage', storage);
    return () => { media.removeEventListener('change', change); window.removeEventListener('storage', storage); };
  }, []);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('threadlabsTheme', next); } catch { /* The selection still works when storage is unavailable. */ }
    setPreference(next);
  };
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
// oxlint-disable-next-line react/only-export-components -- Keep the existing shared context/hook import API.
export function useTheme() { return useContext(ThemeContext); }
