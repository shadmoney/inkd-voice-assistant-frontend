import boto3
from botocore.exceptions import ClientError
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_BUCKET_NAME = "inkd-contracts"

def configure_bucket_policy():
    """Configure bucket policy to allow public read access"""
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    try:
        # Configure bucket policy for public read access
        bucket_policy = {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Sid': 'PublicReadGetObject',
                    'Effect': 'Allow',
                    'Principal': '*',
                    'Action': ['s3:GetObject'],
                    'Resource': [f'arn:aws:s3:::{AWS_BUCKET_NAME}/*']
                }
            ]
        }
        
        # Convert policy to JSON string
        bucket_policy_string = json.dumps(bucket_policy)
        
        # Apply the policy to the bucket
        s3_client.put_bucket_policy(
            Bucket=AWS_BUCKET_NAME,
            Policy=bucket_policy_string
        )
        print(f"✓ Successfully configured bucket policy for {AWS_BUCKET_NAME}")
        
        # Configure bucket for public access
        s3_client.put_public_access_block(
            Bucket=AWS_BUCKET_NAME,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': False,
                'IgnorePublicAcls': False,
                'BlockPublicPolicy': False,
                'RestrictPublicBuckets': False
            }
        )
        print("✓ Configured bucket for public access")
        
        # Configure CORS
        cors_configuration = {
            'CORSRules': [{
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'HEAD'],
                'AllowedOrigins': ['*'],
                'ExposeHeaders': ['ETag'],
                'MaxAgeSeconds': 3000
            }]
        }
        
        s3_client.put_bucket_cors(
            Bucket=AWS_BUCKET_NAME,
            CORSConfiguration=cors_configuration
        )
        print("✓ Configured CORS settings")
        
    except ClientError as e:
        print(f"Error configuring bucket: {e}")

if __name__ == "__main__":
    configure_bucket_policy()
