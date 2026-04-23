# FnaticPair Platform Suite

게임 개발자를 위한 4개 플랫폼 모노레포

## 플랫폼 구성

| 플랫폼 | 폴더 | 설명 | 목표 도메인 |
|--------|------|------|------------|
| FnaticPair 홈 | `/` (index.html) | 메인 랜딩 페이지 | fnaticpair.com |
| GameMatch | `/gamematch` | 게임 개발자 팀 매칭 | gamematch.gg |
| IndieAsset | `/assetmarket` | 인디게임 에셋 마켓플레이스 | indieasset.kr |
| GameDevKit | `/devkit` | 게임개발 툴 & SDK 마켓 | gamedevkit.kr |

## 배포 구조

각 플랫폼은 **독립적인 Vercel 프로젝트**로 배포됩니다.
- `Root Directory` 설정으로 각 폴더를 별도 프로젝트로 연결
- 모든 플랫폼은 단일 HTML 파일 SPA (localStorage 기반 프로토타입)

## 로컬 실행

```
# 아무 폴더나 브라우저로 열기
start index.html
start gamematch/index.html
start assetmarket/index.html
start devkit/index.html
```

## 데모 계정

- 이메일: `alex@example.com` (또는 다른 데모 유저)
- 비밀번호: `demo123`

## 기술 스택

- **현재**: Vanilla HTML/CSS/JS + localStorage
- **예정**: Next.js 14 + Supabase + 포트원 결제

## Secure contact form

The homepage contact form now sends submissions to `/api/contact` instead of exposing the destination email address in the browser.

Set these Vercel environment variables before deploying:

- `RESEND_API_KEY`: API key for Resend
- `CONTACT_TO_EMAIL`: inbox that receives the inquiry, for example `lup53699@gmail.com`
- `CONTACT_FROM_EMAIL`: verified sender address in Resend, for example `FnaticPair <noreply@fnaticpair.com>`

Optional variables:

- `CONTACT_SUBJECT_PREFIX`: custom email subject prefix
- `CONTACT_ALLOWED_ORIGINS`: comma-separated allowlist for custom origins
