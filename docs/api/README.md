# API

## 역할

`apps/api`는 NestJS 기반의 유일한 공개 백엔드다. 인증, 권한, 내담자·사례 정보, 상담 기록, 감사 로그와 향후 AI job 생성을 소유한다.

현재 권한 모델은 단순하다. 가입한 사용자는 상담사로 취급되며 별도의 관리자 화면, 역할, 조직 모델을 사용하지 않는다. `Case`와 `Client`의 `counselorId`가 소유자를 나타내고, 상담사는 자신이 만든 사례·내담자와 그 하위 상담 기록만 조회·변경할 수 있다.

## 기술 구성

- NestJS 11
- Prisma 6와 PostgreSQL
- JWT Bearer 인증
- Argon2 비밀번호 hashing
- class-validator 기반 인증 DTO
- `@nuri/contracts` Zod 스키마 기반 사례·상담 요청 검증

서버 시작 시 전역 `ValidationPipe`가 적용되고 사례·상담 요청에는 `ZodValidationPipe`가 추가로 적용된다.

## 모듈 상태

| 모듈 | 현재 상태 |
| --- | --- |
| `auth` | 회원가입, 로그인, 현재 사용자 조회 구현 |
| `users` | 이메일·ID 조회, 사용자 생성 구현 |
| `cases` | 사례 CRUD 일부와 상담 기록 lifecycle 구현 |
| `audit-logs` | 상담 변경 감사 로그 작성 구현 |
| `organizations` | 빈 module placeholder |
| `documents` | 빈 module placeholder |
| `ai-jobs` | 빈 module placeholder |

## 환경 변수

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | 예 | PostgreSQL 연결 URL |
| `REDIS_URL` | 예 | 향후 queue/cache 연결 URL |
| `AI_WORKER_URL` | 예 | 내부 AI worker URL |
| `JWT_ACCESS_SECRET` | 예 | 최소 32자의 JWT 서명 secret |
| `JWT_ACCESS_EXPIRES_IN` | 아니요 | access token 만료시간, 기본값 `15m` |
| `JWT_REFRESH_SECRET` | 예 | 최소 32자의 refresh token 서명 secret |
| `JWT_REFRESH_EXPIRES_IN` | 아니요 | refresh token 만료시간, 기본값 `30d` |
| `API_PORT` | 아니요 | 기본값 `3001` |
| `WEB_ORIGIN` | 아니요 | CORS origin, 기본값 `http://localhost:3000` |

`.env.example`의 JWT secret은 로컬 구성 형식을 보여 주는 개발용 placeholder다. 운영 환경에서는 access와 refresh에 서로 다른 32자 이상의 secret을 주입하고 실제 secret을 저장소에 커밋하면 안 된다.

## 인증 세션 저장소

`AuthSession`은 사용자별 refresh 세션의 hash, 만료·마지막 사용·폐기 시각과 선택적인 user agent/IP metadata를 저장한다. refresh token 원문은 저장하지 않고 SHA-256 hash만 저장한다. 실제 refresh 발급·rotation·폐기 endpoint는 다음 구현 단계에서 이 모델을 사용한다.

## 인증 API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/auth/sign-up` | 없음 | 이메일과 비밀번호로 상담사 계정 생성 |
| `POST` | `/auth/sign-in` | 없음 | access token과 HttpOnly refresh cookie 발급 |
| `POST` | `/auth/refresh` | refresh cookie | refresh rotation 후 새 access token과 cookie 발급 |
| `GET` | `/auth/me` | Bearer | token의 현재 사용자 정보 반환 |

로그인과 refresh 응답 본문에는 access token과 사용자 정보만 포함한다. refresh token은 `nuri_refresh_token` HttpOnly cookie로만 전달하며 최초 로그인 시 정해진 최대 30일 만료를 rotation 후에도 연장하지 않는다. 유효하게 서명된 이전 token이 재사용되거나 같은 token으로 동시 rotation이 발생하면 해당 세션을 폐기한다.

보호된 API는 다음 header를 요구한다.

```http
Authorization: Bearer <access-token>
```

## 사례 API

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/cases` | 사례와 내담자 정보 생성 |
| `GET` | `/cases` | 내 사례 cursor 목록 조회 |
| `GET` | `/cases/:caseId` | 내 사례 상세 조회 |
| `PATCH` | `/cases/:caseId` | 내 사례 정보 수정 |

목록 query는 `cursor`, `limit`(기본 20, 최대 100), `status`를 지원한다. `status`는 `OPEN`, `CLOSED`, `ARCHIVED` 중 하나지만 현재 상태를 변경하는 endpoint는 구현되지 않았다.

생성 예시:

```json
{
  "title": "초기 상담 사례",
  "clientName": "홍길동",
  "clientPhone": "010-0000-0000",
  "clientEmail": "client@example.com",
  "clientBirthDate": "2000-01-01",
  "clientAddress": "서울시",
  "clientMemo": "초기 접수"
}
```

내담자 개인정보는 현재 `Case`의 PostgreSQL 컬럼에 평문으로 저장한다. 응답·로그·오류 메시지에 개인정보를 불필요하게 복사하지 않는다.

## 내담자·상담 기록 API

모든 endpoint는 Bearer 인증을 요구한다. `Client.counselorId`를 현재 사용자 ID로 저장하며, 목록과 상세 조회는 해당 소유자 범위로 제한한다. `CounselingRecord`는 부모 Client의 소유권을 상속한다. 다른 상담사의 Client ID로 접근하면 자원 존재 여부를 노출하지 않도록 `404 Not Found`를 반환한다.

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/clients` | 내 내담자 생성 |
| `GET` | `/clients` | 내 내담자 목록 조회 |
| `GET` | `/clients/:clientId` | 내 내담자 상세 조회 |
| `POST` | `/clients/:clientId/records` | 내 내담자의 상담 기록 생성 |
| `GET` | `/clients/:clientId/records` | 내 내담자의 상담 기록 목록 조회 |

