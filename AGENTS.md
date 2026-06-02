# Backroom — AGENTS.md

## 프로젝트 개요

Three.js 기반 1인칭 백룸 탐험 웹앱. 빌드 도구 없이 정적 HTML/CSS/JS와 CDN importmap으로 실행한다.
노란 벽지, 낮은 천장, 카펫, 형광등 깜빡임, 가짜 그림자를 사용해 무한히 반복되는 백룸 분위기를 만든다.

## 파일 구조

```text
Backroom/
├── index.html                 # 페이지 뼈대, importmap, favicon, canvas/HUD
├── main.js                    # Three.js 장면, 월드 생성, 이동/충돌/렌더링
├── sytle.css                  # 전체화면 스타일, HUD, 비네팅/노이즈
├── backroom-favicon-2026.svg  # 사이트 탭 favicon
├── AGENTS.md                  # 에이전트 작업 지침
├── CLAUDE.md                  # Claude용 프로젝트 지식
└── CNAME                      # GitHub Pages 도메인
```

`sytle.css`는 오타처럼 보이지만 실제 연결된 파일명이다. 사용자 요청 없이 이름을 바꾸지 않는다.

## 실행 방법

```bash
python3 -m http.server 8000
# http://127.0.0.1:8000/
```

## 기술 스택

- Three.js r0.165.0
- 순수 ES 모듈 + importmap
- 빌드 도구와 package.json 없음
- 대부분의 시각 에셋은 `main.js`의 CanvasTexture로 생성

## main.js 핵심 구조

| 항목 | 설명 |
|---|---|
| `settings` | 눈높이, 천장 제한, 중력, 점프, 속도, 타일 크기 |
| `reusable` | 벽, 복도벽, 기둥, 천장, 조명, 그림자 지오메트리 |
| `tilePatterns` | 반복되는 백룸 타일 배치 |
| `makeMaterials()` | 벽지/카펫/천장/몰딩/조명/그림자 재질 생성 |
| `createTile()` | 타일 하나의 바닥, 천장, 벽, 조명, 그림자 생성 |
| `syncTiles()` | 플레이어 주변 타일만 유지 |
| `movePlayer()` | WASD 이동, 중력, 점프, 천장 충돌 |
| `updateLights()` | 형광등 깜빡임 |
| `updateMonster()` | 괴물 출현, 응시, 돌진, 사망 처리 |

## 조작키

| 입력 | 기능 |
|---|---|
| 클릭 | 포인터 락 시작 |
| 마우스 | 시점 전환 |
| WASD | 이동 |
| Space | 점프 |
| Shift | 달리기 |
| ESC | 포인터 락 해제 |

## 렌더링 제약

- `MeshStandardMaterial`과 실제 WebGL shadowMap은 이 프로젝트에서 천장/조명만 보이는 문제를 만든 적이 있다.
- 표면은 안정적인 `MeshBasicMaterial`을 우선 사용한다.
- 그림자는 실제 그림자가 아니라 CanvasTexture 기반 투명 평면으로 만든다.
- `renderer.shadowMap.enabled = false`를 유지한다.
- 현실감을 높일 때도 먼저 “항상 보이는 장면”을 보장한다.
- 괴물은 `createMonster()`의 절차적 Three.js 메시이며, 가끔 플레이어가 보는 방향 근처의 옆 통로에 붉은 눈 glow와 긴 팔다리 실루엣으로 출현한 뒤 돌진해서 플레이어를 죽인다.

## 검증

- JS 수정 후 `node --check main.js` 실행.
- 정적 파일 확인이 필요하면 `curl -I http://127.0.0.1:8000/<file>` 사용.
- 긴 출력은 필요한 범위만 잘라 확인한다.

## 작업 규칙

### 절약 규칙

- 이미 읽은 파일은 변경되었다고 볼 이유가 없으면 다시 확인하지 않는다.
- 불필요한 도구 호출은 하지 않는다.
- 가능한 도구 호출은 동시에 실행한다.
- 긴 출력은 필요한 범위만 확인한다.
- 20줄 이상의 불필요한 출력은 만들지 않는다.
- 사용자가 이미 설명한 내용을 다시 반복하지 않는다.

### 기타 규칙

- 새로 알게 된 프로젝트 지식은 필요할 때 `AGENTS.md` 또는 `CLAUDE.md`에 반영한다.
- `AGENTS.md`와 `CLAUDE.md`는 각각 200줄을 넘기지 않는다.
- 사용자 요청 없이 기존 변경사항을 되돌리지 않는다.
- 수정 범위는 사용자의 요청과 직접 관련된 부분으로 제한한다.

## GitHub

저장소: `https://github.com/kmathlove-wq/Backroom`
브랜치: `main`

사용자가 하지 말라고 하지 않는 한 변경 후 항상 커밋 + 푸시한다.

```bash
git add <files>
git commit -m "<message>"
env -u GITHUB_TOKEN git pull --rebase origin main
env -u GITHUB_TOKEN git push origin main
```
