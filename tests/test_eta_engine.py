import pytest
from sqlmodel import Session, create_engine, SQLModel, select
from backend.models import (
    Train, Station, TrackSection, ScheduleStop, LiveTrainState,
    CautionOrder, WeatherIncident, DigitalTSRLog
)
from backend.eta_engine import (
    DynamicETAForecastingEngine, calculate_caution_delay, 
    calculate_weather_delay, time_to_minutes, format_time_from_minutes
)


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite:///:memory:", echo=False)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # Add basic test stations
        s1 = Station(code="NDLS", name="New Delhi", km_from_origin=0.0, division="Delhi", platforms_count=16, active_occupied_platforms=5)
        s2 = Station(code="ALJN", name="Aligarh Jn", km_from_origin=126.0, division="Prayagraj", platforms_count=7, active_occupied_platforms=2)
        s3 = Station(code="CNB", name="Kanpur Central", km_from_origin=440.0, division="Prayagraj", platforms_count=10, active_occupied_platforms=8)
        session.add_all([s1, s2, s3])

        # Add train
        t1 = Train(
            number="22436", name="Vande Bharat", train_type="VANDE_BHARAT",
            priority_rank=1, origin_code="NDLS", destination_code="CNB",
            max_speed_kmh=160.0
        )
        t2 = Train(
            number="12420", name="Gomti Express", train_type="EXPRESS",
            priority_rank=5, origin_code="NDLS", destination_code="CNB",
            max_speed_kmh=110.0
        )
        session.add_all([t1, t2])

        # Add stops for VB
        session.add(ScheduleStop(train_number="22436", station_code="NDLS", stop_sequence=1, scheduled_arrival="06:00", scheduled_departure="06:00", dwell_minutes=0, distance_from_origin=0.0))
        session.add(ScheduleStop(train_number="22436", station_code="CNB", stop_sequence=2, scheduled_arrival="10:08", scheduled_departure="10:10", dwell_minutes=2, distance_from_origin=440.0))

        # Add live state for VB
        session.add(LiveTrainState(
            train_number="22436", current_station_code="NDLS", next_station_code="CNB",
            current_km=50.0, current_speed_kmh=140.0, operational_status="RUNNING",
            current_delay_minutes=5.0
        ))

        # Add stops for Gomti Exp
        session.add(ScheduleStop(train_number="12420", station_code="NDLS", stop_sequence=1, scheduled_arrival="12:20", scheduled_departure="12:20", dwell_minutes=0, distance_from_origin=0.0))
        session.add(ScheduleStop(train_number="12420", station_code="ALJN", stop_sequence=2, scheduled_arrival="14:15", scheduled_departure="14:17", dwell_minutes=2, distance_from_origin=126.0))
        session.add(ScheduleStop(train_number="12420", station_code="CNB", stop_sequence=3, scheduled_arrival="19:45", scheduled_departure="19:50", dwell_minutes=5, distance_from_origin=440.0))

        # Add live state for Gomti
        session.add(LiveTrainState(
            train_number="12420", current_station_code="ALJN", next_station_code="CNB",
            current_km=126.0, current_speed_kmh=0.0, operational_status="HALTED_AT_STATION",
            current_delay_minutes=15.0
        ))

        # Add Caution Order between ALJN and CNB
        session.add(CautionOrder(
            section_from="ALJN", section_to="CNB", km_start=200.0, km_end=205.0,
            restricted_speed_kmh=30.0, normal_speed_kmh=130.0,
            reason="Track Maintenance", is_active=True
        ))

        session.commit()
        yield session


def test_time_conversion_utilities():
    assert time_to_minutes("00:00") == 0
    assert time_to_minutes("06:30") == 390
    assert time_to_minutes("23:59") == 1439
    assert format_time_from_minutes(390) == "06:30"
    assert format_time_from_minutes(1445) == "00:05"  # handles midnight rollover


def test_calculate_caution_delay():
    cautions = [
        CautionOrder(
            section_from="ALJN", section_to="TDL", km_start=150.0, km_end=155.0,
            restricted_speed_kmh=30.0, normal_speed_kmh=130.0,
            reason="Rail Fracture", is_active=True
        )
    ]
    delay, factors = calculate_caution_delay(100.0, 200.0, cautions, 130.0)
    assert delay > 0.0
    assert len(factors) == 1
    assert factors[0].factor_type == "CAUTION_ORDER"
    assert "TSR Caution 30 km/h" in factors[0].label


def test_calculate_weather_delay():
    weather = [
        WeatherIncident(
            section_from="ETW", section_to="CNB", condition="DENSE_FOG",
            visibility_meters=200, max_permissible_speed_override=60.0, is_active=True
        )
    ]
    delay, factors = calculate_weather_delay("ETW", "CNB", weather, 140.0, 130.0)
    assert delay > 0.0
    assert len(factors) == 1
    assert factors[0].factor_type == "WEATHER_FOG"


def test_dynamic_forecast_engine(session):
    engine = DynamicETAForecastingEngine(session)
    forecast = engine.get_dynamic_forecast("22436")

    assert forecast["train"].number == "22436"
    assert len(forecast["forecast_stops"]) == 2
    summary = forecast["summary"]
    assert summary.current_delay_minutes == 5.0
    assert summary.overall_confidence_percent > 60

    # Gomti Express with caution order
    forecast_gomti = engine.get_dynamic_forecast("12420")
    assert len(forecast_gomti["forecast_stops"]) == 3
    final_stop = forecast_gomti["forecast_stops"][-1]
    # Check that dynamic ETA is greater than scheduled due to current delay + caution
    assert final_stop.predicted_delay_minutes >= 15.0
    # Check factors include caution order
    factor_types = [f.factor_type for f in final_stop.delay_factors]
    assert "CAUTION_ORDER" in factor_types
