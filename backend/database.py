from sqlalchemy import create_engine, Column, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# SQLite database for simplicity
SQLALCHEMY_DATABASE_URL = "sqlite:///./bank_rates.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class BankRate(Base):
    __tablename__ = "bank_rates"

    bank_name = Column(String, primary_key=True)
    rate_10_years = Column(Float)
    rate_15_years = Column(Float)
    rate_20_years = Column(Float)
    rate_25_years = Column(Float)
    rate_30_years = Column(Float, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    source_url = Column(String, nullable=True)
    is_promotional = Column(Boolean, default=False)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()