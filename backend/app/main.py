from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import leads, pipeline

#Create all tables onn startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SparsaOS - Agentic CRM API",
    description="Multi-Agent pipeline for enterprise lead automation",
    version="1.0.0"
)

# CORS - allow frontend (vercel) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Register routers
app.include_router(leads.router)
app.include_router(pipeline.router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "product": "SparsaOS",
        "description": "Agentic CRM Operating System",
        "agents": ["qualifier", "drafter", "advisor"]
    }