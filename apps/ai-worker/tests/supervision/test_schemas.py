import pytest
from pydantic import ValidationError

from app.supervision.schemas import InternalSupervisionRequest


def test_supervision_request_rejects_blank_transcript() -> None:
    with pytest.raises(ValidationError):
        InternalSupervisionRequest(
            job_id="job-1",
            transcript="   ",
            summary={
                "overview": "요약",
                "main_topics": [],
                "client_statements": [],
                "counselor_interventions": [],
                "agreed_actions": [],
                "follow_up_items": [],
                "uncertainties": [],
            },
        )


def test_supervision_request_accepts_valid_input() -> None:
    request = InternalSupervisionRequest(
        job_id="job-1",
        transcript="내담자는 최근 잠을 잘 못 잔다고 말했다.",
        summary={
            "overview": "내담자가 수면의 어려움을 보고했다.",
            "main_topics": ["수면"],
            "client_statements": ["최근 잠을 잘 못 잔다."],
            "counselor_interventions": [],
            "agreed_actions": [],
            "follow_up_items": [],
            "uncertainties": [],
        },
    )

    assert request.job_id == "job-1"
    assert request.language == "ko"
