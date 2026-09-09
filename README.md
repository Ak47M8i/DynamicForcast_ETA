# RailGati-AI / GatiDrishti
### Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains
**Smart India Hackathon (SIH 2026) — Problem Statement ID: 26028**  
**Sponsoring Organization:** Ministry of Railways, Government of India  
**Target Corridor:** Indian Railways High-Density Network 1 (HDN-1: New Delhi ➔ Pt. Deen Dayal Upadhyaya Jn, 786.5 KM)

---

## 1. Executive Summary & Ground Reality

### The Problem:
Indian Railways runs over 13,000 coaching (passenger) trains daily, carrying more than 23 million citizens. However, predicting accurate Expected Time of Arrival (ETA) remains one of the greatest operational hurdles in the network.

Today, passengers and operational staff face significant challenges due to **two fundamental bottlenecks**:
1. **Legacy Systems Use Static Linear Extrapolation (NTES Failure)**: If a train departs 30 minutes late from Station A, conventional systems (like NTES) simply project a flat 30-minute delay at every upcoming station down the line. In reality, delays in railway operations are **highly dynamic and non-linear**.
2. **Operations Locked in Paper & Telephone Calls**: In field control offices and station cabins, Station Masters (SM), Section Controllers (SCOR), and Yard Masters still record train movements on physical paper registers—the **Train Signal Register (TSR)**, hand-drawn **colored-pencil time-distance string charts**, and physical paper **Caution Order memos**. Because updates remain siloed on paper, downstream delay forecasts are inaccurate and outdated.

### The Solution: RailGati-AI
RailGati-AI is a full-stack, local-server-hostable operational platform that pairs a **high-precision, physics- and priority-based dynamic forecasting backend** with a **paperless operations suite for railway personnel**.

```
+-------------------------------------------------------------------------------------------------+
|                                     RAILGATI-AI ECOSYSTEM                                       |
+-------------------------------------------------------------------------------------------------+
|  [PASSENGER & CREW]          [SECTION CONTROLLER]         [STATION MASTER]       [P-WAY ENGR]   |
|  Dynamic ETA & Factors  |  Digital String Chart   |  Digital TSR Paperless |  TSR & Fog Control |
+-------------------------------------------------------------------------------------------------+
|                                         HTTP / WebSockets                                       |
+-------------------------------------------------------------------------------------------------+
|                                 DYNAMIC MULTI-FACTOR ETA ENGINE                                 |
|  Kinematics • Precedence Resolver • TSR Slow Zones • Fog Caps • Platform Dwell • Slack Recovery |
+-------------------------------------------------------------------------------------------------+
|                                 HIGH-DENSITY CORRIDOR TELEMETRY                                 |
|  HDN-1: NDLS ➔ GZB ➔ ALJN ➔ TDL ➔ ETW ➔ CNB ➔ FTP ➔ PRYJ ➔ MZP ➔ DDU (786.5 KM)                |
+-------------------------------------------------------------------------------------------------+
```

---

## 2. Core Mathematical Formulation: Dynamic Multi-Factor ETA

Rather than simple $ETA = Scheduled + Delay_{current}$, RailGati-AI calculates the dynamic arrival time at station $k$:

$$ETA_k = Scheduled_k + Delay_{current} + \sum_{s=current}^{k} \left( \Delta D_{line\_cong}(s) + \Delta D_{precedence}(s) + \Delta D_{caution}(s) + \Delta D_{weather}(s) \right) + \Delta D_{platform}(k) - Slack_{recovery}(s \to k)$$

### Breakdown of Contributing Dynamic Factors:
1. **$\Delta D_{precedence}(s)$ — Priority & Overtaking Regulation**:
   Indian Railways enforces strict train precedence hierarchies:
   $$\text{Vande Bharat (P1)} > \text{Rajdhani (P2)} > \text{Shatabdi (P3)} > \text{Superfast (P4)} > \text{Express (P5)} > \text{Passenger (P6)} > \text{Freight (P7)}$$
   When a high-priority train is trailing behind an Express train within 65 km on the same line, the lower-priority train is dynamically assigned a loop-line hold (+10m to +15m) to grant a green wave to the premier train.
