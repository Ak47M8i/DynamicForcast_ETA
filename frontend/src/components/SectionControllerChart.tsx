import React, { useState } from 'react';
import { StringChartTrainLine, Station } from '../types';
import { Activity, Clock, Layers, AlertCircle, Eye, Info } from 'lucide-react';

interface SectionControllerChartProps {
  chartData: StringChartTrainLine[];
  stations: Station[];
}

export const SectionControllerChart: React.FC<SectionControllerChartProps> = ({
  chartData,
  stations,
}) => {
  const [selectedTrainNum, setSelectedTrainNum] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<number | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{
    train: StringChartTrainLine;
    coord: any;
    x: number;
    y: number;
  } | null>(null);

  // Geometry dimensions
  const width = 1000;
  const height = 550;
  const paddingLeft = 140;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 60;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // X-axis: Time range from 06:00 (360 mins) to 24:00 (1440 mins)
  const minTimeMins = 360;  // 06:00
  const maxTimeMins = 1440; // 24:00
  const timeSpan = maxTimeMins - minTimeMins;

  // Y-axis: Distance in KM from 0 (NDLS) to 786.5 (DDU)
  const maxKm = 786.5;

  const getX = (minutesFromStart: number) => {
    // minutesFromStart is relative to 06:00 (0 = 06:00, 360 = 12:00, etc.)
    const totalMins = minTimeMins + minutesFromStart;
    const clamped = Math.max(minTimeMins, Math.min(maxTimeMins, totalMins));
    const ratio = (clamped - minTimeMins) / timeSpan;
    return paddingLeft + ratio * chartW;
  };

  const getY = (km: number) => {
    const ratio = km / maxKm;
    return paddingTop + ratio * chartH;
  };

  // Generate hourly grid lines
  const hourMarkers = [];
  for (let m = minTimeMins; m <= maxTimeMins; m += 120) {
    const hours = Math.floor(m / 60);
    const label = `${hours.toString().padStart(2, '0')}:00`;
    const x = paddingLeft + ((m - minTimeMins) / timeSpan) * chartW;
    hourMarkers.push({ label, x });
  }

  const filteredLines = chartData.filter(line => {
    if (filterPriority && line.priority_rank !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 border border-blue-800/40 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Indian Railways Section Control Desk</span>
            </div>
            <h1 className="text-xl font-bold text-white">Digital Time-Distance String Chart (TSR/Graph)</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Digitizing the traditional hand-drawn colored-pencil control charts used in Railway Divisional Control Rooms. 
              Visualizes actual vs dynamically forecasted train trajectories across HDN-1 track blocks. Lines crossing indicate overtakes and precedence conflicts.
            </p>
          </div>

          {/* Priority filter pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setFilterPriority(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterPriority === null ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Trains ({chartData.length})
            </button>
            <button
              onClick={() => setFilterPriority(1)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                filterPriority === 1 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-cyan-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block mr-1"></span>
              Vande Bharat
            </button>
            <button
              onClick={() => setFilterPriority(2)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                filterPriority === 2 ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block mr-1"></span>
              Rajdhani
            </button>
            <button
              onClick={() => setFilterPriority(4)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                filterPriority === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1"></span>
              Superfast
            </button>
            <button
              onClick={() => setFilterPriority(7)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                filterPriority === 7 ? 'bg-amber-800 text-white' : 'bg-slate-800 text-amber-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block mr-1"></span>
              Goods / Freight
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl overflow-x-auto relative">
        <div className="flex justify-between items-center mb-3 text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-5 h-0.5 bg-blue-500 inline-block"></span>
              <span>Past Telemetry (Actual)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-cyan-400 inline-block"></span>
              <span className="text-cyan-300 font-semibold">AI Dynamic Forecast</span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block"></span>
              <span>Loop / Overtake Conflict</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Scale: 786.5 KM Corridor • Time: 06:00 - 24:00 IST
          </span>
        </div>

        {/* SVG String Chart Canvas */}
        <div className="min-w-[900px] relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-[#070d1e] rounded-xl border border-slate-800/80 shadow-inner">
            {/* Horizontal Station Grid Lines */}
            {stations.map((st) => {
              const y = getY(st.km_from_origin);
              return (
                <g key={st.code}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />
                  {/* Station Label on Y-axis */}
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                    fontWeight="bold"
                  >
                    {st.code} ({st.km_from_origin.toFixed(0)}km)
                  </text>
                  <text
                    x={paddingLeft - 60}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="8"
                    textAnchor="end"
                  >
                    {st.name}
                  </text>
                </g>
              );
            })}

            {/* Vertical Time Grid Lines */}
            {hourMarkers.map((h, i) => (
              <g key={i}>
                <line
                  x1={h.x}
                  y1={paddingTop}
                  x2={h.x}
                  y2={height - paddingBottom}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x={h.x}
                  y={height - paddingBottom + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {h.label}
                </text>
              </g>
            ))}

            {/* Train Trajectory Lines */}
            {filteredLines.map((line) => {
              const isSelected = selectedTrainNum === line.train_number;
              const coords = line.coordinates;
              if (coords.length < 2) return null;

              // Build path points
              const pathD = coords.reduce((acc, curr, index) => {
                const x = getX(curr.minutes_from_start);
                const y = getY(curr.km);
                return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '');

              return (
                <g 
                  key={line.train_number}
                  className="cursor-pointer transition-opacity"
                  opacity={selectedTrainNum && !isSelected ? 0.25 : 1}
                  onClick={() => setSelectedTrainNum(isSelected ? null : line.train_number)}
                >
                  {/* Trajectory glow line if selected */}
                  {isSelected && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={line.color}
                      strokeWidth="6"
                      opacity="0.35"
                      filter="blur(2px)"
                    />
                  )}

                  {/* Main Trajectory Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={isSelected ? "3" : "2"}
                    strokeDasharray={line.coordinates.some(c => c.is_forecast) ? "4,2" : undefined}
                  />

                  {/* Station Coordinate Nodes */}
                  {coords.map((c, ci) => {
                    const cx = getX(c.minutes_from_start);
                    const cy = getY(c.km);

                    return (
                      <circle
                        key={ci}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? "4" : "2.5"}
                        fill={c.is_forecast ? "#38bdf8" : line.color}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                        onMouseEnter={() => setHoverCoord({ train: line, coord: c, x: cx, y: cy })}
                        onMouseLeave={() => setHoverCoord(null)}
                      />
                    );
                  })}

                  {/* Label on the first coordinate */}
                  {coords.length > 0 && (
                    <text
                      x={getX(coords[0].minutes_from_start) + 4}
                      y={getY(coords[0].km) - 5}
                      fill={line.color}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {line.train_number}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip Overlay */}
          {hoverCoord && (
            <div 
              className="absolute pointer-events-none bg-slate-900/95 border border-cyan-500/50 p-2.5 rounded-lg shadow-2xl text-xs z-20 backdrop-blur-md"
              style={{ 
                left: `${Math.min(hoverCoord.x + 10, width - 200)}px`, 
                top: `${Math.max(hoverCoord.y - 60, 10)}px` 
              }}
            >
              <div className="font-bold text-white font-mono flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoverCoord.train.color }}></span>
                <span>Train {hoverCoord.train.train_number}</span>
                <span className="text-[10px] text-slate-400">({hoverCoord.train.train_name})</span>
              </div>
              <div className="text-[11px] text-cyan-300 mt-1">
                Station: <strong>{hoverCoord.coord.station_code}</strong> • Time: <strong>{hoverCoord.coord.time}</strong>
              </div>
              <div className="text-[10px] text-slate-400">
                Type: {hoverCoord.coord.is_forecast ? 'Dynamic AI Forecast' : 'Recorded Telemetry'}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            <div>
              <div className="font-semibold text-white">Vande Bharat (P1)</div>
              <div className="text-[10px] text-slate-400">Max Speed 160 km/h</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <div>
              <div className="font-semibold text-white">Rajdhani Express (P2)</div>
              <div className="text-[10px] text-slate-400">Max Speed 130 km/h</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <div>
              <div className="font-semibold text-white">Superfast Mail/Exp (P4)</div>
              <div className="text-[10px] text-slate-400">Max Speed 130 km/h</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="w-3 h-3 rounded-full bg-amber-700"></span>
            <div>
              <div className="font-semibold text-white">Goods / Freight (P7)</div>
              <div className="text-[10px] text-slate-400">Max Speed 75 km/h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
