import logging

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
    RateLimitError,
)

from app.config import Settings
from app.summarization.prompts import (
    build_summary_input,
    build_summary_instructions,
)
from app.summarization.schemas import (
    CounselingSummary,
    CounselingSummaryRequest,
    CounselingSummaryResponse,
)

logger = logging.getLogger(__name__)


class SummaryProviderError(Exception):
    def __init__(self, code: str, message: str, retryable: bool) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


class CounselingSummaryService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is not None:
            return self._client
        if self._settings.openai_api_key is None:
            raise SummaryProviderError(
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

    async def summarize(
        self,
        request: CounselingSummaryRequest,
    ) -> CounselingSummaryResponse:
        transcript = request.transcript.strip()

        if len(transcript) > self._settings.counseling_summary_max_characters:
            raise ValueError(
                "The counseling record exceeds the configured input size limit."
            )

        try:
            response = await self._get_client().responses.parse(
                model=self._settings.openai_summary_model,
                input=[
                    {
                        "role": "developer",
                        "content": build_summary_instructions(request.language),
                    },
                    {
                        "role": "user",
                        "content": build_summary_input(transcript),
                    },
                ],
                text_format=CounselingSummary,
                store=False,
            )
        except RateLimitError as exc:
            raise SummaryProviderError(
                code="provider_rate_limited",
                message="The summary provider rate limit was exceeded.",
                retryable=True,
            ) from exc
        except APITimeoutError as exc:
            raise SummaryProviderError(
                code="provider_timeout",
                message="The summary provider request timed out.",
                retryable=True,
            ) from exc
        except APIConnectionError as exc:
            raise SummaryProviderError(
                code="provider_unavailable",
                message="The summary provider could not be reached.",
                retryable=True,
            ) from exc
        except APIStatusError as exc:
            logger.warning(
                "OpenAI summary request failed",
                extra={
                    "job_id": request.job_id,
                    "status_code": exc.status_code,
                    "request_id": exc.request_id,
                },
            )

            retryable = exc.status_code == 429 or exc.status_code >= 500

            raise SummaryProviderError(
                code="provider_error",
                message="The summary provider rejected the request.",
                retryable=retryable,
            ) from exc

        summary = response.output_parsed
        if summary is None:
            raise SummaryProviderError(
                code="invalid_provider_response",
                message="The summary provider returned no structured result.",
                retryable=False,
            )
        usage = response.usage

        logger.info(
            "Counseling record summarized",
            extra={
                "job_id": request.job_id,
                "provider_response_id": response.id,
                "model": self._settings.openai_summary_model,
                "input_tokens": usage.input_tokens if usage else None,
                "output_tokens": usage.output_tokens if usage else None,
            },
        )

        return CounselingSummaryResponse(
            job_id=request.job_id,
            summary=summary,
            model=self._settings.openai_summary_model,
            provider_response_id=response.id,
            input_tokens=usage.input_tokens if usage else None,
            output_tokens=usage.output_tokens if usage else None,
        )
