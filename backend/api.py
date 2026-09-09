from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from backend.database import get_session
from backend.models import (
    Train, Station, TrackSection, LiveTrainState, CautionOrder,
    WeatherIncident, DigitalTSRLog, TrainLiveSummary,
    StringChartTrainLine, SimulationRequest, SimulationResult
)
from backend.eta_engine import DynamicETAForecastingEngine

api_router = APIRouter(prefix="/api")


# --- Train & Forecast Endpoints ---

@api_router.get("/trains", response_model=List[TrainLiveSummary])
def get_all_trains(session: Session = Depends(get_session)):
    """Retrieve all trains on the HDN-1 corridor with dynamic ETA summary."""
    engine = DynamicETAForecastingEngine(session)
    return engine.get_all_trains_summary()


@api_router.get("/trains/{train_number}")
def get_train_forecast(train_number: str, session: Session = Depends(get_session)):
    """Retrieve detailed dynamic ETA forecast and explainable factors for a train."""
    engine = DynamicETAForecastingEngine(session)
    try:
        return engine.get_dynamic_forecast(train_number)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@api_router.get("/stations", response_model=List[Station])
def get_stations(session: Session = Depends(get_session)):
    """List all stations on the corridor with live platform status."""
    return session.exec(select(Station).order_by(Station.km_from_origin)).all()


@api_router.get("/corridor")
def get_corridor_overview(session: Session = Depends(get_session)):
    """Full corridor overview: stations, active trains, caution orders, weather."""
    stations = session.exec(select(Station).order_by(Station.km_from_origin)).all()
    sections = session.exec(select(TrackSection)).all()
    trains = session.exec(select(Train)).all()
    live_states = session.exec(select(LiveTrainState)).all()
    cautions = session.exec(select(CautionOrder).where(CautionOrder.is_active == True)).all()
    weather = session.exec(select(WeatherIncident).where(WeatherIncident.is_active == True)).all()

    return {
        "corridor_name": "Indian Railways HDN-1 (New Delhi - Pt. Deen Dayal Upadhyaya Jn)",
        "total_distance_km": 786.5,
        "stations": stations,
        "sections": sections,
        "trains": trains,
        "live_states": live_states,
        "caution_orders": cautions,
        "weather_incidents": weather
    }


@api_router.get("/controller/string-chart", response_model=List[StringChartTrainLine])
def get_string_chart(session: Session = Depends(get_session)):
    """
    Time-distance trajectory coordinates for Section Controllers' digital control chart.
    Visualizes planned vs forecast train paths across stations over time.
    """
    engine = DynamicETAForecastingEngine(session)
    return engine.get_string_chart_data()


# --- Paper-to-Digital Operations: Train Signal Register (TSR) ---

class CreateTSRLogRequest(BaseModel):
    station_code: str
    train_number: str
    event_type: str  # "ARRIVAL", "DEPARTURE", "OUTER_SIGNAL_HOLD", "LINE_CLEAR_GIVEN", "PLATFORM_CHANGE"
    platform: Optional[str] = None
    line_number: Optional[str] = None
    delay_at_event: float = 0.0
    recorded_by: str = "Station Master"
    remarks: Optional[str] = None


