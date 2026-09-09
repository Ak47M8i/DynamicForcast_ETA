import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List

from backend.database import init_db
from backend.seed_data import seed_database
from backend.api import api_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed Indian Railways corridor data
    init_db()
    seed_database()
    yield

app = FastAPI(
    title="RailGati-AI / GatiDrishti",
    description="Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains (SIH 26028)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for local frontend dev server (e.g. Vite on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API router
app.include_router(api_router)


# WebSocket Connection Manager for real-time live push updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or broadcast updates
            await manager.broadcast(f"EVENT: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)



# Mount frontend static build if present
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "system": "RailGati-AI Backend",
            "status": "Online",
            "message": "Dynamic Forecast of ETA for Coaching Trains (SIH 26028)",
            "api_docs": "/docs",
            "api_endpoint": "/api/trains"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
