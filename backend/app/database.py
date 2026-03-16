from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

raw_url = os.environ.get("DATABASE_URL", "NOT SET")
logger.info(f"RAW DATABASE_URL FROM ENV: '{raw_url}'")

DATABASE_URL = raw_url if raw_url != "NOT SET" else "sqlite:///./leads.db"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

logger.info(f"FINAL DATABASE_URL: '{DATABASE_URL[:60]}...'")

try:
    if "sqlite" in DATABASE_URL:
        logger.warning("USING SQLITE — data will not persist on redeploy")
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
    else:
        logger.info("USING POSTGRES — connecting to Supabase")
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=2,
            max_overflow=0,
            connect_args={"connect_timeout": 10}
        )
    logger.info("DATABASE ENGINE CREATED SUCCESSFULLY")
except Exception as e:
    logger.error(f"DATABASE ENGINE CREATION FAILED: {str(e)}")
    logger.warning("FALLING BACK TO SQLITE")
    engine = create_engine(
        "sqlite:///./leads.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
