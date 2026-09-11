import React, { useState } from 'react';
import { CautionOrder, WeatherIncident, Station } from '../types';
import { 
  ShieldAlert, CloudFog, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Gauge, Wrench, ThermometerSnowflake
} from 'lucide-react';

interface CautionOrdersViewProps {
  cautions: CautionOrder[];
  weather: WeatherIncident[];
  stations: Station[];
  onCreateCaution: (order: any) => Promise<void>;
  onRevokeCaution: (id: number) => Promise<void>;
  onUpdateWeather: (data: any) => Promise<void>;
}

export const CautionOrdersView: React.FC<CautionOrdersViewProps> = ({
  cautions,
  weather,
  stations,
  onCreateCaution,
  onRevokeCaution,
  onUpdateWeather
}) => {
  const [sectionFrom, setSectionFrom] = useState('ALJN');
  const [sectionTo, setSectionTo] = useState('TDL');
  const [kmStart, setKmStart] = useState(158.5);
  const [kmEnd, setKmEnd] = useState(163.2);
  const [restrictedSpeed, setRestrictedSpeed] = useState(30);
  const [normalSpeed, setNormalSpeed] = useState(130);
  const [reason, setReason] = useState('Track Maintenance & Ballast Tamping Machine');
  const [issuedBy, setIssuedBy] = useState('Sr. DEN / PRYJ');

  const [weatherFrom, setWeatherFrom] = useState('ETW');
  const [weatherTo, setWeatherTo] = useState('CNB');
  const [condition, setCondition] = useState('DENSE_FOG');
  const [visibility, setVisibility] = useState(300);
  const [speedOverride, setSpeedOverride] = useState(60);

  const handleCreateCaution = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateCaution({
      section_from: sectionFrom,
      section_to: sectionTo,
      km_start: Number(kmStart),
      km_end: Number(kmEnd),
      restricted_speed_kmh: Number(restrictedSpeed),
      normal_speed_kmh: Number(normalSpeed),
      reason,
      issued_by: issuedBy
    });
    alert('Temporary Speed Restriction (TSR) Memo Issued! Dynamic ETAs recomputed.');
  };

  const handleWeatherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateWeather({
      section_from: weatherFrom,
      section_to: weatherTo,
      condition,
      visibility_meters: Number(visibility),
      speed_override: Number(speedOverride)
    });
    alert(`Weather condition updated to ${condition}! Dynamic ETAs updated.`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-700 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Permanent Way & Safety Management</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Temporary Speed Restrictions (TSR) & Weather Protocol</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Engineering speed restrictions (Caution Orders) and seasonal winter fog drastically impact train acceleration/deceleration. 
              Adding or modifying a caution order immediately injects kinematic kinetic loss calculations into every affected train's ETA forecast.
            </p>
          </div>

          <div className="flex gap-2 text-xs">
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px]">Active TSRs</div>
              <div className="font-bold text-amber-700 font-mono">{cautions.length} Speed Limits</div>
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px]">Weather Alerts</div>
              <div className="font-bold text-blue-700 font-mono">{weather.filter(w => w.is_active).length} Active Alerts</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Caution Orders List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Active Caution Orders (TSR Memos)</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Live Track Slow Zones</span>
            </div>

            <div className="space-y-3">
              {cautions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  Corridor track is 100% clear with zero speed restrictions.
                </div>
              ) : (
                cautions.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50/80 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold font-mono">
                          TSR: {c.restricted_speed_kmh} km/h
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Section {c.section_from} ➔ {c.section_to}
                        </span>
                      </div>
                      <button
                        onClick={() => onRevokeCaution(c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition text-xs flex items-center space-x-1"
                        title="Revoke Caution Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold">Revoke</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-700 mb-2">
                      <strong>Reason: </strong> {c.reason}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-amber-100 text-slate-800">
                      <div>
                        <span className="text-slate-500">Location: </span>
                        <span className="font-mono text-slate-900 font-semibold">KM {c.km_start} - {c.km_end}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Normal MPS: </span>
                        <span className="font-mono text-slate-700">{c.normal_speed_kmh} km/h</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Issued By: </span>
                        <span className="text-slate-700 font-medium">{c.issued_by}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Issue New Caution Order Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Issue Digital Caution Order (TSR Memo)</h2>
            </div>

            <form onSubmit={handleCreateCaution} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">From Station</label>
                  <select
                    value={sectionFrom}
                    onChange={(e) => setSectionFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {stations.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">To Station</label>
                  <select
                    value={sectionTo}
                    onChange={(e) => setSectionTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {stations.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Start KM</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kmStart}
                    onChange={(e) => setKmStart(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">End KM</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kmEnd}
                    onChange={(e) => setKmEnd(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Caution Speed (km/h)</label>
                  <input
                    type="number"
                    value={restrictedSpeed}
                    onChange={(e) => setRestrictedSpeed(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-amber-700 font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Normal Speed</label>
                  <input
                    type="number"
                    value={normalSpeed}
                    onChange={(e) => setNormalSpeed(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Engineering Reason for Speed Restriction</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Deep screening machine block, rail fracture fish-plating..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Issuing Authority</label>
                  <input
                    type="text"
                    value={issuedBy}
                    onChange={(e) => setIssuedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Issue TSR Memo</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Weather & Fog Management */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <CloudFog className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Weather & Fog Impact Simulation</h2>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Indian Railways implements Fog Pass Device protocols in North India during winter, capping speed to 60 km/h or 75 km/h. 
              Toggle adverse weather to see how RailGati dynamically projects delayed ETAs along fog corridors.
            </p>

            <form onSubmit={handleWeatherSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">From Station</label>
                  <select
                    value={weatherFrom}
                    onChange={(e) => setWeatherFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {stations.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">To Station</label>
                  <select
                    value={weatherTo}
                    onChange={(e) => setWeatherTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {stations.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Weather Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CLEAR', label: 'Clear' },
                    { id: 'MODERATE_FOG', label: 'Moderate Fog' },
                    { id: 'DENSE_FOG', label: 'Dense Fog' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setCondition(w.id)}
                      className={`p-2 rounded-lg border text-center font-bold text-[11px] transition ${
                        condition === w.id
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Visibility (Meters)</label>
                  <input
                    type="number"
                    value={visibility}
                    onChange={(e) => setVisibility(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Speed Cap (km/h)</label>
                  <input
                    type="number"
                    value={speedOverride}
                    onChange={(e) => setSpeedOverride(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-blue-700 font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition"
              >
                Apply Weather Condition & Recalculate
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
