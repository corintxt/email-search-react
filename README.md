# Email Search Tool (React + FastAPI)

A modern email search application with a React frontend and FastAPI backend, powered by Google BigQuery.

## Architecture
- **Frontend**: React (Vite)
- **Backend**: FastAPI (Python)
- **Database**: Google BigQuery

## Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Google Cloud service account with BigQuery access

## Configuration

### Option 1: Using `config/secrets.toml` (Recommended)

Create a `config/secrets.toml` file in the project root:

```toml
PROJECT_ID = "your-gcp-project-id"
DATASET = "your-dataset-name"
TABLE = "your-table-name"
SUMMARY = "your-summary-table-name"  # Optional

[gcp_service_account]
type = "service_account"
project_id = "your-project-id"
private_key_id = "your-private-key-id"
private_key = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
client_email = "your-service-account@your-project.iam.gserviceaccount.com"
client_id = "your-client-id"
auth_uri = "https://accounts.google.com/o/oauth2/auth"
token_uri = "https://oauth2.googleapis.com/token"
auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs"
client_x509_cert_url = "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
```

> **Note**: The `config/` directory is gitignored to prevent accidentally committing secrets.

### Option 2: Using Environment Variables

Create a `backend/.env` file:

```env
PROJECT_ID=your-gcp-project-id
DATASET=your-dataset-name
TABLE=your-table-name
SUMMARY=your-summary-table-name
```

Then set the Google Cloud credentials:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

## Setup & Running

### 1. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Usage

1. Open `http://localhost:5173`
2. Use the sidebar to filter emails by date, sender, recipient, or category
3. Enter keywords in the search bar to find specific emails
4. Click "View Full" to see the complete email body
5. Export results to CSV using the export button

## Authentication Methods

The backend supports multiple authentication methods (in order of precedence):

1. **Service Account from `config/secrets.toml`** - Reads credentials directly from the config file
2. **Environment Variable** - Uses `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account JSON
3. **Application Default Credentials** - Uses `gcloud auth application-default login` (local development only)

## Deployment

### Remote Server Deployment

For production deployment, use one of these approaches:

**Option 1: Using `config/secrets.toml`**
- Upload your `config/secrets.toml` to the server
- Ensure proper file permissions (600)
- The backend will automatically use it

**Option 2: Using Environment Variables**
- Set `GOOGLE_APPLICATION_CREDENTIALS` to point to your service account JSON
- Configure via systemd, Docker, or your deployment platform

**Option 3: Workload Identity (GCP)**
- If deploying to Google Cloud Run, GKE, or Compute Engine
- Attach a service account to your compute resource
- No credential files needed - automatic authentication

### Security Checklist

- ✅ Never commit `config/secrets.toml` or service account JSON files
- ✅ Restrict service account permissions to BigQuery read-only
- ✅ Update CORS settings in `backend/main.py` for production
- ✅ Use HTTPS in production
- ✅ Set proper file permissions (600) on credential files

## Troubleshooting

- **No Results**: Ensure the `TABLE` configuration points to a valid BigQuery table with columns: `id`, `Subject`, `Body`, `From`, `To`, `Date_Sent`, `filename`
- **Authentication Failed**: Verify your service account has BigQuery Data Viewer permissions
- **CORS Errors**: Update `allow_origins` in `backend/main.py` to include your frontend URL
