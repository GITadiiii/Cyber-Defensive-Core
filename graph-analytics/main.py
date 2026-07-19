import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from neo4j import GraphDatabase
from pydantic import BaseModel

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
    account_number: str | None = None
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


class GraphAnalyzeRequest(BaseModel):
    session_uuid: str | None = None
    citizen_phone_hash: str | None = None
    incidentType: str | None = None
    location: dict | None = None
    filePath: str | None = None
    account_number: str | None = None


@app.post("/api/v1/graph/analyze")
async def graph_analyze(payload: GraphAnalyzeRequest):
    """
    Compatibility endpoint for gateway-server (Payal's incidentController.js),
    which expects a response shaped like { "lviScore": <number> }.
    """
    try:
        with driver.session() as session:
            if payload.account_number:
                chains = find_mule_chains_from_account(session, payload.account_number)
            else:
                accounts = get_laundering_linked_accounts(session)
                chains = []
                for account in accounts[:20]:
                    chains.extend(find_mule_chains_from_account(session, account))
                    if len(chains) >= 10:
                        break

        if not chains:
            return {"lviScore": 0}

        top_score = max(chain["network_velocity_score"] for chain in chains)
        return {"lviScore": top_score}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}