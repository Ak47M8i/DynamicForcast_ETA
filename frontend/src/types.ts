export interface DelayFactorItem {
  factor_type: string;
  label: string;
  impact_minutes: number;
  description: string;
}

export interface DynamicStopForecast {
  station_code: string;
  station_name: string;
  stop_sequence: number;
  scheduled_arrival: string;
  scheduled_departure: string;
  dynamic_eta_arrival: string;
  dynamic_eta_departure: string;
  static_ntes_eta: string;
  predicted_delay_minutes: number;
  accuracy_delta_minutes: number;
  confidence_percent: number;
  confidence_window: string;
  delay_factors: DelayFactorItem[];
  platform_assigned: string;
  status: 'PAST' | 'CURRENT' | 'UPCOMING';
}

export interface TrainLiveSummary {
  number: string;
  name: string;
  train_type: string;
  priority_rank: number;
  origin_code: string;
  destination_code: string;
  current_status: string;
  current_station_code: string;
  next_station_code: string;
  current_speed_kmh: number;
  current_delay_minutes: number;
  destination_eta: string;
  destination_static_eta: string;
  overall_confidence_percent: number;
  total_stops: number;
  stops_completed: number;
}

export interface TrainDetailResponse {
  train: {
    id: number;
    number: string;
    name: string;
    train_type: string;
    priority_rank: number;
    origin_code: string;
    destination_code: string;
    rake_type: string;
    max_speed_kmh: number;
    length_coaches: number;
  };
  live_state: {
    train_number: string;
    current_station_code: string;
    next_station_code: string;
    current_km: number;
    current_speed_kmh: number;
    operational_status: string;
    current_delay_minutes: number;
    allocated_platform: string | null;
    held_reason: string | null;
    last_updated: string;
  };
  forecast_stops: DynamicStopForecast[];
  summary: TrainLiveSummary;
}

export interface Station {
  id: number;
  code: string;
  name: string;
  km_from_origin: number;
  division: string;
  platforms_count: number;
  active_occupied_platforms: number;
  has_bypass_line: boolean;
}

export interface TrackSection {
  id: number;
  from_station_code: string;
  to_station_code: string;
  distance_km: number;
  tracks_count: number;
  mps_kmh: number;
  electrified: boolean;
  automatic_signaling: boolean;
  block_sections_count: number;
}

export interface CautionOrder {
  id: number;
  section_from: string;
  section_to: string;
  km_start: number;
  km_end: number;
  restricted_speed_kmh: number;
  normal_speed_kmh: number;
  reason: string;
  issued_by: string;
  is_active: boolean;
  created_at: string;
}

export interface WeatherIncident {
  id: number;
  section_from: string;
  section_to: string;
  condition: string;
  visibility_meters: number;
  max_permissible_speed_override: number | null;
  is_active: boolean;
}

export interface DigitalTSRLog {
  id: number;
  timestamp: string;
  station_code: string;
  train_number: string;
  event_type: string;
  platform: string | null;
  line_number: string | null;
  delay_at_event: number;
  recorded_by: string;
  remarks: string | null;
}

export interface StringChartCoordinate {
  time: string;
  minutes_from_start: number;
  km: number;
  station_code: string | null;
  event: string;
  is_forecast: boolean;
}

export interface StringChartTrainLine {
  train_number: string;
  train_name: string;
  train_type: string;
  priority_rank: number;
  color: string;
  is_active: boolean;
  coordinates: StringChartCoordinate[];
}

export interface SimulationResult {
  held_train: string;
  extra_hold_minutes: number;
  impacted_trains: Array<{
    train_number: string;
    train_name: string;
    action: string;
    baseline_delay_mins: number;
    simulated_delay_mins: number;
    net_delay_change: string;
    type: 'HELD' | 'EXPEDITED';
  }>;
  dispatcher_recommendation: string;
}
