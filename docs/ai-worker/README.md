# AI worker

## 역할과 경계

`apps/ai-worker`는 FastAPI 기반 내부 AI 작업 프로세스다. 상담 기록 요약, 요약 슈퍼비전과 향후 OCR·embedding 같은 연산을 담당한다.

이 서비스는 공개 제품 API가 아니다.

- Web에서 직접 호출하지 않는다.
- 사용자, 권한, 사례, 상담 metadata를 소유하지 않는다.
- PostgreSQL의 제품 데이터를 직접 변경하지 않는다.
- NestJS가 소유한 `job_id`를 요청 식별자로 사용한다.

현재 NestJS `ai-jobs` module은 비어 있어 실제 job orchestration과 worker 연동은 아직 구현되지 않았다.

## 기술 구성

- Python 3.12+
- FastAPI
- Pydantic v2와 pydantic-settings
- OpenAI Python SDK의 Responses API structured output
- uv 의존성 관리
- Ruff, mypy, pytest

## 엔드포인트

| Method | Path | 상태 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/health` | 구현 | worker health 확인 |
| `POST` | `/internal/ocr` | placeholder | 요청을 저장하지 않고 `accepted` 응답만 반환 |
| `POST` | `/internal/summarize` | placeholder | 요청을 저장하지 않고 `accepted` 응답만 반환 |
| `POST` | `/internal/embed` | placeholder | 요청을 저장하지 않고 `accepted` 응답만 반환 |
| `POST` | `/internal/summarize/execute` | 구현 | OpenAI를 호출해 상담 기록을 구조화 요약 |
| `POST` | `/internal/supervision/execute` | 구현 | 원문과 생성 요약을 비교해 검토 결과 생성 |

내부 OpenAPI 문서는 `/internal/docs`, schema는 `/internal/openapi.json`에서 제공된다. 운영 환경에서는 네트워크 수준에서도 외부 접근을 차단해야 한다.

## 상담 요약

`POST /internal/summarize/execute`는 다음 입력을 받는다.

```json
{
  "job_id": "job-123",
  "transcript": "상담 기록 원문",
  "language": "ko"
}
```

출력의 주요 구조:

- 전체 개요
- 주요 주제
- 내담자 진술
- 상담자 개입
- 합의한 실행 항목
- 후속 확인 항목
- 위험 신호와 원문 근거
- 불명확한 내용

prompt는 원문에 없는 진단이나 사실을 추론하지 않고, 상담 기록 내부의 지시문을 따르지 않도록 구성되어 있다. OpenAI 요청에는 `store=False`가 지정된다.

## 슈퍼비전

`POST /internal/supervision/execute`는 원문과 이미 생성된 요약을 비교한다.

```json
{
  "job_id": "job-123",
  "transcript": "상담 기록 원문",
  "summary": {
    "overview": "생성된 요약",
    "main_topics": [],
    "client_statements": [],
    "counselor_interventions": [],
    "agreed_actions": [],
    "follow_up_items": [],
    "uncertainties": []
  },
  "language": "ko"
}
```

결과 판정은 다음 중 하나다.

- `acceptable`: 중대한 문제가 발견되지 않음
- `revision_required`: 요약 수정이나 보완 필요
- `urgent_review`: 원문에 즉시 사람 검토가 필요한 명시적 신호가 있음

모든 결과의 `human_review_required`는 항상 `true`다. 슈퍼비전 결과는 상담사나 자격 있는 검토자를 대체하지 않는다.

finding category는 `unsupported_claim`, `missing_information`, `misattribution`, `risk_signal`, `privacy`, `follow_up`, `clarity`, `other`를 지원한다.

## 오류 처리

- 입력 크기 초과와 서비스 수준 값 오류: `422`
- retry 가능한 provider rate limit, timeout, connection, 일부 server 오류: `503`
- retry 불가능한 provider 설정·응답 오류: `502`
- Pydantic 요청 검증 오류: FastAPI 기본 `422`

provider 오류 응답에는 내부 오류 코드, 사용자에게 노출 가능한 메시지와 `retryable` 여부를 담는다. API key나 전체 상담 원문을 로그에 남기지 않는다.

## 환경 변수

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `AI_WORKER_PORT` | `8000` | worker port |
| `REDIS_URL` | `redis://localhost:6379` | 향후 queue 연결 URL |
| `OPENAI_API_KEY` | 없음 | 실제 execute endpoint에 필요 |
| `OPENAI_SUMMARY_MODEL` | `gpt-5.6-luna` | 요약 model |
| `OPENAI_SUPERVISION_MODEL` | `gpt-5.6-terra` | 슈퍼비전 model |
| `OPENAI_TIMEOUT_SECONDS` | `45` | provider timeout |
| `OPENAI_MAX_RETRIES` | `2` | SDK retry 횟수, 최대 5 |
| `COUNSELING_SUMMARY_MAX_CHARACTERS` | `100000` | 요약 원문 최대 문자 수 |
| `COUNSELING_SUPERVISION_MAX_CHARACTERS` | `100000` | 슈퍼비전 원문 최대 문자 수 |

`OPENAI_API_KEY`가 없으면 health와 placeholder endpoint는 동작하지만 실제 요약·슈퍼비전 실행은 provider 설정 오류를 반환한다.

## 로컬 실행

```bash
cd apps/ai-worker
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

기본 health URL은 `http://localhost:8000/health`다.

## 검증

```bash
cd apps/ai-worker
uv run ruff check .
uv run mypy app
uv run pytest
```

현재 repository에는 supervision request schema에 대한 pytest가 있다. 요약 service, provider 오류 변환, endpoint와 prompt에 대한 테스트는 아직 부족하다.

## 남은 주요 작업

- NestJS `ai-jobs` module과 Redis durable queue 연결
- `job_id` 기반 idempotency 및 중복 실행 방지
- 재시도와 dead-letter 정책
- 요약·슈퍼비전 결과의 NestJS 소유 저장 흐름
- OCR·embedding placeholder의 실제 worker 구현
- endpoint 및 provider mock 기반 테스트 확대
