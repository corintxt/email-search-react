# Railway Deployment Guide

This guide walks you through deploying the Email Search application (React + FastAPI) to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Google Cloud Service Account**: JSON credentials with BigQuery access

## Architecture Overview

The application will be deployed as **two separate Railway services**:
- **Backend Service**: FastAPI application
- **Frontend Service**: Static React build

---

## Part 1: Deploy the Backend

### Step 1: Create a New Railway Project

1. Log in to [Railway](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your `email_search_react` repository

### Step 2: Configure Backend Service

1. Railway will detect your project and create a service
2. Click on the service to open its settings
3. Go to **Settings** → **Service Name** and rename it to `email-search-backend`

### Step 3: Set Environment Variables

Go to the **Variables** tab and add the following environment variables:

#### Required Variables:
```
PROJECT_ID=your-gcp-project-id
DATASET=your-dataset-name
TABLE=your-table-name
```

#### Optional Variables:
```
SUMMARY=your-summary-table-name
FRONTEND_URL=https://your-frontend-url.railway.app
```

> **Note**: You'll update `FRONTEND_URL` after deploying the frontend in Part 2.

#### Google Cloud Service Account Credentials:

You need to add your GCP service account as a JSON string. Railway supports two approaches:

**Option A: Single Variable (Recommended)**

Create a variable called `GOOGLE_APPLICATION_CREDENTIALS_JSON` with your entire service account JSON as the value:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**Option B: File-based Credentials**

If you prefer, you can use Railway's file upload feature:
1. Go to **Variables** → **Add Variable**
2. Click **"Add File"**
3. Upload your service account JSON file
4. Set the variable name to `GOOGLE_APPLICATION_CREDENTIALS`

### Step 4: Deploy Backend

1. Railway will automatically detect your Python project using:
   - **`runtime.txt`** - Specifies Python 3.9
   - **`Procfile`** - Defines the start command: `web: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **`backend/requirements.txt`** - Lists Python dependencies
2. Railway will automatically:
   - Install Python 3.9
   - Install dependencies from `requirements.txt`
   - Start the application using the command from `Procfile`
3. Wait for the deployment to complete (check the **Deployments** tab)

> **Note**: Railway's auto-detection works best without custom configuration files like `railway.json` or `nixpacks.toml`. The combination of `Procfile` and `runtime.txt` is sufficient.

### Step 5: Configure Networking

1. Go to **Settings** → **Networking**
2. Railway should automatically detect the port from your `Procfile` (which uses `$PORT`)
3. **If Railway asks for a port number, enter `8080`** (this is just for the UI - Railway will use its dynamic `$PORT` at runtime)
4. Click **"Generate Domain"** to get a public URL
5. **Copy this URL** - you'll need it for the frontend (e.g., `https://email-search-backend.railway.app`)

> **Note**: The `Procfile` uses `$PORT` which Railway automatically assigns at runtime. Your backend code reads this via `os.getenv("PORT", 8080)`. The port number you enter in the UI (8000) is just a placeholder.

### Step 6: Verify Backend

1. Navigate to `https://your-backend-url.railway.app/docs`
2. You should see the FastAPI interactive documentation
3. Try the `/api/categories` endpoint to verify BigQuery connectivity

---

## Part 2: Deploy the Frontend

### Step 1: Build the Frontend Locally

Before deploying, you need to configure the frontend to point to your Railway backend:

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Create a `.env.production` file:
   ```env
   VITE_API_URL=https://your-backend-url.railway.app
   ```

3. Update `src/App.jsx` to use the environment variable for API calls (if not already done)

4. Build the production bundle:
   ```bash
   npm run build
   ```

### Step 2: Create a Static Server Configuration

Since Railway needs a server to serve static files, create a simple Node.js server in the `frontend` directory.

Create `frontend/server.js`:
```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
});
```

Update `frontend/package.json` to include:
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "vite build"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

### Step 3: Create Frontend Service on Railway

1. In your Railway project, click **"New Service"**
2. Select **"GitHub Repo"** and choose the same repository
3. Rename the service to `email-search-frontend`

### Step 4: Configure Frontend Build

1. Go to **Settings** → **Build**
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to `npm run build`
4. Set **Start Command** to `npm start`

### Step 5: Set Frontend Environment Variables

Go to **Variables** and add:
```
VITE_API_URL=https://your-backend-url.railway.app
```

### Step 6: Deploy Frontend

1. Railway will automatically deploy
2. Once complete, go to **Settings** → **Networking**
3. Click **"Generate Domain"** to get your frontend URL

### Step 7: Update Backend CORS

Now that you have your frontend URL, update the backend:

1. Go to your **backend service** in Railway
2. Go to **Variables**
3. Update `FRONTEND_URL` to your frontend Railway URL (e.g., `https://email-search-frontend.railway.app`)
4. The backend will automatically redeploy

---

## Part 3: Verification

### Test the Application

1. Navigate to your frontend URL
2. Try searching for emails
3. Apply filters (date, sender, recipient, category)
4. Export results to CSV
5. Check that all features work correctly

### Check Logs

If something doesn't work:

1. Go to the service in Railway
2. Click on **Deployments** → Select the latest deployment
3. View the logs to diagnose issues

### Common Issues

**Backend can't connect to BigQuery:**
- Verify your service account credentials are correct
- Check that the service account has BigQuery Data Viewer permissions
- Ensure `PROJECT_ID`, `DATASET`, and `TABLE` are set correctly

**Frontend can't reach backend:**
- Verify `VITE_API_URL` is set correctly in frontend variables
- Check that the backend URL is accessible
- Verify CORS is configured with the correct frontend URL

**Build failures:**
- Check the build logs in Railway
- Ensure all dependencies are listed in `requirements.txt` (backend) or `package.json` (frontend)

---

## Part 4: Optional Enhancements

### Custom Domains

1. Go to **Settings** → **Networking** for each service
2. Click **"Custom Domain"**
3. Follow Railway's instructions to configure DNS

### Environment-Specific Configurations

You can create different Railway projects for staging and production environments.

### Monitoring

Railway provides built-in metrics:
- Go to **Metrics** tab to view CPU, memory, and network usage
- Set up alerts for service health

---

## Security Checklist

- ✅ Service account has minimal permissions (BigQuery Data Viewer only)
- ✅ Environment variables are set in Railway (not committed to Git)
- ✅ CORS is configured with specific frontend URL (not wildcard)
- ✅ `.gitignore` excludes `config/`, `.env`, and credential files
- ✅ HTTPS is enabled (Railway provides this by default)

---

## Cost Considerations

Railway offers:
- **Free tier**: $5 of usage per month
- **Pro plan**: $20/month + usage

Each service consumes resources. Monitor your usage in the Railway dashboard.

---

## Maintenance

### Updating the Application

1. Push changes to your GitHub repository
2. Railway will automatically detect changes and redeploy
3. Monitor the deployment in the Railway dashboard

### Rolling Back

1. Go to **Deployments**
2. Find a previous successful deployment
3. Click **"Redeploy"**

---

## Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
