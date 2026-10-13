import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, X } from 'lucide-react';
import BeatleMascot from './BeatleMascot';
import { askBeatle, fetchBeatleCapabilities, fetchConversation, clearConversation } from '../../services/api';
import './beatle.css';
const labels={needs:'Open Design Studio',measurements:'Show measurements',saved:'Show saved designs',matching:'Find your artisan',orders:'Show orders',profile:'Edit my profile',artisan:'Open request desk'};
export default function BeatleAssistant({user,page,prompt='',commissionId,onAction,onDraft}) {
  const [open,setOpen]=useState(false),[input,setInput]=useState(''),[messages,setMessages]=useState([]),[pending,setPending]=useState(false),[error,setError]=useState(''),[configured,setConfigured]=useState(null),[language,setLanguage]=useState('en'),[share,setShare]=useState(false),[save,setSave]=useState(false),[look,setLook]=useState(0),[hover,setHover]=useState(false),[obstructed,setObstructed]=useState(false);
  const reduced=useReducedMotion(),launcher=useRef(null),composer=useRef(null),list=useRef(null),controller=useRef(null),panel=useRef(null);
  const artisan=user?.role==='artisan';
  useEffect(()=>{let cancelled=false;fetchBeatleCapabilities().then(v=>{if(!cancelled)setConfigured(v.configured)}).catch(()=>{if(!cancelled)setConfigured(false)});return()=>{cancelled=true;controller.current?.abort()};},[]);
  useEffect(()=>{
    // Yield the corner to existing modal controls and mobile fixed navigation.
    const update=()=>setObstructed(!!document.querySelector('[role="dialog"]:not(#beatle-panel),.dialog-backdrop') || !!document.querySelector('.bottom-nav'));
    update();const observer=new MutationObserver(update);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(open&&!obstructed){composer.current?.focus();list.current?.scrollTo({top:list.current.scrollHeight,behavior:'instant'});}},[open,obstructed]);
  useEffect(()=>{list.current?.scrollTo({top:list.current.scrollHeight,behavior:'instant'});},[messages,pending]);
  const close=()=>{setOpen(false);launcher.current?.focus()};
  const send=async(text=input)=>{
    if(!text.trim()||pending)return;
    if(!user?.id){setError('Sign in to use The Beatle’s AI guidance.');return;}
    setInput('');setError('');setPending(true);
    const history=messages.map(m=>({role:m.role,content:m.content})).slice(-18);
    setMessages(v=>[...v,{role:'user',content:text}]);
    const request=new AbortController();controller.current=request;
    try{
      const answer=await askBeatle({message:text,history,language,save,shareContext:share,page,...(share?{prompt,commissionId}: {})},{signal:request.signal});
      if(!request.signal.aborted)setMessages(v=>[...v,{role:'assistant',content:answer.reply,...answer}]);
    }catch(e){if(!request.signal.aborted){setError(e.message);setInput(text)}}
    finally{if(controller.current===request)setPending(false)};
  };
  const clear=async()=>{controller.current?.abort();setPending(false);try{if(user?.id)await clearConversation();setMessages([]);setInput('');setError('')}catch(e){setError(e.message)}};
  const restore=async()=>{try{const data=await fetchConversation();setMessages(data.messages.map(m=>({role:m.role,content:m.content})));setError('')}catch(e){setError(e.message)}};
  const keyboard=e=>{
    if(e.key==='Escape'){e.stopPropagation();close()}
    if(e.key==='Tab'&&panel.current){const items=[...panel.current.querySelectorAll('button:not(:disabled),textarea,select,input')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
  };
  return <div className={`beatle-root ${obstructed?'beatle-root--obstructed':''}`} hidden={obstructed}>
    <AnimatePresence>{open&&<motion.section ref={panel} id="beatle-panel" role="dialog" aria-label="The Beatle assistant" className="beatle-panel" onKeyDown={keyboard} initial={reduced?false:{opacity:0,y:8,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:reduced?0:5}} transition={{duration:reduced?0:.2}}>
      <header className="beatle-panel-header"><BeatleMascot state={pending?'thinking':error?'error':messages.at(-1)?.role==='assistant'?'responding':'idle'} size={36}/><div><h2>The Beatle</h2><p>{artisan?'Your craft companion':'Your design companion'} · ThreadLabs</p></div><button onClick={close} aria-label="Close The Beatle"><X size={17}/></button></header>
      <div ref={list} className="beatle-messages" role="log" aria-live="polite" aria-relevant="additions">
        <div className="beatle-message">{artisan?"Hey, I’m The Beatle. I can help you build your portfolio, understand designs and plan garment construction.":"Hey! I’m The Beatle, your ThreadLabs design companion. Need help creating something?"}</div>
        {!messages.length&&<div className="beatle-shortcuts">{(artisan?['Help me build my portfolio','Explain this design','Help me stitch this garment','Plan materials']:['Help me design','Explain ThreadLabs','Improve my prompt','Help with measurements']).map(text=><button key={text} disabled={pending||configured===false} onClick={()=>send(text)}>{text}</button>)}</div>}
        {messages.map((m,i)=><div key={i} className={`beatle-message beatle-message--${m.role}`}><small>{m.role==='user'?'You':'The Beatle'}</small>{m.content}{m.actions?.length>0&&<div className="beatle-shortcuts">{m.actions.map(action=><button key={action} onClick={()=>{onAction(action);close()}}>{labels[action]}</button>)}</div>}{(m.draftPrompt||m.draftBio)&&<div className="beatle-draft"><small>Draft for your review</small><p>{m.draftPrompt||m.draftBio}</p><button onClick={()=>{onDraft(m.draftPrompt?'prompt':'bio',m.draftPrompt||m.draftBio);close()}}>Use this draft in the editor</button></div>}</div>)}
        {pending&&<p role="status">The Beatle is thinking…</p>}{error&&<p role="alert" className="beatle-error">{error}</p>}
        {configured===false&&<p className="beatle-error">AI guidance is currently unavailable. You can still use the platform shortcuts below.</p>}
        <div className="beatle-shortcuts">{(artisan?['profile','artisan']:user?.role==='customer'?['needs','measurements','saved','orders']:['needs']).map(action=><button key={action} onClick={()=>{onAction(user?.id?action:'login');close()}}>{user?.id?labels[action]:'Sign in to ThreadLabs'}</button>)}</div>
      </div>
      <div className="beatle-settings"><select aria-label="Assistant language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="hi">हिन्दी</option><option value="te">తెలుగు</option></select><label><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)}/>Share {artisan?'profile & assigned brief':'current brief'}</label><label><input type="checkbox" checked={save} onChange={e=>setSave(e.target.checked)}/>Save chat</label>{user?.id&&<button disabled={pending} onClick={restore}>Load saved</button>}<button onClick={clear}>Delete chat</button></div>
      <form className="beatle-compose" onSubmit={e=>{e.preventDefault();send()}}><textarea ref={composer} aria-label="Message The Beatle" placeholder="A little help with your next idea…" maxLength={6000} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}}/><button type="submit" aria-label="Send message" disabled={pending||!input.trim()||configured===false}><ArrowUp size={17}/></button></form>
      <p className="beatle-disclosure">Messages{share?', shared brief and craft profile':''} go to ThreadLabs’ configured AI provider. Photos and body measurements are excluded. {save?'This chat is saved to your account.':'Chat stays in this session.'}</p>
    </motion.section>}</AnimatePresence>
    <button ref={launcher} className="beatle-launcher" aria-label={open?'Close The Beatle assistant':'Open The Beatle assistant'} aria-expanded={open} aria-controls="beatle-panel" onClick={()=>open?close():setOpen(true)} onPointerEnter={()=>setHover(true)} onPointerLeave={()=>{setHover(false);setLook(0)}} onPointerMove={e=>{const bounds=e.currentTarget.getBoundingClientRect();setLook(Math.max(-1,Math.min(1,(e.clientX-bounds.left-bounds.width/2)/(bounds.width/2))))}}><BeatleMascot size={40} state={pending?'thinking':hover?'hover':'idle'} look={look}/></button>
  </div>;
}
