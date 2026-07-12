from typing import Literal

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.summarization.schemas import CounselingSummaryResponse, InternalSummarizeRequest
from app.summarization.service import CounselingSummaryService, SummaryProviderError

app = FastAPI(
    title="Nuri AI Worker",
    docs_url="/internal/docs",
    openapi_url="/internal/openapi.json",
)

summary_service = CounselingSummaryService(settings)


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


def accepted(
    request: TaskRequest,
    operation: Literal["ocr", "summarize", "embed"],
) -> AcceptedResponse:
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


@app.post(
    "/internal/summarize/execute",
    response_model=CounselingSummaryResponse,
)
async def execute_summary(
    request: InternalSummarizeRequest,
) -> CounselingSummaryResponse:
    try:
        return await summary_service.summarize(request)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except SummaryProviderError as exc:
        http_status = (
            status.HTTP_503_SERVICE_UNAVAILABLE
            if exc.retryable
            else status.HTTP_502_BAD_GATEWAY
        )
        raise HTTPException(
            status_code=http_status,
            detail={
                "code": exc.code,
                "message": str(exc),
                "retryable": exc.retryable,
            },
        ) from exc
