import React, { useState } from 'react';
import { TrainLiveSummary, Station, SimulationResult } from '../types';
import { Cpu, Play, CheckCircle2, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

interface WhatIfSimulatorProps {
  trains: TrainLiveSummary[];
  stations: Station[];
  onSimulate: (req: {
    held_train_number: string;
    hold_station_code: string;
    extra_hold_minutes: number;
    priority_override_train?: string;
  }) => Promise<SimulationResult>;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  trains,
  stations,
  onSimulate
}) => {
  const [heldTrain, setHeldTrain] = useState('12420');
  const [holdStation, setHoldStation] = useState('ETW');
  const [holdMinutes, setHoldMinutes] = useState(15);
  const [overrideTrain, setOverrideTrain] = useState('22436');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await onSimulate({
        held_train_number: heldTrain,
        hold_station_code: holdStation,
        extra_hold_minutes: Number(holdMinutes),
        priority_override_train: overrideTrain || undefined
      });
      setResult(res);
    } catch (err) {
      alert('Error running simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 border border-blue-800/40 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Operational Decision Support</span>
            </div>
            <h1 className="text-xl font-bold text-white">Dispatcher "What-If" Scenario Simulator</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Allows Section Controllers to simulate traffic dispatch decisions before making physical track calls. 
              Evaluate whether holding an Express train at a loop line to let a Vande Bharat or Rajdhani overtake 
              minimizes net corridor cascade delays.
            </p>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Decision Mode: </span>
            <span className="font-mono font-bold text-cyan-400">Precedence Optimization</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Sandbox */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <Play className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Configure Dispatch Scenario</h2>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Train to Regulate / Hold on Loop Line</label>
              <select
                value={heldTrain}
                onChange={(e) => setHeldTrain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
              >
                {trains.map(t => (
                  <option key={t.number} value={t.number}>
                    {t.number} - {t.name} ({t.train_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Station for Loop Holding</label>
              <select
                value={holdStation}
                onChange={(e) => setHoldStation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
              >
                {stations.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name} ({s.platforms_count} Platforms)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400 font-medium">Extra Detention Duration</span>
                <span className="font-mono font-bold text-amber-400">+{holdMinutes} minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={holdMinutes}
                onChange={(e) => setHoldMinutes(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                <span>5m</span>
                <span>15m (Standard Loop)</span>
                <span>30m</span>
                <span>45m</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">High-Priority Train Granted Green Path</label>
              <select
                value={overrideTrain}
                onChange={(e) => setOverrideTrain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono font-bold"
              >
                <option value="">None (Standalone Hold)</option>
                {trains.filter(t => t.number !== heldTrain).map(t => (
                  <option key={t.number} value={t.number}>
                    {t.number} - {t.name} (Priority {t.priority_rank})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>{isSimulating ? 'Simulating Cascade Dynamics...' : 'Run Simulation & Compare ETAs'}</span>
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Simulation Comparative Outcomes</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Ripple Effect Analysis</span>
          </div>

          {result ? (
            <div className="space-y-4">
              {/* Recommendation Card */}
              <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-4 text-xs text-blue-200">
                <div className="font-bold text-white mb-1 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>RailGati AI Dispatcher Recommendation:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-300">
                  {result.dispatcher_recommendation}
                </p>
              </div>

              {/* Impacted Trains List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300">Individual Train Delay Progression:</h3>
                {result.impacted_trains.map((t, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-xl border text-xs ${
                      t.type === 'EXPEDITED' 
                        ? 'bg-emerald-950/20 border-emerald-500/30' 
                        : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <span className="font-mono font-bold text-sm text-white">{t.train_number}</span>
                        <span className="text-slate-300 font-semibold ml-2">{t.train_name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        t.type === 'EXPEDITED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {t.net_delay_change}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 mb-2">
                      {t.action}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800 font-mono">
                      <div>
                        <span className="text-slate-400">Baseline Delay: </span>
                        <span className="text-slate-200">{t.baseline_delay_mins}m</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">Simulated Delay: </span>
                        <span className={t.type === 'EXPEDITED' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {t.simulated_delay_mins}m
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-12 text-slate-400 text-xs">
              <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="font-bold text-slate-300 mb-1">No Simulation Executed Yet</div>
              <p className="max-w-sm mx-auto text-[11px]">
                Choose a train to hold, specify detention minutes, and click "Run Simulation" to see immediate cascade delay metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
