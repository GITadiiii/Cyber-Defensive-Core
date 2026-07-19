"""
main.py (for graph-analytics)
FastAPI wrapper around trace_mule.py's Cypher-based mule chain detection.
Exposes POST /api/v1/graph/trace-mule per the Phase 3 API contract.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager
import os

from dotenv import load_dotenv
from neo4j import GraphDatabase

from trace_mule import get_laundering_linked_accounts, find_mule_chains_from_account

load_dotenv()

URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")

driver = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global driver
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
    yield
    driver.close()

app = FastAPI(title="Mule Chain Detection Service", lifespan=lifespan)


class TraceMuleRequest(BaseModel):
    account_number: str | None = None  # optional: search from a specific account
    max_accounts_to_check: int = 20
    max_results: int = 10


@app.post("/api/v1/graph/trace-mule")
async def trace_mule(payload: TraceMuleRequest):
    try:
        with driver.session() as session:
            if payload.account_number:
                chains = find_mule_chains_from_account(
                    session, payload.account_number, limit_per_account=payload.max_results
                )
            else:
                accounts = get_laundering_linked_accounts(session)
                chains = []
                for account in accounts[:payload.max_accounts_to_check]:
                    chains.extend(find_mule_chains_from_account(session, account))
                    if len(chains) >= payload.max_results:
                        break
                chains = chains[:payload.max_results]

        return {"chains": chains, "count": len(chains)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}