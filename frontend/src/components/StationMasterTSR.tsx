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
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-700 mb-1">
              <ClipboardList className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Station Master Operations Portal</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Digital Train Signal Register (TSR)</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              <strong>100% Paperless Replacement:</strong> Eliminates manual physical paper register ledgers. 
              When a Station Master logs an arrival, departure, or outer-signal halt, RailGati-AI instantly recalculates 
              arrival forecasts across all downstream stations in milliseconds.
            </p>
          </div>

          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs shadow-sm">
            <span className="text-slate-500">Total Digital Logs: </span>
            <span className="font-mono font-bold text-blue-700">{logs.length} Entries Recorded</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-sm animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Grid: Left Entry Form / Right Recent Digital Register */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Action Entry Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Station Master Action Desk</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Station Selection */}
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Station Master Jurisdiction</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {stations.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name} ({s.division} Div)
                  </option>
                ))}
              </select>
              {currentStationObj && (
                <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                  <span>Platforms: <strong>{currentStationObj.platforms_count}</strong></span>
                  <span>Occupied: <strong className="text-amber-700">{currentStationObj.active_occupied_platforms}</strong></span>
                  <span>Bypass Line: <strong>{currentStationObj.has_bypass_line ? 'Yes' : 'No'}</strong></span>
                </div>
              )}
            </div>

            {/* Train Selection */}
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Train Number</label>
              <select
                value={selectedTrain}
                onChange={(e) => setSelectedTrain(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-slate-600 mb-1 font-semibold">Train Signal Action / Event</label>
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
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{ev.label}</div>
                    <div className={`text-[9px] ${eventType === ev.id ? 'text-blue-100' : 'text-slate-500'}`}>{ev.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform & Line */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Platform Allocated</label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="e.g. PF-1, PF-3, Loop-1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Track Line</label>
                <input
                  type="text"
                  value={lineNumber}
                  onChange={(e) => setLineNumber(e.target.value)}
                  placeholder="e.g. Main Line 1, Loop Line"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Delay in minutes */}
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Observed Delay at Event (Minutes)</label>
              <input
                type="number"
                min="0"
                max="300"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Station Master Operational Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="e.g. Held on outer signal due to Platform 2 freight shunting..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Operator Signature */}
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Operator ID / Sign-off</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Logging & Recalculating ETAs...' : 'Submit Digital TSR Entry & Update Network'}</span>
            </button>
          </form>
        </div>

        {/* Right: Live Digital TSR Logbook */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Live Digital Train Signal Register (TSR)</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Real-Time Audit Trail</span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Train</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">PF / Line</th>
                  <th className="py-2.5 px-3">Delay</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition text-slate-800">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                      {log.station_code}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-700 font-mono">
                      {log.train_number}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        log.event_type === 'ARRIVAL' 
                          ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                          : log.event_type === 'DEPARTURE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {log.platform || '-'} / {log.line_number || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={log.delay_at_event > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700'}>
                        {log.delay_at_event > 0 ? `+${log.delay_at_event}m` : '0m'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[180px] truncate" title={log.remarks || ''}>
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
