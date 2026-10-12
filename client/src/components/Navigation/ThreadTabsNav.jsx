import { motion } from 'framer-motion';
import { Volume2, VolumeX, LogOut } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import Wordmark from '../ui/Wordmark';

export default function ThreadTabsNav({ activeTab, onSelectTab, isMuted, onToggleSound, onSignOut }) {
  const tabs = [
    { id: 'mall', label: 'Explore', short: 'Explore' }, { id: 'needs', label: 'Design studio', short: 'Studio' },
    { id: 'matching', label: 'Find your artisan', short: 'Artisans' }, { id: 'orders', label: 'Your commission', short: 'Order' },
  ];
  return <header className="workspace-header">
    <button className="brand-button" onClick={() => onSelectTab('mall')} aria-label="ThreadLabs home"><Wordmark/></button>
    <nav className="workspace-nav" aria-label="Your design journey">
      {tabs.map((tab,index)=><button key={tab.id} aria-label={tab.label} onClick={()=>onSelectTab(tab.id)} aria-current={activeTab === tab.id ? 'step' : undefined}>
        <span className="nav-number">0{index+1}</span><span className="nav-label-full">{tab.label}</span><span className="nav-label-short">{tab.short}</span>
        {activeTab===tab.id && <motion.span className="nav-indicator" layoutId="activeAppTabPill" transition={{type:'spring',damping:30,stiffness:280}}/>}
      </button>)}
    </nav>
    <div className="workspace-preferences"><ThemeToggle/>{onSignOut && <button onClick={onSignOut} className="sound-button" aria-label="Sign out"><LogOut size={17}/></button>}<button onClick={onToggleSound} className="sound-button workspace-sound" aria-label={isMuted?'Enable sound':'Mute sound'} aria-pressed={!isMuted}>{isMuted?<VolumeX size={17}/>:<Volume2 size={17}/>}</button></div>
  </header>;
}
