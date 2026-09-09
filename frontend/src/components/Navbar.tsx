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
    { id: 'tsr', label: 'Station Master TSR', icon: ClipboardList, badge: 'Paper-to-Digital' },
    { id: 'cautions', label: 'Caution Orders & Fog', icon: ShieldAlert, count: 2 },
    { id: 'simulator', label: "What-If Sandbox", icon: Cpu, badge: 'AI Dispatch' },
    { id: 'corridor', label: 'Corridor Track Map', icon: Map, badge: 'HDN-1' },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
      {/* Top operational bar */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-4 py-1.5 border-b border-blue-900/30 text-xs flex justify-between items-center text-slate-300">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            SIH 2026 #26028
          </span>
          <span className="hidden sm:inline text-slate-400 font-medium">
            Ministry of Railways • Dynamic Forecast of ETA for Coaching Trains
          </span>
          <span className="text-blue-400 font-mono text-[11px] bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
            Corridor: HDN-1 (NDLS ↔ DDU) 786.5 km
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span className="font-medium text-[11px]">System Online</span>
          </div>
          <div className="font-mono text-slate-200 text-xs bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            {timeStr || '12:00:00 IST'}
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('track')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  RailGati<span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                  GatiDrishti
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5 hidden sm:block">
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
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400 border border-slate-700'
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
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center text-xs space-x-1.5 font-medium"
              title="Refresh Telemetry & Recalculate Forecasts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs row */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 bg-slate-800/70'
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
