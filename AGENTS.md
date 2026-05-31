# AGENTS.md

## 프로젝트 개요

- 이 프로젝트는 `index.html`, `sytle.css`, `main.js`로 구성된 브라우저 기반 백룸 장면이다.
- `main.js`는 import map을 통해 `https://unpkg.com/three@0.165.0/build/three.module.js`에서 Three.js를 불러온다.
- 앱은 정적 서버에서 실행한다. `python3 -m http.server 8000` 실행 후 `http://127.0.0.1:8000/`을 연다.
- 스타일시트 파일명은 현재 `sytle.css`이다. 사용자가 요청하지 않는 한 이름을 바꾸지 않는다.
- favicon은 캐시와 이름 충돌을 피하기 위해 `backroom-favicon-2026.svg`를 사용한다.

## 작업 규칙

- 사용자가 명시적으로 요청하지 않으면 기존 변경사항을 되돌리지 않는다.
- 요청한 기능에 꼭 필요하지 않다면 현재의 단순한 정적 사이트 구조를 유지한다.
- 수정 범위는 사용자의 요청과 직접 관련된 부분으로 제한한다.
- 새로 알게 된 프로젝트 지식이 이후 작업에 도움이 되면 필요할 때 `AGENTS.md` 또는 `CLAUDE.md`에 반영한다.
- `AGENTS.md`와 `CLAUDE.md`는 각각 200줄을 넘기지 않는다.

## 절약 규칙

- 같은 작업 안에서 이미 읽은 파일은 변경되었다고 볼 이유가 없으면 다시 확인하지 않는다.
- 불필요한 도구 호출은 하지 않는다.
- 가능한 독립적인 도구 호출은 동시에 실행한다.
- 긴 파일이나 긴 명령 출력은 필요한 범위만 잘라 확인한다.
- 사용자가 이미 설명한 내용을 필요 없이 반복하지 않는다.

## 구현 참고사항

- 이 프로젝트에서는 `MeshStandardMaterial`과 실제 WebGL 그림자가 이전에 천장/조명만 보이는 버그를 만들었다.
- 안정성을 위해 보이는 표면에는 `MeshBasicMaterial`, 캔버스 텍스처, 부드러운 가짜 그림자 면을 우선 사용한다.
- 조작은 WASD 이동, 마우스 포인터 잠금, Space 점프, Shift 달리기다.
- 점프 중 천장을 통과하지 않도록 `settings.ceilingLimit`을 유지한다.
- 월드는 재사용 가능한 타일 패턴으로 생성된다. 큰 중복 코드를 만들기보다 `tilePatterns`, 재사용 지오메트리, 헬퍼 함수를 조정한다.

## Git 작업 흐름

- 사용자는 명시적으로 하지 말라고 하지 않는 한 변경사항을 GitHub에 업로드하기를 원한다.
- 커밋 메시지는 짧고 명확하게 작성한다.
- 이 환경에는 잘못된 `GITHUB_TOKEN`이 잡혀 있을 수 있다. 푸시할 때는 `env -u GITHUB_TOKEN git push origin main`을 사용한다.
- 푸시 전 필요하면 `env -u GITHUB_TOKEN git pull --rebase origin main`을 실행한다.
