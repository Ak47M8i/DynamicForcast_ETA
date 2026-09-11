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
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-700 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Operational Decision Support</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Dispatcher "What-If" Scenario Simulator</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Allows Section Controllers to simulate traffic dispatch decisions before making physical track calls. 
              Evaluate whether holding an Express train at a loop line to let a Vande Bharat or Rajdhani overtake 
              minimizes net corridor cascade delays.
            </p>
          </div>

          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs shadow-sm">
            <span className="text-slate-500">Decision Mode: </span>
            <span className="font-mono font-bold text-blue-700">Precedence Optimization</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Sandbox */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <Play className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Configure Dispatch Scenario</h2>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Train to Regulate / Hold on Loop Line</label>
              <select
                value={heldTrain}
                onChange={(e) => setHeldTrain(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {trains.map(t => (
                  <option key={t.number} value={t.number}>
                    {t.number} - {t.name} ({t.train_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Station for Loop Holding</label>
              <select
                value={holdStation}
                onChange={(e) => setHoldStation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <span className="text-slate-600 font-semibold">Extra Detention Duration</span>
                <span className="font-mono font-bold text-amber-700">+{holdMinutes} minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={holdMinutes}
                onChange={(e) => setHoldMinutes(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                <span>5m</span>
                <span>15m (Standard Loop)</span>
                <span>30m</span>
                <span>45m</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">High-Priority Train Granted Green Path</label>
              <select
                value={overrideTrain}
                onChange={(e) => setOverrideTrain(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-blue-700 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>{isSimulating ? 'Simulating Cascade Dynamics...' : 'Run Simulation & Compare ETAs'}</span>
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Simulation Comparative Outcomes</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Ripple Effect Analysis</span>
          </div>

          {result ? (
            <div className="space-y-4">
              {/* Recommendation Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950">
                <div className="font-bold text-blue-900 mb-1 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>RailGati AI Dispatcher Recommendation:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-700">
                  {result.dispatcher_recommendation}
                </p>
              </div>

              {/* Impacted Trains List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800">Individual Train Delay Progression:</h3>
                {result.impacted_trains.map((t, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-xl border text-xs ${
                      t.type === 'EXPEDITED' 
                        ? 'bg-emerald-50/70 border-emerald-200' 
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-900">{t.train_number}</span>
                        <span className="text-slate-700 font-semibold ml-2">{t.train_name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        t.type === 'EXPEDITED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.net_delay_change}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 mb-2">
                      {t.action}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-200 font-mono">
                      <div>
                        <span className="text-slate-500">Baseline Delay: </span>
                        <span className="text-slate-700 font-semibold">{t.baseline_delay_mins}m</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">Simulated Delay: </span>
                        <span className={t.type === 'EXPEDITED' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {t.simulated_delay_mins}m
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-12 text-slate-500 text-xs">
              <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="font-bold text-slate-700 mb-1">No Simulation Executed Yet</div>
              <p className="max-w-sm mx-auto text-[11px] text-slate-500">
                Choose a train to hold, specify detention minutes, and click "Run Simulation" to see immediate cascade delay metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
