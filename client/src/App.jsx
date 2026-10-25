import React, { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { MotionConfig } from 'framer-motion';
import ThreadTabsNav from './components/Navigation/ThreadTabsNav';
import ThreadLabsLanding from './components/ThreadLabsLanding';
import CustomerNeeds from './components/Needs/CustomerNeeds';
import ArtisanMatchingMap from './components/Artisans/ArtisanMatchingMap';
import CustomerOrderTracker from './components/Orders/CustomerOrderTracker';
import CustomFashionCursor from './components/Unseen/CustomFashionCursor';
import RequestInbox from './components/ArtisanPortal/RequestInbox';
import LoginPage from './components/LoginPage';
import BeatleAssistant from './components/Beatle/BeatleAssistant';
import AtelierMotion from './components/Motion/AtelierMotion.jsx';
import { createMeasurementDraft, loadMeasurementDraft, measurementDraftKey, serializeMeasurements, validateMeasurements, garmentLengthRequirement } from './components/Measurements/measurements';
import { demoRequests } from './data/demoRequests';
import { playClickSound, playLoomSwoosh, setSoundMuted } from './utils/audioEffects';
import { fetchSession, fetchCommissions, submitCommission, changeCommissionStage, signOut } from './services/api';

/**
 * ThreadLabs — Final Web Application Master Coordinator
 * Built precisely on the 4-experience product vision:
 * 1. EXPLORE (3D Shopping Mall / Outfit Experience)
 * 2. CUSTOMER NEEDS ("WHAT DO YOU NEED?" AI Requirements Capture)
 * 3. FIND YOUR ARTISAN (Rapido / Ola Style Proximity Recommendation)
 * 4. ORDER TRACKING (Amazon-Style Live Garment Production Stages)
 */
function Application() {
  const demo=import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE==='true';
  const [currentPrompt,setCurrentPrompt]=useState('');
  const [assistantPrompt,setAssistantPrompt]=useState(null);
  const [assistantAction,setAssistantAction]=useState(null);
  const [draftBio,setDraftBio]=useState(null);
  const [selectedCommission,setSelectedCommission]=useState(null);
  const motionRoot = useRef(null);
  const sessionRequest = useRef(null);
  const [measurementDraft, setMeasurementDraft] = useState(() => { try { return loadMeasurementDraft(sessionStorage); } catch { return createMeasurementDraft(); } });
  const [draftStorageWarning, setDraftStorageWarning] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let failed = false;
    try { sessionStorage.setItem(measurementDraftKey, JSON.stringify({ version: 1, ...measurementDraft })); }
    catch { failed = true; }
    queueMicrotask(() => { if (!cancelled) setDraftStorageWarning(failed); });
    return () => { cancelled = true; };
  }, [measurementDraft]);
  const measurementErrors = validateMeasurements(measurementDraft);
  const hasMeasurementErrors = Object.keys(measurementErrors).length > 0;
  const measurements = hasMeasurementErrors ? null : serializeMeasurements(measurementDraft);
  const [activeTab, setActiveTab] = useState(()=>new URLSearchParams(location.search).has('reset')?'login':'mall');
  const [userRole, setUserRole] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // Cross-Step State
  const [customerRequirement, setCustomerRequirement] = useState(null);
  const [requests, setRequests] = useState(() => {
    const samples = demo ? demoRequests : [];
    if (!demo) return [];
    try {
      const saved = JSON.parse(localStorage.getItem('threadlabsRequests') || '[]');
      const savedById = new Map(saved.map((request) => [request.orderId, request]));
      const demoIds = new Set(samples.map((request) => request.orderId));
      return [...samples.map((request) => savedById.get(request.orderId) || request), ...saved.filter((request) => !demoIds.has(request.orderId))];
    } catch { return samples; }
  });
  const [activeOrder, setActiveOrder] = useState(() => { if (!demo) return null; try { return JSON.parse(localStorage.getItem('threadlabsActiveOrder') || 'null'); } catch { return null; } });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    const pending = sessionRequest.current || (sessionRequest.current = fetchSession());
    pending.then(({user}) => { if (!cancelled) setUserRole(user); }).catch(error => {
      if (!cancelled && error.status !== 401) setNotification({msg:error.message});
    });
    return () => { cancelled = true; };
  }, [demo]);
  useEffect(() => {
    if (demo || !userRole?.id) return;
    const controller = new AbortController();
    const refresh = () => fetchCommissions({ signal: controller.signal }).then(items => {
      if (controller.signal.aborted) return;
      setRequests(items);
      setActiveOrder(current => items.find(item => item.orderId === current?.orderId) || items[0] || null);
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error.status === 401) {
        sessionRequest.current=null;setUserRole(null);setRequests([]);setActiveOrder(null);setSelectedCommission(null);setActiveTab('login');
      }
      setNotification({msg:error.message});
    });
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [userRole?.id,demo]);

  const switchWorkspace = async () => {
    if (!demo) {
      try { await signOut(); } catch (error) { showToast(error.message); return; }
      sessionRequest.current=null;setUserRole(null); setRequests([]); setActiveOrder(null); setMeasurementDraft(createMeasurementDraft());
      setCustomerRequirement(null);setCurrentPrompt('');setAssistantPrompt(null);setDraftBio(null);setAssistantAction(null);setSelectedCommission(null);
    }
    setActiveTab('login');
  };

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const enterWorkspace = async () => {
    if (demo) { setActiveTab('login'); return; }
    if (userRole?.id) { setActiveTab(userRole.role === 'artisan' ? 'artisan' : 'needs'); return; }
    setNotification({msg:'Opening your workspace…'});
    try {
      const {user} = await (sessionRequest.current || (sessionRequest.current = fetchSession()));
      setUserRole(user);setNotification(null);setActiveTab(user.role === 'artisan' ? 'artisan' : 'needs');
    } catch (error) {
      sessionRequest.current=null;
      setNotification(error.status === 401 ? null : {msg:error.message});setActiveTab('login');
    }
  };

  const handleToggleSound = () => {
    setIsMuted(!isMuted);
    setSoundMuted(!isMuted);
    playClickSound();
  };

  // Step 2 -> Step 3 Handover: From Customer Needs to Artisan Matching (Rapido-Style)
  const handleProceedToArtisanMatching = (structuredReq) => {
    playLoomSwoosh();
    setCustomerRequirement(structuredReq);
    setActiveTab('matching');
    showToast(demo ? '✓ AI Matched Nearby Tailors & Artisans!' : 'Choose a region to find an artisan for your brief.');
  };

  // Step 3 -> Step 4 Handover: From Artisan Selection to Live Order Tracking
  const handleConfirmOrder = async (orderData) => {
    if (hasMeasurementErrors) return;
    if (!demo) {
      try {
        const request = await submitCommission({ ...orderData, measurements });
        setRequests(current => [request, ...current.filter(item => item.orderId !== request.orderId)]);
        setActiveOrder(request); setActiveTab('orders');
        showToast(`Request sent to ${request.artisanName}. Track its status here.`);
      } catch (error) { showToast(error.message, 'error'); }
      return;
    }
    // oxlint-disable-next-line react/purity -- This timestamp is created by the confirmation event, never during render.
    const request = { ...orderData, measurements, status: 'Request Placed', currentStageIndex: 0, createdAt: new Date().toISOString() };
    const nextRequests = [request, ...requests];
    setRequests(nextRequests);
    localStorage.setItem('threadlabsRequests', JSON.stringify(nextRequests));
    setActiveOrder(request);
    localStorage.setItem('threadlabsActiveOrder', JSON.stringify(request));
    setActiveTab('orders');
    showToast(`Request sent to ${orderData.artisanName}. Track its status here.`);
  };

  const acceptRequest = async (orderId) => {
    if (!demo) return updateRequestStage(orderId, 1, 'Artisan Accepted');
    const accepted = requests.find((request) => request.orderId === orderId);
    if (!accepted) return;
    const nextRequests = requests.map((request) => request.orderId === orderId ? { ...request, status: 'Artisan Accepted', currentStageIndex: Math.max(1, request.currentStageIndex || 0) } : request);
    setRequests(nextRequests);
    localStorage.setItem('threadlabsRequests', JSON.stringify(nextRequests));
    const nextOrder = nextRequests.find((request) => request.orderId === orderId);
    setActiveOrder(nextOrder);
    localStorage.setItem('threadlabsActiveOrder', JSON.stringify(nextOrder));
  };

  const updateRequestStage = async (orderId, stageIndex, status) => {
    if (!demo) {
      try {
        const request = await changeCommissionStage(orderId, { stageIndex: Math.max(0, stageIndex), status });
        setRequests(current => current.map(item => item.orderId === orderId ? request : item));
        setActiveOrder(current => current?.orderId === orderId ? request : current);
      } catch (error) { showToast(error.message, 'error'); }
      return;
    }
    const safeStageIndex = Math.max(0, stageIndex);
    const nextRequests = requests.map((request) => request.orderId === orderId ? { ...request, status, currentStageIndex: safeStageIndex } : request);
    setRequests(nextRequests);
    localStorage.setItem('threadlabsRequests', JSON.stringify(nextRequests));
    const nextOrder = nextRequests.find((request) => request.orderId === orderId);
    setActiveOrder(nextOrder);
    localStorage.setItem('threadlabsActiveOrder', JSON.stringify(nextOrder));
  };

  return (
    <MotionConfig reducedMotion="user"><div className="threadlabs-app" ref={motionRoot}>
      <AtelierMotion rootRef={motionRoot} />
      
      {/* Luxury Spring Cursor */}
      <CustomFashionCursor cursorState="default" />

      {/* 4-Tab Top Navigation Header */}
      {['needs', 'matching', 'orders'].includes(activeTab) && <ThreadTabsNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          playClickSound();
          setActiveTab(tab);
        }}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onSignOut={!demo && userRole?.id ? switchWorkspace : undefined}
      />}

      {/* Main Experience Router */}
      <main id="main-content" className="relative z-10">
        
        {/* TAB 1: 3D SHOPPING MALL (IMPRESSIVE OPENING RUNWAY TOUR) */}
        {activeTab === 'mall' && (
          <ThreadLabsLanding onEnterApp={enterWorkspace} isMuted={isMuted} onToggleSound={handleToggleSound} />
        )}

        {activeTab === 'login' && <LoginPage onBack={()=>setActiveTab('mall')} onLogin={(role, identity, artisanId, account)=>{setUserRole(account || {role,identity,artisanId}); if (!demo) { setRequests([]); setActiveOrder(null); setCustomerRequirement(null);setCurrentPrompt('');setAssistantPrompt(null);setDraftBio(null);setAssistantAction(null);setSelectedCommission(null); setMeasurementDraft(createMeasurementDraft()); } setActiveTab(role==='customer'?'needs':'artisan')}} />}

        {/* TAB 2: CUSTOMER NEEDS ("WHAT DO YOU NEED?") */}
        {activeTab === 'needs' && (
          <CustomerNeeds
            measurementDraft={measurementDraft}
            draftStorageWarning={draftStorageWarning}
            onMeasurementChange={setMeasurementDraft}
            initialPrompt={currentPrompt || customerRequirement?.userPrompt || ''}
            onPromptChange={setCurrentPrompt} assistantPrompt={assistantPrompt} assistantAction={assistantAction}
            onProceedToArtisanMatching={handleProceedToArtisanMatching}
          />
        )}

        {/* TAB 3: FIND YOUR ARTISAN (RAPIDO / OLA PROXIMITY MATCHING) */}
        {activeTab === 'matching' && (
          <ArtisanMatchingMap
            customerRequirement={{ ...customerRequirement, measurements, lengthRequirement: garmentLengthRequirement(measurements), hasMeasurementErrors }}
            customerName={userRole?.identity}
            onConfirmOrder={handleConfirmOrder}
            onBackToNeeds={() => setActiveTab('needs')}
          />
        )}

        {/* TAB 4: ORDER TRACKING (AMAZON-STYLE LIVE PRODUCTION STAGES) */}
        {activeTab === 'orders' && (
          <CustomerOrderTracker
            activeOrder={activeOrder}
            onExploreMoreMall={() => {
              playClickSound();
              setActiveTab('mall');
            }}
          />
        )}
        {activeTab === 'artisan' && <RequestInbox onSelectedCommission={setSelectedCommission} assistantAction={assistantAction} draftBio={draftBio} artisanId={userRole?.artisanId} requests={requests.filter((request)=>!userRole?.artisanId || request.artisanId===userRole.artisanId)} onBack={switchWorkspace} onAccept={acceptRequest} onUpdateStage={updateRequestStage} />}

      </main>

      <BeatleAssistant key={userRole?.id||'guest'} user={userRole} page={activeTab} prompt={currentPrompt} commissionId={selectedCommission}
        onAction={action=>{if(action==='login'||!userRole?.id){setActiveTab('login');return;}if(userRole.role==='artisan'){setAssistantAction({type:action});setActiveTab('artisan');return;}setAssistantAction({type:action});setActiveTab(['measurements','saved'].includes(action)?'needs':action);}}
        onDraft={(kind,text)=>{if(kind==='prompt'&&userRole?.role==='customer'){setAssistantPrompt({text});setActiveTab('needs');}if(kind==='bio'&&userRole?.role==='artisan'){setDraftBio({text});setAssistantAction({type:'profile'});setActiveTab('artisan');}}}/>
      {/* Quick Toast Notification */}
      {notification && (
        <div role="status" className="app-toast">
          <span className="status-dot" />
          <span>{notification.msg}</span>
        </div>
      )}

    </div></MotionConfig>
  );
}

export default function App(){return <ThemeProvider><Application/></ThemeProvider>;}
