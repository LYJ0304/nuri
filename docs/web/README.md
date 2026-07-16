# Web

## 역할

`apps/web`은 Next.js App Router 기반 사용자 화면이다. 상담사가 내담자 정보를 등록하고 상담 내용을 작성·조회하는 흐름을 제공한다.

브라우저에서는 NestJS API만 호출해야 한다. AI worker, PostgreSQL, Redis, MinIO에 직접 접근하지 않는다.

## 기술 구성

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Zustand 5와 `persist` middleware
- 공유 HTTP 계약: `@nuri/contracts`
- 전역 스타일: `apps/web/app/styles.css`

## 현재 라우트

| 경로 | 구현 | 설명 |
| --- | --- | --- |
| `/` | `apps/web/app/page.tsx` | 대시보드, 최근 상담 기록, API health 상태 |
| `/records/new` | `apps/web/app/records/new/page.tsx` | 내담자 정보와 상담 기본정보 등록 |
| `/records/write` | `apps/web/app/records/write/page.tsx` | 상담 내용 작성 |
| `/clients/[clientId]` | `apps/web/app/clients/[clientId]/page.tsx` | 내담자 정보와 상담 이력 조회 |

모든 페이지가 현재 Client Component다. 브라우저 상태와 이벤트 처리가 필요 없는 새 화면은 Server Component를 기본으로 한다.

## 데이터 저장 방식

현재 상담 화면은 API와 연결되어 있지 않다. `apps/web/stores/counseling-store.ts`의 Zustand store가 다음 데이터를 관리한다.

- `clients`: 내담자 정보
- `records`: 상담 기록
- `sessionDraft`: 내담자 등록 화면에서 상담 작성 화면으로 넘기는 임시 정보
- `hasHydrated`: session storage 복원 완료 여부

저장소 키는 `nuri-counseling-session`이며 브라우저 `sessionStorage`를 사용한다. 브라우저 탭의 세션이 끝나면 데이터가 사라질 수 있고, 다른 기기나 사용자와 공유되지 않는다. 코드에 포함된 데모 내담자와 상담 기록도 초기 상태로 노출된다.

따라서 현재 UI에 입력하는 개인정보와 상담 기록은 PostgreSQL의 `Case`나 `Consultation`에 저장되지 않는다.

## API 연결 상태

현재 실제 API 호출은 `apps/web/app/health-check.tsx`의 `GET /health`뿐이다.

```text
NEXT_PUBLIC_API_URL=http://localhost:3001
```

응답은 `HealthResponseSchema`로 검증한다. `NEXT_PUBLIC_*` 환경 변수는 브라우저 번들에 포함되므로 비밀값을 넣으면 안 된다.

사례·상담 저장 기능을 연결할 때는 다음 순서를 권장한다.

1. 로그인 화면과 access token 보관 정책을 결정한다.
2. `/records/new` 입력값을 API `POST /cases` 및 `POST /cases/:caseId/consultations` 계약에 맞춘다.
3. `/records/write`를 상담 초안 수정 API와 연결한다.
4. `/clients/[clientId]`를 사례 상세 및 상담 목록 API와 연결한다.
5. Zustand 데모 데이터와 영구 저장 역할을 제거하고, 필요한 UI 임시 상태만 남긴다.

Web과 API가 공유하는 요청 구조는 `packages/contracts/src/cases.ts`와 `packages/contracts/src/consultations.ts`에서 관리한다. 별도의 중복 타입을 만들지 않는다.

## 화면 데이터와 API 계약의 차이

현재 Web 입력 필드는 API MVP 모델보다 넓다.

- Web에만 존재: 성별, 직업, 보호구분, 가구유형, 장애·장기요양 정보, 긴급 연락처, 주거 및 가족 정보
- API에 존재: 이름, 전화번호, 이메일, 생년월일, 주소, 메모
- Web 상담 유형: 개인·집단·가족·기타
- API 상담 채널: 대면·전화·화상·기타

API 연동 전에 필드 의미를 맞추거나 API 계약을 함께 확장해야 한다. 공개 계약을 변경하면 producer와 consumer를 한 번에 수정한다.

## 로컬 실행

저장소 루트에서 실행한다.

```bash
corepack pnpm --filter @nuri/web dev
```

기본 주소는 `http://localhost:3000`이다. 전체 TypeScript 애플리케이션을 함께 실행하려면 루트에서 `pnpm dev`를 사용한다.

## 검증

```bash
pnpm --filter @nuri/web lint
pnpm --filter @nuri/web typecheck
pnpm --filter @nuri/web build
```

현재 설치된 ESLint와 React Hooks 플러그인의 호환 문제로 lint에서 `context.getScope is not a function` 또는 `a.getScope is not a function`이 발생할 수 있다. TypeScript typecheck와 Next.js 컴파일 결과를 별도로 확인해야 한다.

## 남은 주요 작업

- 인증 UI와 API access token 처리
- 사례·상담 API 연동
- 로딩, 빈 상태, 오류, `409 Conflict` 처리
- 상담 확정 및 확정 후 개정 UI
- 데모 수치와 링크 placeholder 제거
- 키보드 탐색과 접근성 검증
