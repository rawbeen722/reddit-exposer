Deployment steps — Frontend to Netlify, Backend to Render

Frontend (Netlify)
- Connect your GitHub repo to Netlify.
- Netlify will detect `netlify.toml`. It sets `base = "client"`, build command `npm ci && npm run build`, and publishes `client/dist`.
- Alternatively, in Netlify UI set "Base directory" to `client`, build command `npm ci && npm run build`, and publish directory `client/dist`.
- This repo targets Node `20.19.0` because Vite 8 requires Node 20.19+.
- The repo includes `.nvmrc` and `netlify.toml` already pins `NODE_VERSION=20.19.0`.
- Production API base: use Vite env `VITE_API_BASE` so the frontend calls your Render backend after deployment. I added `client/.env.example` with an example value.
- To set the env in Netlify: in your Site → Site settings → Build & deploy → Environment → "New variable":
	- `Key`: `VITE_API_BASE`
	- `Value`: `https://your-backend.onrender.com` (replace with your Render service URL)

	Netlify bakes Vite env vars at build time, so set this before triggering a deploy. Keep the dev fallback `/api` for local testing.

Backend (Render)
- Create a new Web Service on Render and connect your repo.
- Render will detect the `server` folder; set the start command to `npm install --prefix server && npm start --prefix server` or set the "Root" to `server` and use `npm start`.
- For the single-service build, set Render's Node version to `20.19.0` too (use the service environment setting `NODE_VERSION=20.19.0` if available, or let Render honor `.nvmrc`).
- Ensure the service's `PORT` is set by Render automatically; `server/index.js` now respects `process.env.PORT`.
- Add any environment variables required for external APIs (if needed).

Database (PostgreSQL for logging & metrics)
- Create a PostgreSQL database on Render: Dashboard → New → PostgreSQL → Free tier (512 MB).
- Once created, Render provides a `DATABASE_URL` connection string.
- In your Render Web Service: go to Environment → Add environment variable:
	- `DATABASE_URL` = paste the PostgreSQL connection string from Render
	- `ACCESS_TOKEN` = set a strong random token (e.g., generate via `openssl rand -base64 24`)
- Restart the service; the app will auto-create the logs table.
- View metrics: `GET https://your-app.onrender.com/api/metrics?days=7`
- View logs: open `https://your-app.onrender.com/logs` and enter your `ACCESS_TOKEN`
- Manage blacklists: open `https://your-app.onrender.com/admin` and enter your `ACCESS_TOKEN`

Notes:
- Free tier PostgreSQL expires after 90 days of inactivity; keep it active by searching users regularly.
- Logs track: username searched, endpoint, status code, IP, user agent, response time, errors.
- Metrics include: top searched users, hourly request counts, error summary.
- The logs viewer and blacklist admin are hidden routes; share the `ACCESS_TOKEN` only with admins.

Single-service alternative (optional)
- If you prefer to deploy one service (server serves the built frontend), the server can serve `client/dist` automatically when the `client/dist` folder exists or when you set `SERVE_STATIC=true`.
- Render setup example for single-service deploy:
	- Root directory: repository root (or set build commands to build client then server).
	- Build command (Render):

```bash
npm --prefix client ci && npm --prefix client run build && npm --prefix server ci
```

	- Start command (Render):

```bash
npm --prefix server start
```

	- Environment variable: set `SERVE_STATIC=true` (optional; the server also auto-detects `client/dist`).

This approach creates one deployed service at a single origin (e.g., `https://your-app.onrender.com`) so the frontend can use `/api` without cross-origin issues.

Local testing
- Build client and run server locally:

```bash
cd client
npm ci
npm run build

cd ../server
npm ci
PORT=3001 node index.js
```

Notes
- CORS is enabled in `server/index.js`; if you deploy frontend and backend on different origins, server currently allows all origins.
- If you prefer a single service: build `client` and serve `client/dist` from Express (I can add that option if you want).

GitHub Actions

- Frontend workflow: `.github/workflows/frontend-deploy.yml` — builds `client` and deploys to Netlify using the Netlify CLI Action.
- Backend workflow: `.github/workflows/backend-deploy.yml` — triggers a Render deploy via a webhook.

Required GitHub Secrets

- `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token with deploy permissions.
- `NETLIFY_SITE_ID`: The Netlify site ID for the project (used by the CLI action).
- `RENDER_SERVICE_WEBHOOK`: A Render service deploy webhook URL (create a webhook in Render -> Service -> Settings -> Deploy Hooks).

Add these secrets in your GitHub repo settings → Secrets → Actions. After setting them, pushes to `main` will trigger the workflows.

