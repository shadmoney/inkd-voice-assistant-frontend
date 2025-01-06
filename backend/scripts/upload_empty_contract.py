import boto3
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_BUCKET_NAME = "inkd-contracts"

def upload_empty_contract():
    """Upload the empty contract template to S3 with public read access"""
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    # Path to template
    template_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "templates",
        "VAResidentialSalesContractP1.pdf"
    )
    
    try:
        # Upload file with public-read ACL
        with open(template_path, 'rb') as file:
            # Upload the file
            s3_client.put_object(
                Bucket=AWS_BUCKET_NAME,
                Key="VAResidentialSalesContractP1.pdf",
                Body=file,
                ContentType='application/pdf'
            )
            
            # Update bucket policy to make this object public
            bucket_policy = {
                'Version': '2012-10-17',
                'Statement': [{
                    'Sid': 'PublicReadEmptyContract',
                    'Effect': 'Allow',
                    'Principal': '*',
                    'Action': ['s3:GetObject'],
                    'Resource': [f'arn:aws:s3:::{AWS_BUCKET_NAME}/VAResidentialSalesContractP1.pdf']
                }]
            }
            
            s3_client.put_bucket_policy(
                Bucket=AWS_BUCKET_NAME,
                Policy=json.dumps(bucket_policy)
            )
        
        print("✓ Successfully uploaded empty contract template")
        print(f"URL: https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/VAResidentialSalesContractP1.pdf")
        
    except Exception as e:
        print(f"Error uploading empty contract: {e}")
        raise e

if __name__ == "__main__":
    upload_empty_contract()
