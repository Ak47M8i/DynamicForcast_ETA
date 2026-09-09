import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from sqlmodel import Session, select
from backend.models import (
    Train, Station, TrackSection, ScheduleStop, LiveTrainState,
    CautionOrder, WeatherIncident, DynamicStopForecast, DelayFactorItem,
    TrainLiveSummary, StringChartTrainLine, StringChartCoordinate
)


def parse_time_str(time_str: str) -> Tuple[int, int]:
    """Parse 'HH:MM' string to (hours, minutes)."""
    parts = time_str.strip().split(":")
    return int(parts[0]), int(parts[1])


def format_time_from_minutes(total_mins: int) -> str:
    """Format total minutes from midnight into 'HH:MM' string (handles day rollover)."""
    total_mins = int(round(total_mins)) % (24 * 60)
    hours = total_mins // 60
    mins = total_mins % 60
    return f"{hours:02d}:{mins:02d}"


def time_to_minutes(time_str: str) -> int:
    """Convert 'HH:MM' to total minutes since midnight."""
    h, m = parse_time_str(time_str)
    return h * 60 + m


def add_minutes_to_time(time_str: str, delta_mins: float) -> str:
    """Add delta_mins to 'HH:MM' string."""
    mins = time_to_minutes(time_str) + int(round(delta_mins))
    return format_time_from_minutes(mins)


def calculate_caution_delay(
    from_km: float, 
    to_km: float, 
    cautions: List[CautionOrder], 
    train_mps: float
) -> Tuple[float, List[DelayFactorItem]]:
    """
    Calculate kinetic delay caused by Temporary Speed Restrictions (TSR).
    Delay formula: time at restricted speed - time at normal speed + deceleration/acceleration loss (1.5 min per TSR).
    """
    factors = []
    total_delay = 0.0

    for c in cautions:
        if not c.is_active:
            continue
        
        # Check overlap between train section and caution order zone
        overlap_start = max(min(from_km, to_km), c.km_start)
        overlap_end = min(max(from_km, to_km), c.km_end)

        if overlap_start < overlap_end:
            dist = overlap_end - overlap_start
            normal_speed = min(train_mps, c.normal_speed_kmh)
            restricted_speed = min(normal_speed, c.restricted_speed_kmh)

            if normal_speed > restricted_speed and restricted_speed > 0:
                time_normal_hrs = dist / normal_speed
                time_restr_hrs = dist / restricted_speed
                # In railway engineering, braking from 130 to 30 km/h and re-acceleration adds ~1.5 to 2.0 mins
                braking_loss_mins = 1.5
                speed_diff_mins = (time_restr_hrs - time_normal_hrs) * 60.0
                delay_mins = round(speed_diff_mins + braking_loss_mins, 1)

                total_delay += delay_mins
                factors.append(DelayFactorItem(
                    factor_type="CAUTION_ORDER",
                    label=f"TSR Caution {int(c.restricted_speed_kmh)} km/h",
                    impact_minutes=delay_mins,
                    description=f"Temporary Speed Restriction between km {c.km_start:.1f}-{c.km_end:.1f}: {c.reason} (+{delay_mins}m)"
                ))

    return total_delay, factors


def calculate_weather_delay(
    from_station: str, 
    to_station: str, 
    weather_list: List[WeatherIncident],
    section_dist: float,
    train_mps: float
) -> Tuple[float, List[DelayFactorItem]]:
    """
    Calculate delay due to adverse weather conditions (dense fog, heavy rainfall).
    In Indian Railways, fog requires Fog Pass Devices and caps speed at 60 or 75 km/h.
    """
    factors = []
    total_delay = 0.0

    for w in weather_list:
        if not w.is_active:
            continue
        # Check if this section matches
        if (w.section_from == from_station and w.section_to == to_station) or \
           (w.section_from == to_station and w.section_to == from_station):
            
            fog_cap = w.max_permissible_speed_override or 60.0
            normal_speed = train_mps

            if normal_speed > fog_cap:
                normal_time_hrs = section_dist / normal_speed
                fog_time_hrs = section_dist / fog_cap
                weather_delay_mins = round((fog_time_hrs - normal_time_hrs) * 60.0 * 0.4, 1)  # calibrated operational factor
                if weather_delay_mins > 0:
                    total_delay += weather_delay_mins
                    factors.append(DelayFactorItem(
                        factor_type="WEATHER_FOG",
                        label=f"{w.condition.replace('_', ' ').title()}",
                        impact_minutes=weather_delay_mins,
                        description=f"Visibility {w.visibility_meters}m; Cautionary speed limit {int(fog_cap)} km/h (+{weather_delay_mins}m)"
                    ))

    return total_delay, factors


