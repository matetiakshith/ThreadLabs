import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Scissors, ShoppingBag, ArrowUpRight } from 'lucide-react';
import artisanProfiles from '../data/artisans.json';
import { demoArtisans } from '../data/demoArtisans';
import ThemeToggle from './ui/ThemeToggle';
import Wordmark from './ui/Wordmark';
import { signIn, registerCustomer } from '../services/api';

export default function LoginPage({ onLogin, onBack }) {
  const [role, setRole] = useState(null);
  const [method, setMethod] = useState('email');
  const [identity, setIdentity] = useState('');
  const [artisanId, setArtisanId] = useState(artisanProfiles[0]?.id || 'art-001');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!identity.trim() || password.length < 4) {
      setError('Enter your email or username and a password of at least 4 characters.');
      return;
    }
    if (import.meta.env.DEV) return onLogin(role, identity.trim(), role === 'artisan' ? artisanId : null);
    setError(''); setPending(true);
    try {
      const { user } = await (creatingAccount && role === 'customer' ? registerCustomer : signIn)({ role, identity: identity.trim(), password });
      onLogin(user.role, user.identity, user.artisanId, user);
    } catch (error) { setError(error.message); }
    finally { setPending(false); }
  };

  return <section className="login-page">
    <aside className="login-art">
      <button className="brand-button" onClick={onBack} aria-label="ThreadLabs home"><Wordmark/></button>
      <div className="login-art-copy"><span className="eyebrow">Tradition. Craft. Tomorrow.</span><h2>Made for <br/>the hands <br/>that <em>make it.</em></h2><p>A shared space for a new generation of ideas<br/>and generations of extraordinary craft.</p></div>
      <span className="eyebrow login-art-footer">The ThreadLabs atelier — Est. 2026</span>
    </aside>
    <div className="login-panel">
      <div className="login-preferences"><button onClick={role ? ()=>setRole(null) : onBack} className="text-button login-back"><ArrowLeft size={16}/>{role ? 'Change workspace' : 'Back to the atelier'}</button><ThemeToggle/></div>
      <div className="login-form-wrap">
        <span className="eyebrow">{role ? `${role} workspace` : 'A place for your imagination'}</span>
        <h1>{role ? <>Welcome <em>back.</em></> : <>Make it <em>yours.</em></>}</h1>
        <p className="muted">{role ? `Sign in to your ${role} workspace.` : 'Choose your side of the creative process.'}</p>
        {!role ? <div className="workspace-choices">
          {[{id:'customer',title:'I have a vision',label:'Customer',desc:'Create a custom outfit. Find your artisan. Follow every stitch.',Icon:ShoppingBag},{id:'artisan',title:'I bring it to life',label:'Artisan',desc:'Meet your next commission and share the work of your hands.',Icon:Scissors}].map(({id,title,label,desc,Icon})=><button key={id} onClick={()=>setRole(id)} className="workspace-choice"><span className="workspace-choice-top"><span className="eyebrow">{label}</span><Icon size={19} strokeWidth={1.4}/></span><strong>{title}</strong><span className="workspace-choice-description">{desc}</span><ArrowUpRight className="workspace-choice-arrow" size={21}/></button>)}
        </div> : <form onSubmit={submit} className="login-form">
          <div><span className="field-label">Sign in with</span><div className="segmented-control">{['email','username'].map(value=><button key={value} type="button" aria-pressed={method===value} onClick={()=>setMethod(value)}>{value==='email'?'Email':'Username'}</button>)}</div></div>
          <label className="field-label">{method==='email'?'Email address':'Username'}<input required type={method==='email'?'email':'text'} autoComplete="username" value={identity} onChange={e=>setIdentity(e.target.value)} placeholder={method==='email'?'you@example.com':'Your username'}/></label>
          <label className="field-label">Password<span className="password-field"><input required minLength={creatingAccount && !import.meta.env.DEV ? 12 : 4} type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
          {import.meta.env.DEV && role==='artisan'&&<label className="field-label">Artisan profile for this demo<select value={artisanId} onChange={e=>setArtisanId(e.target.value)}>{[...artisanProfiles,...demoArtisans].map(artisan=><option key={artisan.id} value={artisan.id}>{artisan.name}</option>)}</select></label>}
          {error&&<p role="alert" className="form-error">{error}</p>}
          <button disabled={pending} className="primary-button">{pending ? 'Connecting…' : creatingAccount && role==='customer' ? 'Create customer account' : `Sign in as ${role}`}<ArrowUpRight size={17}/></button>
          {!import.meta.env.DEV && role==='customer' && <button type="button" className="text-button" onClick={()=>{setCreatingAccount(!creatingAccount);setError('')}}>{creatingAccount ? 'Already have an account? Sign in' : 'Create a customer account'}</button>}
          <p className="form-note">{import.meta.env.DEV ? 'Prototype sign-in: credentials are used only to enter the selected demo workspace.' : role==='artisan' ? 'Use the artisan account assigned to your workshop by the ThreadLabs operator.' : creatingAccount ? 'Choose a password of at least 12 characters.' : 'Your account and commissions are stored securely on the server.'}</p>
        </form>}
      </div>
      <div className="login-panel-footer"><span>From imagination to heirloom.</span><span>©2026</span></div>
    </div>
  </section>;
}
