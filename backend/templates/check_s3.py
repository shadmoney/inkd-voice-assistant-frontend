import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_BUCKET_NAME = "inkd-contracts"

def check_file_exists():
    """Check if the contract form exists in S3"""
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    try:
        # Try to head the object to check if it exists
        s3_client.head_object(
            Bucket=AWS_BUCKET_NAME,
            Key='Virginia-REALTORS-Form-420-Independent-Contractor-Listing-Agreement-2019-01-Redline.pdf'
        )
        print(f"✓ File exists in S3 bucket: {AWS_BUCKET_NAME}")
        
        # Generate a presigned URL for testing
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_BUCKET_NAME,
                'Key': 'Virginia-REALTORS-Form-420-Independent-Contractor-Listing-Agreement-2019-01-Redline.pdf'
            },
            ExpiresIn=3600
        )
        print(f"\nPresigned URL (valid for 1 hour):\n{url}")
        
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            print(f"✗ File does not exist in S3 bucket: {AWS_BUCKET_NAME}")
        else:
            print(f"Error checking file: {e}")

if __name__ == "__main__":
    check_file_exists()
