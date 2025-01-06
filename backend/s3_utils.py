import boto3
import os
from botocore.exceptions import ClientError

class S3Utils:
    def __init__(self):
        from dotenv import load_dotenv
        load_dotenv()
        
        # Get and validate environment variables
        self.access_key = os.getenv('AWS_ACCESS_KEY_ID')
        self.secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.region = os.getenv('AWS_REGION')
        self.bucket_name = os.getenv('AWS_BUCKET_NAME')
        
        print(f"AWS Region: {self.region}")
        print(f"Bucket Name: {self.bucket_name}")
        print(f"Access Key: {self.access_key[:4]}..." if self.access_key else "Access Key: None")
        
        if not all([self.access_key, self.secret_key, self.region, self.bucket_name]):
            raise Exception("Missing required AWS credentials in environment variables")
            
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region
        )

    def upload_file(self, file_content: bytes, file_name: str, user_id: str = None) -> str:
        """
        Upload a file to S3 bucket
        
        Args:
            file_content: The content of the file as bytes
            file_name: The name to give the file in S3
            
        Returns:
            str: The S3 URL of the uploaded file
            
        Raises:
            Exception: If upload fails
        """
        try:
            # If user_id is provided, prefix the file name with it
            key = f"{user_id}/{file_name}" if user_id else file_name
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_content,
                ContentType='application/pdf'
            )
            
            # Generate the S3 URL
            url = f"https://{self.bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
            return url
            
        except ClientError as e:
            raise Exception(f"Failed to upload file to S3: {str(e)}")
            
    def generate_presigned_url(self, key: str, expiration: int = 3600) -> str:
        """
        Generate a presigned URL for downloading a file from S3
        
        Args:
            key: The S3 key (path) of the file
            expiration: URL expiration time in seconds (default 1 hour)
            
        Returns:
            str: Presigned URL for downloading the file
            
        Raises:
            Exception: If URL generation fails
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")
            
    def get_empty_contract(self) -> str:
        """
        Get the empty contract template (VAResidentialSalesContractP1.pdf)
        
        Returns:
            str: Direct S3 URL for downloading the empty contract
            
        Raises:
            Exception: If contract not found or if operation fails
        """
        try:
            key = "VAResidentialSalesContractP1.pdf"
            print(f"Getting empty contract: {key}")
            # Return direct S3 URL since the file is publicly accessible
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{key}"
        except Exception as e:
            print(f"Error getting empty contract: {str(e)}")
            raise

    def get_latest_contract(self) -> str:
        """
        Get the latest contract from the S3 bucket
        
        Returns:
            str: Presigned URL for downloading the latest contract
            
        Raises:
            Exception: If no contracts found or if operation fails
        """
        try:
            print(f"Attempting to list objects in bucket: {self.bucket_name}")
            # List all objects in the bucket
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='',  # List all objects
            )
            
            print(f"S3 list_objects_v2 response: {response}")
            
            if 'Contents' not in response or not response['Contents']:
                raise Exception("No contracts found in the bucket")
                
            # Sort by last modified timestamp and get the latest
            latest_contract = max(response['Contents'], key=lambda x: x['LastModified'])
            print(f"Latest contract found: {latest_contract['Key']}")
            
            # Generate presigned URL for the latest contract
            url = self.generate_presigned_url(latest_contract['Key'])
            print(f"Generated presigned URL for {latest_contract['Key']}")
            return url
            
        except ClientError as e:
            print(f"AWS Error in get_latest_contract: {str(e)}")
            raise Exception(f"Failed to get latest contract: {str(e)}")
        except Exception as e:
            print(f"Unexpected error in get_latest_contract: {str(e)}")
            raise
