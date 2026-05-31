# CLAUDE.md

## 프로젝트 문맥

- 정적 백룸 웹 경험을 만드는 프로젝트다.
- 주요 파일:
  - `index.html`: 페이지 뼈대, favicon, Three.js import map, 스크립트 로딩.
  - `sytle.css`: 전체 화면 캔버스, HUD, 조준점, 비네팅과 노이즈 오버레이.
  - `main.js`: Three.js 장면, 생성 텍스처, 타일 생성, 이동, 충돌, 조명, 가짜 그림자.
  - `backroom-favicon-2026.svg`: 캐시와 이름 충돌을 피하기 위한 고유 favicon.
- 앱 자체에는 패키지 매니저 설정이 필요하지 않다.

## 필수 규칙

- 사용자의 명시적 허락 없이 기존 변경사항을 되돌리지 않는다.
- `AGENTS.md`와 `CLAUDE.md`는 각각 200줄을 넘기지 않는다.
- 이후 작업에 도움이 되는 프로젝트 지식을 새로 알게 되면 필요할 때 `AGENTS.md` 또는 `CLAUDE.md`에 반영한다.
- 사이트는 프로젝트 루트에서 제공되는 정적 페이지로 계속 동작해야 한다.

## 절약 규칙

- 같은 작업 중 이미 읽은 파일은 변경되지 않았다면 다시 확인하지 않는다.
- 불필요한 도구 호출은 하지 않는다.
- 독립적인 읽기와 확인 작업은 동시에 실행한다.
- 긴 명령 출력은 필요한 범위만 확인한다.
- 사용자가 이미 설명한 내용을 반복하지 않는다.

## 알려진 렌더링 제약

- 실제 WebGL 그림자와 `MeshStandardMaterial`은 이전에 장면이 잘못 렌더링되는 문제를 만들었다.
- 안정적인 방식은 `MeshBasicMaterial`, 캔버스 생성 텍스처, 부드러운 투명 그림자 텍스처를 사용하는 것이다.
- 사용자는 현실적인 백룸 분위기를 원하지만, 물리적으로 정확한 조명보다 장면이 안정적으로 보이는 것이 더 중요하다.
- 벽 그림자는 `makeSoftWallShadowTexture()`에서 생성한다.
- 기둥 그림자는 `makeSoftColumnShadowTexture()`에서 생성한다.

## 검증

- JavaScript를 수정한 뒤에는 `node --check main.js`를 실행한다.
- 로컬 서버가 필요하면 `python3 -m http.server 8000`을 사용한다.
- 필요할 때 `curl -I http://127.0.0.1:8000/<file>`로 정적 파일 응답을 확인한다.

## GitHub 업로드

- 사용자가 다르게 말하지 않으면 완료된 변경사항을 커밋하고 GitHub에 푸시한다.
- 권장 순서:
  - `git add <files>`
  - `git commit -m "<message>"`
  - `env -u GITHUB_TOKEN git pull --rebase origin main`
  - `env -u GITHUB_TOKEN git push origin main`
