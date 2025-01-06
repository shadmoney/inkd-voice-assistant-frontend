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
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME") or "inkd-contracts"

def create_bucket():
    """Create S3 bucket with CORS configuration"""
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    # Check if bucket exists
    try:
        s3_client.head_bucket(Bucket=AWS_BUCKET_NAME)
        print(f"✓ Bucket {AWS_BUCKET_NAME} already exists")
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            try:
                s3_client.create_bucket(Bucket=AWS_BUCKET_NAME)
                print(f"✓ Created bucket: {AWS_BUCKET_NAME}")
            except ClientError as e:
                print(f"Error creating bucket: {e}")
                return
        else:
            print(f"Error checking bucket: {e}")
            return

    # Configure CORS
    try:
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
        print("✓ Configured CORS")
    except ClientError as e:
        print(f"Error configuring CORS: {e}")
        return

    # Configure bucket policy
    try:
        bucket_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Sid': 'PublicReadGetObject',
                'Effect': 'Allow',
                'Principal': '*',
                'Action': ['s3:GetObject'],
                'Resource': [f'arn:aws:s3:::{AWS_BUCKET_NAME}/*']
            }]
        }
        
        s3_client.put_bucket_policy(
            Bucket=AWS_BUCKET_NAME,
            Policy=str(bucket_policy).replace("'", '"')
        )
        print("✓ Configured bucket policy")
    except ClientError as e:
        print(f"Error configuring bucket policy: {e}")
        return

    # Upload PDF file
    try:
        file_path = "VAResidential Sales Contract-p1.pdf"
        s3_client.upload_file(
            file_path,
            AWS_BUCKET_NAME,
            'contracts/VAResidential Sales Contract-p1.pdf',
            ExtraArgs={
                'ContentType': 'application/pdf',
                'ContentDisposition': 'inline'
            }
        )
        print(f"✓ Uploaded file to s3://{AWS_BUCKET_NAME}/contracts/VAResidential Sales Contract-p1.pdf")
    except (ClientError, FileNotFoundError) as e:
        print(f"Error uploading file: {e}")

if __name__ == "__main__":
    create_bucket()
