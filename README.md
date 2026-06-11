# FairCourt Badminton

배드민턴 클럽 운영자가 복식 경기 그룹을 공정하게 생성하고 운영할 수 있는 한국어 MVP 웹앱입니다. 팀 A/B를 고정하지 않고, 경기마다 4명의 참가자만 묶어 현장에서 팀을 정하도록 설계했습니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Vercel 배포 호환
- 선택 기능: OpenAI API 기반 관리자용 공정성 분석

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

관리자 화면은 `/admin`, 회원 공개 화면은 `/view`입니다. 관리자 로그인은 `.env.local`의 `ADMIN_PASSWORD` 값을 사용합니다.

## 환경 변수

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 라우트에서만 사용합니다. 브라우저 컴포넌트에는 import하지 않습니다.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. Project Settings에서 URL, anon key, service role key를 `.env.local`에 입력합니다.
4. `ADMIN_PASSWORD`와 충분히 긴 `ADMIN_SESSION_SECRET`을 입력합니다.

## 주요 기능

- 관리자 비밀번호 로그인과 httpOnly 쿠키 세션
- 참가자 단일 추가, 일괄 붙여넣기, 출석/귀가/비활성 상태 관리
- 모임 시작 후 참가자 삭제 제한
- 자동 대진 1~5개 생성
- 자동 대진 유효 성별 구성: 남 4명, 여 4명, 남 2명 + 여 2명
- 같은 4인 조합 반복, 가까운 경기 연속 출전, 게임 수, 대기 시간, 성별 비율, 실력 차이 기반 점수화
- 생성 대진을 운영 대기열로 이동
- 운영 대기열에서 경기 시작, 진행 중 경기 완료
- 완료 시 참가자 경기 수와 마지막 경기 시각 업데이트
- 수동 대진 추가 및 수정
- `/view` 공개 화면에서 진행 중 경기와 운영 대기열만 5초마다 갱신
- OpenAI API 키가 있으면 AI 공정성 분석, 없으면 로컬 분석 문구 제공

## 샘플 참가자 데이터

```text
김민수, 남, 5
박준호, 남, 4
이도윤, 남, 4
정우성, 남, 3
강민재, 남, 3
최현우, 남, 2
오세훈, 남, 2
윤태민, 남, 1
이지은, 여, 5
최서연, 여, 4
한지민, 여, 4
김하늘, 여, 3
박소연, 여, 3
정유나, 여, 2
오민지, 여, 2
서아린, 여, 1
```

## Vercel 배포

Vercel에 프로젝트를 연결한 뒤 위 환경 변수를 Production/Preview 환경에 등록합니다. Supabase SQL은 배포 전에 한 번 실행되어 있어야 합니다.

## 알려진 한계

- MVP 인증은 Supabase Auth가 아닌 단일 관리자 비밀번호 방식입니다.
- 현재 모임 하나를 대상으로 하며 여러 세션/날짜별 모임 분리는 아직 없습니다.
- 점수 기록, 승패 기록, 코트별 배정은 포함하지 않았습니다.
- 공개 화면은 실시간 구독 대신 5초 polling으로 갱신합니다.

## 향후 개선

- Supabase Auth
- 세션 기반 다중 모임 관리
- 스코어 기록
- 카메라/OCR 점수 인식
- polling 대신 realtime 업데이트
