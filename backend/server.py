from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from s3_utils import S3Utils
from dotenv import load_dotenv
import os
import subprocess
import json
import time

# Load environment variables
load_dotenv()

app = FastAPI()

# Initialize S3Utils
s3 = S3Utils()

# Store contract generation status with timestamps
contract_status = {}

def update_contract_status(user_id: str, url: str, contract_id: str):
    """Update the contract status for a user with timestamp"""
    contract_status[user_id] = {
        "url": url,
        "contractId": contract_id,
        "timestamp": time.time(),
        "generated": True
    }

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

@app.get("/latest-contract/{user_id}")
async def get_latest_contract(user_id: str, contract_id: str = None):
    """Get a specific contract or the latest generated contract from S3"""
    try:
        print(f"Received request for contract. User: {user_id}, Contract ID: {contract_id}")
        if contract_id:
            url = s3.get_contract_by_id(user_id, contract_id)
            return {"url": url}
        else:
            result = s3.get_latest_contract(user_id)
            print(f"Successfully retrieved contract data: {result}")
            return result
    except Exception as e:
        print(f"Error in get_latest_contract endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run-tooltest/{user_id}")
async def run_tooltest(user_id: str, request: ContractRequest):
    """Run tooltest.py to generate and upload a new contract"""
    try:
        # Generate timestamp for both contract ID and file name
        timestamp = time.strftime("%Y-%m-%d-%H%M%S")
        contract_id = f"contract_{timestamp}"
        
        request_data = request.dict()
        request_data["user_id"] = user_id
        request_data["contract_id"] = contract_id
        request_data["timestamp"] = timestamp  # Pass timestamp to tooltest
        print("Running tooltest.py with data:", request_data)
        
        result = subprocess.run(
            ["python", "tooltest.py"],
            input=json.dumps(request_data),
            text=True,
            capture_output=True,
            check=True
        )
        print(f"Tooltest output: {result.stdout}")
        
        # Get the latest contract for the user
        result = s3.get_latest_contract(user_id)
        print(f"Latest contract result: {result}")
        
        # Check if we got a no_contract status
        if "status" in result and result["status"] == "no_contract":
            print("No existing contracts found, checking if new contract was generated")
            # Try to get the specific contract we just generated
            try:
                key = f"{user_id}/contracts/{timestamp}/ResidentialSalesContract.pdf"
                url = s3.generate_presigned_url(key)
                print(f"Generated presigned URL for new contract: {url}")
                # Update contract status immediately
                update_contract_status(user_id, url, contract_id)
            except Exception as e:
                print(f"Error getting new contract: {str(e)}")
                raise HTTPException(status_code=500, detail="Failed to retrieve generated contract")
        else:
            url = result["url"]
            print(f"Found existing contract URL: {url}")
            # Update contract status immediately
            update_contract_status(user_id, url, contract_id)
        
        return {
            "message": "Contract generated successfully",
            "url": url,
            "contractId": contract_id
        }
    except subprocess.CalledProcessError as e:
        print(f"Error running tooltest: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Failed to run tooltest: {e.stderr}")
    except Exception as e:
        print(f"Unexpected error running tooltest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/contract-status/{user_id}")
async def get_contract_status(user_id: str):
    """Get the status of the latest contract generation"""
    try:
        # First check in-memory status for immediate updates
        if user_id in contract_status:
            status = contract_status[user_id]
            current_time = time.time()
            
            # If status is recent (within last 30 seconds), return it
            if current_time - status["timestamp"] <= 30:
                return status
                
            # Clear old status
            del contract_status[user_id]
        
        # If no recent in-memory status, check S3 for latest contract
        result = s3.get_latest_contract(user_id)
        
        # Handle no_contract status
        if "status" in result and result["status"] == "no_contract":
            return result
            
        # Return contract info if found
        return {
            "url": result["url"],
            "generated": True,
            "timestamp": time.time()
        }
    except Exception as e:
        print(f"Error in get_contract_status endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
