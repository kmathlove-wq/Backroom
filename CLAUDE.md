# Backroom — CLAUDE.md

## 프로젝트 개요

Three.js 기반 1인칭 백룸 탐험 웹앱. 별도 빌드 툴 없이 순수 ES 모듈 + CDN으로 동작한다.
무한히 반복되는 노란 벽지, 낮은 천장, 형광등, 카펫, 부드러운 가짜 그림자로 백룸 분위기를 만든다.

## 파일 구조

```text
Backroom/
├── index.html                 # importmap + canvas + HUD DOM + favicon 연결
├── main.js                    # Three.js 장면, 월드 생성, 이동/점프/충돌
├── sytle.css                  # 전체화면 캔버스 + HUD + 비네팅/노이즈
├── backroom-favicon-2026.svg  # 고유 favicon, 캐시/이름 충돌 방지
├── AGENTS.md                  # Codex/에이전트 작업 규칙
├── CLAUDE.md                  # Claude용 프로젝트 지식
└── CNAME                      # GitHub Pages 도메인 설정
```

주의: CSS 파일명은 `sytle.css`가 현재 실제 이름이다. 사용자 요청 없이 `style.css`로 고치지 않는다.

## 실행 방법

정적 서버로 실행한다.

```bash
python3 -m http.server 8000
# → http://127.0.0.1:8000/
```

## 기술 스택

- **Three.js r0.165.0** — `index.html` importmap에서 `three`로 매핑
- **빌드 툴 없음** — `type="module"` + importmap으로 브라우저에서 직접 실행
- **외부 에셋 거의 없음** — 벽지/카펫/천장/그림자는 `main.js`에서 CanvasTexture로 생성

## main.js 구조

### 핵심 변수

| 변수 | 설명 |
|---|---|
| `scene` | 백룸 장면. 어두운 배경과 안개 사용 |
| `camera` | 1인칭 PerspectiveCamera. 회전 순서는 `YXZ` |
| `renderer` | WebGLRenderer. 실제 shadowMap은 꺼져 있음 |
| `player` | 위치, yaw, pitch, 지면 접촉 여부 |
| `settings` | 이동/중력/점프/타일/천장 제한 상수 |
| `materials` | CanvasTexture 기반 재질 모음 |
| `reusable` | 반복 사용 지오메트리 모음 |
| `tilePatterns` | 무한 반복 백룸 타일 배치 패턴 |
| `tiles` | 현재 생성된 타일 Map |
| `blockerObjects` | 벽/기둥 충돌 대상 |
| `flickerLights` | 형광등 깜빡임 상태 배열 |
| `monster` | 가끔 출현해 응시 후 돌진하는 괴물 상태 |

### 주요 함수

| 함수 | 역할 |
|---|---|
| `makeCanvasTexture()` | 캔버스에서 반복 텍스처 생성 |
| `makeSoftWallShadowTexture()` | 벽에서 넓게 퍼지고 점점 연해지는 가짜 그림자 텍스처 생성 |
| `makeSoftColumnShadowTexture()` | 기둥용 원형 가짜 그림자 텍스처 생성 |
| `makeMaterials()` | 벽지, 카펫, 천장, 몰딩, 조명, 그림자 재질 생성 |
| `createTile()` | 바닥/천장/벽/기둥/조명/그림자를 한 타일에 생성 |
| `syncTiles()` | 플레이어 주변 타일만 유지해 무한 반복처럼 보이게 함 |
| `movePlayer()` | WASD 이동, 중력, 점프, 천장 제한 처리 |
| `resolveHorizontalCollision()` | 벽/기둥 수평 충돌 처리 |
| `updateLights()` | 형광등 깜빡임과 밝기 변화 처리 |
| `updateMonster()` | 괴물 숨김/응시/돌진/사망 상태 처리 |
| `animate()` | 이동, 타일 동기화, 카메라 흔들림, 렌더링 루프 |

## 게임 상수

```js
settings.eyeHeight = 1.7
settings.ceilingLimit = 2.72
settings.gravity = 24
settings.jumpPower = 6.6
settings.moveSpeed = 7.2
settings.sprintSpeed = 10.5
settings.tile = 18
settings.renderRadius = 3
```

`ceilingLimit`은 점프 시 천장을 관통하지 않게 하는 핵심 값이다.

## 조작키

| 입력 | 기능 |
|---|---|
| `들어가기` 클릭 | 포인터 락 시작 |
| 마우스 이동 | 시점 회전 |
| WASD | 이동 |
| Space | 점프 |
| Shift | 달리기 |
| ESC | 포인터 락 해제 |

## HUD / DOM 구조

```text
#world       → Three.js canvas
.hud
  └── #startButton → "들어가기"
.crosshair   → 중앙 조준점
```

`sytle.css`의 `body::before`, `body::after`는 비네팅과 노이즈 오버레이를 만든다.

## 렌더링 주의사항

- `MeshStandardMaterial`과 실제 WebGL 그림자는 이전에 천장/조명만 보이는 버그를 만들었다.
- 안정성을 위해 표면은 `MeshBasicMaterial`을 우선 사용한다.
- 그림자는 실제 shadowMap이 아니라 투명 CanvasTexture 평면으로 표현한다.
- `renderer.shadowMap.enabled = false` 상태를 유지한다.
- 현실감을 높일 때도 표면 가시성이 깨지지 않는 방식을 먼저 선택한다.
- 괴물은 이미지 에셋이 아니라 `createMonster()`가 만드는 절차적 메시다.
- 괴물 AI는 `hidden → stare → charge` 흐름이며 닿으면 `killPlayer()`로 사망 오버레이를 띄운다.

## GitHub

저장소: `https://github.com/kmathlove-wq/Backroom`
브랜치: `main`

사용자가 하지 말라고 하지 않는 한 코드 변경 후 항상 커밋 + 푸시한다.

권장 명령:

```bash
git add <files>
git commit -m "<message>"
env -u GITHUB_TOKEN git pull --rebase origin main
env -u GITHUB_TOKEN git push origin main
```

이 환경에는 잘못된 `GITHUB_TOKEN`이 잡혀 있을 수 있으므로 `env -u GITHUB_TOKEN`을 사용한다.

## 작업 규칙

### 절약 규칙

- 이미 읽은 파일은 변경되었다고 볼 이유가 없으면 다시 확인하지 않는다.
- 불필요한 도구 호출은 하지 않는다.
- 가능한 도구 호출은 동시에 실행한다.
- 긴 출력은 필요한 범위만 잘라 확인한다.
- 20줄 이상의 불필요한 출력은 만들지 않는다.
- 사용자가 이미 설명한 내용을 다시 반복하지 않는다.

### 기타 규칙

- 새로 알게 된 프로젝트 지식은 필요할 때 `CLAUDE.md` 또는 `AGENTS.md`에 반영한다.
- 이 파일은 반드시 200줄을 넘으면 안 된다.
- 사용자 요청 없이 기존 변경사항을 되돌리지 않는다.
- JavaScript 수정 후에는 `node --check main.js`를 실행한다.
