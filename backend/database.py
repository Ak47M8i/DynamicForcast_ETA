import os
from sqlmodel import SQLModel, create_engine, Session

DB_PATH = os.path.join(os.path.dirname(__file__), "railgati.db")
sqlite_url = f"sqlite:///{DB_PATH}"

# connect_args={"check_same_thread": False} is needed for SQLite with FastAPI multi-threaded requests
engine = create_engine(sqlite_url, echo=False, connect_args={"check_same_thread": False})


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
