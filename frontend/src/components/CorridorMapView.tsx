import React from 'react';
import { Station, TrackSection, TrainLiveSummary, CautionOrder, WeatherIncident } from '../types';
import { Map, Train, AlertTriangle, CloudFog, Gauge, ArrowRight } from 'lucide-react';

interface CorridorMapViewProps {
  stations: Station[];
  sections: TrackSection[];
  trains: TrainLiveSummary[];
  cautions: CautionOrder[];
  weather: WeatherIncident[];
}

export const CorridorMapView: React.FC<CorridorMapViewProps> = ({
  stations,
  sections,
  trains,
  cautions,
  weather,
}) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-700 mb-1">
              <Map className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Railway Infrastructure Topology</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">High-Density Network 1 (HDN-1) Corridor Map</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              786.5 km Northern & North Central Railway Trunk Line from New Delhi (NDLS) to Pt. Deen Dayal Upadhyaya (DDU). 
              Displays live train positions, block line tracks, speed caution restrictions, and platform yard capacities.
            </p>
          </div>

          <div className="flex gap-2 text-xs">
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px]">Total Distance</div>
              <div className="font-bold text-slate-900 font-mono">786.5 KM</div>
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px]">Trunk Stations</div>
              <div className="font-bold text-blue-700 font-mono">{stations.length} Junctions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Corridor Linear Schematic */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>Linear Track Schematic & Live Block Occupation</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Automatic Signaling Territory</span>
        </div>

        {/* Stations Line Flow */}
        <div className="relative pt-4 pb-12 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* The main rail track line */}
            <div className="relative h-2.5 bg-slate-200 rounded-full my-8 border border-slate-300">
              {/* Rail sleepers graphic pattern */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#94a3b8_0px,#94a3b8_3px,transparent_3px,transparent_14px)] opacity-50"></div>
            </div>

            {/* Station Nodes along the track */}
            <div className="grid grid-cols-10 gap-2 relative -mt-12">
              {stations.map((st, idx) => {
                const trainsAtStation = trains.filter(t => t.current_station_code === st.code);
                const hasCautionNear = cautions.some(c => c.section_from === st.code || c.section_to === st.code);
                const occPercent = Math.round((st.active_occupied_platforms / Math.max(1, st.platforms_count)) * 100);

                return (
                  <div key={st.code} className="flex flex-col items-center text-center relative group">
                    {/* Node Dot on rail */}
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center z-10 shadow-md shadow-blue-500/20 group-hover:scale-125 transition">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </div>

                    {/* Station Name & KM */}
                    <div className="mt-3">
                      <span className="font-mono font-bold text-xs text-slate-900 block">{st.code}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight truncate max-w-[80px]">{st.name}</span>
                      <span className="text-[9px] text-blue-700 font-mono block font-semibold">{st.km_from_origin.toFixed(0)} km</span>
                    </div>

                    {/* Platform Occupancy Pill */}
                    <div className="mt-2 bg-slate-50 px-2 py-0.5 rounded text-[9px] font-mono border border-slate-200" title={`Platforms Occupied: ${st.active_occupied_platforms}/${st.platforms_count}`}>
                      <span className={occPercent >= 70 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {st.active_occupied_platforms}/{st.platforms_count} PF
                      </span>
                    </div>

                    {/* Caution Icon badge */}
                    {hasCautionNear && (
                      <div className="mt-1 bg-amber-50 text-amber-800 p-0.5 rounded border border-amber-200" title="Active Caution Order in this section">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                      </div>
                    )}

                    {/* Active Train Indicator */}
                    {trainsAtStation.length > 0 && (
                      <div className="absolute -top-10 bg-blue-600 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full shadow-md animate-bounce flex items-center space-x-1">
                        <Train className="w-2.5 h-2.5" />
                        <span>{trainsAtStation[0].number}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section Specifications Table */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 mb-3">Corridor Section Engineering Data</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {sections.map((sec) => (
              <div key={sec.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 font-mono">{sec.from_station_code} ➔ {sec.to_station_code}</span>
                  <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-mono text-[10px] border border-blue-200 font-semibold">
                    {sec.tracks_count} Lines ({sec.distance_km} km)
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>MPS: <strong className="text-blue-700 font-mono">{sec.mps_kmh} km/h</strong></span>
                  <span>Auto Blocks: <strong className="text-slate-700 font-mono">{sec.block_sections_count}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