2. **$\Delta D_{caution}(s)$ — Temporary Speed Restriction (TSR)**:
   For engineering maintenance zones where track speed drops from normal MPS (130 km/h) to restricted speed (e.g. 20–30 km/h), the engine computes kinetic transit delay:
   $$\Delta D_{caution} = \left(\frac{\text{Distance}}{V_{restricted}} - \frac{\text{Distance}}{V_{normal}}\right) \times 60 + \text{Braking/Acceleration Loss (1.5m)}$$
3. **$\Delta D_{weather}(s)$ — Adverse Weather & Winter Fog Protocol**:
   When dense fog is active (visibility $< 400\text{m}$), Indian Railways mandates Fog Pass Device operating limits, capping speeds to 60 or 75 km/h.
4. **$\Delta D_{platform}(k)$ — Platform & Yard Dwell Bottleneck**:
   At major junctions (Kanpur Central, Prayagraj Jn, New Delhi), when platform occupancy reaches $\ge 70\%$, incoming trains experience outer-signal reception buffers (+4m to +12m).
5. **$Slack_{recovery}(s \to k)$ — Timetable Slack Recovery**:
   Official Indian Railways Working Timetables (WTT) build in 5–8% slack buffer. If a delayed train has a green corridor with no caution orders, drivers utilize schedule slack to make up 3–6 minutes per 100 km.
6. **Confidence Interval Estimation**:
   $$\text{Confidence} = \max\left(55\%, 98\% - 4.5\% \times \text{Hops}\right) \quad\implies\quad \text{ETA Window: } \pm \max\left(2, \text{Hops} \times 2.5\right) \text{ mins}$$

---

## 3. Key Modules & Features

### 1. Dynamic Train ETA & Explainable Delay Board
* Live search and filter across coaching trains (Vande Bharat, Rajdhani, Shatabdi, Prayagraj Exp, Gomti Exp, etc.).
* **Explainable Delay Attribution Cards**: Transparent breakdown showing why a train is late (e.g. `+14m Precedence hold for VB 22436`, `+6m TSR Caution at km 158`, `-4m Timetable Slack Recovery`).
* **Side-by-Side Comparison Table**: Scheduled vs. Static NTES vs. Dynamic Forecast ETA with real-time confidence bounds ($\pm \text{mins}$).

### 2. Section Controller Digital String Chart (Time-Distance Graph)
* **Direct replacement for paper control rolls and colored pencils**: Interactive digital time-distance trajectory graph used by Indian Railways Section Controllers (SCOR).
* Plots train trajectories over time (06:00 to 24:00) across stations from New Delhi to DDU (786.5 km).
* Instantly highlights line conflicts and overtaking points where lines converge.

### 3. Station Master Digital TSR (Train Signal Register)
* **100% paperless replacement for physical station registers**.
* One-click logging for Station Masters: **Train Arrival**, **Train Departure**, **Hold Outer Signal**, **Grant Line Clear**, and **Platform Diversion**.
* Auto-timestamps, tracks platform occupancy, and **instantly recalculates dynamic ETAs across the entire downstream network**.

### 4. Caution Order (TSR Memo) & Weather Console
* Digital issuance of Temporary Speed Restrictions by Permanent Way (P-Way) engineers.
* Real-time winter fog and rain toggles to simulate seasonal delays across Northern India.

### 5. Dispatcher "What-If" Scenario Simulator
* Decision-support sandbox for Section Controllers: "What if I hold Train 12420 at Etawah for 15 minutes to let 22436 cross?"
* Evaluates ripple delays and provides an automated AI Dispatcher Recommendation.

