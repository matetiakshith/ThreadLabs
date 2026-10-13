import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Image as ImageIcon, PenTool, Scissors, ArrowUpRight } from 'lucide-react';
import BodyMeasurementsPanel from '../Measurements/BodyMeasurementsPanel';
import MeasurementSummary from '../Measurements/MeasurementSummary';
import { serializeMeasurements, validateMeasurements, garmentLengthRequirement } from '../Measurements/measurements';
import VoiceRecorder from '../Studio/VoiceRecorder';
import SketchPad from '../Studio/SketchPad';
import ScrollScene, { ScrollType } from '../Motion/ScrollScene.jsx';
import useReducedMotion from '../Measurements/useReducedMotion.js';
import { fetchImageCapabilities, createDesign, generateDesignView, fetchDesign, fetchDesigns, mediaURL } from '../../services/api';
import { buildGarmentBrief } from './garmentBrief.js';
import { prepareReferenceFile } from './referenceImage.js';
import { playClickSound, playLoomSwoosh, playSuccessChime } from '../../utils/audioEffects';
import './garment-generation.css';
import FashionCollection from './FashionCollection';
const InteractiveCloth3D = lazy(() => import('../Three/InteractiveCloth3D.jsx'));

export default function CustomerNeeds({ onProceedToArtisanMatching, initialPrompt = '', measurementDraft, onMeasurementChange, draftStorageWarning, onPromptChange, assistantPrompt, assistantAction }) {
  const reduced = useReducedMotion();
  const [inputMode, setInputMode] = useState('text');
  const [promptText, setPromptText] = useState(initialPrompt || '');
  const [reference, setReference] = useState(null);
  const [referenceError, setReferenceError] = useState('');
  const [isReadingReference, setIsReadingReference] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [structuredRequest, setStructuredRequest] = useState(null);
  const [collection, setCollection] = useState(null);
  const [imageCount,setImageCount] = useState(5);
  const [savedDesigns,setSavedDesigns] = useState(null);
  const [savedError,setSavedError] = useState('');
  const generated = collection?.views[0]?.mediaId ? {mediaId:collection.views[0].mediaId} : null;
  const [generationError, setGenerationError] = useState('');
  const [capabilities, setCapabilities] = useState(null);
  const [seed, setSeed] = useState('');
  const [asideView, setAsideView] = useState('fabric');
  const [refineFromImage, setRefineFromImage] = useState(false);
  const request = useRef(null);
  const referenceRead = useRef(0);
  const activeConditioning = useRef(null);
  const hasMeasurementErrors = Object.keys(validateMeasurements(measurementDraft)).length > 0;
  const presetExamples = [
    'I need a black oversized T-shirt with blue jeans for a casual outfit.',
    'I want a traditional royal wedding sherwani with gold zari embroidery.',
    'I need a formal tailored silk shirt and pleated trousers.',
    'I want a custom embroidered jacket with anime streetwear aesthetics.'
  ];
  useEffect(() => {
    const controller = new AbortController();
    fetchImageCapabilities({ signal: controller.signal }).then(setCapabilities).catch(error => { if (!controller.signal.aborted) setCapabilities({ configured: false, reason: error.message }); });
    // This ref holds the current request controller, not a DOM node. The latest
    // request must be cancelled when the studio unmounts.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return () => { controller.abort(); request.current?.abort(); referenceRead.current++; };
  }, []);

  const loadReference = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    const read = ++referenceRead.current;
    setIsReadingReference(true); setReferenceError('');
    try { const image = await prepareReferenceFile(file); if (read === referenceRead.current) { setReference(image); setRefineFromImage(false); } }
    catch (error) { if (read === referenceRead.current) setReferenceError(error.message); }
    finally { if (read === referenceRead.current) setIsReadingReference(false); }
  };
  useEffect(()=>{onPromptChange?.(promptText)},[promptText,onPromptChange]);
  useEffect(()=>{if(assistantPrompt?.text!==undefined){setPromptText(assistantPrompt.text);setStructuredRequest(null);}},[assistantPrompt]);
  useEffect(()=>{
    if(!assistantAction)return;
    if(assistantAction.type==='saved')fetchDesigns().then(setSavedDesigns).catch(e=>setSavedError(e.message));
    if(assistantAction.type==='measurements'){setStructuredRequest(null);setTimeout(()=>document.querySelector('.body-measurements')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'}),50);}
  },[assistantAction,reduced]);
  const updateView = view => setCollection(current=>current?{...current,views:current.views.map(v=>v.id===view.id?view:v)}:current);
  const generate = async (brief, image = activeConditioning.current, viewId = null) => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setIsProcessing(true); setGenerationError('');
    let design=collection;
    try {
      if(!viewId){design=await createDesign({prompt:brief.userPrompt,specification:{title:brief.title,garments:brief.garments,style:brief.style,fit:brief.fit,occasion:brief.occasion},count:imageCount,...(image?{imageDataUrl:image}:{}),...(seed!==''?{seed:Number(seed)}:{})},{signal:controller.signal});if(controller.signal.aborted)return;setCollection(design);}
      const remaining=viewId?design.views.filter(v=>v.id===viewId):design.views;
      for(const view of remaining){
        if(controller.signal.aborted)break;
        updateView({...view,status:'processing'});
        try{const result=await generateDesignView(design.id,view.id,{signal:controller.signal});if(!controller.signal.aborted){updateView(result);playSuccessChime();}}
        catch(error){if(controller.signal.aborted)break;updateView({...view,status:view.mediaId?'ready':'failed',error:error.message});if(view.id==='hero')throw error;}
      }
    } catch (error) { if (!controller.signal.aborted) setGenerationError(error.message); }
    finally { if (request.current === controller) { request.current = null; setIsProcessing(false); if(design?.id)fetchDesign(design.id).then(setCollection).catch(()=>{}); } }
  };
  const syncId=collection?.id;
  const needsSync=collection?.views.some(v=>v.status==='processing') && !isProcessing;
  useEffect(()=>{if(!syncId||!needsSync)return;const controller=new AbortController();const timer=setInterval(()=>fetchDesign(syncId,{signal:controller.signal}).then(setCollection).catch(()=>{}),1500);return()=>{controller.abort();clearInterval(timer)};},[syncId,needsSync]);
  const openSaved=async id=>{
    request.current?.abort();setIsProcessing(false);setSavedError('');
    try{const design=await fetchDesign(id);const measurements=serializeMeasurements(measurementDraft);setCollection(design);setPromptText(design.prompt);setStructuredRequest(buildGarmentBrief(design.prompt,measurements,garmentLengthRequirement(measurements),'text'));setSavedDesigns(null);setGenerationError('');}catch(e){setSavedError(e.message)}
  };
  const createBrief = async () => {
    if (!promptText.trim() || promptText.length > 6000 || hasMeasurementErrors || isReadingReference || referenceError) return;
    const measurements = serializeMeasurements(measurementDraft);
    const brief = buildGarmentBrief(promptText.trim(), measurements, garmentLengthRequirement(measurements), inputMode);
    let conditioning = reference?.dataUrl;
    if(refineFromImage && generated?.mediaId){
      try{const response=await fetch(mediaURL(generated.mediaId));if(!response.ok)throw new Error('Saved reference unavailable');const blob=await response.blob();conditioning=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
      catch{setReferenceError('The last generated image could not be used as a reference.');return;}
    }
    activeConditioning.current = conditioning;
    setRefineFromImage(false);
    setStructuredRequest(brief); setCollection(null); playLoomSwoosh();
    generate(brief, conditioning);
  };
  const cancel = () => { request.current?.abort(); setIsProcessing(false); setGenerationError('Generation cancelled. Your design brief is still available.'); };
  const refine = () => { request.current?.abort(); setIsProcessing(false); setStructuredRequest(null); setGenerationError(''); };
  const removeReference = () => { referenceRead.current++; setReference(null); setReferenceError(''); setIsReadingReference(false); setRefineFromImage(false); };

  return <section className="product-page studio-page">
    <div className="page-container">
      <header className="page-heading"><div><span className="eyebrow">02 / The design studio</span><h1><ScrollType>A thread of <em>an idea.</em></ScrollType></h1></div><p>Tell us what you want to wear.<br/>We'll find the hands to bring it to life.</p></header>
      <button className="text-button" onClick={()=>fetchDesigns().then(setSavedDesigns).catch(e=>setSavedError(e.message))}>Open saved designs</button>
      {savedError&&<p role="alert" className="generation-error">{savedError}</p>}
      {savedDesigns&&<section className="saved-designs" aria-label="Saved designs"><h3>Your saved designs</h3><button className="text-button" onClick={()=>setSavedDesigns(null)}>Close saved designs</button>{savedDesigns.length?savedDesigns.map(d=><button key={d.id} onClick={()=>openSaved(d.id)}>{d.prompt.slice(0,140)}</button>):<p>No saved designs yet.</p>}</section>}
      {!structuredRequest && <div className="studio-layout">
        <motion.section className="studio-workspace" initial={{ opacity: reduced ? 1 : .3, x: reduced ? 0 : -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: reduced ? 0 : .7 }} aria-label="Design brief" data-motion-scene="studio-workspace">
          <div className="studio-tools" aria-label="Input method">
            {[{id:'text',label:'Write a brief',icon:PenTool},{id:'voice',label:'Use your voice',icon:Mic},{id:'image',label:'Add a reference',icon:ImageIcon},{id:'sketch',label:'Sketch it out',icon:Scissors}].map(({id,label,icon:Icon})=><motion.button key={id} whileHover={reduced ? undefined : { y:-3 }} whileTap={reduced ? undefined : { scale:.96 }} aria-pressed={inputMode===id} onClick={()=>{setInputMode(id);playClickSound();}}><Icon size={16} strokeWidth={1.5}/><span>{label}</span></motion.button>)}
          </div>
          {inputMode==='voice' && <VoiceRecorder onTranscriptReady={text=>setPromptText(text)}/>}
          {inputMode==='image' && <div className="upload-area"><ImageIcon size={28} strokeWidth={1}/><div><strong>Begin with something that inspires you.</strong><p>A garment, a textile, a detail. PNG, JPG or WebP, up to 4 MB.</p></div><input aria-label="Upload a garment reference" type="file" accept="image/png,image/jpeg,image/webp" onChange={loadReference}/>{isReadingReference && <p role="status">Preparing your reference…</p>}</div>}
          {inputMode==='sketch' && <SketchPad initialSketch={reference?.kind === 'sketch' ? reference : null} onSketchChange={data=>{ setReference({ ...data, kind:'sketch' }); setReferenceError(''); setRefineFromImage(false); }}/>}
          {reference && <div className="reference-review"><img src={reference.dataUrl} alt={reference.description}/><div><p>{reference.kind === 'sketch' ? 'Your sketch is attached.' : 'Your reference is attached.'} It will be sent as an image when you generate.{reference.resized && ' Resized to 2,048 px; photo metadata removed.'}</p><button className="text-button" onClick={removeReference}>Remove reference</button></div></div>}
          {reference && capabilities && !capabilities.supportsReference && <p className="generation-error">This image service cannot condition images on your reference. Your image stays attached. Remove it explicitly to generate from text, or configure a compatible editing service.</p>}
          {referenceError && <p role="alert" className="generation-error">{referenceError} <button className="text-button" onClick={removeReference}>Clear upload error</button></p>}
          <div className="studio-input-label"><label htmlFor="design-prompt">What do you have in mind?</label><span>YOUR CREATIVE BRIEF</span></div>
          <textarea id="design-prompt" value={promptText} onChange={event=>setPromptText(event.target.value)} className="prompt-area" placeholder={'A silhouette, a feeling, a fabric…\nPerhaps an ivory silk kurta with a little gold at the collar.'} rows={5} maxLength={6000}/>
          {inputMode==='text' && <div className="studio-presets"><p>A little inspiration to get you started</p><div className="studio-preset-list">{presetExamples.map((example,index)=><button key={example} title={example} onClick={()=>{setPromptText(example);playClickSound();}}>{['Everyday essentials','Wedding heirloom','Modern tailoring','Anime streetwear'][index]}<ArrowUpRight size={12}/></button>)}</div></div>}
          {capabilities?.supportsSeed && <label className="generation-seed">Seed (optional)<input type="number" min="0" max="2147483647" step="1" value={seed} onChange={event=>setSeed(event.target.value)}/></label>}
          {generated && capabilities?.supportsReference && <label className="refine-image-choice"><input type="checkbox" checked={refineFromImage} onChange={event=>setRefineFromImage(event.target.checked)}/>Use the last generated image as the reference for this refinement</label>}
          {capabilities && !capabilities.configured && <p className="generation-service-note">Image generation is currently unavailable. You can still create your brief and find an artisan.</p>}
          <label className="collection-count">Images in this collection<select value={imageCount} onChange={e=>setImageCount(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}{n===5?' · Recommended':''}</option>)}</select><span>Fewer images use fewer inference credits.</span></label>
          <BodyMeasurementsPanel draft={measurementDraft} onChange={onMeasurementChange} garment={promptText} draftStorageWarning={draftStorageWarning}/>
          <div className="studio-action"><p>Your prompt and attached reference are sent to the configured image service. Body measurements stay in your tailoring brief.</p><motion.button className="primary-button" whileHover={reduced ? undefined : { y:-3 }} whileTap={reduced ? undefined : { scale:.98 }} disabled={!promptText.trim() || hasMeasurementErrors || isReadingReference || !!referenceError} onClick={createBrief}>Create my design brief <ArrowUpRight size={17}/></motion.button></div>
        </motion.section>
        <ScrollScene as="aside" name="studio-material-study" className="studio-aside">
          <div className="studio-preview-switch" aria-label="Studio preview"><button aria-pressed={asideView==='fabric'} onClick={()=>setAsideView('fabric')}>Fabric in 3D</button><button aria-pressed={asideView==='editorial'} onClick={()=>setAsideView('editorial')}>Editorial study</button></div>
          {asideView==='fabric' ? <Suspense fallback={<div className="studio-aside-image" role="status">Opening the fabric study…</div>}><InteractiveCloth3D/></Suspense> : <div className="studio-aside-image"><img src="/images/atelier-campaign.jpg" alt="AI-created editorial study of sculptural ivory couture"/><span>AN EDITORIAL STUDY / IVORY & BRONZE</span></div>}
          <h3>Imagination, meet<br/><em>craftsmanship.</em></h3><p>From the first thought to the final stitch, every piece begins with you. A personal brief, interpreted with care and made by skilled hands.</p><ol><li><span>01</span> Describe your vision</li><li><span>02</span> Shape your design brief</li><li><span>03</span> Find your artisan</li></ol>
        </ScrollScene>
      </div>}
      {structuredRequest && <motion.section className="design-sheet" initial={{ opacity: reduced ? 1 : .3, y: reduced ? 0 : 32 }} animate={{ opacity:1, y:0 }} transition={{ duration: reduced ? 0 : .7 }} aria-label="Your design specification">
        <header className="design-sheet-heading"><div><span className="eyebrow">ThreadLabs / Design specification / 01</span><h3>{structuredRequest.title}</h3></div><button className="text-button" onClick={refine}>Refine the brief <PenTool size={14}/></button></header>
        <FashionCollection collection={collection} pending={isProcessing} error={generationError} onRetry={viewId=>generate(structuredRequest,null,viewId)} onCancel={cancel}/>
        {!isProcessing && !collection && <button className="text-button" onClick={()=>generate(structuredRequest)}>Try collection generation again</button>}
        <div className="design-sheet-grid">
          <aside className="design-brief"><span className="eyebrow">The original idea</span><blockquote>“{structuredRequest.userPrompt}”</blockquote><span className="eyebrow">Colors mentioned in your brief</span>{structuredRequest.colorPalette.length ? <div className="design-swatches">{structuredRequest.colorPalette.map((color,index)=><div key={color} className="design-swatch" style={{backgroundColor:color}} title={structuredRequest.colourTerms[index]}/>)}</div> : <p className="muted">Not specified</p>}<span className="eyebrow">Garment length</span><p className="muted">{structuredRequest.lengthRequirement || 'Discuss with artisan'}</p>{reference && <img src={reference.dataUrl} alt={reference.description}/>}</aside>
          <div><div>{structuredRequest.garments.map((garment,index)=><article key={index} className="garment-spec"><span className="eyebrow">Garment / 0{index+1}</span><h4>{garment.name}</h4><dl><div className="spec-pair"><dt>Fabric</dt><dd>{garment.fabric}</dd></div><div className="spec-pair"><dt>Color</dt><dd>{garment.color}</dd></div></dl></article>)}</div><div className="design-parameters">{[['Direction',structuredRequest.style],['Fit & silhouette',structuredRequest.fit],['Occasion',structuredRequest.occasion],['Estimated range',structuredRequest.estimatedCost],['Lead time',structuredRequest.estimatedDays]].map(([label,value])=><div key={label}><span className="eyebrow">{label}</span><p>{value}</p></div>)}</div><p className="brief-integrity-note">These local labels only index words in your brief. The complete original request, including every detail and placement, is sent to the image service and your artisan.</p></div>
        </div>
        <MeasurementSummary measurements={structuredRequest.measurements} open/>
        <footer className="design-sheet-footer"><p>Your vision, ready for a skilled pair of hands.<br/><small>Confirm materials, price and lead time with your artisan. Image generation is optional.</small></p><button className="primary-button" onClick={()=>{playLoomSwoosh();onProceedToArtisanMatching({...structuredRequest,...(collection?.id?{designId:collection.id}:{})});}}>Find your artisan <ArrowUpRight size={17}/></button></footer>
      </motion.section>}
      <footer className="product-footer"><span>THREADLABS — YOUR PERSONAL ATELIER</span><span>From imagination to heirloom.</span></footer>
    </div>
  </section>;
}
