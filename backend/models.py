from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone
from pydantic import BaseModel


class Station(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    name: str
    km_from_origin: float
    division: str
    platforms_count: int = 4
    active_occupied_platforms: int = 0
    has_bypass_line: bool = True


class TrackSection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    from_station_code: str = Field(index=True)
    to_station_code: str = Field(index=True)
    distance_km: float
    tracks_count: int = 2
    mps_kmh: float = 130.0  # Maximum Permissible Speed
    electrified: bool = True
    automatic_signaling: bool = True
    block_sections_count: int = 15


class Train(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    number: str = Field(index=True, unique=True)
    name: str
    train_type: str  # "VANDE_BHARAT", "RAJDHANI", "SHATABDI", "SUPERFAST", "EXPRESS", "PASSENGER", "FREIGHT"
    priority_rank: int  # 1 (Highest: VB), 2 (Rajdhani), 3 (Shatabdi), 4 (Superfast), 5 (Express), 6 (Passenger), 7 (Freight)
    origin_code: str
    destination_code: str
    rake_type: str = "LHB"  # "Train18-SelfPropelled", "LHB", "ICF", "WAG9-Freight"
    max_speed_kmh: float = 130.0
    length_coaches: int = 16


class ScheduleStop(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    train_number: str = Field(index=True)
    station_code: str = Field(index=True)
    stop_sequence: int
    scheduled_arrival: str  # "HH:MM"
    scheduled_departure: str  # "HH:MM"
    dwell_minutes: int
    distance_from_origin: float
    platform_scheduled: str = "PF-1"


class LiveTrainState(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    train_number: str = Field(index=True, unique=True)
    current_station_code: str
    next_station_code: str
    current_km: float
    current_speed_kmh: float
    operational_status: str = "RUNNING"  # "RUNNING", "HALTED_AT_STATION", "HELD_OUTER_SIGNAL", "HELD_LOOP_PRECEDENCE", "SCHEDULED"
    current_delay_minutes: float = 0.0
    allocated_platform: Optional[str] = None
    held_reason: Optional[str] = None
    last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CautionOrder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    section_from: str = Field(index=True)
    section_to: str = Field(index=True)
    km_start: float
    km_end: float
    restricted_speed_kmh: float = 30.0
    normal_speed_kmh: float = 130.0
    reason: str
    issued_by: str = "Sr. DEN / PRYJ Div"
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WeatherIncident(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    section_from: str = Field(index=True)
    section_to: str = Field(index=True)
    condition: str = "CLEAR"  # "CLEAR", "MODERATE_FOG", "DENSE_FOG", "HEAVY_RAINFALL"
    visibility_meters: int = 1000
    max_permissible_speed_override: Optional[float] = None
    is_active: bool = True
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class DigitalTSRLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    station_code: str = Field(index=True)
    train_number: str = Field(index=True)
    event_type: str  # "ARRIVAL", "DEPARTURE", "OUTER_SIGNAL_HOLD", "LINE_CLEAR_GIVEN", "PLATFORM_CHANGE"
    platform: Optional[str] = None
    line_number: Optional[str] = None
    delay_at_event: float = 0.0
    recorded_by: str = "Station Master (SM-Desk)"
    remarks: Optional[str] = None


# --- Pydantic Data Transfer Objects (DTOs) for API Responses ---

class DelayFactorItem(BaseModel):
    factor_type: str  # "PRECEDENCE_WAIT", "CAUTION_ORDER", "WEATHER_FOG", "SECTION_CONGESTION", "PLATFORM_OCCUPANCY", "SCHEDULE_RECOVERY_SLACK"
    label: str
    impact_minutes: float  # positive = delayed, negative = recovered
    description: str


class DynamicStopForecast(BaseModel):
    station_code: str
    station_name: str
    stop_sequence: int
    scheduled_arrival: str
    scheduled_departure: str
    dynamic_eta_arrival: str
    dynamic_eta_departure: str
    static_ntes_eta: str
    predicted_delay_minutes: float
    accuracy_delta_minutes: float  # difference between static extrapolation vs dynamic forecast
    confidence_percent: int
    confidence_window: str  # e.g., "14:22 - 14:32"
    delay_factors: List[DelayFactorItem]
    platform_assigned: str
    status: str  # "PAST", "CURRENT", "UPCOMING"


class TrainLiveSummary(BaseModel):
    number: str
    name: str
    train_type: str
    priority_rank: int
    origin_code: str
    destination_code: str
    current_status: str
    current_station_code: str
    next_station_code: str
    current_speed_kmh: float
    current_delay_minutes: float
    destination_eta: str
    destination_static_eta: str
    overall_confidence_percent: int
    total_stops: int
    stops_completed: int


class StringChartCoordinate(BaseModel):
    time: str  # "HH:MM"
    minutes_from_start: int
    km: float
    station_code: Optional[str] = None
    event: str  # "ARR", "DEP", "PASS", "HELD"
    is_forecast: bool


class StringChartTrainLine(BaseModel):
    train_number: str
    train_name: str
    train_type: str
    priority_rank: int
    color: str
    is_active: bool
    coordinates: List[StringChartCoordinate]


class SimulationRequest(BaseModel):
    held_train_number: str
    hold_station_code: str
    extra_hold_minutes: int
    priority_override_train: Optional[str] = None


class SimulationResult(BaseModel):
    held_train: str
    extra_hold_minutes: int
    impacted_trains: List[dict]
    dispatcher_recommendation: str
