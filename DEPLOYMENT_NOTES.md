# Auto Media Save — Deployment & Configuration

This branch (reconfigure/env-setup) contains improvements to the client UI and server-side error handling.

Files changed:
- public/index.html -> simplified UI, added quality dropdown and loader
- server.js -> stronger env var checks, timeout, response normalization
- .env.example -> sample env vars to set locally or in Vercel

## Required Environment Variables (Vercel)

Go to your Vercel Project → Settings → Environment Variables and add the following values:

- RAPIDAPI_KEY  (set value from your RapidAPI account) — mark as Sensitive ON
- RAPIDAPI_HOST = allmedia-downloader.p.rapidapi.com
- RAPIDAPI_PATH = /universal

Set Environment to both Preview & Production if you want the same keys to be used in both.

After adding/updating env vars, trigger a redeploy (Deployments → Redeploy). Watch the deployment logs for any errors.

## Local testing

1. Create a .env file locally with values from .env.example (do NOT commit your real keys to GitHub).
2. Run:

```
export RAPIDAPI_KEY="YOUR_KEY_HERE"
export RAPIDAPI_HOST="allmedia-downloader.p.rapidapi.com"
export RAPIDAPI_PATH="/universal"
node server.js
```

3. Open http://localhost:3000 and try a media URL.

## Troubleshooting

- If you see `Server misconfigured. Admin must set RAPIDAPI env vars.` then your RAPIDAPI_* env vars are missing or not set in Vercel.
- If downloader returns an unexpected response shape, check Deploy → latest → Functions logs and paste the error here.

## Notes on Quality

The quality dropdown is forwarded to the RapidAPI endpoint as `quality` query param. The upstream API may or may not honor different quality values — if it doesn't, it will return the best available media it can provide.
