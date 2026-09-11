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
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-700 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Indian Railways Section Control Desk</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Digital Time-Distance String Chart (TSR/Graph)</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Digitizing the traditional hand-drawn colored-pencil control charts used in Railway Divisional Control Rooms. 
              Visualizes actual vs dynamically forecasted train trajectories across HDN-1 track blocks. Lines crossing indicate overtakes and precedence conflicts.
            </p>
          </div>

          {/* Priority filter pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setFilterPriority(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterPriority === null 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Trains ({chartData.length})
            </button>
            <button
              onClick={() => setFilterPriority(1)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                filterPriority === 1 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block mr-1"></span>
              Vande Bharat
            </button>
            <button
              onClick={() => setFilterPriority(2)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                filterPriority === 2 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block mr-1"></span>
              Rajdhani
            </button>
            <button
              onClick={() => setFilterPriority(4)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                filterPriority === 4 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block mr-1"></span>
              Superfast
            </button>
            <button
              onClick={() => setFilterPriority(7)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                filterPriority === 7 
                  ? 'bg-amber-700 text-white shadow-sm' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block mr-1"></span>
              Goods / Freight
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto relative">
        <div className="flex justify-between items-center mb-3 text-xs text-slate-600">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-5 h-1 bg-blue-600 inline-block rounded"></span>
              <span className="font-medium text-slate-700">Past Telemetry (Actual)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-sky-500 inline-block"></span>
              <span className="text-sky-700 font-semibold">AI Dynamic Forecast</span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block"></span>
              <span>Loop / Overtake Conflict</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Scale: 786.5 KM Corridor • Time: 06:00 - 24:00 IST
          </span>
        </div>

        {/* SVG String Chart Canvas */}
        <div className="min-w-[900px] relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-[#fafbfc] rounded-xl border border-slate-200 shadow-inner">
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
                    stroke="#e2e8f0"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />
                  {/* Station Label on Y-axis */}
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    fill="#334155"
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
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={h.x}
                  y={height - paddingBottom + 18}
                  fill="#475569"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="600"
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
                      opacity="0.25"
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
                        fill={c.is_forecast ? "#0ea5e9" : line.color}
                        stroke="#ffffff"
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
              className="absolute pointer-events-none bg-white/95 border border-slate-300 p-2.5 rounded-lg shadow-xl text-xs z-20 backdrop-blur-md text-slate-900"
              style={{ 
                left: `${Math.min(hoverCoord.x + 10, width - 200)}px`, 
                top: `${Math.max(hoverCoord.y - 60, 10)}px` 
              }}
            >
              <div className="font-bold text-slate-900 font-mono flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoverCoord.train.color }}></span>
                <span>Train {hoverCoord.train.train_number}</span>
                <span className="text-[10px] text-slate-500">({hoverCoord.train.train_name})</span>
              </div>
              <div className="text-[11px] text-blue-700 font-semibold mt-1">
                Station: <strong>{hoverCoord.coord.station_code}</strong> • Time: <strong>{hoverCoord.coord.time}</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                Type: {hoverCoord.coord.is_forecast ? 'Dynamic AI Forecast' : 'Recorded Telemetry'}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="w-3 h-3 rounded-full bg-sky-600"></span>
            <div>
              <div className="font-semibold text-slate-800">Vande Bharat (P1)</div>
              <div className="text-[10px] text-slate-500">Max Speed 160 km/h</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="w-3 h-3 rounded-full bg-red-600"></span>
            <div>
              <div className="font-semibold text-slate-800">Rajdhani Express (P2)</div>
              <div className="text-[10px] text-slate-500">Max Speed 130 km/h</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <div>
              <div className="font-semibold text-slate-800">Superfast Mail/Exp (P4)</div>
              <div className="text-[10px] text-slate-500">Max Speed 130 km/h</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="w-3 h-3 rounded-full bg-amber-700"></span>
            <div>
              <div className="font-semibold text-slate-800">Goods / Freight (P7)</div>
              <div className="text-[10px] text-slate-500">Max Speed 75 km/h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
