from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import leads, pipeline
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="SparsaOS - Agentic CRM API",
    description="Multi-Agent pipeline for enterprise lead automation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(pipeline.router)

@app.on_event("startup")
async def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        logger.warning("⚠️ Running without database — leads will not persist")

@app.get("/")
def health_check():
    return {
        "status": "online",
        "product": "SparsaOS",
        "description": "Agentic CRM Operating System",
        "agents": ["qualifier", "drafter", "advisor"]
    }