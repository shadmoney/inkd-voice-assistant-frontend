from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from s3_utils import S3Utils
from dotenv import load_dotenv
import os
import subprocess
import json

# Load environment variables
load_dotenv()

app = FastAPI()

# Initialize S3Utils
s3 = S3Utils()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ideally, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DownloadRequest(BaseModel):
    userId: str
    key: str

class ContractRequest(BaseModel):
    sales_price: str
    down_payment_amount: str
    buyer_name: str
    street_address: str
    conventional_financing: bool
    financing_contingent: bool

@app.post("/download-contract")
async def download_contract(request: DownloadRequest):
    try:
        # Verify the key belongs to the user
        if not request.key.startswith(f"{request.userId}/"):
            raise HTTPException(status_code=403, detail="Access denied")
            
        presigned_url = s3.generate_presigned_url(request.key)
        
        return {"url": presigned_url}
        
    except Exception as e:
        print(f"Error in get_latest_contract: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/empty-contract")
async def get_empty_contract():
    """Get the empty contract template from S3"""
    try:
        print("Received request for empty contract")
        url = s3.get_empty_contract()
        print(f"Successfully retrieved empty contract URL: {url}")
        return {"url": url}
    except Exception as e:
        print(f"Error in get_empty_contract endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/latest-contract")
async def get_latest_contract():
    """Get the latest generated contract from S3"""
    try:
        print("Received request for latest contract")
        url = s3.get_latest_contract()
        print(f"Successfully retrieved latest contract URL: {url}")
        return {"url": url}
    except Exception as e:
        print(f"Error in get_latest_contract endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run-tooltest")
async def run_tooltest(request: ContractRequest):
    """Run tooltest.py to generate and upload a new contract"""
    try:
        print("Running tooltest.py with data:", request.dict())
        result = subprocess.run(
            ["python", "tooltest.py"],
            input=json.dumps(request.dict()),
            text=True,
            capture_output=True,
            check=True
        )
        print(f"Tooltest output: {result.stdout}")
        
        # Get the URL of the newly generated contract
        url = s3.get_latest_contract()
        print(f"Generated contract URL: {url}")
        
        return {
            "message": "Contract generated successfully",
            "url": url
        }
    except subprocess.CalledProcessError as e:
        print(f"Error running tooltest: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Failed to run tooltest: {e.stderr}")
    except Exception as e:
        print(f"Unexpected error running tooltest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
