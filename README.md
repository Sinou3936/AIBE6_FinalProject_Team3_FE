# 안심집

사회초년생과 대학생을 위한 부동산 계약 안전 확인 서비스 프론트엔드입니다.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- React 18

## Getting Started

```bash
npm install
npm run dev
```

## Project Docs

- [Frontend Structure Guide](docs/FRONTEND_STRUCTURE.md): 작업 시작용 요약 문서
- [Frontend Structure Detail](docs/FRONTEND_STRUCTURE_DETAIL.md): API/mock 흐름, 타입, mapper, service 상세 기준

## Kakao Map

매물 위치 표시는 Kakao Maps JavaScript API를 사용합니다.

```bash
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your_kakao_javascript_key
```

이 값을 `.env.local`에 설정하면 지도가 표시됩니다. 값이 없으면 안내 fallback UI가 표시됩니다.

## API Environment

백엔드 API 주소와 mock 사용 여부는 다음 환경변수로 설정합니다.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_USE_MOCK_DATA=false
```

`NEXT_PUBLIC_USE_MOCK_DATA=true`로 설정한 경우에만 `app/mocks/init`의 초기 mock 데이터를 사용합니다.
기본 흐름은 Spring Boot API에서 데이터를 받는 구조입니다.

API 응답은 다음 공통 포맷을 기준으로 unwrap합니다.

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  } | null;
};
```

개발 서버 기본 주소는 `http://localhost:3000`입니다.

## Scripts

- `npm run dev`: Next.js 개발 서버 실행
- `npm run build`: 프로덕션 빌드 및 타입 검사
- `npm run lint`: ESLint 검사
- `npm run format:check`: Prettier 포맷 검사
- `npm run format`: Prettier 포맷 적용
- `npm run start`: 빌드 결과 실행

## Backend Integration

Java 21, Spring Boot, JPA, MySQL 백엔드와 REST API 방식으로 연동하는 구조입니다.
