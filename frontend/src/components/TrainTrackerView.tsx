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
        return <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Vande Bharat (P1)</span>;
      case 'RAJDHANI':
        return <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Rajdhani (P2)</span>;
      case 'SHATABDI':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Shatabdi (P3)</span>;
      case 'SUPERFAST':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Superfast (P4)</span>;
      case 'EXPRESS':
        return <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] px-2.5 py-0.5 rounded-full font-semibold">Express (P5)</span>;
      case 'PASSENGER':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-2.5 py-0.5 rounded-full font-medium">Passenger (P6)</span>;
      default:
        return <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[10px] px-2.5 py-0.5 rounded-full font-medium">Freight (P7)</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            Running
          </span>
        );
      case 'HELD_LOOP_PRECEDENCE':
        return (
          <span className="inline-flex items-center text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            Looped (Precedence)
          </span>
        );
      case 'HELD_OUTER_SIGNAL':
        return (
          <span className="inline-flex items-center text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
            Held Outer Signal
          </span>
        );
      case 'HALTED_AT_STATION':
        return (
          <span className="inline-flex items-center text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-xs font-semibold border border-blue-200">
            At Platform
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation of Dynamic ETA */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-700 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Dynamic Multi-Factor Forecasting</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Coaching Train ETA Forecast Board</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Unlike legacy NTES linear extrapolation, RailGati-AI recalculates dynamic arrival times in real time by factoring in 
              <strong> Sectional Precedence Overtakes</strong>, <strong>Temporary Speed Restrictions (TSR)</strong>, <strong>Weather/Fog Speed Caps</strong>, <strong>Terminal Platform Dwell Congestion</strong>, and <strong>Timetable Recovery Slack</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px]">Track Corridor</div>
              <div className="font-semibold text-slate-800">NDLS ↔ DDU (HDN-1)</div>
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px]">Active Coaching Trains</div>
              <div className="font-semibold text-blue-700 font-mono">{trains.length} Trains Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Train List & Search */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm">
            <input
              type="text"
              placeholder="Search train by number or name (e.g. 22436, Rajdhani)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <div className="flex flex-wrap gap-1 text-[11px]">
              {['ALL', 'VANDE_BHARAT', 'RAJDHANI', 'SHATABDI', 'SUPERFAST', 'EXPRESS'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    filterType === t 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
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
                      ? 'bg-blue-50/90 border-blue-400 ring-1 ring-blue-400/40 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{t.number}</span>
                      {getPriorityBadge(t.train_type, t.priority_rank)}
                    </div>
                    {getStatusBadge(t.current_status)}
                  </div>

                  <div className="text-xs font-semibold text-slate-800 truncate mb-2">
                    {t.name}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500">Current Pos: </span>
                      <span className="font-medium text-slate-800">{t.current_station_code} → {t.next_station_code}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500">Speed: </span>
                      <span className="font-mono font-bold text-blue-700">{t.current_speed_kmh} km/h</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Current Delay: </span>
                      <span className={`font-mono font-bold ${hasDelay ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {hasDelay ? `+${t.current_delay_minutes}m` : 'Right Time'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500">Dynamic ETA: </span>
                      <span className="font-mono font-bold text-slate-900">{t.destination_eta}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                    <span>Confidence: <strong className="text-blue-700">{t.overall_confidence_percent}%</strong></span>
                    <span className="flex items-center text-blue-600 font-semibold hover:underline">
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
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h2 className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                        {selectedTrain.train.number}
                      </h2>
                      <span className="text-lg font-bold text-slate-800">
                        {selectedTrain.train.name}
                      </span>
                      {getPriorityBadge(selectedTrain.train.train_type, selectedTrain.train.priority_rank)}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-3">
                      <span>Rake: <strong className="text-slate-700">{selectedTrain.train.rake_type} ({selectedTrain.train.length_coaches} Coaches)</strong></span>
                      <span>•</span>
                      <span>Max Speed: <strong className="text-slate-700">{selectedTrain.train.max_speed_kmh} km/h</strong></span>
                      <span>•</span>
                      <span>Corridor: <strong className="text-slate-700">{selectedTrain.train.origin_code} ➔ {selectedTrain.train.destination_code}</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">Final Destination Dynamic ETA</div>
                    <div className="text-2xl font-black font-mono text-blue-600">
                      {selectedTrain.summary.destination_eta}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Static NTES Estimate: <span className="line-through text-slate-400 font-mono">{selectedTrain.summary.destination_static_eta}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Telemetry Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Operational Status</div>
                    <div className="mt-1">{getStatusBadge(selectedTrain.live_state.operational_status)}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Speed</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {selectedTrain.live_state.current_speed_kmh} <span className="text-xs text-slate-500 font-normal">km/h</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Telemetric Delay</div>
                    <div className={`text-base font-bold font-mono mt-0.5 ${selectedTrain.live_state.current_delay_minutes > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {selectedTrain.live_state.current_delay_minutes > 0 ? `+${selectedTrain.live_state.current_delay_minutes}m` : '0m (On Time)'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">AI Confidence Score</div>
                    <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
                      {selectedTrain.summary.overall_confidence_percent}%
                    </div>
                  </div>
                </div>

                {/* Held reason alert if applicable */}
                {selectedTrain.live_state.held_reason && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Active Dispatch Condition: </strong>
                      {selectedTrain.live_state.held_reason}
                    </div>
                  </div>
                )}
              </div>

              {/* Explainable Delay Contributors */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Dynamic Delay Attribution & Explainability</h3>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Calculated by RailGati Kinematic & Stochastic Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(() => {
                    const allFactors = selectedTrain.forecast_stops.flatMap(s => s.delay_factors);
                    if (allFactors.length === 0) {
                      return (
                        <div className="col-span-3 text-center py-4 text-xs text-slate-500">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                          Clear track ahead. Train is operating within working timetable parameters.
                        </div>
                      );
                    }
                    return allFactors.slice(0, 6).map((f, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-xl border text-xs ${
                          f.impact_minutes > 0 
                            ? 'bg-rose-50/70 border-rose-200 text-slate-800' 
                            : 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-slate-900 text-[11px] truncate">{f.label}</span>
                          <span className={`font-mono font-bold text-xs px-1.5 py-0.2 rounded ${
                            f.impact_minutes > 0 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {f.impact_minutes > 0 ? `+${f.impact_minutes}m` : `${f.impact_minutes}m`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-snug">
                          {f.description}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Station-by-Station Detailed Timetable */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Dynamic Forecast vs Scheduled vs Static NTES Timetable</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedTrain.forecast_stops.length} Corridor Stops
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Station</th>
                        <th className="py-2.5 px-3">Scheduled Time</th>
                        <th className="py-2.5 px-3">Static NTES</th>
                        <th className="py-2.5 px-3 text-blue-800 font-bold bg-blue-50/70">Dynamic Forecast ETA</th>
                        <th className="py-2.5 px-3">Delay / Delta</th>
                        <th className="py-2.5 px-3">Confidence Window</th>
                        <th className="py-2.5 px-3">Platform</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {selectedTrain.forecast_stops.map((stop) => {
                        const isPast = stop.status === 'PAST';
                        const isCurrent = stop.status === 'CURRENT';

                        return (
                          <tr 
                            key={stop.station_code}
                            className={`transition ${
                              isCurrent 
                                ? 'bg-blue-50/60 font-semibold text-slate-900' 
                                : isPast 
                                  ? 'opacity-60 bg-slate-50/40 text-slate-500' 
                                  : 'hover:bg-slate-50/70 text-slate-800'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-400">{stop.stop_sequence}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{stop.station_code}</div>
                              <div className="text-[10px] text-slate-500">{stop.station_name}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              <div>Arr: {stop.scheduled_arrival}</div>
                              <div>Dep: {stop.scheduled_departure}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {stop.static_ntes_eta}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700 bg-blue-50/40">
                              <div>Arr: {stop.dynamic_eta_arrival}</div>
                              <div className="text-[10px] text-blue-600">Dep: {stop.dynamic_eta_departure}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <div className={stop.predicted_delay_minutes > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700'}>
                                {stop.predicted_delay_minutes > 0 ? `+${stop.predicted_delay_minutes}m` : '0m'}
                              </div>
                              {stop.accuracy_delta_minutes !== 0 && (
                                <div className="text-[10px] text-blue-600">
                                  {stop.accuracy_delta_minutes > 0 ? `+${stop.accuracy_delta_minutes}m vs static` : `${stop.accuracy_delta_minutes}m recovered`}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                              <div>{stop.confidence_window}</div>
                              <div className="text-[10px] text-slate-500">{stop.confidence_percent}% confidence</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-amber-800 font-semibold">
                              {stop.platform_assigned}
                            </td>
                            <td className="py-2.5 px-3">
                              {isCurrent ? (
                                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] px-2 py-0.5 rounded font-bold">
                                  Current
                                </span>
                              ) : isPast ? (
                                <span className="text-slate-400 text-[10px]">Departed</span>
                              ) : (
                                <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
              <Train className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Select a Train to Inspect Dynamic Forecast</h3>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                Click any train in the list on the left to see its multi-factor ETA prediction, precedence conflicts, and stop-by-stop confidence intervals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
