from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

class CounselingSummaryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: str = Field(min_length=1, max_length=100)
    transcript: str = Field(min_length=1)
    language: Literal["ko", "en"] = "ko"

class RiskIndicator(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: Literal[
        "self_harm",
        "harm_to_others",
        "abuse",
        "medical_emergency",
        "other",
    ]
    evidence: str = Field(
        description="원문에서 확인 가능한 짧은 근거. 새로운 사실을 추론하지 않는다."
    )
    requires_immediate_review: bool

class CounselingSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overview: str = Field(
        description="상담 전체를 사실 중심으로 정리한 짧은 요약"
    )
    main_topics: list[str]
    client_statements: list[str] = Field(
        description="내담자가 직접 표현한 주요 어려움, 감정, 요구"
    )
    counselor_interventions: list[str] = Field(
        description="상담자가 수행한 질문, 반영, 안내, 개입"
    )
    agreed_actions: list[str] = Field(
        description="상담 중 명시적으로 합의된 실행 항목"
    )
    follow_up_items: list[str] = Field(
        description="다음 상담에서 확인해야 할 사항"
    )
    risk_indicators: list[RiskIndicator]
    uncertainties: list[str] = Field(
        description="원문만으로 확정할 수 없거나 불명확한 내용"
    )

class CounselingSummaryResponse(BaseModel):
    job_id: str
    status: Literal["completed"] = "completed"
    summary: CounselingSummary
    model: str
    provider_response_id: str
    input_tokens: int | None = None
    output_tokens: int | None = None

class SummaryErrorResponse(BaseModel):
    job_id: str
    status: Literal["failed"] = "failed"
    error_code: str
    message: str

class InternalSummarizeRequest(CounselingSummaryRequest):
    @model_validator(mode="after")
    def reject_blank_transcript(self) -> "InternalSummarizeRequest":
        if not self.transcript.strip():
            raise ValueError("transcript must not be blank")
        return self
