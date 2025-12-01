import os
import re
from typing import List, Optional
from datetime import date
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.cloud import bigquery
from google.oauth2 import service_account
from dotenv import load_dotenv
import pandas as pd
import tomli

# Load environment variables
load_dotenv()

app = FastAPI(title="Email Search API")

# CORS configuration
# Get allowed origins from environment variable, default to wildcard for development
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
allowed_origins = [FRONTEND_URL] if FRONTEND_URL != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load secrets from config/secrets.toml if available
secrets = {}
try:
    secrets_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "secrets.toml")
    if os.path.exists(secrets_path):
        with open(secrets_path, "rb") as f:
            secrets = tomli.load(f)
except Exception as e:
    print(f"Warning: Could not load secrets.toml: {e}")

# Configuration - Priority: Env Vars > Secrets > Defaults
PROJECT_ID = os.getenv("PROJECT_ID") or secrets.get("PROJECT_ID")
DATASET = os.getenv("DATASET") or secrets.get("DATASET")
TABLE = os.getenv("TABLE") or secrets.get("TABLE")
SUMMARY_TABLE = os.getenv("SUMMARY") or secrets.get("SUMMARY")
APP_PASSWORD = os.getenv("APP_PASSWORD") or secrets.get("APP_PASSWORD", "password123")


# Initialize BigQuery client
def get_bigquery_client():
    try:
        # Priority 1: Try to use service account from secrets.toml
        if "gcp_service_account" in secrets:
            credentials = service_account.Credentials.from_service_account_info(
                secrets["gcp_service_account"]
            )
            return bigquery.Client(credentials=credentials, project=PROJECT_ID)
        
        # Priority 2: Try to use JSON credentials from environment variable (Railway)
        gcp_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if gcp_json:
            import json
            credentials_dict = json.loads(gcp_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_dict
            )
            return bigquery.Client(credentials=credentials, project=PROJECT_ID)
        
        # Priority 3: Fallback to default credentials (env vars or gcloud auth)
        return bigquery.Client(project=PROJECT_ID)
    except Exception as e:
        print(f"Error initializing BigQuery client: {e}")
        return None

client = get_bigquery_client()

# Models
class SearchRequest(BaseModel):
    query: Optional[str] = None
    limit: int = 100
    search_type: str = "All fields"
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    sender_filter: Optional[str] = None
    recipient_filter: Optional[str] = None
    show_summaries: bool = False
    category_filter: Optional[str] = None

class AuthRequest(BaseModel):
    password: str

@app.post("/api/auth")
async def check_auth(request: AuthRequest):
    if request.password == APP_PASSWORD:
        return {"authenticated": True}
    raise HTTPException(status_code=401, detail="Incorrect password")

@app.get("/api/categories")
async def get_categories():
    if not SUMMARY_TABLE or not client:
        return {"categories": []}
    
    try:
        query = f"SELECT DISTINCT category FROM `{PROJECT_ID}.{DATASET}.{SUMMARY_TABLE}` WHERE category IS NOT NULL ORDER BY category"
        query_job = client.query(query)
        categories = [row.category for row in query_job]
        return {"categories": categories}
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return {"categories": []}

@app.get("/api/config")
async def get_config():
    """Return dataset configuration for frontend display"""
    return {
        # "project_id": PROJECT_ID,
        "dataset": DATASET,
        "table": TABLE
    }

@app.post("/api/search")
async def search_emails(request: SearchRequest):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    # Build WHERE clause
    query_params = []
    where_conditions = []
    
    # Check summary table availability
    summary_table_available = False
    if SUMMARY_TABLE:
        try:
            client.get_table(f"{PROJECT_ID}.{DATASET}.{SUMMARY_TABLE}")
            summary_table_available = True
        except:
            pass

    # Always include summaries when the summary table is available so the UI can
    # instantly show/hide without refetching or requerying.
    needs_summary_join = summary_table_available
    table_prefix = "e." if needs_summary_join else ""

    # Keyword search
    if request.query:
        if request.search_type == "Subject":
            search_fields = [f"{table_prefix}Subject"]
        elif request.search_type == "Body":
            search_fields = [f"{table_prefix}Body"]
        else:
            search_fields = [f"{table_prefix}Subject", f"{table_prefix}Body"]
        
        keywords = request.query.split()
        keyword_conditions = []
        for i, keyword in enumerate(keywords):
            field_conditions = " OR ".join([
                f"LOWER({field}) LIKE LOWER(@keyword_{i})" for field in search_fields
            ])
            keyword_conditions.append(f"({field_conditions})")
            query_params.append(bigquery.ScalarQueryParameter(f"keyword_{i}", "STRING", f"%{keyword}%"))
        
        where_conditions.append(" AND ".join(keyword_conditions))

    # Filters
    if request.sender_filter:
        where_conditions.append(f"LOWER({table_prefix}`From`) LIKE LOWER(@sender)")
        query_params.append(bigquery.ScalarQueryParameter("sender", "STRING", f"%{request.sender_filter}%"))
    
    if request.recipient_filter:
        where_conditions.append(f"LOWER({table_prefix}`To`) LIKE LOWER(@recipient)")
        query_params.append(bigquery.ScalarQueryParameter("recipient", "STRING", f"%{request.recipient_filter}%"))

    if request.date_from:
        where_conditions.append(f"{table_prefix}Date_Sent >= @date_from")
        query_params.append(bigquery.ScalarQueryParameter("date_from", "DATE", request.date_from))
    
    if request.date_to:
        where_conditions.append(f"{table_prefix}Date_Sent <= @date_to")
        query_params.append(bigquery.ScalarQueryParameter("date_to", "DATE", request.date_to))

    if request.category_filter and needs_summary_join:
        where_conditions.append("s.category = @category")
        query_params.append(bigquery.ScalarQueryParameter("category", "STRING", request.category_filter))

    where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

    # Build SQL
    if needs_summary_join:
        sql_query = f"""
        SELECT 
            e.id,
            e.Body,
            e.Subject,
            e.`From` as sender,
            e.`To` as recipient,
            e.Date_Sent as date,
            e.filename,
            s.summary,
            s.category
        FROM `{PROJECT_ID}.{DATASET}.{TABLE}` e
        LEFT JOIN `{PROJECT_ID}.{DATASET}.{SUMMARY_TABLE}` s
        ON e.id = s.id
        WHERE {where_clause}
        ORDER BY e.Date_Sent DESC
        LIMIT @limit
        """
    else:
        sql_query = f"""
        SELECT 
            id,
            Body,
            Subject,
            `From` as sender,
            `To` as recipient,
            Date_Sent as date,
            filename
        FROM `{PROJECT_ID}.{DATASET}.{TABLE}`
        WHERE {where_clause}
        ORDER BY Date_Sent DESC
        LIMIT @limit
        """
    
    query_params.append(bigquery.ScalarQueryParameter("limit", "INT64", request.limit))

    job_config = bigquery.QueryJobConfig(query_parameters=query_params)
    
    try:
        query_job = client.query(sql_query, job_config=job_config)
        results = []
        for row in query_job:
            # Convert row to dict and handle date serialization
            item = dict(row)
            if item.get('date'):
                item['date'] = item['date'].isoformat()
            results.append(item)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
