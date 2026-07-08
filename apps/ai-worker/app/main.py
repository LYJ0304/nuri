from typing import Literal

from fastapi import FastAPI, status
from pydantic import BaseModel

app = FastAPI(title="Nuri AI Worker", docs_url="/internal/docs", openapi_url="/internal/openapi.json")


class TaskRequest(BaseModel):
    job_id: str
    object_key: str | None = None
    text: str | None = None


class AcceptedResponse(BaseModel):
    status: Literal["accepted"] = "accepted"
    job_id: str
    operation: Literal["ocr", "summarize", "embed"]


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-worker"}


def accepted(request: TaskRequest, operation: Literal["ocr", "summarize", "embed"]) -> AcceptedResponse:
    return AcceptedResponse(job_id=request.job_id, operation=operation)


@app.post("/internal/ocr", status_code=status.HTTP_202_ACCEPTED)
async def ocr(request: TaskRequest) -> AcceptedResponse:
    return accepted(request, "ocr")


@app.post("/internal/summarize", status_code=status.HTTP_202_ACCEPTED)
async def summarize(request: TaskRequest) -> AcceptedResponse:
    return accepted(request, "summarize")


@app.post("/internal/embed", status_code=status.HTTP_202_ACCEPTED)
async def embed(request: TaskRequest) -> AcceptedResponse:
    return accepted(request, "embed")