## 상담 API

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/cases/:caseId/consultations` | 상담 초안과 첫 개정본 생성 |
| `GET` | `/cases/:caseId/consultations` | 삭제되지 않은 상담 목록 조회 |
| `GET` | `/cases/:caseId/consultations/:consultationId` | 최신 개정본을 포함한 상세 조회 |
| `PATCH` | `/cases/:caseId/consultations/:consultationId` | 초안 수정 |
| `POST` | `/cases/:caseId/consultations/:consultationId/finalize` | 초안 확정 |
| `POST` | `/cases/:caseId/consultations/:consultationId/amendments` | 확정된 상담 개정 |
| `DELETE` | `/cases/:caseId/consultations/:consultationId` | 논리 삭제 |

목록 query는 `cursor`, `limit`, `status`를 지원한다. 상담 상태는 `DRAFT`, `FINALIZED`, `AMENDED`다.

상담 생성 예시:

```json
{
  "occurredAt": "2026-07-14T10:00:00+09:00",
  "durationMinutes": 50,
  "channel": "IN_PERSON",
  "subject": "초기 상담",
  "summary": "초기 호소 문제를 확인함",
  "content": {
    "presentingProblem": "최근 수면에 어려움이 있다고 보고함",
    "observations": "대화에 지속적으로 참여함",
    "interventions": "생활 패턴을 함께 확인함",
    "clientResponse": "수면 기록에 동의함",
    "assessment": "추가 확인 필요",
    "followUpPlan": "다음 회기에 수면 기록 확인",
    "privateNote": null
  }
}
```

## 상태 전이와 동시 수정

```text
DRAFT ── finalize ──> FINALIZED ── amendment ──> AMENDED
                              ^                     │
                              └──── amendment ──────┘
```

- `DRAFT`만 일반 `PATCH`로 수정할 수 있다.
- 확정 후에는 기존 본문을 덮어쓰지 않고 `ConsultationRevision`을 추가한다.
- 개정에는 `changeReason`이 필수다.
- 수정·확정·개정·삭제 요청은 현재 `version`을 보내야 한다.
- 저장된 version과 요청 version이 다르면 `409 Conflict`를 반환한다.
- 삭제는 `deletedAt`을 설정하는 논리 삭제이며 기본 조회에서 제외된다.

초안 수정 예시:

```json
{
  "version": 1,
  "summary": "수정된 요약",
  "content": {
    "presentingProblem": "수정된 상담 내용"
  }
}
```

확정 요청 예시:

```json
{ "version": 2 }
```

개정 요청 예시:

```json
{
  "version": 3,
  "changeReason": "상담사 기록 누락 보완",
  "content": {
    "presentingProblem": "보완된 전체 상담 내용"
  }
}
```

## 데이터 모델

```text
User
 ├─ AuthSession
 ├─ Client
 │   └─ CounselingRecord
 ├─ Case
 │   └─ Consultation
 │       └─ ConsultationRevision
 └─ AuditLog
```

- `Case`: 내담자 개인정보와 사례 상태
- `Consultation`: 회기 메타데이터, 현재 상태, 낙관적 잠금 version
- `ConsultationRevision`: 상담 본문 JSON과 개정 사유
- `AuditLog`: 상담 생성·수정·확정·개정·삭제 작업 정보

감사 로그는 상담 변경과 동일한 Prisma transaction에서 작성한다. 상담 본문이나 내담자 개인정보는 감사 로그 metadata에 저장하지 않는다.

## Migration

스키마는 `apps/api/prisma/schema.prisma`, migration은 `apps/api/prisma/migrations`에서 관리한다. 현재 첫 migration은 빈 데이터베이스에 사용자, 사례, 상담, 개정, 감사 로그 테이블을 생성한다.

새 데이터베이스에 커밋된 migration을 적용하려면:

```bash
pnpm --filter @nuri/api exec prisma migrate deploy
pnpm --filter @nuri/api db:generate
```

이미 migration history 없이 `User` 테이블을 만든 데이터베이스라면 바로 적용하지 말고 Prisma baseline을 먼저 구성해야 한다. 개발 중 추가 스키마 변경은 다음 명령으로 migration을 생성한다.

```bash
pnpm db:migrate -- --name <migration-name>
```

## 로컬 실행과 검증

```bash
pnpm --filter @nuri/api dev
pnpm --filter @nuri/api lint
pnpm --filter @nuri/api typecheck
pnpm --filter @nuri/api build
```

기본 API 주소는 `http://localhost:3001`, health endpoint는 `GET /health`다.

## 남은 주요 작업

- Web 인증 및 사례·상담 API 연결
- 사례 `CLOSED`/`ARCHIVED` 상태 변경 API
- API endpoint 단위·통합 테스트
- access token 갱신 및 폐기 정책
- Redis 기반 AI job queue
- 문서 metadata 및 MinIO 저장 흐름
- 내담자 개인정보 암호화·마스킹 정책
