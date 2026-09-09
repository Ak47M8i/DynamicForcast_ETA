import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TrainTrackerView } from './components/TrainTrackerView';
import { SectionControllerChart } from './components/SectionControllerChart';
import { StationMasterTSR } from './components/StationMasterTSR';
import { CautionOrdersView } from './components/CautionOrdersView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { CorridorMapView } from './components/CorridorMapView';
import { api } from './api';
import { 
  TrainLiveSummary, TrainDetailResponse, Station, TrackSection, 
  CautionOrder, WeatherIncident, DigitalTSRLog, StringChartTrainLine 
} from './types';
import { Train } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('track');
  const [trains, setTrains] = useState<TrainLiveSummary[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainDetailResponse | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<TrackSection[]>([]);
  const [cautions, setCautions] = useState<CautionOrder[]>([]);
  const [weather, setWeather] = useState<WeatherIncident[]>([]);
  const [logs, setLogs] = useState<DigitalTSRLog[]>([]);
  const [chartData, setChartData] = useState<StringChartTrainLine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadAllData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [trainsList, corridorData, stringChart, tsrLogs] = await Promise.all([
        api.getTrains(),
        api.getCorridor(),
        api.getStringChart(),
        api.getTSRLogs()
      ]);

      setTrains(trainsList);
      setStations(corridorData.stations);
      setSections(corridorData.sections);
      setCautions(corridorData.caution_orders);
      setWeather(corridorData.weather_incidents);
      setChartData(stringChart);
      setLogs(tsrLogs);

      // If no train selected or currently selected train needs refresh
      if (trainsList.length > 0) {
        const trainToFetch = selectedTrain?.train.number || '22436'; // Default Vande Bharat
        const detail = await api.getTrainForecast(trainToFetch);
        setSelectedTrain(detail);
      }
    } catch (err) {
      console.error('Failed to load corridor data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData(true);
    // Periodic background telemetry refresh every 20 seconds
    const timer = setInterval(() => loadAllData(false), 20000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectTrain = async (trainNumber: string) => {
    try {
      const detail = await api.getTrainForecast(trainNumber);
      setSelectedTrain(detail);
    } catch (err) {
      console.error('Error fetching train details:', err);
    }
  };

  const handleLogTSR = async (data: any) => {
    await api.logTSR(data);
    await loadAllData(false);
  };

  const handleCreateCaution = async (order: any) => {
    await api.createCautionOrder(order);
    await loadAllData(false);
  };

  const handleRevokeCaution = async (id: number) => {
    await api.revokeCautionOrder(id);
    await loadAllData(false);
  };

  const handleUpdateWeather = async (data: any) => {
    await api.updateWeather(data);
    await loadAllData(false);
  };

  const handleSimulate = async (req: any) => {
    return await api.simulateScenario(req);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1329] text-slate-100">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadAllData(false)}
        isRefreshing={isRefreshing}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse">
              <Train className="w-6 h-6 text-white animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              Connecting to RailGati-AI Telemetric Server & Seeding Corridor Data...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'track' && (
              <TrainTrackerView
                trains={trains}
                selectedTrain={selectedTrain}
                onSelectTrain={handleSelectTrain}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'chart' && (
              <SectionControllerChart
                chartData={chartData}
                stations={stations}
              />
            )}

            {activeTab === 'tsr' && (
              <StationMasterTSR
                stations={stations}
                trains={trains}
                logs={logs}
                onLogTSR={handleLogTSR}
                isSubmitting={isRefreshing}
              />
            )}

            {activeTab === 'cautions' && (
              <CautionOrdersView
                cautions={cautions}
                weather={weather}
                stations={stations}
                onCreateCaution={handleCreateCaution}
                onRevokeCaution={handleRevokeCaution}
                onUpdateWeather={handleUpdateWeather}
              />
            )}

            {activeTab === 'simulator' && (
              <WhatIfSimulator
                trains={trains}
                stations={stations}
                onSimulate={handleSimulate}
              />
            )}

            {activeTab === 'corridor' && (
              <CorridorMapView
                stations={stations}
                sections={sections}
                trains={trains}
                cautions={cautions}
                weather={weather}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-4 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">RailGati-AI</span>
            <span>•</span>
            <span>Smart India Hackathon (SIH 2026) Problem Statement 26028</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Dynamic Forecast of ETA for Coaching Trains • Northern & North Central Railway HDN-1 Corridor
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
