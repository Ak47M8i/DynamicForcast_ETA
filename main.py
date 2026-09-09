"""
RailGati-AI / GatiDrishti
Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains (SIH 26028)
Local Server Launcher
"""

import sys
import os

# Add workspace to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 70)
    print("  RAILGATI-AI: DYNAMIC ETA FORECAST FOR COACHING TRAINS (SIH 26028)")
    print("  Indian Railways HDN-1 Corridor (New Delhi to Pt. Deen Dayal Upadhyaya)")
    print("=" * 70)
    print("  Starting unified local server at: http://localhost:8000")
    print("  API Documentation available at:   http://localhost:8000/docs")
    print("=" * 70 + "\n")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
