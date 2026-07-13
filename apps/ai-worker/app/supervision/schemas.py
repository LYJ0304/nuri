from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SupervisionVerdict = Literal["acceptable", "revision_required", "urgent_review"]
FindingSeverity = Literal["info", "warning", "critical"]
FindingCategory = Literal[
    "unsupported_claim",
    "missing_information",
    "misattribution",
    "risk_signal",
    "privacy",
    "follow_up",
    "clarity",
    "other",
]


class SummaryForSupervision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overview: str
    main_topics: list[str] = Field(default_factory=list)
    client_statements: list[str] = Field(default_factory=list)
    counselor_interventions: list[str] = Field(default_factory=list)
    agreed_actions: list[str] = Field(default_factory=list)
    follow_up_items: list[str] = Field(default_factory=list)
    uncertainties: list[str] = Field(default_factory=list)


class InternalSupervisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: str = Field(min_length=1, max_length=100)
    transcript: str = Field(min_length=1)
    summary: SummaryForSupervision
    language: Literal["ko", "en"] = "ko"

    @model_validator(mode="after")
    def reject_blank_values(self) -> "InternalSupervisionRequest":
        if not self.transcript.strip():
            raise ValueError("transcript must not be blank")

        if not self.summary.overview.strip():
            raise ValueError("summary.overview must not be blank")

        return self


class SupervisionFinding(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: FindingCategory
    severity: FindingSeverity

    description: str = Field(
        description="검토자가 확인해야 할 문제 또는 개선 사항"
    )
    transcript_evidence: str | None = Field(
        description=(
            "상담 기록에 실제로 존재하는 짧은 근거. "
            "근거가 없거나 누락 자체가 문제라면 null"
        )
    )
    summary_evidence: str | None = Field(
        description="검토 대상 요약에서 문제가 되는 짧은 내용"
    )
    recommendation: str = Field(
        description="사람 검토자가 취할 수 있는 구체적인 수정 또는 확인 방법"
    )


class SupervisionAssessment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    verdict: SupervisionVerdict
    rationale: str = Field(
        description="판정 근거를 사실 중심으로 간단히 설명"
    )
    strengths: list[str] = Field(
        description="원문에 충실하고 유용하게 작성된 부분"
    )
    findings: list[SupervisionFinding]
    missing_follow_up_questions: list[str] = Field(
        description="다음 검토 또는 상담에서 확인할 질문"
    )
    human_review_required: bool = Field(
        default=True,
        description="supervision 결과는 항상 사람의 최종 검토가 필요함"
    )


class SupervisionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: str
    status: Literal["completed"] = "completed"
    assessment: SupervisionAssessment
    model: str
    prompt_version: str
    provider_response_id: str
    input_tokens: int | None = None
    output_tokens: int | None = None
