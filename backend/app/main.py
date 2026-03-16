"""NetLab — Interactive Network Engineering Labs API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import labs, topology, cli, progress

app = FastAPI(
    title="NetLab API",
    description="Backend for interactive network engineering labs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "netlab-api"}


app.include_router(labs.router, prefix="/api/labs", tags=["Labs"])
app.include_router(topology.router, prefix="/api/topology", tags=["Topology"])
app.include_router(cli.router, prefix="/api/cli", tags=["CLI"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
