import React, { useState } from 'react';
import { Scissors, CheckCircle, Package, Camera, Send, PlusCircle, UserCheck, ShieldCheck, ArrowRight, Rotate3d, Sparkles } from 'lucide-react';
import { addCatalogItem, updateOrderStatus, sendOrderMessage } from '../../services/api';
import Spool3DWidget from '../Three/Spool3DWidget';

export default function SimpleArtisanDesk({ artisans, orders, onRefreshData }) {
  const [selectedArtisanId, setSelectedArtisanId] = useState(artisans[0]?.id || 'art-001');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'catalog'
  const [showAddModal, setShowAddModal] = useState(false);

  // Quick Catalog Piece State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeArtisan = artisans.find(a => a.id === selectedArtisanId) || artisans[0];
  const artisanOrders = orders.filter(o => o.artisanId === activeArtisan?.id);

  const handleAdvanceMilestone = async (orderId, nextIdx, statusKey, note) => {
    try {
      await updateOrderStatus(orderId, {
        status: statusKey,
        milestoneIndex: nextIdx,
        note: note
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Milestone update error:', err);
    }
  };

  const handleAddPiece = async (e) => {
    e.preventDefault();
    if (!title || !price) return;
    setIsSubmitting(true);
    try {
      await addCatalogItem(activeArtisan.id, {
        title,
        price: Number(price),
        craft: activeArtisan.craft,
        fabric: activeArtisan.fabricsSupported[0],
        imageUrl,
        leadTime: '8-12 days',
        description: `Handcrafted ${activeArtisan.craft} piece.`
      });
      setShowAddModal(false);
      setTitle('');
      setPrice('');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Add piece error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* 1. Artisan Persona Header with Interactive 3D Spinning Bobbin */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-clay-glow flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        
        <div className="flex items-center gap-4 z-10">
          <img
            src={activeArtisan?.avatar}
            alt={activeArtisan?.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white shadow-md"
          />
          <div>
            <span className="bg-white/20 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
              <Sparkles className="w-3 h-3 text-amber-200" /> Artisan Workshop Desk (कारीगर कार्यशाला)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display mt-1">{activeArtisan?.name}</h2>
            <p className="text-xs text-orange-100 font-medium">{activeArtisan?.craft} • {activeArtisan?.region}</p>
          </div>
        </div>

        {/* 3D Spool Widget & Switcher */}
        <div className="flex items-center gap-4 z-10 w-full md:w-auto justify-between md:justify-end">
          <div className="w-20 h-20 bg-black/20 rounded-2xl backdrop-blur-md border border-white/20 overflow-hidden shadow-inner flex items-center justify-center">
            <Spool3DWidget threadColor="#ffd700" speed={1.2} />
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex-1 md:flex-initial">
            <label className="text-[10px] font-bold text-orange-100 uppercase tracking-wider block">
              Switch Artisan Profile:
            </label>
            <select
              value={selectedArtisanId}
              onChange={(e) => setSelectedArtisanId(e.target.value)}
              className="w-full bg-orange-700 text-white font-bold text-xs rounded-xl p-2 mt-1 border border-white/30 focus:outline-none cursor-pointer"
            >
              {artisans.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.craft.split('&')[0].trim()})</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* 2. Top Large Action Tabs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`p-4 rounded-2xl border-2 font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white border-blue-600 shadow-float'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Customer Orders ({artisanOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`p-4 rounded-2xl border-2 font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'catalog'
              ? 'bg-blue-600 text-white border-blue-600 shadow-float'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span>My Smart Catalog ({activeArtisan?.catalog?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS WITH 1-TAP BIG BUTTONS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {artisanOrders.length === 0 ? (
            <div className="app-card p-10 text-center space-y-2">
              <p className="text-sm font-bold text-slate-800">No active custom orders right now for {activeArtisan?.name}.</p>
              <p className="text-xs text-slate-400">Switch to Customer Mode to commission a new outfit.</p>
            </div>
          ) : (
            artisanOrders.map((order) => (
              <div key={order.id} className="app-card p-6 space-y-5 border-2 border-slate-200">
                
                {/* Order Top Bar */}
                <div className="flex flex-wrap justify-between items-start gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {order.id}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">{order.garmentType}</h3>
                    <p className="text-xs text-slate-500">Customer: <strong className="text-slate-800">{order.customerName}</strong> ({order.customerPhone})</p>
                  </div>

                  <div className="text-right">
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${
                      order.status === 'In_Production' ? 'bg-amber-100 text-amber-800' :
                      order.status === 'Quality_Check' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'Dispatched' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      Current: {order.status.replace('_', ' ')}
                    </span>
                    <p className="text-lg font-black text-orange-600 mt-1">₹{order.price?.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Requirements Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <p className="font-bold text-slate-900">✂️ Garment Tailoring Instructions (कपड़े का विवरण):</p>
                  <p className="text-slate-700 font-medium">"{order.requirementsSummary}"</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-semibold text-slate-600">
                    <div>Fabric: <strong className="text-slate-900">{order.fabric}</strong></div>
                    <div>Color: <strong className="text-slate-900">{order.colorName}</strong></div>
                    {order.measurements && (
                      <>
                        <div>Chest: <strong className="text-slate-900">{order.measurements.chest}</strong></div>
                        <div>Length: <strong className="text-slate-900">{order.measurements.length}</strong></div>
                      </>
                    )}
                  </div>
                </div>

                {/* ONE-TAP BIG PROGRESS ADVANCER (VILLAGE ARTISAN FRIENDLY) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Update Stitching Progress (काम का स्टेटस बदलें):
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {order.status === 'Submitted' && (
                      <button
                        onClick={() => handleAdvanceMilestone(order.id, 1, 'Accepted', 'Artisan locked measurements and began raw textile procurement.')}
                        className="btn-primary-big py-3 text-xs"
                      >
                        ✓ 1. Accept Order (ऑर्डर स्वीकार करें)
                      </button>
                    )}

                    {order.status === 'Accepted' && (
                      <button
                        onClick={() => handleAdvanceMilestone(order.id, 2, 'In_Production', 'Pattern drafted; artisan actively weaving / hand-embroidering on frame.')}
                        className="btn-clay-big py-3 text-xs"
                      >
                        ⚡ 2. Start Stitching/Embroidery (सिलाई शुरू की)
                      </button>
                    )}

                    {order.status === 'In_Production' && (
                      <button
                        onClick={() => handleAdvanceMilestone(order.id, 3, 'Quality_Check', 'Garment stitched; undergoing master tailor seam inspection and pressing.')}
                        className="w-full py-3 px-4 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                      >
                        🔍 3. Ready for Quality Check (जांच के लिए तैयार)
                      </button>
                    )}

                    {order.status === 'Quality_Check' && (
                      <button
                        onClick={() => handleAdvanceMilestone(order.id, 4, 'Dispatched', 'Packaged with artisan seal of authenticity and dispatched via courier.')}
                        className="w-full py-3 px-4 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                      >
                        📦 4. Dispatch to Customer (भेज दिया गया)
                      </button>
                    )}

                    {order.status === 'Dispatched' && (
                      <div className="col-span-3 bg-emerald-50 text-emerald-800 p-3 rounded-xl text-center text-xs font-bold border border-emerald-200">
                        ✓ Order completed and dispatched to customer!
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: SMART CATALOG MANAGER */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-slate-900">Your Handcrafted Showcases</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Clothing Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activeArtisan?.catalog?.map((item) => (
              <div key={item.id} className="app-card overflow-hidden shadow-sm space-y-2">
                <div className="h-44 overflow-hidden relative">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-slate-900/90 text-white text-xs font-black px-2 py-1 rounded-lg">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-4 pt-1">
                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Piece Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Add Clothing to Smart Catalog</h3>
            <form onSubmit={handleAddPiece} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Title (कपड़े का नाम)</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Indigo Ajrakh Shirt"
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Price in Rupees (मूल्य ₹)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2800"
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Photo URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Publish to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
