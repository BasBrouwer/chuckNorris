# Chuckles

Chuck Norris jokes from [api.chucknorris.io](https://api.chucknorris.io). The home page shows the latest 10 jokes and can auto-refresh one every 5 seconds. You can favorite up to 10 jokes; they are saved in `localStorage` and stay in sync across tabs.

React 19 with the React Compiler, Vite, TanStack Router, Vitest.

## Getting started

Requires Node 24 (the version used by CI and the Docker build).

```sh
npm install   # runs `prepare`, which installs the pre-commit hook
npm run dev   # http://localhost:5173
```

Installed with `--ignore-scripts` or `HUSKY=0`? Run `npm run prepare` to install the hook.

## Scripts

| Command              | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `npm run dev`        | Dev server with HMR                                     |
| `npm run build`      | Type check (`tsc -b`) and production build into `dist/` |
| `npm run preview`    | Serve the production build locally                      |
| `npm test`           | Run all tests once                                      |
| `npm run test:watch` | Re-run tests on change                                  |
| `npm run lint`       | Oxlint with type-aware rules, fails on warnings         |
| `npm run fmt`        | Format with oxfmt (`npm run fmt:check` only checks)     |
| `npm run doctor`     | React Doctor scan                                       |

The pre-commit hook (`.husky/pre-commit`) runs `lint` and `fmt:check`.

## Project structure

Code is split into `app` (routing, pages), `features` (`jokes`, `favorites`) and shared `components`/`hooks`/`types`. Features never import each other, and lint enforces this. Folder layout, naming, import rules and testing conventions are described in [`src/README.md`](src/README.md).

`src/app/routeTree.gen.ts` is generated from `src/app/routes/` on `dev` and `build`. Do not edit it.

## CI

| Workflow           | Trigger                | What it does                                          |
| ------------------ | ---------------------- | ----------------------------------------------------- |
| `validate.yml`     | Pull requests          | `fmt:check`, `lint` and `test`, each as its own check |
| `build-image.yml`  | PRs, `main`, `v*` tags | Builds the Docker image; pushes to GHCR except on PRs |
| `react-doctor.yml` | PRs, `main`            | Advisory React Doctor report, never fails the build   |
| `deploy-pages.yml` | `main`, manual         | Builds for the Pages sub-path and deploys it          |

Image tags on `ghcr.io/<owner>/<repo>`: `main` publishes `latest` and `sha-<short>`. A `v1.2.3` tag publishes `1.2.3`, `1.2` and `sha-<short>`, never `latest`.

## GitHub Pages

`deploy-pages.yml` publishes to `https://<owner>.github.io/<repo>/`. It sets `BASE_PATH` to the Pages sub-path, which Vite uses as `base` and the router as `basepath`. Pages has no rewrites, so `dist/index.html` is also copied to `404.html` to make deep links like `/favorites` load the app. One-time setup: in **Settings → Pages**, set **Source** to **GitHub Actions**.

To try a sub-path build locally: `BASE_PATH=/chuckNorris/ npm run build && npm run preview`.

## Docker

The image serves the static build with nginx on port 80. It falls back to `index.html` for client-side routes, and files under `/assets/` are cached as immutable.

```sh
docker build -t chuckles .
docker run --rm -p 8080:80 chuckles   # http://localhost:8080
```