### 6. Corridor Track Topology & Block Occupancy Map
* Linear schematic of HDN-1 showing all 10 major junctions, double/triple/quadruple tracks, and live train positions.

---

## 4. Pre-Seeded Corridor: Indian Railways HDN-1

The application is pre-seeded with the complete **HDN-1 (High-Density Network 1)** trunk corridor:
* **Distance:** 786.5 KM (Fully Electrified, Automatic Signaling)
* **Stations:**
  1. `NDLS` — New Delhi (KM 0.0, 16 Platforms)
  2. `GZB` — Ghaziabad Junction (KM 25.6, 6 Platforms, 4-Track line)
  3. `ALJN` — Aligarh Junction (KM 126.3, 7 Platforms, 3-Track line)
  4. `TDL` — Tundla Junction (KM 204.0, 7 Platforms, 2-Track line)
  5. `ETW` — Etawah Junction (KM 296.0, 5 Platforms, 2-Track line)
  6. `CNB` — Kanpur Central (KM 440.2, 10 Platforms, 2-Track line)
  7. `FTP` — Fatehpur (KM 517.5, 4 Platforms, 3-Track line)
  8. `PRYJ` — Prayagraj Junction (KM 634.7, 10 Platforms, 3-Track line)
  9. `MZP` — Mirzapur (KM 723.8, 3 Platforms, 2-Track line)
  10. `DDU` — Pt. Deen Dayal Upadhyaya Junction (KM 786.5, 8 Platforms, 2-Track line)

---

## 5. Quick Start & Local Server Hosting

### Prerequisites:
* Python 3.10+ (tested on Python 3.13)
* Node.js 18+ (tested on Node.js 24)

### Step 1: Clone or Navigate to Directory
```powershell
cd e:\DynamicForcast_ETA
```

### Step 2: One-Click Startup (Windows)
Double-click or run from terminal:
```cmd
start.bat
```
*(Or via PowerShell: `.\start.ps1`)*

### Step 3: Access the Application
* **Web Dashboard:** [http://localhost:8000](http://localhost:8000)
* **Interactive API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Alternative ReDoc Docs:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 6. Verification & Test Suite

RailGati-AI includes a comprehensive automated test suite verifying mathematical forecasting accuracy, speed restrictions, precedence logic, REST endpoints, and static web serving:

```powershell
.\venv\Scripts\pytest.exe -v
```

### Test Results:
```
tests/test_api.py::test_api_trains_list PASSED                           [  9%]
tests/test_api.py::test_api_train_detail_forecast PASSED                 [ 18%]
tests/test_api.py::test_api_corridor_overview PASSED                     [ 27%]
tests/test_api.py::test_api_tsr_log_and_update PASSED                    [ 36%]
tests/test_api.py::test_api_string_chart PASSED                          [ 45%]
tests/test_api.py::test_api_simulation PASSED                            [ 54%]
tests/test_api.py::test_frontend_static_served PASSED                    [ 63%]
tests/test_eta_engine.py::test_time_conversion_utilities PASSED          [ 72%]
tests/test_eta_engine.py::test_calculate_caution_delay PASSED            [ 81%]
tests/test_eta_engine.py::test_calculate_weather_delay PASSED            [ 90%]
tests/test_eta_engine.py::test_dynamic_forecast_engine PASSED            [100%]
======================= 11 passed in 3.39s =======================
```

---

## 7. Technology Stack Summary

* **Backend Engine:** Python 3.13, FastAPI, Uvicorn, SQLModel, SQLAlchemy, Pydantic, WebSockets
* **Database:** SQLite (zero-config, portable, self-contained persistence)
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts
* **Deployment:** Unified single-port deployment on port 8000 with one-click Windows launchers (`start.bat`, `start.ps1`)

---
*Developed for Smart India Hackathon (SIH 2026) • Ministry of Railways Problem Statement 26028*