def calculate_precedence_conflict(
    target_train: Train,
    target_live: LiveTrainState,
    all_trains: List[Train],
    all_live: Dict[str, LiveTrainState],
    current_station: Station,
    next_station: Station
) -> Tuple[float, List[DelayFactorItem]]:
    """
    Indian Railways precedence logic:
    Higher priority trains (Vande Bharat = 1, Rajdhani = 2) have precedence over lower-ranked trains.
    If a higher priority train is trailing behind within ~50 km and moving faster,
    the lower priority train must be looped at the nearest station loop-line for 14-18 minutes!
    """
    factors = []
    total_delay = 0.0

    # If target train is top priority, it never waits for precedence!
    if target_train.priority_rank <= 1:
        return 0.0, []

    # Check other active trains on the line
    for other_t in all_trains:
        if other_t.number == target_train.number:
            continue
        
        # Only check trains with higher priority
        if other_t.priority_rank < target_train.priority_rank:
            other_live = all_live.get(other_t.number)
            if not other_live:
                continue

            # Check if other train is trailing behind (lower km) heading in same direction
            is_trailing = (
                other_live.current_km < target_live.current_km and 
                (target_live.current_km - other_live.current_km) <= 65.0
            )

            if is_trailing:
                # Loop line detention time in Indian Railways: typically 12-18 mins (setting road, clearance, pass-through)
                precedence_wait_mins = 14.0 if target_train.priority_rank >= 4 else 10.0
                total_delay += precedence_wait_mins
                factors.append(DelayFactorItem(
                    factor_type="PRECEDENCE_WAIT",
                    label=f"Precedence for {other_t.name} ({other_t.number})",
                    impact_minutes=precedence_wait_mins,
                    description=f"Scheduled loop-line regulation at {next_station.name} to grant clear path to high-priority {other_t.name} (+{precedence_wait_mins}m)"
                ))
                break  # usually held once per block territory

    return total_delay, factors


def calculate_platform_bottleneck(
    station: Station, 
    dwell_mins: int
) -> Tuple[float, List[DelayFactorItem]]:
    """
    Major junctions (Kanpur, Prayagraj, NDLS) experience platform occupancy conflicts.
    If occupancy ratio >= 70%, train faces outer signal detention or reception speed reduction.
    """
    factors = []
    occupancy_ratio = station.active_occupied_platforms / max(1, station.platforms_count)

    if occupancy_ratio >= 0.70 and station.platforms_count >= 6:
        # High occupancy penalty
        holding_mins = round((occupancy_ratio - 0.5) * 14.0, 1)
        if holding_mins > 2.0:
            factors.append(DelayFactorItem(
                factor_type="PLATFORM_OCCUPANCY",
                label=f"Platform Congestion at {station.code}",
                impact_minutes=holding_mins,
                description=f"Terminal platform occupancy at {int(occupancy_ratio * 100)}% ({station.active_occupied_platforms}/{station.platforms_count} PFs occupied); outer signal reception buffer (+{holding_mins}m)"
            ))
            return holding_mins, factors

    return 0.0, []


def calculate_schedule_recovery(
    accumulated_delay: float, 
    section_dist: float, 
    has_caution: bool
) -> Tuple[float, List[DelayFactorItem]]:
    """
    Schedule slack recovery: If the train is late, drivers can utilize built-in timetable slack
    (5-8% of run time) provided the section has no active caution orders or congestion.
    """
    factors = []
    if accumulated_delay > 5.0 and not has_caution and section_dist > 50.0:
        # Drivers can make up about 3-6 minutes per 100 km of clear track
        recoverable_mins = min(accumulated_delay * 0.25, (section_dist / 100.0) * 4.5)
        recoverable_mins = round(recoverable_mins, 1)

        if recoverable_mins >= 1.5:
            factors.append(DelayFactorItem(
                factor_type="SCHEDULE_RECOVERY_SLACK",
                label="Timetable Slack Recovery",
                impact_minutes=-recoverable_mins,
                description=f"Clear green corridor: loco pilot can utilize schedule recovery slack (-{recoverable_mins}m)"
            ))
            return -recoverable_mins, factors

    return 0.0, []