@api_router.post("/tsr/log")
def log_tsr_entry(req: CreateTSRLogRequest, session: Session = Depends(get_session)):
    """
    Log an operational action in the Digital Train Signal Register (TSR).
    Replaces the manual physical paper logbook.
    Automatically updates the train's live state and recalculates downstream ETAs.
    """
    # 1. Create log entry
    log_entry = DigitalTSRLog(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        station_code=req.station_code,
        train_number=req.train_number,
        event_type=req.event_type,
        platform=req.platform,
        line_number=req.line_number,
        delay_at_event=req.delay_at_event,
        recorded_by=req.recorded_by,
        remarks=req.remarks
    )
    session.add(log_entry)

    # 2. Update live state of train
    live = session.exec(select(LiveTrainState).where(LiveTrainState.train_number == req.train_number)).first()
    if live:
        live.current_delay_minutes = req.delay_at_event
        live.current_station_code = req.station_code
        live.last_updated = datetime.now(timezone.utc).isoformat()

        if req.event_type == "ARRIVAL":
            live.operational_status = "HALTED_AT_STATION"
            live.current_speed_kmh = 0.0
            if req.platform:
                live.allocated_platform = req.platform
            live.held_reason = None
        elif req.event_type == "DEPARTURE":
            live.operational_status = "RUNNING"
            live.current_speed_kmh = 75.0
            live.held_reason = None
        elif req.event_type == "OUTER_SIGNAL_HOLD":
            live.operational_status = "HELD_OUTER_SIGNAL"
            live.current_speed_kmh = 0.0
            live.held_reason = f"Held at Outer Home Signal of {req.station_code}: {req.remarks or 'Waiting for platform/line clearance'}"
        elif req.event_type == "PLATFORM_CHANGE":
            live.allocated_platform = req.platform
            live.held_reason = f"Diverted to {req.platform}: {req.remarks or 'Operational convenience'}"

        session.add(live)

    # 3. Update station platform occupancy if applicable
    station = session.exec(select(Station).where(Station.code == req.station_code)).first()
    if station:
        if req.event_type == "ARRIVAL" and station.active_occupied_platforms < station.platforms_count:
            station.active_occupied_platforms += 1
            session.add(station)
        elif req.event_type == "DEPARTURE" and station.active_occupied_platforms > 0:
            station.active_occupied_platforms -= 1
            session.add(station)

    session.commit()

    # Recalculate dynamic forecast immediately
    engine = DynamicETAForecastingEngine(session)
    updated_forecast = engine.get_dynamic_forecast(req.train_number)

    return {
        "status": "SUCCESS",
        "message": f"Digital TSR entry logged for Train {req.train_number} at {req.station_code}. Live ETAs recalculated.",
        "log_id": log_entry.id,
        "updated_forecast": updated_forecast["summary"]
    }


@api_router.get("/tsr/logs", response_model=List[DigitalTSRLog])
def get_tsr_logs(station_code: Optional[str] = None, limit: int = 50, session: Session = Depends(get_session)):
    """Fetch digital TSR records (replaces manual paper registers)."""
    query = select(DigitalTSRLog).order_by(DigitalTSRLog.id.desc()).limit(limit)
    if station_code:
        query = query.where(DigitalTSRLog.station_code == station_code)
    return session.exec(query).all()


# --- Caution Orders (Temporary Speed Restrictions - TSR) ---

class CautionOrderRequest(BaseModel):
    section_from: str
    section_to: str
    km_start: float
    km_end: float
    restricted_speed_kmh: float
    normal_speed_kmh: float = 130.0
    reason: str
    issued_by: str = "Sr. DEN / PRYJ"


@api_router.get("/caution-orders", response_model=List[CautionOrder])
def get_caution_orders(session: Session = Depends(get_session)):
    """List all active Temporary Speed Restrictions (TSRs)."""
    return session.exec(select(CautionOrder).where(CautionOrder.is_active == True)).all()


@api_router.post("/caution-orders", response_model=CautionOrder)
def create_caution_order(req: CautionOrderRequest, session: Session = Depends(get_session)):
    """
    Issue a new Caution Order (TSR Memo) digitally.
    Replaces paper caution order forms and instantly updates dynamic ETAs across all trains.
    """
    co = CautionOrder(
        section_from=req.section_from,
        section_to=req.section_to,
        km_start=req.km_start,
        km_end=req.km_end,
        restricted_speed_kmh=req.restricted_speed_kmh,
        normal_speed_kmh=req.normal_speed_kmh,
        reason=req.reason,
        issued_by=req.issued_by,
        is_active=True
    )
    session.add(co)
    session.commit()
    session.refresh(co)
    return co


@api_router.delete("/caution-orders/{caution_id}")
def deactivate_caution_order(caution_id: int, session: Session = Depends(get_session)):
    """Cancel / revoke an active speed restriction."""
    co = session.get(CautionOrder, caution_id)
    if not co:
        raise HTTPException(status_code=404, detail="Caution order not found")
    co.is_active = False
    session.add(co)
    session.commit()
    return {"status": "SUCCESS", "message": f"Caution Order #{caution_id} revoked."}


# --- Weather & Visibility Endpoints ---

class WeatherUpdateRequest(BaseModel):
    section_from: str
    section_to: str
    condition: str  # "CLEAR", "MODERATE_FOG", "DENSE_FOG", "HEAVY_RAINFALL"
    visibility_meters: int
    speed_override: Optional[float] = None


