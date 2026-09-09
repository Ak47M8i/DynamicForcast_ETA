import React, { useState } from 'react';
import { Station, TrainLiveSummary, DigitalTSRLog } from '../types';
import { 
  ClipboardList, CheckCircle2, Clock, Send, AlertTriangle, 
  ArrowRight, ShieldCheck, FileSpreadsheet
} from 'lucide-react';

interface StationMasterTSRProps {
  stations: Station[];
  trains: TrainLiveSummary[];
  logs: DigitalTSRLog[];
  onLogTSR: (data: {
    station_code: string;
    train_number: string;
    event_type: string;
    platform?: string;
    line_number?: string;
    delay_at_event: number;
    recorded_by: string;
    remarks?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const StationMasterTSR: React.FC<StationMasterTSRProps> = ({
  stations,
  trains,
  logs,
  onLogTSR,
  isSubmitting
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('CNB');
  const [selectedTrain, setSelectedTrain] = useState<string>('12004');
  const [eventType, setEventType] = useState<string>('ARRIVAL');
  const [platform, setPlatform] = useState<string>('PF-1');
  const [lineNumber, setLineNumber] = useState<string>('Main Line 1');
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('SM-CNB-ShiftA');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onLogTSR({
        station_code: selectedStation,
        train_number: selectedTrain,
        event_type: eventType,
        platform,
        line_number: lineNumber,
        delay_at_event: delayMinutes,
        recorded_by: operatorName,
        remarks: remarks || undefined
      });

      setToastMessage(`✓ Logged ${eventType} for Train ${selectedTrain} at ${selectedStation}. Dynamic ETAs updated!`);
      setTimeout(() => setToastMessage(null), 4000);
      setRemarks('');
    } catch (err) {
      alert('Error submitting TSR entry');
    }
  };

  const currentStationObj = stations.find(s => s.code === selectedStation);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 border border-blue-800/40 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <ClipboardList className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Station Master Operations Portal</span>
            </div>
            <h1 className="text-xl font-bold text-white">Digital Train Signal Register (TSR)</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              <strong>100% Paperless Replacement:</strong> Eliminates manual physical paper register ledgers. 
              When a Station Master logs an arrival, departure, or outer-signal halt, RailGati-AI instantly recalculates 
              arrival forecasts across all downstream stations in milliseconds.
            </p>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Total Digital Logs: </span>
            <span className="font-mono font-bold text-cyan-400">{logs.length} Entries Recorded</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-lg animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid: Left Entry Form / Right Recent Digital Register */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Action Entry Form */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Station Master Action Desk</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Station Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Station Master Jurisdiction</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500"
              >
                {stations.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name} ({s.division} Div)
                  </option>
                ))}
              </select>
              {currentStationObj && (
                <div className="mt-1 text-[11px] text-slate-400 flex justify-between">
                  <span>Platforms: <strong>{currentStationObj.platforms_count}</strong></span>
                  <span>Occupied: <strong className="text-amber-400">{currentStationObj.active_occupied_platforms}</strong></span>
                  <span>Bypass Line: <strong>{currentStationObj.has_bypass_line ? 'Yes' : 'No'}</strong></span>
                </div>
              )}
            </div>

            {/* Train Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Train Number</label>
              <select
                value={selectedTrain}
                onChange={(e) => setSelectedTrain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              >
                {trains.map((t) => (
                  <option key={t.number} value={t.number}>
                    {t.number} - {t.name} ({t.train_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type Buttons */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Train Signal Action / Event</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'ARRIVAL', label: '1. Train Arrival', desc: 'Arrived on platform' },
                  { id: 'DEPARTURE', label: '2. Train Departure', desc: 'Departed station' },
                  { id: 'OUTER_SIGNAL_HOLD', label: '3. Hold Outer Signal', desc: 'Held before home' },
                  { id: 'LINE_CLEAR_GIVEN', label: '4. Line Clear Sent', desc: 'Block section clear' },
                ].map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setEventType(ev.id)}
                    className={`p-2 rounded-lg border text-left transition ${
                      eventType === ev.id
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{ev.label}</div>
                    <div className="text-[9px] text-slate-400">{ev.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform & Line */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Platform Allocated</label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="e.g. PF-1, PF-3, Loop-1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Track Line</label>
                <input
                  type="text"
                  value={lineNumber}
                  onChange={(e) => setLineNumber(e.target.value)}
                  placeholder="e.g. Main Line 1, Loop Line"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Delay in minutes */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Observed Delay at Event (Minutes)</label>
              <input
                type="number"
                min="0"
                max="300"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Station Master Operational Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="e.g. Held on outer signal due to Platform 2 freight shunting..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Operator Signature */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Operator ID / Sign-off</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Logging & Recalculating ETAs...' : 'Submit Digital TSR Entry & Update Network'}</span>
            </button>
          </form>
        </div>

        {/* Right: Live Digital TSR Logbook */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Live Digital Train Signal Register (TSR)</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Real-Time Audit Trail</span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Train</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">PF / Line</th>
                  <th className="py-2.5 px-3">Delay</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white font-mono">
                      {log.station_code}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-400 font-mono">
                      {log.train_number}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        log.event_type === 'ARRIVAL' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : log.event_type === 'DEPARTURE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">
                      {log.platform || '-'} / {log.line_number || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={log.delay_at_event > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {log.delay_at_event > 0 ? `+${log.delay_at_event}m` : '0m'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-[180px] truncate" title={log.remarks || ''}>
                      {log.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
