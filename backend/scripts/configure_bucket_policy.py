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
    """Configure bucket policy for secure user-specific access"""
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    try:
        # Configure bucket policy for secure access
        bucket_policy = {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Sid': 'PublicReadEmptyContract',
                    'Effect': 'Allow',
                    'Principal': '*',
                    'Action': ['s3:GetObject'],
                    'Resource': f'arn:aws:s3:::{AWS_BUCKET_NAME}/VAResidentialSalesContractP1.pdf'
                },
                {
                    'Sid': 'AllowPresignedUrlOperations',
                    'Effect': 'Allow',
                    'Principal': {
                        'AWS': '*'
                    },
                    'Action': [
                        's3:GetObject',
                        's3:PutObject'
                    ],
                    'Resource': f'arn:aws:s3:::{AWS_BUCKET_NAME}/*',
                    'Condition': {
                        'StringLike': {
                            'aws:UserAgent': 'aws-sdk-*'  # Only allow access through AWS SDK
                        }
                    }
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
        
        # Configure bucket to block public access
        s3_client.put_public_access_block(
            Bucket=AWS_BUCKET_NAME,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': False,  # Allow bucket policy to control access
                'RestrictPublicBuckets': True
            }
        )
        print("✓ Configured bucket to block public access")
        
        # Configure CORS for presigned URL operations
        cors_configuration = {
            'CORSRules': [{
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'PUT', 'POST', 'HEAD'],  # Removed OPTIONS as it's not supported
                'AllowedOrigins': [
                    'http://localhost:3000',
                    'https://localhost:3000',
                    os.environ.get("FRONTEND_URL", "http://localhost:3000")
                ],
                'ExposeHeaders': [
                    'Content-Type',
                    'Content-Disposition',
                    'Content-Length',
                    'ETag'
                ],
                'MaxAgeSeconds': 3600
            }]
        }
        
        s3_client.put_bucket_cors(
            Bucket=AWS_BUCKET_NAME,
            CORSConfiguration=cors_configuration
        )
        print("✓ Configured CORS settings")
        
    except ClientError as e:
        print(f"Error configuring bucket: {e}")
        raise e

if __name__ == "__main__":
    configure_bucket_policy()
