# Railway Deployment - Quick Reference

## Prerequisites
- Railway account ([railway.app](https://railway.app))
- GitHub repository
- Google Cloud service account JSON

## Backend Deployment

### 1. Create Service
- New Project → Deploy from GitHub repo
- Select `email_search_react` repository
- Rename service to `email-search-backend`

### 2. Environment Variables
```
PROJECT_ID=your-gcp-project-id
DATASET=your-dataset-name
TABLE=your-table-name
SUMMARY=your-summary-table-name (optional)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

### 3. Generate Domain
- Settings → Networking → Generate Domain
- Copy URL (e.g., `https://email-search-backend.railway.app`)

## Frontend Deployment

### 1. Create Service
- New Service → GitHub Repo → Same repository
- Rename to `email-search-frontend`

### 2. Build Settings
- Root Directory: `frontend`
- Build Command: `npm run build`
- Start Command: `npm start`

### 3. Environment Variables
```
VITE_API_URL=https://your-backend-url.railway.app
```

### 4. Generate Domain
- Settings → Networking → Generate Domain

### 5. Update Backend CORS
Go back to backend service and add:
```
FRONTEND_URL=https://your-frontend-url.railway.app
```

## Verification
1. Visit `https://your-backend-url.railway.app/docs` - should see FastAPI docs
2. Visit `https://your-frontend-url.railway.app` - should see the app
3. Test search functionality
4. Check logs if issues occur

## Files Created for Deployment
- `railway.json` - Railway configuration
- `nixpacks.toml` - Nixpacks build config
- `Procfile` - Process definition
- `runtime.txt` - Python version
- `frontend/server.js` - Static file server
- `frontend/.env.production.example` - Environment template

## Common Issues
- **BigQuery auth fails**: Check `GOOGLE_APPLICATION_CREDENTIALS_JSON` is valid JSON
- **CORS errors**: Ensure `FRONTEND_URL` matches your frontend Railway domain
- **Build fails**: Check Railway logs for specific errors

For detailed instructions, see [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
