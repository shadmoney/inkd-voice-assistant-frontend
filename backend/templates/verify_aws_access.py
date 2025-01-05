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

def verify_aws_access():
    """Verify AWS credentials and bucket access"""
    print("Verifying AWS credentials and bucket access...")
    
    # Check if credentials are set
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        print("❌ AWS credentials are not set in environment variables")
        return
    
    try:
        # Create S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        # Test AWS credentials by listing buckets
        s3_client.list_buckets()
        print("✓ AWS credentials are valid")
        
        # Check bucket existence
        try:
            s3_client.head_bucket(Bucket=AWS_BUCKET_NAME)
            print(f"✓ Bucket '{AWS_BUCKET_NAME}' exists and is accessible")
            
            # List objects in bucket
            response = s3_client.list_objects_v2(Bucket=AWS_BUCKET_NAME)
            print("\nObjects in bucket:")
            if 'Contents' in response:
                for obj in response['Contents']:
                    print(f"- {obj['Key']}")
            else:
                print("(No objects found)")
            
            # Try to generate a presigned URL
            try:
                url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': AWS_BUCKET_NAME,
                        'Key': 'Virginia-REALTORS-Form-420-Independent-Contractor-Listing-Agreement-2019-01-Redline.pdf'
                    },
                    ExpiresIn=3600
                )
                print("\n✓ Successfully generated presigned URL")
                print(f"URL: {url}")
            except ClientError as e:
                print(f"\n❌ Error generating presigned URL: {e}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                print(f"❌ Bucket '{AWS_BUCKET_NAME}' does not exist")
            elif error_code == '403':
                print(f"❌ Access denied to bucket '{AWS_BUCKET_NAME}'")
            else:
                print(f"❌ Error accessing bucket: {e}")
                
    except ClientError as e:
        print(f"❌ Error verifying AWS credentials: {e}")

if __name__ == "__main__":
    verify_aws_access()
