import React, { useState } from 'react';
import { PackageCheck, Clock, CheckCircle2, MessageCircle, Send, Scissors, Phone, AlertCircle, ChevronRight } from 'lucide-react';
import { sendOrderMessage } from '../../services/api';

export default function ModernOrderTimeline({ orders, onRefreshOrders }) {
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
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
          <PackageCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 font-display">No Custom Orders Yet</h3>
        <p className="text-xs text-slate-500">
          Create an outfit in Step 1 to commission a master artisan and track live workshop progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Live Order Tracking (ऑर्डर ट्रैकर)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Watch your custom garment move through cutting, weaving, stitching, and dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Orders Horizontal/Vertical Bar */}
        <div className="lg:col-span-4 space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Your Orders ({orders.length})
          </label>

          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                selectedOrder?.id === order.id
                  ? 'bg-blue-50 border-blue-600 shadow-sm ring-2 ring-blue-600/10'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-blue-700">{order.id}</span>
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
                <h4 className="font-bold text-slate-900 text-sm">{order.garmentType}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{order.artisanName?.split(' ')[0]} • {order.craftTechnique}</p>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-400">Total:</span>
                <span className="font-black text-slate-900">₹{order.price?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Active Order Status Tracker */}
        {selectedOrder && (
          <div className="lg:col-span-8 space-y-6">
            
            <div className="app-card p-6 space-y-6 border border-slate-200">
              
              {/* Top Order Details */}
              <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="bg-blue-100 text-blue-700 font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
                    {selectedOrder.id}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2 font-display">
                    {selectedOrder.garmentType}
                  </h3>
                  <p className="text-xs text-slate-500">Fabric: {selectedOrder.fabric} • Color: {selectedOrder.colorName}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold">Total Price</p>
                  <p className="text-2xl font-black text-slate-900">₹{selectedOrder.price?.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-emerald-600 font-bold mt-0.5">Est. Delivery: {selectedOrder.estimatedDelivery}</p>
                </div>
              </div>

              {/* Artisan Contact Bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedOrder.artisanAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"}
                    alt={selectedOrder.artisanName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-orange-400"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Artisan</span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{selectedOrder.artisanName}</h4>
                    <p className="text-xs text-orange-600 font-medium">{selectedOrder.artisanCraft}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    ✓ Verified Workshop
                  </span>
                </div>
              </div>

              {/* Modern Milestone Tracker (Large Checkmarks & Status) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Workshop Milestones (कारीगर का काम)
                </h4>

                <div className="space-y-3">
                  {selectedOrder.timeline?.map((milestone, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        milestone.completed
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : i === selectedOrder.currentMilestoneIndex
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100'
                          : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        milestone.completed
                          ? 'bg-emerald-600 text-white'
                          : i === selectedOrder.currentMilestoneIndex
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {milestone.completed ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>

                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between items-center text-xs">
                          <h5 className={`font-bold ${milestone.completed ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {milestone.title}
                          </h5>
                          {milestone.timestamp && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(milestone.timestamp).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{milestone.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Workshop Chat Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-blue-600" /> Message the Artisan (सीधी बात)
                  </h4>
                  <span className="text-[10px] text-slate-400">Direct Workshop Line</span>
                </div>

                {/* Message Stream */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 max-h-48 overflow-y-auto">
                  {selectedOrder.messages?.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl text-xs max-w-sm space-y-1 ${
                        msg.sender === 'customer'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : msg.sender === 'system'
                          ? 'bg-slate-200 text-slate-700 w-full text-center italic'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                      }`}>
                        <div className="flex justify-between gap-3 text-[10px] font-semibold opacity-75">
                          <span>{msg.senderName}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={`Ask ${selectedOrder.artisanName?.split(' ')[0]} about sleeve length or delivery date...`}
                    className="flex-1 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !chatMessage.trim()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-40 transition-all flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
