import React, { useState } from 'react';
import { 
  TrainLiveSummary, TrainDetailResponse, DynamicStopForecast 
} from '../types';
import { 
  Train, Clock, ShieldAlert, ArrowRight, CheckCircle2, 
  AlertTriangle, Gauge, Info, ChevronRight, Zap, CloudFog
} from 'lucide-react';

interface TrainTrackerViewProps {
  trains: TrainLiveSummary[];
  selectedTrain: TrainDetailResponse | null;
  onSelectTrain: (trainNumber: string) => void;
  isLoading: boolean;
}

export const TrainTrackerView: React.FC<TrainTrackerViewProps> = ({
  trains,
  selectedTrain,
  onSelectTrain,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredTrains = trains.filter(t => {
    const matchesSearch = t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || t.train_type === filterType;
    return matchesSearch && matchesType;
  });

  const getPriorityBadge = (type: string, rank: number) => {
    switch (type) {
      case 'VANDE_BHARAT':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">Vande Bharat (P1)</span>;
      case 'RAJDHANI':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">Rajdhani (P2)</span>;
      case 'SHATABDI':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">Shatabdi (P3)</span>;
      case 'SUPERFAST':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">Superfast (P4)</span>;
      case 'EXPRESS':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] px-2 py-0.5 rounded-full font-medium">Express (P5)</span>;
      case 'PASSENGER':
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/40 text-[10px] px-2 py-0.5 rounded-full font-medium">Passenger (P6)</span>;
      default:
        return <span className="bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] px-2 py-0.5 rounded-full font-medium">Freight (P7)</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <span className="inline-flex items-center text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>Running</span>;
      case 'HELD_LOOP_PRECEDENCE':
        return <span className="inline-flex items-center text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs font-semibold border border-amber-500/20"><AlertTriangle className="w-3 h-3 mr-1" />Looped (Precedence)</span>;
      case 'HELD_OUTER_SIGNAL':
        return <span className="inline-flex items-center text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-xs font-semibold border border-rose-500/20"><AlertTriangle className="w-3 h-3 mr-1" />Held at Outer Signal</span>;
      case 'HALTED_AT_STATION':
        return <span className="inline-flex items-center text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs font-semibold border border-blue-500/20">At Station Platform</span>;
      default:
        return <span className="inline-flex items-center text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded text-xs font-medium border border-slate-700">Scheduled</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation of Dynamic ETA */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 border border-blue-800/40 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Dynamic Multi-Factor Forecasting</span>
            </div>
            <h1 className="text-xl font-bold text-white">Coaching Train ETA Forecast Board</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Unlike legacy NTES linear extrapolation, RailGati-AI recalculates dynamic arrival times in real time by factoring in 
              <strong> Sectional Precedence Overtakes</strong>, <strong>Temporary Speed Restrictions (TSR)</strong>, <strong>Weather/Fog Speed Caps</strong>, <strong>Terminal Platform Dwell Congestion</strong>, and <strong>Timetable Recovery Slack</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-[10px]">Track Corridor</div>
              <div className="font-semibold text-white">NDLS ↔ DDU (HDN-1)</div>
            </div>
            <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-[10px]">Active Coaching Trains</div>
              <div className="font-semibold text-cyan-400 font-mono">{trains.length} Trains Telemetric</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Train List & Search */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search & Filter Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
            <input
              type="text"
              placeholder="Search train by number or name (e.g. 22436, Rajdhani)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            <div className="flex flex-wrap gap-1 text-[11px]">
              {['ALL', 'VANDE_BHARAT', 'RAJDHANI', 'SHATABDI', 'SUPERFAST', 'EXPRESS'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                    filterType === t 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Train Cards List */}
          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredTrains.map((t) => {
              const isSelected = selectedTrain?.train.number === t.number;
              const hasDelay = t.current_delay_minutes > 0;

              return (
                <div
                  key={t.number}
                  onClick={() => onSelectTrain(t.number)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/70 border-blue-500 ring-1 ring-blue-500/50 shadow-lg'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-white">{t.number}</span>
                      {getPriorityBadge(t.train_type, t.priority_rank)}
                    </div>
                    {getStatusBadge(t.current_status)}
                  </div>

                  <div className="text-xs font-semibold text-slate-200 truncate mb-2">
                    {t.name}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-400">Current Pos: </span>
                      <span className="font-medium text-slate-200">{t.current_station_code} → {t.next_station_code}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">Speed: </span>
                      <span className="font-mono font-bold text-cyan-400">{t.current_speed_kmh} km/h</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Current Delay: </span>
                      <span className={`font-mono font-bold ${hasDelay ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {hasDelay ? `+${t.current_delay_minutes}m` : 'Right Time'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">Dynamic ETA: </span>
                      <span className="font-mono font-bold text-white">{t.destination_eta}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                    <span>Confidence: <strong className="text-cyan-400">{t.overall_confidence_percent}%</strong></span>
                    <span className="flex items-center text-blue-400 hover:underline">
                      View Forecast <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Forecast, Explainability & Station Timetable */}
        <div className="lg:col-span-8 space-y-5">
          {selectedTrain ? (
            <>
              {/* Selected Train Header Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h2 className="text-2xl font-black font-mono text-white tracking-tight">
                        {selectedTrain.train.number}
                      </h2>
                      <span className="text-lg font-bold text-slate-200">
                        {selectedTrain.train.name}
                      </span>
                      {getPriorityBadge(selectedTrain.train.train_type, selectedTrain.train.priority_rank)}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-3">
                      <span>Rake: <strong className="text-slate-200">{selectedTrain.train.rake_type} ({selectedTrain.train.length_coaches} Coaches)</strong></span>
                      <span>•</span>
                      <span>Max Speed: <strong className="text-slate-200">{selectedTrain.train.max_speed_kmh} km/h</strong></span>
                      <span>•</span>
                      <span>Corridor: <strong className="text-slate-200">{selectedTrain.train.origin_code} ➔ {selectedTrain.train.destination_code}</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Final Destination Dynamic ETA</div>
                    <div className="text-2xl font-black font-mono text-cyan-400">
                      {selectedTrain.summary.destination_eta}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Static NTES Estimate: <span className="line-through text-slate-500 font-mono">{selectedTrain.summary.destination_static_eta}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Telemetry Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Operational Status</div>
                    <div className="mt-1">{getStatusBadge(selectedTrain.live_state.operational_status)}</div>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Speed</div>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      {selectedTrain.live_state.current_speed_kmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Telemetric Delay</div>
                    <div className={`text-base font-bold font-mono mt-0.5 ${selectedTrain.live_state.current_delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {selectedTrain.live_state.current_delay_minutes > 0 ? `+${selectedTrain.live_state.current_delay_minutes}m` : '0m (On Time)'}
                    </div>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">AI Confidence Score</div>
                    <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                      {selectedTrain.summary.overall_confidence_percent}%
                    </div>
                  </div>
                </div>

                {/* Held reason alert if applicable */}
                {selectedTrain.live_state.held_reason && (
                  <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Active Dispatch Condition: </strong>
                      {selectedTrain.live_state.held_reason}
                    </div>
                  </div>
                )}
              </div>

              {/* Explainable Delay Contributors (The SIH Secret Sauce) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Dynamic Delay Attribution & Explainability</h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Factors calculated by RailGati Kinematic & Stochastic Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Gather unique delay factors from stops */}
                  {(() => {
                    const allFactors = selectedTrain.forecast_stops.flatMap(s => s.delay_factors);
                    if (allFactors.length === 0) {
                      return (
                        <div className="col-span-3 text-center py-4 text-xs text-slate-400">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                          Clear track ahead. Train is operating within working timetable parameters.
                        </div>
                      );
                    }
                    return allFactors.slice(0, 6).map((f, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-xl border text-xs ${
                          f.impact_minutes > 0 
                            ? 'bg-rose-950/20 border-rose-900/40 text-slate-300' 
                            : 'bg-emerald-950/20 border-emerald-900/40 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-white text-[11px] truncate">{f.label}</span>
                          <span className={`font-mono font-bold text-xs px-1.5 py-0.2 rounded ${
                            f.impact_minutes > 0 
                              ? 'bg-rose-500/20 text-rose-300' 
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {f.impact_minutes > 0 ? `+${f.impact_minutes}m` : `${f.impact_minutes}m`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {f.description}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Station-by-Station Detailed Timetable */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Dynamic Forecast vs Scheduled vs Static NTES Timetable</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedTrain.forecast_stops.length} Corridor Stops
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium text-[11px]">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Station</th>
                        <th className="py-2.5 px-3">Scheduled Time</th>
                        <th className="py-2.5 px-3">Static NTES</th>
                        <th className="py-2.5 px-3 text-cyan-300 font-bold bg-blue-950/40">Dynamic Forecast ETA</th>
                        <th className="py-2.5 px-3">Delay / Delta</th>
                        <th className="py-2.5 px-3">Confidence Window</th>
                        <th className="py-2.5 px-3">Platform</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {selectedTrain.forecast_stops.map((stop) => {
                        const isPast = stop.status === 'PAST';
                        const isCurrent = stop.status === 'CURRENT';

                        return (
                          <tr 
                            key={stop.station_code}
                            className={`transition ${
                              isCurrent 
                                ? 'bg-blue-950/50 font-semibold' 
                                : isPast 
                                  ? 'opacity-60 bg-slate-950/30' 
                                  : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-500">{stop.stop_sequence}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white">{stop.station_code}</div>
                              <div className="text-[10px] text-slate-400">{stop.station_name}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">
                              <div>Arr: {stop.scheduled_arrival}</div>
                              <div>Dep: {stop.scheduled_departure}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              {stop.static_ntes_eta}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-cyan-300 bg-blue-950/30">
                              <div>Arr: {stop.dynamic_eta_arrival}</div>
                              <div className="text-[10px] text-cyan-400/80">Dep: {stop.dynamic_eta_departure}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <div className={stop.predicted_delay_minutes > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                                {stop.predicted_delay_minutes > 0 ? `+${stop.predicted_delay_minutes}m` : '0m'}
                              </div>
                              {stop.accuracy_delta_minutes !== 0 && (
                                <div className="text-[10px] text-cyan-400">
                                  {stop.accuracy_delta_minutes > 0 ? `+${stop.accuracy_delta_minutes}m vs static` : `${stop.accuracy_delta_minutes}m recovered`}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                              <div>{stop.confidence_window}</div>
                              <div className="text-[10px] text-slate-400">{stop.confidence_percent}% confidence</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-amber-300 font-semibold">
                              {stop.platform_assigned}
                            </td>
                            <td className="py-2.5 px-3">
                              {isCurrent ? (
                                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                                  Current
                                </span>
                              ) : isPast ? (
                                <span className="text-slate-500 text-[10px]">Departed</span>
                              ) : (
                                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                  Upcoming
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Train className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-white mb-1">Select a Train to Inspect Dynamic Forecast</h3>
              <p className="text-xs max-w-md mx-auto">
                Click any train in the list on the left to see its multi-factor ETA prediction, precedence conflicts, and stop-by-stop confidence intervals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
