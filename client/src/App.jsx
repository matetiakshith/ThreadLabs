import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import ThreadTabsNav from './components/Navigation/ThreadTabsNav';
import ShoppingMall3D from './components/Mall/ShoppingMall3D';
import CustomerNeeds from './components/Needs/CustomerNeeds';
import ArtisanMatchingMap from './components/Artisans/ArtisanMatchingMap';
import CustomerOrderTracker from './components/Orders/CustomerOrderTracker';
import CustomFashionCursor from './components/Unseen/CustomFashionCursor';
import RequestInbox from './components/ArtisanPortal/RequestInbox';
import LoginPage from './components/LoginPage';
import { demoRequests } from './data/demoRequests';
import { playClickSound, playLoomSwoosh, playSuccessChime } from './utils/audioEffects';

/**
 * ThreadLabs — Final Web Application Master Coordinator
 * Built precisely on the 4-experience product vision:
 * 1. EXPLORE (3D Shopping Mall / Outfit Experience)
 * 2. CUSTOMER NEEDS ("WHAT DO YOU NEED?" AI Requirements Capture)
 * 3. FIND YOUR ARTISAN (Rapido / Ola Style Proximity Recommendation)
 * 4. ORDER TRACKING (Amazon-Style Live Garment Production Stages)
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('mall');
  const [userRole, setUserRole] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // Cross-Step State
  const [customerRequirement, setCustomerRequirement] = useState(null);
  const [requests, setRequests] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('threadlabsRequests') || '[]');
      const savedById = new Map(saved.map((request) => [request.orderId, request]));
      const demoIds = new Set(demoRequests.map((request) => request.orderId));
      return [...demoRequests.map((request) => savedById.get(request.orderId) || request), ...saved.filter((request) => !demoIds.has(request.orderId))];
    } catch { return demoRequests; }
  });
  const [activeOrder, setActiveOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('threadlabsActiveOrder') || 'null'); } catch { return null; } });
  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleSound = () => {
    setIsMuted(!isMuted);
    playClickSound();
  };

  // Step 2 -> Step 3 Handover: From Customer Needs to Artisan Matching (Rapido-Style)
  const handleProceedToArtisanMatching = (structuredReq) => {
    playLoomSwoosh();
    setCustomerRequirement(structuredReq);
    setActiveTab('matching');
    showToast('✓ AI Matched Nearby Tailors & Artisans!');
  };

  // Step 3 -> Step 4 Handover: From Artisan Selection to Live Order Tracking
  const handleConfirmOrder = (orderData) => {
    const request = { ...orderData, status: 'Request Placed', currentStageIndex: 0, createdAt: new Date().toISOString() };
    const nextRequests = [request, ...requests];
    setRequests(nextRequests);
    localStorage.setItem('threadlabsRequests', JSON.stringify(nextRequests));
    setActiveOrder(request);
    localStorage.setItem('threadlabsActiveOrder', JSON.stringify(request));
    setActiveTab('orders');
    showToast(`Request sent to ${orderData.artisanName}. Track its status here.`);
  };

  const acceptRequest = (orderId) => {
    const accepted = requests.find((request) => request.orderId === orderId);
    if (!accepted) return;
    const nextRequests = requests.map((request) => request.orderId === orderId ? { ...request, status: 'Artisan Accepted', currentStageIndex: Math.max(1, request.currentStageIndex || 0) } : request);
    setRequests(nextRequests);
    localStorage.setItem('threadlabsRequests', JSON.stringify(nextRequests));
    const nextOrder = nextRequests.find((request) => request.orderId === orderId);
    setActiveOrder(nextOrder);
    localStorage.setItem('threadlabsActiveOrder', JSON.stringify(nextOrder));
  };

  const updateRequestStage = (orderId, stageIndex, status) => {
    const safeStageIndex = Math.max(0, stageIndex);
    const nextRequests = requests.map((request) => request.orderId === orderId ? { ...request, status, currentStageIndex: safeStageIndex } : request);
    setRequests(nextRequests);
    localStorage.setItem('threadlabsRequests', JSON.stringify(nextRequests));
    const nextOrder = nextRequests.find((request) => request.orderId === orderId);
    setActiveOrder(nextOrder);
    localStorage.setItem('threadlabsActiveOrder', JSON.stringify(nextOrder));
  };

  return (
    <div data-flow-palette={activeTab !== 'mall' ? 'rose' : undefined} className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans relative overflow-x-hidden">
      
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
      />}

      {/* Main Experience Router */}
      <main className="relative z-10">
        
        {/* TAB 1: 3D SHOPPING MALL (IMPRESSIVE OPENING RUNWAY TOUR) */}
        {activeTab === 'mall' && (
          <ShoppingMall3D onEnter={() => setActiveTab('login')} />
        )}

        {activeTab === 'login' && <LoginPage onBack={()=>setActiveTab('mall')} onLogin={(role, identity, artisanId)=>{setUserRole({role,identity,artisanId}); setActiveTab(role==='customer'?'needs':'artisan')}} />}

        {/* TAB 2: CUSTOMER NEEDS ("WHAT DO YOU NEED?") */}
        {activeTab === 'needs' && (
          <CustomerNeeds
            initialPrompt={customerRequirement?.userPrompt || ''}
            onProceedToArtisanMatching={handleProceedToArtisanMatching}
          />
        )}

        {/* TAB 3: FIND YOUR ARTISAN (RAPIDO / OLA PROXIMITY MATCHING) */}
        {activeTab === 'matching' && (
          <ArtisanMatchingMap
            customerRequirement={customerRequirement}
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
        {activeTab === 'artisan' && <RequestInbox artisanId={userRole?.artisanId} requests={requests.filter((request)=>!userRole?.artisanId || request.artisanId===userRole.artisanId)} onBack={()=>setActiveTab('login')} onAccept={acceptRequest} onUpdateStage={updateRequestStage} />}

      </main>

      {/* Quick Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 animate-in fade-in border border-white/10 font-mono ${activeTab !== 'mall' ? 'rose-flow-toast' : ''}`}>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{notification.msg}</span>
        </div>
      )}

    </div>
  );
}
