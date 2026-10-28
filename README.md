# Chuckles

Chuck Norris jokes, with favorites saved in the browser. React 19 (with the React Compiler), Vite, TanStack Router, Vitest.

Source layout, architecture rules and testing conventions: [`src/README.md`](src/README.md).

## Scripts

| Command           | What it does                                                |
| ----------------- | ----------------------------------------------------------- |
| `npm run dev`     | Dev server with HMR                                         |
| `npm run build`   | Type check (`tsc -b`) and production build into `dist/`     |
| `npm run preview` | Serve the production build locally                          |
| `npm test`        | Run all tests once (`npm run test:watch` re-runs on change) |
| `npm run lint`    | Oxlint with type-aware rules and type checking, no warnings |
| `npm run fmt`     | Format with oxfmt (`npm run fmt:check` only checks)         |
| `npm run doctor`  | React Doctor scan                                           |

`npm install` sets up a pre-commit hook (husky, `.husky/pre-commit`) that runs `lint` and `fmt:check`.

## CI and deployment

- `.github/workflows/validate.yml` runs on every PR: `npm run fmt:check`, `npm run lint` and `npm test`, each as its own check.
- `.github/workflows/build-image.yml` builds the Docker image. PRs only build it. Pushes to `main` publish `ghcr.io/<owner>/<repo>:latest` and `:sha-<short>`; `v*` tags publish `:<version>`, `:<major>.<minor>` and `:sha-<short>`, never `latest`.

The image is the static build served by nginx on port 80 (SPA fallback to `index.html`, immutable caching for `/assets/`):

```sh
docker build -t frontvalue .
docker run --rm -p 8080:80 frontvalue
```
