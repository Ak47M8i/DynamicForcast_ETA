# Step-by-Step Dependency Installation & Local Hosting Guide
## SIH Problem Statement 26028: Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains
**Project Name:** RailGati-AI / GatiDrishti  
**Corridor:** Indian Railways HDN-1 (New Delhi to Pt. Deen Dayal Upadhyaya Junction, 786.5 KM)

---

## 1. System Requirements & Prerequisites

Ensure the following runtimes are installed on your local machine:

| Component | Minimum Version | Recommended Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Python** | `3.10+` | `3.13+` | Dynamic ETA Forecasting Backend, FastAPI, SQLite ORM |
| **Node.js** | `18+` | `20+` or `24+` | React 18 frontend compilation, Vite build tool |
| **npm** | `9+` | `10+` or `11+` | Frontend package manager |
| **Git** | `2.x` | Latest | Version control |

To check if they are installed, open PowerShell or Command Prompt and run:
```powershell
python --version
node --version
npm --version
```

---

## 2. Backend Dependencies (Python)

All backend dependencies are declared in `backend/requirements.txt`.

### Step-by-Step Backend Setup:

1. Open your terminal in the project root directory (`e:\DynamicForcast_ETA`):
   ```powershell
   cd e:\DynamicForcast_ETA
   ```

2. Create an isolated Python virtual environment (`venv`):
   ```powershell
   python -m venv venv
   ```

3. Activate the virtual environment:
   * **Windows PowerShell:**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
     *(If script execution is disabled on PowerShell, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*
   * **Windows Command Prompt (cmd.exe):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   * **Linux / macOS:**
     ```bash
     source venv/bin/activate
     ```

4. Upgrade `pip` to the latest version:
   ```powershell
   python -m pip install --upgrade pip
   ```

5. Install the required Python packages:
   ```powershell
   pip install -r backend/requirements.txt
   ```

### List of Python Dependencies Added:
* **`fastapi>=0.110.0`**: High-performance asynchronous REST API framework.
* **`uvicorn[standard]>=0.28.0`**: Lightning-fast ASGI web server for local hosting.
* **`sqlmodel>=0.0.16`** & **`sqlalchemy>=2.0.14`**: Modern, type-safe SQLite ORM that manages stations, trains, tracks, caution orders, and digital TSR registers without requiring a standalone database server.
* **`pydantic>=2.6.0`**: Robust data schema validation for telemetry feeds and simulation requests.
* **`websockets>=12.0`**: Live bi-directional streaming for train positions and alerts.
* **`python-multipart>=0.0.9`**: Form payload handling for Station Master action desks.
* **`pytest>=8.0.0`**: Automated unit and integration test suite.
* **`httpx>=0.27.0`**: TestClient engine for API validation.

---

## 3. Frontend Dependencies (Node.js & React)

All frontend dependencies are declared in `frontend/package.json`.

### Step-by-Step Frontend Setup:

1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Install the frontend npm packages:
   ```powershell
   npm install
   ```

3. Build the production single-page application (SPA):
   ```powershell
   npm run build
   ```
   *(This compiles TypeScript and Tailwind into optimized static assets in `frontend/dist/`)*

4. Return to the project root:
   ```powershell
   cd ..
   ```

### List of Frontend Dependencies Added:
* **`react` & `react-dom` (`^18.3.1`)**: Component-based UI library.
* **`vite` (`^5.4.2`)**: Next-generation frontend build tool and hot-module replacement dev server.
* **`typescript` (`^5.5.3`)**: Type-safe development matching backend DTO schemas.
* **`tailwindcss` (`^3.4.10`)**: High-performance railway operations dark mode styling.
* **`lucide-react` (`^0.359.0`)**: Comprehensive railway, signal, and dispatch iconography.
* **`recharts` (`^2.12.3`)**: Trajectory, delay, and operational telemetry charts.
* **`clsx` & `tailwind-merge`**: Conditional CSS class merger.

---

## 4. One-Click Local Hosting (Unified Single Port)

The backend server is architected to host **both** the backend API and the compiled React frontend simultaneously from a **single local port (`http://localhost:8000`)**.

### Method A: One-Click Windows Script (Easiest)
Simply double-click or run:
```cmd
start.bat
```
or in PowerShell:
```powershell
.\start.ps1
```
*This script automatically checks Python and Node.js, verifies dependencies, builds the frontend if needed, and launches the application.*

### Method B: Direct Python Execution
```powershell
.\venv\Scripts\python.exe main.py
```

### Accessing the Running Application:
* **Web Application UI:** [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Alternative ReDoc API Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 5. Development Mode (Optional Live Hot-Reloading)

If you are developing or presenting code modifications live during the hackathon:

1. **Terminal 1 (Backend API with live reload):**
   ```powershell
   .\venv\Scripts\uvicorn.exe backend.main:app --reload --port 8000
   ```

2. **Terminal 2 (Frontend with Vite HMR):**
   ```powershell
   cd frontend
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) (Vite proxies all `/api` and `/ws` requests to port 8000).

---

## 6. Running Automated Verification Tests

To verify that all forecasting mathematical formulas, caution orders, weather fog limits, and API routes work without error:
```powershell
.\venv\Scripts\pytest.exe -v
```
*(All 11 unit and integration tests should report `PASSED`)*
