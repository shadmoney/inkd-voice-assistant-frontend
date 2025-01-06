import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_BUCKET_NAME = "inkd-contracts"

def get_s3_client():
    """Get configured S3 client"""
    return boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )

def generate_presigned_upload_url(user_id, filename=None):
    """Generate a presigned URL for uploading a contract

    :param user_id: User ID to create directory structure
    :param filename: Optional original filename to preserve
    :return: Dictionary containing presigned URL and S3 key
    """
    s3_client = get_s3_client()
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    file_uuid = uuid.uuid4().hex[:8]
    
    if filename:
        # Preserve original filename but make it URL-safe
        base_name = os.path.splitext(os.path.basename(filename))[0]
        safe_name = "".join(c for c in base_name if c.isalnum() or c in ('-', '_'))
        key = f"{user_id}/contract-{timestamp}-{file_uuid}-{safe_name}.pdf"
    else:
        key = f"{user_id}/contract-{timestamp}-{file_uuid}.pdf"

    try:
        url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': AWS_BUCKET_NAME,
                'Key': key,
                'ContentType': 'application/pdf',
                'ACL': 'private'
            },
            ExpiresIn=3600  # URL valid for 1 hour
        )
        return {"url": url, "key": key}
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        return None

def generate_presigned_download_url(user_id, key):
    """Generate a presigned URL for downloading a contract

    :param user_id: User ID to verify access
    :param key: S3 object key
    :return: Presigned URL if successful, None otherwise
    """
    # Verify the key belongs to the user
    if not key.startswith(f"{user_id}/"):
        print("Access denied: Key does not match user_id")
        return None
    
    s3_client = get_s3_client()
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_BUCKET_NAME,
                'Key': key
            },
            ExpiresIn=3600  # URL valid for 1 hour
        )
        return url
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        return None

def list_user_contracts(user_id):
    """List all contracts for a specific user

    :param user_id: User ID to list contracts for
    :return: List of contract metadata
    """
    s3_client = get_s3_client()
    try:
        response = s3_client.list_objects_v2(
            Bucket=AWS_BUCKET_NAME,
            Prefix=f"{user_id}/"
        )
        
        contracts = []
        for obj in response.get('Contents', []):
            # Extract timestamp and name from key
            key_parts = obj['Key'].split('/')[-1].split('-', 3)
            if len(key_parts) >= 3:
                timestamp = key_parts[1]
                name = key_parts[3].rsplit('.', 1)[0] if len(key_parts) > 3 else 'Contract'
            else:
                timestamp = obj['LastModified'].strftime("%Y%m%d-%H%M%S")
                name = 'Contract'
                
            contracts.append({
                'key': obj['Key'],
                'name': name,
                'timestamp': timestamp,
                'size': obj['Size'],
                'last_modified': obj['LastModified'].isoformat()
            })
            
        return contracts
    except ClientError as e:
        print(f"Error listing contracts: {e}")
        return []

if __name__ == "__main__":
    # Example usage
    USER_ID = "test_user"
    
    # Generate upload URL
    upload_data = generate_presigned_upload_url(USER_ID, "example-contract.pdf")
    if upload_data:
        print(f"Upload URL generated for key: {upload_data['key']}")
        print(f"Upload URL: {upload_data['url']}")
    
    # List user's contracts
    contracts = list_user_contracts(USER_ID)
    print(f"\nContracts for user {USER_ID}:")
    for contract in contracts:
        print(f"- {contract['name']} ({contract['timestamp']})")
