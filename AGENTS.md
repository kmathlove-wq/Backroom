# AGENTS.md

## Project Overview

- This project is a browser-based Backrooms scene built with plain `index.html`, `sytle.css`, and `main.js`.
- `main.js` uses Three.js through an import map that loads from `https://unpkg.com/three@0.165.0/build/three.module.js`.
- The app runs from a static server. Use `python3 -m http.server 8000` and open `http://127.0.0.1:8000/`.
- The stylesheet filename is intentionally `sytle.css`; keep the existing name unless the user asks to rename it.
- The favicon is `backroom-favicon-2026.svg`, linked with a cache-busting query string.

## Work Rules

- Do not revert existing changes unless the user explicitly asks.
- Preserve the current simple static-site structure unless a requested feature requires a larger change.
- Keep edits focused on the user's request.
- When adding project knowledge that matters for future work, update `AGENTS.md` or `CLAUDE.md` when appropriate.
- Keep both `AGENTS.md` and `CLAUDE.md` under 200 lines each.

## Saving Tool Calls

- Do not reread files already read in the current task unless there is a reason to believe they changed.
- Avoid unnecessary tool calls.
- Run independent tool calls in parallel when possible.
- For long files or command output, inspect only the needed range.
- Do not repeat information the user already explained unless it is necessary for clarity.

## Implementation Notes

- The scene avoids `MeshStandardMaterial` and real WebGL shadows because that previously caused a bug where only ceiling/light elements appeared.
- Prefer stable visible materials such as `MeshBasicMaterial` plus canvas textures and soft fake shadow planes.
- Movement uses WASD, mouse pointer lock, Space jump, and Shift sprint.
- Keep the ceiling collision limit in `settings.ceilingLimit` so jumping cannot clip through the ceiling.
- The world is generated from reusable tile patterns; adjust `tilePatterns`, reusable geometries, and helper functions rather than duplicating large blocks.

## Git Workflow

- The user wants changes pushed to GitHub unless they say not to.
- Use normal commits with concise messages.
- This environment may have an invalid `GITHUB_TOKEN`; when pushing, use `env -u GITHUB_TOKEN git push origin main`.
- Before pushing, if needed, run `env -u GITHUB_TOKEN git pull --rebase origin main`.
