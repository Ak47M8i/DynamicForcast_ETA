import React, { useState, useEffect } from 'react';
import { 
  Train, Activity, ClipboardList, ShieldAlert, Cpu, 
  Map, RefreshCw, Radio
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  isRefreshing 
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'track', label: 'Dynamic Train ETA', icon: Train, badge: 'Live AI' },
    { id: 'chart', label: 'Section Controller Chart', icon: Activity, badge: 'String Chart' },
    { id: 'tsr', label: 'Station Master TSR', icon: ClipboardList, badge: 'Paperless' },
    { id: 'cautions', label: 'Caution Orders & Fog', icon: ShieldAlert, count: 2 },
    { id: 'simulator', label: "What-If Sandbox", icon: Cpu, badge: 'AI Dispatch' },
    { id: 'corridor', label: 'Corridor Track Map', icon: Map, badge: 'HDN-1' },
  ];

  return (
    <header className="bg-white/95 border-b border-slate-200 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      {/* Top operational bar */}
      <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200 text-xs flex justify-between items-center text-slate-600">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            SIH 2026 #26028
          </span>
          <span className="hidden sm:inline text-slate-600 font-medium">
            Ministry of Railways • Dynamic Forecast of ETA for Coaching Trains
          </span>
          <span className="text-blue-700 font-mono text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
            Corridor: HDN-1 (NDLS ↔ DDU) 786.5 km
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-emerald-600">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span className="font-semibold text-[11px]">System Online</span>
          </div>
          <div className="font-mono text-slate-700 text-xs bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-sm">
            {timeStr || '12:00:00 IST'}
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('track')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-blue-500/30">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  RailGati<span className="text-blue-600">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                  GatiDrishti
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5 hidden sm:block">
                Dynamic Coaching Train ETA & Section Operations System
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm transition flex items-center text-xs space-x-1.5 font-semibold"
              title="Refresh Telemetry & Recalculate Forecasts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs row */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-200 no-scrollbar bg-slate-50/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
