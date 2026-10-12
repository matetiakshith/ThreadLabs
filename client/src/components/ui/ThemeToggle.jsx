import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
export default function ThemeToggle(){const {theme,toggleTheme}=useTheme();return <button className="theme-toggle" onClick={toggleTheme} aria-label={theme==='light'?'Switch to dark mode':'Switch to light mode'} title={theme==='light'?'Dark atelier':'Light atelier'}>{theme==='light'?<Moon size={17}/>:<Sun size={17}/>}</button>;}
