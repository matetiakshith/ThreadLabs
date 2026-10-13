import { useEffect, useState } from 'react';
import { fetchProfile, saveProfile, addPortfolio, editPortfolio, removePortfolio, mediaURL } from '../../services/api';
import { prepareReferenceFile } from '../Needs/referenceImage';
import './profile-editor.css';
import AnimatedContent from '../ReactBits/AnimatedContent';
export default function ArtisanProfileEditor({draftBio}) {
  const [loaded,setLoaded]=useState(false),[reload,setReload]=useState(0);
  const [profile,setProfile]=useState({}),[portfolio,setPortfolio]=useState([]),[piece,setPiece]=useState({title:'',description:'',category:''}),[image,setImage]=useState(null),[editing,setEditing]=useState(null),[pending,setPending]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
  useEffect(()=>{let cancelled=false;fetchProfile().then(v=>{if(!cancelled){setProfile(v.profile);setPortfolio(v.portfolio);setLoaded(true)}}).catch(e=>{if(!cancelled)setError(e.message)});return()=>{cancelled=true}},[reload]);
  useEffect(()=>{let cancelled=false;if(loaded&&draftBio?.text)queueMicrotask(()=>{if(!cancelled)setProfile(v=>({...v,bio:draftBio.text}))});return()=>{cancelled=true};},[draftBio,loaded]);
  const update=(key,value)=>setProfile(v=>({...v,[key]:value}));
  const act=async(fn,message)=>{setPending(true);setError('');setStatus('');try{await fn();setStatus(message)}catch(e){setError(e.message)}finally{setPending(false)}};
  const publish=()=>{if(!profile.published&&!window.confirm('Publish your studio name, city, state, biography and craft details in the artisan directory? Contact details and portfolio photographs stay private.'))return;act(async()=>{const saved=await saveProfile({...profile,published:!profile.published});setProfile(saved.profile)},profile.published?'Studio removed from public directory.':'Studio published. You can now receive commissions.');};
  const add=()=>act(async()=>{
    if(editing){await editPortfolio(editing,piece);setPortfolio(v=>v.map(p=>p.id===editing?{...p,...piece}:p))}
    else{if(!image)throw new Error('Choose a photograph for this piece.');const saved=await addPortfolio({...piece,imageDataUrl:image.dataUrl});setPortfolio(v=>[saved,...v]);}
    setPiece({title:'',description:'',category:''});setImage(null);setEditing(null);
  },editing?'Portfolio details saved.':'Portfolio piece saved.');
  if(!loaded)return <div role="status" className="artisan-profile-editor">{error?<><p>{error}</p><button className="text-button" onClick={()=>{setError('');setReload(v=>v+1)}}>Retry loading profile</button></>:<p>Loading your saved profile…</p>}</div>;
  return <div className="artisan-profile-editor">
    <form onSubmit={e=>{e.preventDefault();act(async()=>{const data=await saveProfile(profile);setProfile(data.profile)},'Profile saved to your account.')}}>
      <h2>Your craft profile</h2><p>Start with the basics. Add professional details when you’re ready.</p>
      <div className="profile-fields">{[['studioName','Artisan or studio name'],['fullName','Full name'],['contact','Contact details'],['city','City'],['state','State']].map(([key,label])=><label className="field-label" key={key}>{label}<input maxLength={160} value={profile[key]||''} onChange={e=>update(key,e.target.value)}/></label>)}<label className="field-label">Years of experience<input type="number" min="0" max="80" value={profile.experienceYears??''} onChange={e=>update('experienceYears',e.target.value===''?undefined:Number(e.target.value))}/></label></div>
      {[['specializations','Tailoring specializations'],['categories','Garment categories'],['materials','Fabrics & materials'],['capabilities','Customization capabilities']].map(([key,label])=><label className="field-label" key={key}>{label} · separate with commas<input maxLength={1800} value={(profile[key]||[]).join(',')} onChange={e=>update(key,e.target.value.split(',').slice(0,20))}/></label>)}
      <label className="field-label">Professional description<textarea maxLength={2000} rows={5} value={profile.bio||''} onChange={e=>update('bio',e.target.value)}/></label>
      <button disabled={pending} className="primary-button">{pending?'Saving…':'Save profile'}</button>
      <button type="button" className="text-button" disabled={pending} onClick={publish}>{profile.published?'Withdraw public studio profile':'Review & publish studio profile'}</button><p className="profile-note">Publishing lists your studio and craft details in the directory. Contact details and portfolio photographs stay private. Self-published studios are unverified.</p>
    </form>
    <section><h2>Your portfolio</h2><p>Upload photographs of your completed work. Images use persistent private storage.</p>
      <form onSubmit={e=>{e.preventDefault();add()}} className="portfolio-form">
        <label className="field-label">Project title<input required maxLength={160} value={piece.title} onChange={e=>setPiece(v=>({...v,title:e.target.value}))}/></label>
        <label className="field-label">Category<input maxLength={100} value={piece.category} onChange={e=>setPiece(v=>({...v,category:e.target.value}))}/></label>
        <label className="field-label">Description<textarea maxLength={2000} value={piece.description} onChange={e=>setPiece(v=>({...v,description:e.target.value}))}/></label>
        {!editing&&<label className="field-label">Completed garment photograph<input type="file" accept="image/png,image/jpeg,image/webp" disabled={pending} onChange={e=>{const file=e.target.files?.[0];if(file)act(async()=>setImage(await prepareReferenceFile(file)),'Photograph ready. Save the piece to upload it.')}}/></label>}
        {image&&<img className="portfolio-preview" src={image.dataUrl} alt="Photograph ready to upload"/>}<button disabled={pending} className="primary-button">{editing?'Save piece details':'Add portfolio piece'}</button>{editing&&<button type="button" className="text-button" onClick={()=>{setEditing(null);setPiece({title:'',description:'',category:''})}}>Cancel edit</button>}
      </form>
      <div className="portfolio-saved">{portfolio.map(item=><AnimatedContent as="article" key={item.id}><img src={mediaURL(item.mediaId)} alt={item.title}/><div><h3>{item.title}</h3><small>{item.category}</small><p>{item.description}</p><button disabled={pending} className="text-button" onClick={()=>{setEditing(item.id);setPiece({title:item.title,description:item.description,category:item.category});setImage(null)}}>Edit details</button><button disabled={pending} className="text-button" onClick={()=>act(async()=>{await removePortfolio(item.id);setPortfolio(v=>v.filter(p=>p.id!==item.id))},'Piece removed from your portfolio.')}>Remove piece</button></div></AnimatedContent>)}</div>
    </section>{error&&<p role="alert" className="generation-error">{error}</p>}{status&&<p role="status">{status}</p>}
  </div>;
}