class DynamicETAForecastingEngine:
    """
    Dynamic ETA Engine for Indian Railways Coaching Trains.
    Combines live telemetry, precedence graphs, temporary speed restrictions,
    weather conditions, platform dwell modeling, and timetable recovery slack.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_dynamic_forecast(self, train_number: str) -> Dict:
        """
        Generate complete dynamic ETA forecast for a specific train with explainable factors.
        """
        train = self.session.exec(select(Train).where(Train.number == train_number)).first()
        if not train:
            raise ValueError(f"Train {train_number} not found")

        live_state = self.session.exec(select(LiveTrainState).where(LiveTrainState.train_number == train_number)).first()
        if not live_state:
            raise ValueError(f"Live telemetry for train {train_number} not found")

        stops = self.session.exec(
            select(ScheduleStop)
            .where(ScheduleStop.train_number == train_number)
            .order_by(ScheduleStop.stop_sequence)
        ).all()

        stations_by_code = {s.code: s for s in self.session.exec(select(Station)).all()}
        all_trains = self.session.exec(select(Train)).all()
        all_live = {ls.train_number: ls for ls in self.session.exec(select(LiveTrainState)).all()}
        all_cautions = self.session.exec(select(CautionOrder).where(CautionOrder.is_active == True)).all()
        all_weather = self.session.exec(select(WeatherIncident).where(WeatherIncident.is_active == True)).all()

        # Step 1: Baseline current state
        current_delay = live_state.current_delay_minutes
        accumulated_delay = current_delay
        running_km = live_state.current_km

        forecast_stops: List[DynamicStopForecast] = []
        hops_from_current = 0
        is_past_current = False

        # Identify current stop index
        current_seq = 1
        for st in stops:
            if st.station_code == live_state.current_station_code:
                current_seq = st.stop_sequence
                break

        for idx, st in enumerate(stops):
            station_info = stations_by_code.get(st.station_code)
            station_name = station_info.name if station_info else st.station_code

            stop_factors: List[DelayFactorItem] = []

            if st.stop_sequence < current_seq:
                # Past station - already completed
                static_eta = st.scheduled_arrival
                dynamic_arr = st.scheduled_arrival
                dynamic_dep = st.scheduled_departure
                pred_delay = 0.0
                conf_pct = 100
                conf_window = f"{st.scheduled_arrival} - {st.scheduled_arrival}"
                status = "PAST"
            elif st.stop_sequence == current_seq:
                # Current station
                status = "CURRENT"
                pred_delay = current_delay
                static_eta = add_minutes_to_time(st.scheduled_arrival, current_delay)
                dynamic_arr = add_minutes_to_time(st.scheduled_arrival, current_delay)
                dynamic_dep = add_minutes_to_time(st.scheduled_departure, current_delay)
                conf_pct = 98
                conf_window = f"{dynamic_arr} (Current Position)"
                if live_state.held_reason:
                    stop_factors.append(DelayFactorItem(
                        factor_type="CURRENT_DELAY",
                        label="Active Status",
                        impact_minutes=current_delay,
                        description=live_state.held_reason
                    ))
            else:
                # Upcoming station - apply dynamic multi-factor model
                hops_from_current += 1
                status = "UPCOMING"

                prev_stop = stops[idx - 1]
                prev_station = stations_by_code.get(prev_stop.station_code)
                dist_segment = abs(st.distance_from_origin - prev_stop.distance_from_origin)

                # 1. Caution order delay in this section
                caution_delay, caution_factors = calculate_caution_delay(
                    prev_stop.distance_from_origin,
                    st.distance_from_origin,
                    all_cautions,
                    train.max_speed_kmh
                )
                accumulated_delay += caution_delay
                stop_factors.extend(caution_factors)

                # 2. Weather impact in this section
                weather_delay, weather_factors = calculate_weather_delay(
                    prev_stop.station_code,
                    st.station_code,
                    all_weather,
                    dist_segment,
                    train.max_speed_kmh
                )
                accumulated_delay += weather_delay
                stop_factors.extend(weather_factors)

                # 3. Precedence / Overtake logic
                if hops_from_current == 1:
                    precedence_delay, precedence_factors = calculate_precedence_conflict(
                        train, live_state, all_trains, all_live, prev_station, station_info
                    )
                    accumulated_delay += precedence_delay
                    stop_factors.extend(precedence_factors)

                # 4. Platform & Yard occupancy bottleneck at destination/junction
                if station_info:
                    pf_delay, pf_factors = calculate_platform_bottleneck(station_info, st.dwell_minutes)
                    accumulated_delay += pf_delay
                    stop_factors.extend(pf_factors)

                # 5. Schedule Slack Recovery
                has_caution_in_sec = len(caution_factors) > 0
                recovery_mins, recovery_factors = calculate_schedule_recovery(
                    accumulated_delay, dist_segment, has_caution_in_sec
                )
                accumulated_delay += recovery_mins
                accumulated_delay = max(0.0, accumulated_delay)
                stop_factors.extend(recovery_factors)

                # Calculate times
                static_eta = add_minutes_to_time(st.scheduled_arrival, current_delay)
                dynamic_arr = add_minutes_to_time(st.scheduled_arrival, accumulated_delay)
                dynamic_dep = add_minutes_to_time(st.scheduled_departure, accumulated_delay)
                pred_delay = round(accumulated_delay, 1)

                # Confidence interval calculation
                conf_pct = max(55, int(98 - (hops_from_current * 4.5)))
                margin = max(2.0, hops_from_current * 2.5)
                lower_bound = add_minutes_to_time(dynamic_arr, -margin)
                upper_bound = add_minutes_to_time(dynamic_arr, margin)
                conf_window = f"{lower_bound} - {upper_bound}"

            accuracy_delta = round(accumulated_delay - current_delay, 1) if status == "UPCOMING" else 0.0

            forecast_stops.append(DynamicStopForecast(
                station_code=st.station_code,
                station_name=station_name,
                stop_sequence=st.stop_sequence,
                scheduled_arrival=st.scheduled_arrival,
                scheduled_departure=st.scheduled_departure,
                dynamic_eta_arrival=dynamic_arr,
                dynamic_eta_departure=dynamic_dep,
                static_ntes_eta=static_eta,
                predicted_delay_minutes=pred_delay,
                accuracy_delta_minutes=accuracy_delta,
                confidence_percent=conf_pct,
                confidence_window=conf_window,
                delay_factors=stop_factors,
                platform_assigned=live_state.allocated_platform or st.platform_scheduled,
                status=status
            ))

        # Overall summary
        final_stop = forecast_stops[-1]
        overall_conf = int(sum(f.confidence_percent for f in forecast_stops if f.status != "PAST") / max(1, len([f for f in forecast_stops if f.status != "PAST"])))

        return {
            "train": train,
            "live_state": live_state,
            "forecast_stops": forecast_stops,
            "summary": TrainLiveSummary(
                number=train.number,
                name=train.name,
                train_type=train.train_type,
                priority_rank=train.priority_rank,
                origin_code=train.origin_code,
                destination_code=train.destination_code,
                current_status=live_state.operational_status,
                current_station_code=live_state.current_station_code,
                next_station_code=live_state.next_station_code,
                current_speed_kmh=live_state.current_speed_kmh,
                current_delay_minutes=live_state.current_delay_minutes,
                destination_eta=final_stop.dynamic_eta_arrival,
                destination_static_eta=final_stop.static_ntes_eta,
                overall_confidence_percent=overall_conf,
                total_stops=len(stops),
                stops_completed=current_seq - 1
            )
        }

    def get_all_trains_summary(self) -> List[TrainLiveSummary]:
        """Get summarized list of all trains on the corridor."""
        trains = self.session.exec(select(Train)).all()
        summaries = []
        for t in trains:
            try:
                data = self.get_dynamic_forecast(t.number)
                summaries.append(data["summary"])
            except Exception as e:
                print(f"Error forecasting {t.number}: {e}")
        return summaries

    def get_string_chart_data(self) -> List[StringChartTrainLine]:
        """
        Generate time-distance trajectory data for Section Controllers.
        In Indian Railways, time-distance string charts are the gold standard operational chart.
        Stations/distance on one axis, time on the other axis.
        Lines crossing indicate meets/crossings or overtakes.
        """
        trains = self.session.exec(select(Train)).all()
        stations_by_code = {s.code: s for s in self.session.exec(select(Station)).all()}
        lines: List[StringChartTrainLine] = []

        # Color coding by train priority
        color_map = {
            1: "#0ea5e9",  # Vande Bharat - Bright Blue
            2: "#ef4444",  # Rajdhani - Red
            3: "#f59e0b",  # Shatabdi - Amber
            4: "#10b981",  # Superfast - Emerald Green
            5: "#8b5cf6",  # Express - Purple
            6: "#6b7280",  # Passenger - Gray
            7: "#78350f",  # Freight - Brown
        }

        # Base reference time: 06:00 AM = 360 mins from midnight
        base_ref_mins = 360  # 06:00

        for t in trains:
            data = self.get_dynamic_forecast(t.number)
            stops = data["forecast_stops"]
            coords: List[StringChartCoordinate] = []

            for st in stops:
                st_info = stations_by_code.get(st.station_code)
                km = st_info.km_from_origin if st_info else 0.0

                # Arrival coordinate
                arr_mins = time_to_minutes(st.dynamic_eta_arrival)
                coords.append(StringChartCoordinate(
                    time=st.dynamic_eta_arrival,
                    minutes_from_start=arr_mins - base_ref_mins,
                    km=km,
                    station_code=st.station_code,
                    event="ARR",
                    is_forecast=(st.status == "UPCOMING")
                ))

                # Departure coordinate
                dep_mins = time_to_minutes(st.dynamic_eta_departure)
                coords.append(StringChartCoordinate(
                    time=st.dynamic_eta_departure,
                    minutes_from_start=dep_mins - base_ref_mins,
                    km=km,
                    station_code=st.station_code,
                    event="DEP",
                    is_forecast=(st.status == "UPCOMING")
                ))

            lines.append(StringChartTrainLine(
                train_number=t.number,
                train_name=t.name,
                train_type=t.train_type,
                priority_rank=t.priority_rank,
                color=color_map.get(t.priority_rank, "#3b82f6"),
                is_active=True,
                coordinates=coords
            ))

        return lines
