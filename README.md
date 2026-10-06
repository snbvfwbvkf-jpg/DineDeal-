# DineDeal — Vercel Ready

DineDeal is ready to deploy on Vercel. The Google Places API key is kept server-side in a Vercel Environment Variable and is never shipped to the browser.

## Deploy from iPhone
1. Create a GitHub repository and upload the contents of this folder (not the ZIP itself).
2. In Vercel, choose **Add New → Project**, select the GitHub repository, and deploy.
3. In Vercel Project Settings → Environment Variables, add:
   - Name: `GOOGLE_PLACES_API_KEY`
   - Value: your Google Places API (New) key
   - Environments: Production, Preview, Development
4. Redeploy the project.
5. Open the Vercel URL on your iPhone and allow location access.

## Google Cloud
Enable Places API (New) and billing. Restrict the API key to the APIs and server environment you use. Do not commit `.env` or the API key to GitHub.

## Endpoints
- `/api/restaurants?lat=<lat>&lng=<lng>` — nearby cafés/restaurants
- `/api/restaurants?lat=<lat>&lng=<lng>&q=<search>` — text search
- `/api/health` — configuration check

## Discounts
Google Places does not provide DineDeal merchant discounts. Google results use `discount: 0` until a DineDeal deal database is connected using the Google Place ID.
