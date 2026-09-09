from sqlmodel import Session, select
from backend.database import engine
from backend.models import (
    Station, TrackSection, Train, ScheduleStop, 
    LiveTrainState, CautionOrder, WeatherIncident, DigitalTSRLog
)


def seed_database():
    with Session(engine) as session:
        # Check if already seeded
        existing_stations = session.exec(select(Station)).first()
        if existing_stations:
            print("Database already seeded with corridor data.")
            return

        print("Seeding Indian Railways HDN-1 Corridor (NDLS - DDU)...")

        # 1. Stations
        stations = [
            Station(code="NDLS", name="New Delhi", km_from_origin=0.0, division="Delhi", platforms_count=16, active_occupied_platforms=9),
            Station(code="GZB", name="Ghaziabad Jn", km_from_origin=25.6, division="Delhi", platforms_count=6, active_occupied_platforms=4),
            Station(code="ALJN", name="Aligarh Jn", km_from_origin=126.3, division="Prayagraj", platforms_count=7, active_occupied_platforms=3),
            Station(code="TDL", name="Tundla Jn", km_from_origin=204.0, division="Prayagraj", platforms_count=7, active_occupied_platforms=3),
            Station(code="ETW", name="Etawah Jn", km_from_origin=296.0, division="Prayagraj", platforms_count=5, active_occupied_platforms=2),
            Station(code="CNB", name="Kanpur Central", km_from_origin=440.2, division="Prayagraj", platforms_count=10, active_occupied_platforms=7),
            Station(code="FTP", name="Fatehpur", km_from_origin=517.5, division="Prayagraj", platforms_count=4, active_occupied_platforms=2),
            Station(code="PRYJ", name="Prayagraj Jn", km_from_origin=634.7, division="Prayagraj", platforms_count=10, active_occupied_platforms=6),
            Station(code="MZP", name="Mirzapur", km_from_origin=723.8, division="Prayagraj", platforms_count=3, active_occupied_platforms=1),
            Station(code="DDU", name="Pt. Deen Dayal Upadhyaya Jn", km_from_origin=786.5, division="Pt. Deen Dayal Upadhyaya", platforms_count=8, active_occupied_platforms=5),
        ]
        for s in stations:
            session.add(s)

        # 2. Track Sections
        sections = [
            TrackSection(from_station_code="NDLS", to_station_code="GZB", distance_km=25.6, tracks_count=4, mps_kmh=110.0, block_sections_count=18),
            TrackSection(from_station_code="GZB", to_station_code="ALJN", distance_km=100.7, tracks_count=3, mps_kmh=130.0, block_sections_count=50),
            TrackSection(from_station_code="ALJN", to_station_code="TDL", distance_km=77.7, tracks_count=2, mps_kmh=130.0, block_sections_count=38),
            TrackSection(from_station_code="TDL", to_station_code="ETW", distance_km=92.0, tracks_count=2, mps_kmh=130.0, block_sections_count=46),
            TrackSection(from_station_code="ETW", to_station_code="CNB", distance_km=144.2, tracks_count=2, mps_kmh=130.0, block_sections_count=72),
            TrackSection(from_station_code="CNB", to_station_code="FTP", distance_km=77.3, tracks_count=3, mps_kmh=130.0, block_sections_count=38),
            TrackSection(from_station_code="FTP", to_station_code="PRYJ", distance_km=117.2, tracks_count=3, mps_kmh=130.0, block_sections_count=58),
            TrackSection(from_station_code="PRYJ", to_station_code="MZP", distance_km=89.1, tracks_count=2, mps_kmh=130.0, block_sections_count=44),
            TrackSection(from_station_code="MZP", to_station_code="DDU", distance_km=62.7, tracks_count=2, mps_kmh=130.0, block_sections_count=31),
        ]
        for sec in sections:
            session.add(sec)

        # 3. Coaching & Goods Trains
        trains = [
            Train(number="22436", name="Vande Bharat Express", train_type="VANDE_BHARAT", priority_rank=1, origin_code="NDLS", destination_code="DDU", rake_type="Train18-SelfPropelled", max_speed_kmh=160.0, length_coaches=16),
            Train(number="12302", name="Kolkata Rajdhani Express", train_type="RAJDHANI", priority_rank=2, origin_code="NDLS", destination_code="DDU", rake_type="LHB", max_speed_kmh=130.0, length_coaches=22),
            Train(number="12004", name="Lucknow Swarna Shatabdi", train_type="SHATABDI", priority_rank=3, origin_code="NDLS", destination_code="CNB", rake_type="LHB", max_speed_kmh=130.0, length_coaches=18),
            Train(number="12418", name="Prayagraj Express", train_type="SUPERFAST", priority_rank=4, origin_code="NDLS", destination_code="PRYJ", rake_type="LHB", max_speed_kmh=130.0, length_coaches=24),
            Train(number="12560", name="Shiv Ganga Express", train_type="SUPERFAST", priority_rank=4, origin_code="NDLS", destination_code="DDU", rake_type="LHB", max_speed_kmh=130.0, length_coaches=22),
            Train(number="12420", name="Gomti Express", train_type="EXPRESS", priority_rank=5, origin_code="NDLS", destination_code="CNB", rake_type="LHB", max_speed_kmh=110.0, length_coaches=21),
            Train(number="14218", name="Unchahar Express", train_type="EXPRESS", priority_rank=5, origin_code="NDLS", destination_code="PRYJ", rake_type="ICF", max_speed_kmh=110.0, length_coaches=20),
            Train(number="64154", name="Aligarh-Kanpur MEMU Passenger", train_type="PASSENGER", priority_rank=6, origin_code="ALJN", destination_code="CNB", rake_type="MEMU", max_speed_kmh=100.0, length_coaches=12),
            Train(number="BOXN-9021", name="Heavy Haul Coal Freight", train_type="FREIGHT", priority_rank=7, origin_code="GZB", destination_code="DDU", rake_type="Freight-WAG9", max_speed_kmh=75.0, length_coaches=58),
        ]
        for t in trains:
            session.add(t)

        # 4. Schedule Stops
        # Train 22436: Vande Bharat Express (Fastest, selective stops)
        vb_stops = [
            ScheduleStop(train_number="22436", station_code="NDLS", stop_sequence=1, scheduled_arrival="06:00", scheduled_departure="06:00", dwell_minutes=0, distance_from_origin=0.0, platform_scheduled="PF-16"),
            ScheduleStop(train_number="22436", station_code="CNB", stop_sequence=2, scheduled_arrival="10:08", scheduled_departure="10:10", dwell_minutes=2, distance_from_origin=440.2, platform_scheduled="PF-1"),
            ScheduleStop(train_number="22436", station_code="PRYJ", stop_sequence=3, scheduled_arrival="12:08", scheduled_departure="12:10", dwell_minutes=2, distance_from_origin=634.7, platform_scheduled="PF-6"),
            ScheduleStop(train_number="22436", station_code="DDU", stop_sequence=4, scheduled_arrival="14:00", scheduled_departure="14:05", dwell_minutes=5, distance_from_origin=786.5, platform_scheduled="PF-2"),
        ]
        for st in vb_stops:
            session.add(st)

        # Train 12302: Howrah Rajdhani
        raj_stops = [
            ScheduleStop(train_number="12302", station_code="NDLS", stop_sequence=1, scheduled_arrival="16:50", scheduled_departure="16:50", dwell_minutes=0, distance_from_origin=0.0, platform_scheduled="PF-12"),
            ScheduleStop(train_number="12302", station_code="CNB", stop_sequence=2, scheduled_arrival="21:32", scheduled_departure="21:37", dwell_minutes=5, distance_from_origin=440.2, platform_scheduled="PF-1"),
            ScheduleStop(train_number="12302", station_code="PRYJ", stop_sequence=3, scheduled_arrival="23:43", scheduled_departure="23:45", dwell_minutes=2, distance_from_origin=634.7, platform_scheduled="PF-4"),
            ScheduleStop(train_number="12302", station_code="DDU", stop_sequence=4, scheduled_arrival="01:42", scheduled_departure="01:52", dwell_minutes=10, distance_from_origin=786.5, platform_scheduled="PF-1"),
        ]
        for st in raj_stops:
            session.add(st)

        # Train 12004: Lucknow Shatabdi
        shat_stops = [
            ScheduleStop(train_number="12004", station_code="NDLS", stop_sequence=1, scheduled_arrival="06:10", scheduled_departure="06:10", dwell_minutes=0, distance_from_origin=0.0, platform_scheduled="PF-1"),
            ScheduleStop(train_number="12004", station_code="GZB", stop_sequence=2, scheduled_arrival="06:46", scheduled_departure="06:48", dwell_minutes=2, distance_from_origin=25.6, platform_scheduled="PF-2"),
            ScheduleStop(train_number="12004", station_code="ALJN", stop_sequence=3, scheduled_arrival="07:47", scheduled_departure="07:49", dwell_minutes=2, distance_from_origin=126.3, platform_scheduled="PF-3"),
            ScheduleStop(train_number="12004", station_code="TDL", stop_sequence=4, scheduled_arrival="08:45", scheduled_departure="08:47", dwell_minutes=2, distance_from_origin=204.0, platform_scheduled="PF-3"),
            ScheduleStop(train_number="12004", station_code="ETW", stop_sequence=5, scheduled_arrival="09:40", scheduled_departure="09:42", dwell_minutes=2, distance_from_origin=296.0, platform_scheduled="PF-2"),
            ScheduleStop(train_number="12004", station_code="CNB", stop_sequence=6, scheduled_arrival="11:20", scheduled_departure="11:25", dwell_minutes=5, distance_from_origin=440.2, platform_scheduled="PF-3"),
        ]
        for st in shat_stops:
            session.add(st)

        # Train 12418: Prayagraj Express (Overnight premier superfast)
        pryj_stops = [
            ScheduleStop(train_number="12418", station_code="NDLS", stop_sequence=1, scheduled_arrival="22:10", scheduled_departure="22:10", dwell_minutes=0, distance_from_origin=0.0, platform_scheduled="PF-14"),
            ScheduleStop(train_number="12418", station_code="GZB", stop_sequence=2, scheduled_arrival="22:42", scheduled_departure="22:44", dwell_minutes=2, distance_from_origin=25.6, platform_scheduled="PF-1"),
            ScheduleStop(train_number="12418", station_code="ALJN", stop_sequence=3, scheduled_arrival="23:55", scheduled_departure="23:57", dwell_minutes=2, distance_from_origin=126.3, platform_scheduled="PF-2"),
            ScheduleStop(train_number="12418", station_code="FTP", stop_sequence=4, scheduled_arrival="04:50", scheduled_departure="04:52", dwell_minutes=2, distance_from_origin=517.5, platform_scheduled="PF-3"),
            ScheduleStop(train_number="12418", station_code="PRYJ", stop_sequence=5, scheduled_arrival="07:00", scheduled_departure="07:00", dwell_minutes=0, distance_from_origin=634.7, platform_scheduled="PF-1"),
        ]
        for st in pryj_stops:
            session.add(st)

        # Train 12560: Shiv Ganga Express
        shiv_stops = [
            ScheduleStop(train_number="12560", station_code="NDLS", stop_sequence=1, scheduled_arrival="20:05", scheduled_departure="20:05", dwell_minutes=0, distance_from_origin=0.0, platform_scheduled="PF-8"),
            ScheduleStop(train_number="12560", station_code="CNB", stop_sequence=2, scheduled_arrival="01:00", scheduled_departure="01:05", dwell_minutes=5, distance_from_origin=440.2, platform_scheduled="PF-5"),
            ScheduleStop(train_number="12560", station_code="PRYJ", stop_sequence=3, scheduled_arrival="03:45", scheduled_departure="03:55", dwell_minutes=10, distance_from_origin=634.7, platform_scheduled="PF-7"),
            ScheduleStop(train_number="12560", station_code="DDU", stop_sequence=4, scheduled_arrival="06:10", scheduled_departure="06:20", dwell_minutes=10, distance_from_origin=786.5, platform_scheduled="PF-4"),
        ]
        for st in shiv_stops:
            session.add(st)

        # Train 12420: Gomti Express (Intercity, stops at almost all stations)
        gomti_stops = [
            ScheduleStop(train_number="12420", station_code="NDLS", stop_sequence=1, scheduled_arrival="12:20", scheduled_departure="12:20", dwell_minutes=0, distance_from_origin=0.0, platform_scheduled="PF-5"),
            ScheduleStop(train_number="12420", station_code="GZB", stop_sequence=2, scheduled_arrival="12:54", scheduled_departure="12:56", dwell_minutes=2, distance_from_origin=25.6, platform_scheduled="PF-1"),
            ScheduleStop(train_number="12420", station_code="ALJN", stop_sequence=3, scheduled_arrival="14:15", scheduled_departure="14:17", dwell_minutes=2, distance_from_origin=126.3, platform_scheduled="PF-2"),
            ScheduleStop(train_number="12420", station_code="TDL", stop_sequence=4, scheduled_arrival="15:55", scheduled_departure="15:57", dwell_minutes=2, distance_from_origin=204.0, platform_scheduled="PF-4"),
            ScheduleStop(train_number="12420", station_code="ETW", stop_sequence=5, scheduled_arrival="17:08", scheduled_departure="17:10", dwell_minutes=2, distance_from_origin=296.0, platform_scheduled="PF-3"),
            ScheduleStop(train_number="12420", station_code="CNB", stop_sequence=6, scheduled_arrival="19:45", scheduled_departure="19:50", dwell_minutes=5, distance_from_origin=440.2, platform_scheduled="PF-2"),
        ]
        for st in gomti_stops:
            session.add(st)

        # Train 14218: Unchahar Express
        unch_stops = [
            ScheduleStop(train_number="14218", station_code="NDLS", stop_sequence=1, scheduled_arrival="21:10", scheduled_departure="21:10", dwell_minutes=0, distance_from_origin=0.0, platform_scheduled="PF-6"),
            ScheduleStop(train_number="14218", station_code="GZB", stop_sequence=2, scheduled_arrival="21:48", scheduled_departure="21:50", dwell_minutes=2, distance_from_origin=25.6, platform_scheduled="PF-2"),
            ScheduleStop(train_number="14218", station_code="ALJN", stop_sequence=3, scheduled_arrival="23:18", scheduled_departure="23:20", dwell_minutes=2, distance_from_origin=126.3, platform_scheduled="PF-2"),
            ScheduleStop(train_number="14218", station_code="TDL", stop_sequence=4, scheduled_arrival="00:40", scheduled_departure="00:45", dwell_minutes=5, distance_from_origin=204.0, platform_scheduled="PF-3"),
            ScheduleStop(train_number="14218", station_code="ETW", stop_sequence=5, scheduled_arrival="01:50", scheduled_departure="01:52", dwell_minutes=2, distance_from_origin=296.0, platform_scheduled="PF-1"),
            ScheduleStop(train_number="14218", station_code="CNB", stop_sequence=6, scheduled_arrival="05:30", scheduled_departure="05:35", dwell_minutes=5, distance_from_origin=440.2, platform_scheduled="PF-4"),
            ScheduleStop(train_number="14218", station_code="FTP", stop_sequence=7, scheduled_arrival="06:48", scheduled_departure="06:50", dwell_minutes=2, distance_from_origin=517.5, platform_scheduled="PF-2"),
            ScheduleStop(train_number="14218", station_code="PRYJ", stop_sequence=8, scheduled_arrival="08:50", scheduled_departure="08:50", dwell_minutes=0, distance_from_origin=634.7, platform_scheduled="PF-3"),
        ]
        for st in unch_stops:
            session.add(st)

        # Train 64154: Aligarh-Kanpur MEMU
        memu_stops = [
            ScheduleStop(train_number="64154", station_code="ALJN", stop_sequence=1, scheduled_arrival="13:30", scheduled_departure="13:30", dwell_minutes=0, distance_from_origin=126.3, platform_scheduled="PF-4"),
            ScheduleStop(train_number="64154", station_code="TDL", stop_sequence=2, scheduled_arrival="15:10", scheduled_departure="15:15", dwell_minutes=5, distance_from_origin=204.0, platform_scheduled="PF-5"),
            ScheduleStop(train_number="64154", station_code="ETW", stop_sequence=3, scheduled_arrival="16:50", scheduled_departure="16:55", dwell_minutes=5, distance_from_origin=296.0, platform_scheduled="PF-3"),
            ScheduleStop(train_number="64154", station_code="CNB", stop_sequence=4, scheduled_arrival="19:30", scheduled_departure="19:30", dwell_minutes=0, distance_from_origin=440.2, platform_scheduled="PF-8"),
        ]
        for st in memu_stops:
            session.add(st)

        # Train BOXN-9021: Freight
        freight_stops = [
            ScheduleStop(train_number="BOXN-9021", station_code="GZB", stop_sequence=1, scheduled_arrival="11:00", scheduled_departure="11:00", dwell_minutes=0, distance_from_origin=25.6, platform_scheduled="Loop-1"),
            ScheduleStop(train_number="BOXN-9021", station_code="TDL", stop_sequence=2, scheduled_arrival="14:30", scheduled_departure="14:50", dwell_minutes=20, distance_from_origin=204.0, platform_scheduled="Goods-Yard"),
            ScheduleStop(train_number="BOXN-9021", station_code="CNB", stop_sequence=3, scheduled_arrival="19:10", scheduled_departure="19:40", dwell_minutes=30, distance_from_origin=440.2, platform_scheduled="Yard-2"),
            ScheduleStop(train_number="BOXN-9021", station_code="DDU", stop_sequence=4, scheduled_arrival="02:30", scheduled_departure="02:30", dwell_minutes=0, distance_from_origin=786.5, platform_scheduled="Marshalling-Yard"),
        ]
        for st in freight_stops:
            session.add(st)

        # 5. Live State (Realistic real-time snapshot)
        # Train 22436: VB running past Kanpur Central towards Prayagraj on time
        # Train 12420: Gomti Express running near Etawah, delayed by 24 mins due to caution order + loop holding
        # Train 12004: Shatabdi running between Aligarh and Tundla
        # Train 12418: Prayagraj Express at New Delhi ready to depart
        live_states = [
            LiveTrainState(
                train_number="22436",
                current_station_code="CNB",
                next_station_code="PRYJ",
                current_km=485.0,
                current_speed_kmh=142.0,
                operational_status="RUNNING",
                current_delay_minutes=4.0,
                allocated_platform="PF-1",
                held_reason=None
            ),
            LiveTrainState(
                train_number="12302",
                current_station_code="NDLS",
                next_station_code="CNB",
                current_km=18.0,
                current_speed_kmh=105.0,
                operational_status="RUNNING",
                current_delay_minutes=2.0,
                allocated_platform="PF-12",
                held_reason=None
            ),
            LiveTrainState(
                train_number="12004",
                current_station_code="ALJN",
                next_station_code="TDL",
                current_km=175.0,
                current_speed_kmh=88.0,
                operational_status="RUNNING",
                current_delay_minutes=12.0,
                allocated_platform="PF-3",
                held_reason="Slowed by Caution Order (TSR 30 km/h) at km 160"
            ),
            LiveTrainState(
                train_number="12420",
                current_station_code="ETW",
                next_station_code="CNB",
                current_km=296.0,
                current_speed_kmh=0.0,
                operational_status="HELD_LOOP_PRECEDENCE",
                current_delay_minutes=28.0,
                allocated_platform="PF-3",
                held_reason="Looped at Etawah Platform 3 for High-Priority Vande Bharat (22436) Overtake"
            ),
            LiveTrainState(
                train_number="12418",
                current_station_code="NDLS",
                next_station_code="GZB",
                current_km=0.0,
                current_speed_kmh=0.0,
                operational_status="SCHEDULED",
                current_delay_minutes=0.0,
                allocated_platform="PF-14",
                held_reason="Boarding in progress at NDLS"
            ),
            LiveTrainState(
                train_number="12560",
                current_station_code="NDLS",
                next_station_code="CNB",
                current_km=0.0,
                current_speed_kmh=0.0,
                operational_status="SCHEDULED",
                current_delay_minutes=0.0,
                allocated_platform="PF-8",
                held_reason="Rake shunted to PF-8"
            ),
            LiveTrainState(
                train_number="14218",
                current_station_code="NDLS",
                next_station_code="GZB",
                current_km=0.0,
                current_speed_kmh=0.0,
                operational_status="SCHEDULED",
                current_delay_minutes=0.0,
                allocated_platform="PF-6",
                held_reason=None
            ),
            LiveTrainState(
                train_number="64154",
                current_station_code="TDL",
                next_station_code="ETW",
                current_km=218.0,
                current_speed_kmh=64.0,
                operational_status="RUNNING",
                current_delay_minutes=35.0,
                allocated_platform="PF-5",
                held_reason="Precedence waits for 12004 Shatabdi and caution order"
            ),
            LiveTrainState(
                train_number="BOXN-9021",
                current_station_code="ETW",
                next_station_code="CNB",
                current_km=340.0,
                current_speed_kmh=52.0,
                operational_status="RUNNING",
                current_delay_minutes=48.0,
                allocated_platform="Loop-1",
                held_reason="Regulated to loop lines for coaching trains"
            ),
        ]
        for ls in live_states:
            session.add(ls)

        # 6. Active Caution Orders (Temporary Speed Restrictions - TSR)
        cautions = [
            CautionOrder(
                section_from="ALJN",
                section_to="TDL",
                km_start=158.5,
                km_end=163.2,
                restricted_speed_kmh=30.0,
                normal_speed_kmh=130.0,
                reason="Track Renewal & Ballast Tamping Machine Block (Sr.DEN Memo #741)",
                issued_by="Sr. DEN / PRYJ",
                is_active=True
            ),
            CautionOrder(
                section_from="CNB",
                section_to="FTP",
                km_start=468.0,
                km_end=471.0,
                restricted_speed_kmh=20.0,
                normal_speed_kmh=130.0,
                reason="Ganga River Bridge #84 Pier Structural Inspection & Bearing Pad Greasing",
                issued_by="Dy. CE (Bridges) / NCR",
                is_active=True
            ),
        ]
        for c in cautions:
            session.add(c)

        # 7. Weather Incident
        weather = [
            WeatherIncident(
                section_from="ETW",
                section_to="CNB",
                condition="MODERATE_FOG",
                visibility_meters=450,
                max_permissible_speed_override=90.0,
                is_active=True
            )
        ]
        for w in weather:
            session.add(w)

        # 8. Digital TSR Logs (Replacing paper registers)
        sample_logs = [
            DigitalTSRLog(
                timestamp="2026-09-09 10:06:12",
                station_code="CNB",
                train_number="22436",
                event_type="ARRIVAL",
                platform="PF-1",
                line_number="Main Line 1",
                delay_at_event=4.0,
                recorded_by="SM-CNB-ShiftA",
                remarks="Arrived on Line 1. Fast turnaround, 42 passengers alighting."
            ),
            DigitalTSRLog(
                timestamp="2026-09-09 10:09:45",
                station_code="CNB",
                train_number="22436",
                event_type="DEPARTURE",
                platform="PF-1",
                line_number="Main Line 1",
                delay_at_event=3.5,
                recorded_by="SM-CNB-ShiftA",
                remarks="Right-time departure towards Prayagraj."
            ),
            DigitalTSRLog(
                timestamp="2026-09-09 14:12:00",
                station_code="ALJN",
                train_number="12420",
                event_type="ARRIVAL",
                platform="PF-2",
                line_number="Platform Loop 2",
                delay_at_event=14.0,
                recorded_by="SM-ALJN-East",
                remarks="Delayed by 14m due to TSR at km 160."
            ),
            DigitalTSRLog(
                timestamp="2026-09-09 16:45:30",
                station_code="ETW",
                train_number="12420",
                event_type="OUTER_SIGNAL_HOLD",
                platform="PF-3",
                line_number="Loop Line 3",
                delay_at_event=28.0,
                recorded_by="SM-ETW-Central",
                remarks="Held on loop line for VB 22436 precedence as per Section Controller order."
            )
        ]
        for lg in sample_logs:
            session.add(lg)

        session.commit()
        print("Database successfully seeded with realistic Indian Railways HDN-1 data.")


if __name__ == "__main__":
    from backend.database import init_db
    init_db()
    seed_database()
