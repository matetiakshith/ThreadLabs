import React, { useState } from 'react';
import { Scissors, PlusCircle, CheckCircle, Package, Clock, MessageSquare, Send, Upload, Sparkles, UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';
import { addCatalogItem, updateOrderStatus, sendOrderMessage } from '../../services/api';

export default function ArtisanDashboard({ artisans, orders, onRefreshData }) {
  const [selectedArtisanId, setSelectedArtisanId] = useState(artisans[0]?.id || 'art-001');
  const [showAddPieceModal, setShowAddPieceModal] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'catalog'
  
  // New Catalog Piece Form State
  const [newPiece, setNewPiece] = useState({
    title: '',
    craft: '',
    fabric: '',
    price: '',
    leadTime: '8-12 days',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
    description: ''
  });
  const [isSubmittingPiece, setIsSubmittingPiece] = useState(false);

  // Direct Message State
  const [activeOrderId, setActiveOrderId] = useState(orders[0]?.id || null);
  const [artisanReply, setArtisanReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const activeArtisan = artisans.find(a => a.id === selectedArtisanId) || artisans[0];
  const artisanOrders = orders.filter(o => o.artisanId === activeArtisan?.id);
  const currentOrder = orders.find(o => o.id === activeOrderId) || artisanOrders[0];

  const handleCreateCatalogPiece = async (e) => {
    e.preventDefault();
    if (!newPiece.title || !newPiece.price) return;

    setIsSubmittingPiece(true);
    try {
      await addCatalogItem(activeArtisan.id, {
        ...newPiece,
        craft: newPiece.craft || activeArtisan.craft,
        fabric: newPiece.fabric || activeArtisan.fabricsSupported[0]
      });
      setShowAddPieceModal(false);
      setNewPiece({
        title: '',
        craft: '',
        fabric: '',
        price: '',
        leadTime: '8-12 days',
        imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
        description: ''
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to add catalog piece:', err);
    } finally {
      setIsSubmittingPiece(false);
    }
  };

  const handleUpdateMilestone = async (orderId, nextIndex, statusKey, noteText) => {
    try {
      await updateOrderStatus(orderId, {
        status: statusKey,
        milestoneIndex: nextIndex,
        note: noteText
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  const handleSendArtisanReply = async (e) => {
    e.preventDefault();
    if (!artisanReply.trim() || !currentOrder) return;

    setIsReplying(true);
    try {
      await sendOrderMessage(currentOrder.id, {
        sender: 'artisan',
        senderName: activeArtisan.name,
        text: artisanReply.trim()
      });
      setArtisanReply('');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to reply:', err);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="bg-heritage-sand/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Artisan Top Banner & Profile Switcher */}
        <div className="bg-heritage-indigo rounded-3xl p-6 sm:p-8 text-white shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div className="flex items-center space-x-4">
            <img
              src={activeArtisan?.avatar}
              alt={activeArtisan?.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-heritage-gold shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-heritage-terracotta text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full">
                  Artisan Workspace
                </span>
                <span className="text-xs text-heritage-goldLight flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Master
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">{activeArtisan?.name}</h2>
              <p className="text-xs text-slate-300 font-medium">
                {activeArtisan?.craft} • {activeArtisan?.region}
              </p>
            </div>
          </div>

          {/* Switch Active Artisan Workshop View */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-1 w-full md:w-auto">
            <label className="text-[11px] font-bold text-heritage-goldLight uppercase tracking-wider block">
              Switch Artisan Persona:
            </label>
            <select
              value={selectedArtisanId}
              onChange={(e) => setSelectedArtisanId(e.target.value)}
              className="w-full bg-heritage-indigo text-white font-semibold text-xs rounded-xl p-2 border border-heritage-gold/40 focus:outline-none cursor-pointer"
            >
              {artisans.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.craft.split('&')[0].trim()})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Dashboard Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-heritage-silk shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider">Active Inquiries</span>
            <p className="text-2xl font-black text-heritage-indigo font-display">{artisanOrders.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-heritage-silk shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider">Smart Catalog Pieces</span>
            <p className="text-2xl font-black text-heritage-terracotta font-display">{activeArtisan?.catalog?.length || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-heritage-silk shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider">Rating & Feedback</span>
            <p className="text-2xl font-black text-heritage-gold font-display">{activeArtisan?.rating} ★</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-heritage-silk shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider">Historical Orders</span>
            <p className="text-2xl font-black text-emerald-700 font-display">{activeArtisan?.completedOrders}</p>
          </div>
        </div>

        {/* Navigation Tabs (Orders vs Catalog Storefront) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-heritage-silk pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-heritage-indigo text-white shadow-sm'
                  : 'bg-white text-heritage-charcoal border border-heritage-silk hover:bg-heritage-sand'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Assigned Custom Orders ({artisanOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-heritage-indigo text-white shadow-sm'
                  : 'bg-white text-heritage-charcoal border border-heritage-silk hover:bg-heritage-sand'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Smart Catalog Storefront ({activeArtisan?.catalog?.length || 0})</span>
            </button>
          </div>

          {activeTab === 'catalog' && (
            <button
              onClick={() => setShowAddPieceModal(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-heritage-terracotta hover:bg-heritage-terracottaLight shadow-sm transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload New Handcrafted Piece</span>
            </button>
          )}
        </div>

        {/* TAB 1: ARTISAN ORDERS & LIFECYCLE CONTROLLER */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {artisanOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-heritage-silk space-y-2">
                <p className="text-sm font-bold text-heritage-indigo">No active orders assigned to {activeArtisan.name.split(' ')[0]} right now.</p>
                <p className="text-xs text-heritage-muted">Try switching artisan persona or creating a new order from the Customer Studio.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Orders List */}
                <div className="lg:col-span-6 space-y-4">
                  {artisanOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setActiveOrderId(order.id)}
                      className={`bg-white rounded-3xl p-6 border transition-all space-y-4 cursor-pointer ${
                        currentOrder?.id === order.id
                          ? 'border-heritage-terracotta shadow-craft ring-2 ring-heritage-terracotta/20'
                          : 'border-heritage-silk hover:shadow-soft'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-heritage-indigo bg-heritage-sand px-2 py-0.5 rounded border border-heritage-silk">
                            {order.id}
                          </span>
                          <h4 className="text-lg font-extrabold text-heritage-indigo font-display mt-1">
                            {order.garmentType}
                          </h4>
                          <p className="text-xs text-heritage-muted">
                            Customer: <strong className="text-heritage-charcoal">{order.customerName}</strong> ({order.customerPhone})
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${
                            order.status === 'In_Production' ? 'bg-amber-100 text-amber-800' :
                            order.status === 'Quality_Check' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'Dispatched' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <p className="text-base font-extrabold text-heritage-terracotta mt-1">
                            ₹{order.price?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {/* Tech Pack Requirements Box */}
                      <div className="bg-heritage-sand/60 p-3.5 rounded-2xl border border-heritage-silk/80 text-xs space-y-1.5">
                        <p className="font-bold text-heritage-indigo">Production Tech-Pack Specifications:</p>
                        <p className="text-heritage-charcoal italic">{order.requirementsSummary}</p>
                        
                        <div className="grid grid-cols-2 gap-2 pt-1 font-semibold text-[11px] text-heritage-muted">
                          <div>Fabric: <span className="text-heritage-charcoal">{order.fabric}</span></div>
                          <div>Color: <span className="text-heritage-charcoal">{order.colorName}</span></div>
                        </div>

                        {/* Customer Measurements */}
                        {order.measurements && (
                          <div className="pt-2 border-t border-heritage-silk/60 flex flex-wrap gap-2 text-[11px]">
                            <span className="bg-white px-2 py-0.5 rounded border border-heritage-silk">Chest: <strong>{order.measurements.chest}</strong></span>
                            <span className="bg-white px-2 py-0.5 rounded border border-heritage-silk">Length: <strong>{order.measurements.length}</strong></span>
                            <span className="bg-white px-2 py-0.5 rounded border border-heritage-silk">Shoulder: <strong>{order.measurements.shoulder}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* One-Click Milestone Advancers for Artisan */}
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider">
                          Update Production Progress:
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {order.status === 'Submitted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateMilestone(order.id, 1, 'Accepted', 'Artisan locked measurements and began raw textile procurement.');
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-heritage-indigo text-white font-bold hover:bg-heritage-indigoLight shadow-sm transition-all"
                            >
                              ✓ Accept Order & Procure Fabric
                            </button>
                          )}

                          {order.status === 'Accepted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateMilestone(order.id, 2, 'In_Production', 'Pattern drafted; artisan actively weaving / hand-embroidering on frame.');
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-sm transition-all"
                            >
                              ⚡ Start Weaving / Embroidery
                            </button>
                          )}

                          {order.status === 'In_Production' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateMilestone(order.id, 3, 'Quality_Check', 'Garment stitched; undergoing master tailor seam inspection and pressing.');
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm transition-all"
                            >
                              🔍 Move to Quality Inspection
                            </button>
                          )}

                          {order.status === 'Quality_Check' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateMilestone(order.id, 4, 'Dispatched', 'Packaged with artisan seal of authenticity and dispatched via courier.');
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm transition-all"
                            >
                              📦 Dispatch Finished Garment
                            </button>
                          )}

                          {order.status === 'Dispatched' && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" /> Order Successfully Completed & Dispatched
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Artisan Direct Communication Box */}
                {currentOrder && (
                  <div className="lg:col-span-6 bg-white rounded-3xl border border-heritage-silk p-6 shadow-soft space-y-4 h-fit">
                    <div className="flex justify-between items-center pb-3 border-b border-heritage-silk">
                      <div>
                        <h4 className="text-sm font-bold text-heritage-indigo">Customer Direct Line</h4>
                        <p className="text-xs text-heritage-muted">Chatting with {currentOrder.customerName} regarding {currentOrder.id}</p>
                      </div>
                      <span className="font-mono text-xs font-bold bg-heritage-sand px-2 py-1 rounded-lg border border-heritage-silk">
                        {currentOrder.id}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {currentOrder.messages?.map((m, i) => (
                        <div
                          key={i}
                          className={`flex flex-col ${m.sender === 'artisan' ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`max-w-xs p-3 rounded-2xl text-xs space-y-1 ${
                            m.sender === 'artisan'
                              ? 'bg-heritage-terracotta text-white rounded-tr-none'
                              : m.sender === 'system'
                              ? 'bg-heritage-sand text-heritage-charcoal w-full text-center italic'
                              : 'bg-heritage-sand text-heritage-charcoal rounded-tl-none border border-heritage-silk'
                          }`}>
                            <div className="flex justify-between gap-4 text-[10px] font-semibold opacity-80">
                              <span>{m.senderName}</span>
                              <span>{m.time}</span>
                            </div>
                            <p>{m.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendArtisanReply} className="flex gap-2 pt-2 border-t border-heritage-silk">
                      <input
                        type="text"
                        value={artisanReply}
                        onChange={(e) => setArtisanReply(e.target.value)}
                        placeholder={`Reply to ${currentOrder.customerName}...`}
                        className="flex-1 bg-heritage-sand/60 px-4 py-2.5 rounded-xl border border-heritage-silk text-xs font-medium text-heritage-charcoal focus:outline-none focus:ring-2 focus:ring-heritage-indigo/20"
                      />
                      <button
                        type="submit"
                        disabled={isReplying || !artisanReply.trim()}
                        className="px-4 py-2.5 rounded-xl bg-heritage-terracotta text-white hover:bg-heritage-terracottaLight disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* TAB 2: SMART CATALOG STOREFRONT */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeArtisan?.catalog?.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl border border-heritage-silk overflow-hidden shadow-soft space-y-3">
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-3 right-3 bg-heritage-indigo/90 text-white font-extrabold text-sm px-3 py-1 rounded-xl backdrop-blur-sm">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-5 pt-0 space-y-2">
                    <h4 className="font-extrabold text-heritage-indigo text-base font-display">{item.title}</h4>
                    <p className="text-xs text-heritage-muted leading-relaxed">{item.description}</p>
                    <div className="flex justify-between items-center pt-2 text-xs font-semibold text-heritage-terracotta">
                      <span>{item.craft}</span>
                      <span className="text-heritage-charcoal">{item.leadTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Add New Catalog Piece Modal */}
      {showAddPieceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-heritage-charcoal/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-heritage-silk">
            <div className="flex justify-between items-center pb-2 border-b border-heritage-silk">
              <h3 className="font-bold text-heritage-indigo text-base">Upload Handcrafted Piece to Smart Catalog</h3>
              <button onClick={() => setShowAddPieceModal(false)} className="text-heritage-muted text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCatalogPiece} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-heritage-indigo mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={newPiece.title}
                  onChange={(e) => setNewPiece({ ...newPiece, title: e.target.value })}
                  placeholder="e.g. Indigo Starburst Ajrakh Shirt"
                  className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-heritage-indigo mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPiece.price}
                    onChange={(e) => setNewPiece({ ...newPiece, price: e.target.value })}
                    placeholder="3200"
                    className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-heritage-indigo mb-1">Lead Time</label>
                  <input
                    type="text"
                    value={newPiece.leadTime}
                    onChange={(e) => setNewPiece({ ...newPiece, leadTime: e.target.value })}
                    placeholder="10-14 days"
                    className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-heritage-indigo mb-1">Photo Image URL</label>
                <input
                  type="text"
                  value={newPiece.imageUrl}
                  onChange={(e) => setNewPiece({ ...newPiece, imageUrl: e.target.value })}
                  className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-heritage-indigo mb-1">Piece Description</label>
                <textarea
                  rows={2}
                  value={newPiece.description}
                  onChange={(e) => setNewPiece({ ...newPiece, description: e.target.value })}
                  placeholder="Describe stitches, dyes, and tailoring finish..."
                  className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPieceModal(false)}
                  className="px-4 py-2 rounded-xl text-heritage-muted font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPiece}
                  className="px-5 py-2 rounded-xl bg-heritage-terracotta text-white font-bold shadow-sm"
                >
                  {isSubmittingPiece ? 'Uploading...' : 'Publish to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
