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

def update_cors():
    """Update S3 bucket CORS configuration"""
    print("Updating S3 bucket CORS configuration...")
    
    try:
        # Create S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        # Configure CORS
        cors_configuration = {
            'CORSRules': [
                {
                    'AllowedHeaders': ['*'],
                    'AllowedMethods': ['GET', 'HEAD'],
                    'AllowedOrigins': ['*'],
                    'ExposeHeaders': [
                        'ETag',
                        'Content-Length',
                        'Content-Type',
                        'Content-Disposition',
                        'Content-Range',
                        'Access-Control-Allow-Origin',
                        'Access-Control-Allow-Methods',
                        'Access-Control-Allow-Headers'
                    ],
                    'MaxAgeSeconds': 3600
                }
            ]
        }
        
        # Apply CORS configuration
        s3_client.put_bucket_cors(
            Bucket=AWS_BUCKET_NAME,
            CORSConfiguration=cors_configuration
        )
        print("✓ Successfully updated CORS configuration")
        
    except ClientError as e:
        print(f"❌ Error updating CORS configuration: {e}")

if __name__ == "__main__":
    update_cors()
