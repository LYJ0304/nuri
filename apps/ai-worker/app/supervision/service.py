import logging

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
    RateLimitError,
)

from app.config import Settings
from app.supervision.prompts import (
    SUPERVISION_PROMPT_VERSION,
    build_supervision_input,
    build_supervision_instructions,
)
from app.supervision.schemas import (
    InternalSupervisionRequest,
    SupervisionAssessment,
    SupervisionResponse,
)

logger = logging.getLogger(__name__)


class SupervisionProviderError(Exception):
    def __init__(self, code: str, message: str, retryable: bool) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


class CounselingSupervisionService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is not None:
            return self._client
        if self._settings.openai_api_key is None:
            raise SupervisionProviderError(
                code="provider_not_configured",
                message="OPENAI_API_KEY is not configured.",
                retryable=False,
            )
        self._client = AsyncOpenAI(
            api_key=self._settings.openai_api_key.get_secret_value(),
            timeout=self._settings.openai_timeout_seconds,
            max_retries=self._settings.openai_max_retries,
        )
        return self._client

    async def supervise(
        self,
        request: InternalSupervisionRequest,
    ) -> SupervisionResponse:
        transcript = request.transcript.strip()

        if len(transcript) > self._settings.counseling_supervision_max_characters:
            raise ValueError("The counseling record exceeds the configured input size limit.")

        try:
            response = await self._get_client().responses.parse(
                model=self._settings.openai_supervision_model,
                input=[
                    {
                        "role": "developer",
                        "content": build_supervision_instructions(request.language),
                    },
                    {
                        "role": "user",
                        "content": build_supervision_input(transcript, request.summary),
                    },
                ],
                text_format=SupervisionAssessment,
                store=False,
            )
        except RateLimitError as exc:
            raise SupervisionProviderError(
                code="provider_rate_limited",
                message="The supervision provider rate limit was exceeded.",
                retryable=True,
            ) from exc
        except APITimeoutError as exc:
            raise SupervisionProviderError(
                code="provider_timeout",
                message="The supervision provider request timed out.",
                retryable=True,
            ) from exc
        except APIConnectionError as exc:
            raise SupervisionProviderError(
                code="provider_unavailable",
                message="The supervision provider could not be reached.",
                retryable=True,
            ) from exc
        except APIStatusError as exc:
            logger.warning(
                "OpenAI supervision request failed",
                extra={
                    "job_id": request.job_id,
                    "status_code": exc.status_code,
                    "request_id": exc.request_id,
                },
            )
            retryable = exc.status_code == 429 or exc.status_code >= 500
            raise SupervisionProviderError(
                code="provider_error",
                message="The supervision provider rejected the request.",
                retryable=retryable,
            ) from exc

        assessment = response.output_parsed
        if assessment is None:
            raise SupervisionProviderError(
                code="invalid_provider_response",
                message="The provider returned no structured supervision result.",
                retryable=False,
            )

        assessment.human_review_required = True
        usage = response.usage

        logger.info(
            "Counseling summary supervised",
            extra={
                "job_id": request.job_id,
                "provider_response_id": response.id,
                "model": self._settings.openai_supervision_model,
                "verdict": assessment.verdict,
                "finding_count": len(assessment.findings),
                "input_tokens": usage.input_tokens if usage else None,
                "output_tokens": usage.output_tokens if usage else None,
            },
        )

        return SupervisionResponse(
            job_id=request.job_id,
            assessment=assessment,
            model=self._settings.openai_supervision_model,
            prompt_version=SUPERVISION_PROMPT_VERSION,
            provider_response_id=response.id,
            input_tokens=usage.input_tokens if usage else None,
            output_tokens=usage.output_tokens if usage else None,
        )