@api_router.post("/weather")
def update_weather(req: WeatherUpdateRequest, session: Session = Depends(get_session)):
    """Update track weather conditions (e.g. dense fog mode)."""
    incident = session.exec(
        select(WeatherIncident).where(
            WeatherIncident.section_from == req.section_from,
            WeatherIncident.section_to == req.section_to
        )
    ).first()

    if not incident:
        incident = WeatherIncident(
            section_from=req.section_from,
            section_to=req.section_to,
            condition=req.condition,
            visibility_meters=req.visibility_meters,
            max_permissible_speed_override=req.speed_override,
            is_active=(req.condition != "CLEAR")
        )
    else:
        incident.condition = req.condition
        incident.visibility_meters = req.visibility_meters
        incident.max_permissible_speed_override = req.speed_override
        incident.is_active = (req.condition != "CLEAR")
        incident.updated_at = datetime.utcnow().isoformat()

    session.add(incident)
    session.commit()
    return {"status": "SUCCESS", "condition": req.condition, "visibility": req.visibility_meters}


# --- Dispatcher "What-If" Simulation Engine ---

@api_router.post("/simulate", response_model=SimulationResult)
def simulate_dispatch_scenario(req: SimulationRequest, session: Session = Depends(get_session)):
    """
    Dispatcher "What-If" Decision Simulator.
    Simulates operational decisions:
    e.g. "If Train X is held for 15 mins at Station Y to allow Train Z to overtake,
    what is the ripple effect on downstream ETAs across the corridor?"
    """
    # 1. Fetch current baseline ETAs
    engine = DynamicETAForecastingEngine(session)
    baseline_target = engine.get_dynamic_forecast(req.held_train_number)
    target_train = session.exec(select(Train).where(Train.number == req.held_train_number)).first()

    # 2. Simulate the hold
    simulated_impacts = []
    
    # Target train delay increases by extra_hold_minutes
    old_target_eta = baseline_target["summary"].destination_eta
    new_target_delay = baseline_target["summary"].current_delay_minutes + req.extra_hold_minutes
    simulated_impacts.append({
        "train_number": req.held_train_number,
        "train_name": target_train.name if target_train else "Target Train",
        "action": f"Held at {req.hold_station_code} loop line for +{req.extra_hold_minutes}m",
        "baseline_delay_mins": baseline_target["summary"].current_delay_minutes,
        "simulated_delay_mins": new_target_delay,
        "net_delay_change": f"+{req.extra_hold_minutes} mins",
        "type": "HELD"
    })

    # If priority override train given, calculate its time saved
    if req.priority_override_train:
        ov_train = session.exec(select(Train).where(Train.number == req.priority_override_train)).first()
        if ov_train:
            ov_forecast = engine.get_dynamic_forecast(req.priority_override_train)
            # High priority train avoids loop line queue, saves ~12-16 mins!
            time_saved = min(14.0, float(req.extra_hold_minutes))
            ov_new_delay = max(0.0, ov_forecast["summary"].current_delay_minutes - time_saved)
            simulated_impacts.append({
                "train_number": req.priority_override_train,
                "train_name": ov_train.name,
                "action": f"Granted non-stop green corridor through {req.hold_station_code}",
                "baseline_delay_mins": ov_forecast["summary"].current_delay_minutes,
                "simulated_delay_mins": ov_new_delay,
                "net_delay_change": f"-{time_saved} mins (RECOVERED)",
                "type": "EXPEDITED"
            })

    # Generate recommendation based on passenger weight and train priority
    if req.priority_override_train:
        recommendation = (
            f"RECOMMENDED DECISION: Holding Train {req.held_train_number} gives clean clearance to "
            f"Premier Train {req.priority_override_train}. Net corridor delay is minimized because "
            f"super-priority passengers arrive on time, preventing cascading section lockups downstream."
        )
    else:
        recommendation = (
            f"CAUTION: Holding Train {req.held_train_number} for {req.extra_hold_minutes}m adds "
            f"direct delay to passenger ETA at destination. Only execute if track maintenance block or emergency."
        )

    return SimulationResult(
        held_train=req.held_train_number,
        extra_hold_minutes=req.extra_hold_minutes,
        impacted_trains=simulated_impacts,
        dispatcher_recommendation=recommendation
    )
