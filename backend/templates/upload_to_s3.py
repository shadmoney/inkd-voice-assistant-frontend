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
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME") or "inkd--use1-az6--x-s3"

def upload_file():
    """Upload the contract form to S3"""
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    # Local file path
    file_path = "VAResidential Sales Contract-p1.pdf"
    
    try:
        # Upload file
        s3_client.upload_file(
            file_path,
            AWS_BUCKET_NAME,
            'contracts/VAResidential Sales Contract-p1.pdf',
            ExtraArgs={'ContentType': 'application/pdf'}
        )
        print(f"✓ Successfully uploaded file to s3://{AWS_BUCKET_NAME}/contracts/VAResidential Sales Contract-p1.pdf")
        
        # Generate a presigned URL to verify
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_BUCKET_NAME,
                'Key': 'contracts/VAResidential Sales Contract-p1.pdf'
            },
            ExpiresIn=3600
        )
        print(f"\nPresigned URL (valid for 1 hour):\n{url}")
        
    except FileNotFoundError:
        print(f"✗ Local file not found: {file_path}")
    except ClientError as e:
        print(f"Error uploading file: {e}")

if __name__ == "__main__":
    upload_file()
