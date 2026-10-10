import React from 'react';
import { Sparkles, Users, Package, Scissors, Compass } from 'lucide-react';

export default function BottomNav({ currentTab, setCurrentTab, userRole, ordersCount = 0 }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 shadow-2xl">
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        
        <button
          onClick={() => setCurrentTab('fashion_mall')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            currentTab === 'fashion_mall' ? 'text-amber-500 font-extrabold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentTab === 'fashion_mall' ? 'bg-amber-50 text-amber-500' : ''}`}>
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">3D Mall</span>
        </button>

        <button
          onClick={() => setCurrentTab('studio')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            currentTab === 'studio' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentTab === 'studio' ? 'bg-blue-50 text-blue-600' : ''}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Create</span>
        </button>

        <button
          onClick={() => setCurrentTab('artisans')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            currentTab === 'artisans' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentTab === 'artisans' ? 'bg-blue-50 text-blue-600' : ''}`}>
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Artisans</span>
        </button>

        <button
          onClick={() => setCurrentTab('orders')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all relative ${
            currentTab === 'orders' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentTab === 'orders' ? 'bg-blue-50 text-blue-600' : ''}`}>
            <Package className="w-5 h-5" />
          </div>
          {ordersCount > 0 && (
            <span className="absolute top-1 right-3 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {ordersCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Orders</span>
        </button>

        <button
          onClick={() => setCurrentTab('artisan_portal')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            currentTab === 'artisan_portal' ? 'text-orange-600 font-extrabold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentTab === 'artisan_portal' ? 'bg-orange-50 text-orange-600' : ''}`}>
            <Scissors className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Artisans</span>
        </button>

      </div>
    </div>
  );
}
