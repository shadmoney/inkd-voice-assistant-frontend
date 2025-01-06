import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

# Load environment variables
load_dotenv()

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_BUCKET_NAME = "inkd-contracts"

def check_recent_simulations():
    """Check for recently uploaded simulation files in S3"""
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    try:
        # List objects in the bucket
        response = s3_client.list_objects_v2(
            Bucket=AWS_BUCKET_NAME
        )
        
        if 'Contents' in response:
            # Get current time for comparison (UTC)
            now = datetime.now(timezone.utc)
            
            # Filter for simulation files uploaded in the last hour
            recent_files = [
                obj for obj in response['Contents']
                if 'simulation.pdf' in obj['Key']
                and obj['LastModified'] > now - timedelta(hours=1)
            ]
            
            if recent_files:
                print(f"\n✓ Found {len(recent_files)} recent simulation(s):")
                for file in recent_files:
                    print(f"\nFile: {file['Key']}")
                    print(f"Uploaded: {file['LastModified']} UTC")
                    print(f"Size: {file['Size']} bytes")
                    
                    # Generate a presigned URL for the most recent file
                    url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': AWS_BUCKET_NAME,
                            'Key': file['Key']
                        },
                        ExpiresIn=3600
                    )
                    print(f"Presigned URL (valid for 1 hour):\n{url}")
            else:
                print("✗ No simulation files found from the last hour")
        else:
            print(f"✗ No files found in bucket: {AWS_BUCKET_NAME}")
            
    except ClientError as e:
        print(f"Error checking simulations: {e}")

if __name__ == "__main__":
    check_recent_simulations()
