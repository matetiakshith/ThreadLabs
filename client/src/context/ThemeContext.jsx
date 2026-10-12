import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(null);
export function ThemeProvider({children}) {
  const [theme,setTheme] = useState(()=>{try{return localStorage.getItem('threadlabsTheme')==='dark'?'dark':'light';}catch{return 'light';}});
  useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('threadlabsTheme',theme);}catch{}},[theme]);
  return <ThemeContext.Provider value={{theme,toggleTheme:()=>setTheme(value=>value==='light'?'dark':'light')}}>{children}</ThemeContext.Provider>;
}
export function useTheme(){return useContext(ThemeContext);}
