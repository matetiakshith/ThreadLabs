import React, { useState } from 'react';
import { PackageCheck, Clock, CheckCircle2, MessageCircle, Send, MapPin, Scissors, Calendar, AlertCircle, FileText, ArrowUpRight } from 'lucide-react';
import { sendOrderMessage } from '../../services/api';

export default function OrderTracker({ orders, onRefreshOrders }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || null);
  const [chatMessage, setChatMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedOrder) return;

    setIsSending(true);
    try {
      await sendOrderMessage(selectedOrder.id, {
        sender: 'customer',
        senderName: selectedOrder.customerName || 'Customer',
        text: chatMessage.trim()
      });
      setChatMessage('');
      if (onRefreshOrders) onRefreshOrders();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-heritage-cream py-16">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-heritage-sand text-heritage-indigo flex items-center justify-center mx-auto border border-heritage-silk">
            <PackageCheck className="w-8 h-8 text-heritage-terracotta" />
          </div>
          <h3 className="text-xl font-extrabold text-heritage-indigo font-display">No Custom Orders Yet</h3>
          <p className="text-xs text-heritage-muted leading-relaxed">
            Use the AI Customization Studio to craft your unique outfit requirements and place your first custom artisan order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-heritage-cream py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Tracker Header */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Live Artisan Tailoring Lifecycle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-heritage-indigo font-display">
            Track Custom Orders & Live Production
          </h2>
          <p className="text-sm text-heritage-muted mt-1">
            Real-time status updates directly from master artisan workshops across India.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Orders List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-heritage-muted mb-2">Active Commissions ({orders.length})</h3>
            
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2.5 ${
                  selectedOrder?.id === order.id
                    ? 'bg-white border-heritage-indigo shadow-craft ring-2 ring-heritage-indigo/10'
                    : 'bg-heritage-sand/60 border-heritage-silk hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[11px] font-bold text-heritage-indigo">{order.id}</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    order.status === 'In_Production' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'Quality_Check' ? 'bg-indigo-100 text-indigo-800' :
                    order.status === 'Dispatched' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-heritage-indigo text-sm">{order.garmentType}</h4>
                  <p className="text-xs text-heritage-muted flex items-center gap-1 mt-0.5">
                    <Scissors className="w-3 h-3 text-heritage-terracotta" /> {order.craftTechnique}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-heritage-silk/60 text-xs">
                  <span className="text-heritage-muted">Artisan: <strong className="text-heritage-charcoal">{order.artisanName?.split(' ')[0]}</strong></span>
                  <span className="font-extrabold text-heritage-terracotta">₹{order.price?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Order Details & Milestone Timeline */}
          {selectedOrder && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Order Header Summary Card */}
              <div className="bg-white rounded-3xl border border-heritage-silk p-6 shadow-soft space-y-4">
                
                <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-heritage-silk">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-heritage-indigo bg-heritage-sand px-2.5 py-1 rounded-lg border border-heritage-silk">
                        {selectedOrder.id}
                      </span>
                      <span className="text-xs text-heritage-muted">
                        Ordered on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-heritage-indigo mt-2 font-display">
                      {selectedOrder.garmentType}
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-heritage-muted uppercase font-bold tracking-wider">Commission Value</p>
                    <p className="text-2xl font-black text-heritage-terracotta">₹{selectedOrder.price?.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Est. Delivery: {selectedOrder.estimatedDelivery}
                    </p>
                  </div>
                </div>

                {/* Assigned Artisan Info Bar */}
                <div className="bg-heritage-sand/60 p-4 rounded-2xl border border-heritage-silk flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedOrder.artisanAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"}
                      alt={selectedOrder.artisanName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-heritage-gold"
                    />
                    <div>
                      <p className="text-xs text-heritage-muted font-bold uppercase tracking-wider">Crafting Artisan</p>
                      <h4 className="font-extrabold text-heritage-indigo text-sm">{selectedOrder.artisanName}</h4>
                      <p className="text-xs text-heritage-terracotta font-medium">{selectedOrder.artisanCraft}</p>
                    </div>
                  </div>

                  <div className="text-xs text-heritage-charcoal space-y-1 sm:text-right">
                    <p><span className="text-heritage-muted">Fabric:</span> <strong>{selectedOrder.fabric}</strong></p>
                    <p><span className="text-heritage-muted">Color:</span> <strong>{selectedOrder.colorName}</strong></p>
                  </div>
                </div>

                {/* Production Milestone Timeline */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-heritage-indigo flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-heritage-terracotta" /> Production Milestone Progression
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-heritage-silk">
                    {selectedOrder.timeline?.map((step, idx) => (
                      <div key={idx} className="relative group">
                        {/* Milestone dot */}
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          step.completed
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : idx === selectedOrder.currentMilestoneIndex
                            ? 'bg-heritage-terracotta text-white ring-4 ring-heritage-terracotta/20 animate-pulse'
                            : 'bg-white border-2 border-heritage-silk text-heritage-muted'
                        }`}>
                          {step.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[9px] font-bold">{idx + 1}</span>
                          )}
                        </div>

                        <div className="bg-heritage-cream p-3.5 rounded-xl border border-heritage-silk space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <h5 className={`font-bold ${step.completed ? 'text-heritage-indigo' : 'text-heritage-muted'}`}>
                              {step.title}
                            </h5>
                            {step.timestamp && (
                              <span className="text-[10px] text-heritage-muted font-mono">
                                {new Date(step.timestamp).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-heritage-charcoal/80">{step.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Direct Artisan Messaging Section */}
              <div className="bg-white rounded-3xl border border-heritage-silk p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-heritage-silk">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-heritage-indigo" />
                    <h4 className="text-sm font-bold text-heritage-indigo">Artisan Workshop Messages</h4>
                  </div>
                  <span className="text-[11px] text-heritage-muted">Direct line with {selectedOrder.artisanName?.split(' ')[0]}</span>
                </div>

                {/* Message stream */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {selectedOrder.messages?.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                        msg.sender === 'customer'
                          ? 'bg-heritage-indigo text-white rounded-tr-none'
                          : msg.sender === 'system'
                          ? 'bg-heritage-sand text-heritage-charcoal border border-heritage-silk w-full text-center italic'
                          : 'bg-heritage-sand text-heritage-charcoal border border-heritage-silk rounded-tl-none'
                      }`}>
                        <div className="flex justify-between items-center gap-4 text-[10px] font-semibold opacity-75">
                          <span>{msg.senderName}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={`Message ${selectedOrder.artisanName?.split(' ')[0]} about fittings or queries...`}
                    className="flex-1 bg-heritage-sand/60 px-4 py-2.5 rounded-xl border border-heritage-silk text-xs font-medium text-heritage-charcoal placeholder-heritage-muted focus:outline-none focus:ring-2 focus:ring-heritage-indigo/20"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !chatMessage.trim()}
                    className="px-5 py-2.5 rounded-xl bg-heritage-indigo text-white hover:bg-heritage-indigoLight disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
