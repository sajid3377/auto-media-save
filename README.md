# All-in-One Social Media Video Downloader

یہ پروجیکٹ ایک سادہ responsive ویب سائٹ + Express بیک اینڈ ہے جو RapidAPI کے "All-in-One" downloader providers کو proxy کر کے مختلف سوشل میڈیا ویڈیوز/آڈیوز کو ڈاؤنلوڈ کرنے کی سہولت دیتی ہے۔

Changelog / Provider integration
- I searched RapidAPI and integrated the app for a widely-used provider listing `AllMedia Downloader` (host: `allmedia-downloader.p.rapidapi.com`) via a generic universal endpoint `/universal`.
- The server now attempts a flexible request and normalizes common response shapes into a `links` array so the frontend can show direct download links (video no-watermark, video, audio).

Important: You must subscribe to the chosen RapidAPI provider on RapidAPI, get your RapidAPI key, and enable that API on your account. The provider's host may differ by provider — set it in the environment variable RAPIDAPI_HOST.

Environment variables (.env)
- RAPIDAPI_KEY=your_rapidapi_key_here
- RAPIDAPI_HOST=allmedia-downloader.p.rapidapi.com
- RAPIDAPI_PATH=/universal  # optional, default is /universal
- PORT=3000

Note: If you pick another provider on RapidAPI, update RAPIDAPI_HOST and RAPIDAPI_PATH accordingly.

How to run locally:
1. git clone https://github.com/sajid3377/auto-media-save.git
2. cd auto-media-save
3. npm install
4. copy .env.example to .env and set RAPIDAPI_KEY and RAPIDAPI_HOST
5. npm run dev
6. Open http://localhost:3000

Quick Deploy (recommended providers)
- Render (easy for Express apps):
  1. Create a Render account (https://render.com) and connect your GitHub.
  2. Create a new Web Service > Connect repository `sajid3377/auto-media-save`.
  3. Build Command: `npm install`
  4. Start Command: `npm start` (or `npm run dev` for auto-redeploy with nodemon but not recommended for production)
  5. Add Environment Variables in Render dashboard: `RAPIDAPI_KEY`, `RAPIDAPI_HOST` (and `RAPIDAPI_PATH` if needed).
  6. Deploy — Render will build and expose a public HTTPS URL.

- Railway (also very simple):
  1. Create Railway account and connect GitHub.
  2. Create a new project, link the repo.
  3. Set environment variables in the Railway dashboard.
  4. Deploy — Railway will detect Node app and run `npm start`.

- Vercel (using Serverless Functions):
  Vercel can host serverless API routes, but migrating this Express app into Vercel’s serverless functions requires small changes. For simplicity, use Render or Railway.

Deploy notes & tips:
- Do not commit your RapidAPI key to GitHub. Use the host's environment variables feature.
- Check provider rate limits and pricing on RapidAPI. For heavy usage consider paid plan or caching results.
- For production, set NODE_ENV=production and consider adding a small caching layer (Redis) or in-memory cache to reduce duplicate RapidAPI calls.

If you want, I can:
- Configure the repo with a Dockerfile or Render/railway specific configuration (render.yaml)
- Add a simple caching layer (in-memory LRU) to reduce RapidAPI usage
- Add a sample Google AdSense snippet in index.html using your AdSense client/ad slot IDs

