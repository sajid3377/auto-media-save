# Deploying to Render (auto-media-save)

This repository now includes a Dockerfile and `render.yaml` so you can deploy quickly to Render.com.

Quick steps to deploy with Render:
1. Sign in to Render and connect your GitHub account.
2. Create a new Web Service and select the repository `sajid3377/auto-media-save` or use the `render.yaml` automatic setup.
3. In Render service settings add Environment Variables:
   - RAPIDAPI_KEY = <your_rapidapi_key>
   - RAPIDAPI_HOST = allmedia-downloader.p.rapidapi.com (or provider host you choose)
   - RAPIDAPI_PATH = /universal
4. Deploy. Render will build using the provided Dockerfile / buildCommand and start the app with `npm start`.

Notes:
- Replace AdSense placeholders in `public/index.html` with your actual `data-ad-client` (ca-pub-...) and ad slot IDs before making the site public.
- The app uses a simple in-memory cache (5 minute TTL) to reduce duplicate RapidAPI calls.
- Do NOT commit your actual RAPIDAPI_KEY to the repository.
