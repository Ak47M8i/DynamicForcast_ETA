import { 
  TrainLiveSummary, TrainDetailResponse, Station, TrackSection, 
  CautionOrder, WeatherIncident, DigitalTSRLog, StringChartTrainLine, 
  SimulationResult 
} from './types';

const API_BASE = '/api';

export const api = {
  async getTrains(): Promise<TrainLiveSummary[]> {
    const res = await fetch(`${API_BASE}/trains`);
    if (!res.ok) throw new Error('Failed to fetch trains');
    return res.json();
  },

  async getTrainForecast(trainNumber: string): Promise<TrainDetailResponse> {
    const res = await fetch(`${API_BASE}/trains/${trainNumber}`);
    if (!res.ok) throw new Error(`Failed to fetch forecast for ${trainNumber}`);
    return res.json();
  },

  async getStations(): Promise<Station[]> {
    const res = await fetch(`${API_BASE}/stations`);
    if (!res.ok) throw new Error('Failed to fetch stations');
    return res.json();
  },

  async getCorridor(): Promise<{
    corridor_name: string;
    total_distance_km: number;
    stations: Station[];
    sections: TrackSection[];
    trains: any[];
    live_states: any[];
    caution_orders: CautionOrder[];
    weather_incidents: WeatherIncident[];
  }> {
    const res = await fetch(`${API_BASE}/corridor`);
    if (!res.ok) throw new Error('Failed to fetch corridor data');
    return res.json();
  },

  async getStringChart(): Promise<StringChartTrainLine[]> {
    const res = await fetch(`${API_BASE}/controller/string-chart`);
    if (!res.ok) throw new Error('Failed to fetch string chart data');
    return res.json();
  },

  async logTSR(data: {
    station_code: string;
    train_number: string;
    event_type: string;
    platform?: string;
    line_number?: string;
    delay_at_event: number;
    recorded_by: string;
    remarks?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/tsr/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to log TSR entry');
    return res.json();
  },

  async getTSRLogs(stationCode?: string): Promise<DigitalTSRLog[]> {
    const url = stationCode ? `${API_BASE}/tsr/logs?station_code=${stationCode}` : `${API_BASE}/tsr/logs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch TSR logs');
    return res.json();
  },

  async getCautionOrders(): Promise<CautionOrder[]> {
    const res = await fetch(`${API_BASE}/caution-orders`);
    if (!res.ok) throw new Error('Failed to fetch caution orders');
    return res.json();
  },

  async createCautionOrder(order: {
    section_from: string;
    section_to: string;
    km_start: number;
    km_end: number;
    restricted_speed_kmh: number;
    normal_speed_kmh: number;
    reason: string;
    issued_by: string;
  }): Promise<CautionOrder> {
    const res = await fetch(`${API_BASE}/caution-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error('Failed to create caution order');
    return res.json();
  },

  async revokeCautionOrder(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/caution-orders/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to revoke caution order');
    return res.json();
  },

  async updateWeather(data: {
    section_from: string;
    section_to: string;
    condition: string;
    visibility_meters: number;
    speed_override?: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/weather`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update weather');
    return res.json();
  },

  async simulateScenario(req: {
    held_train_number: string;
    hold_station_code: string;
    extra_hold_minutes: number;
    priority_override_train?: string;
  }): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to run simulation');
    return res.json();
  },
};
