import boto3
import os
import time
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

    def upload_file(self, file_content: bytes, file_name: str, user_id: str, timestamp: str = None) -> str:
        """
        Upload a file to S3 bucket in the user's contracts folder
        
        Args:
            file_content: The content of the file as bytes
            file_name: The name to give the file in S3
            user_id: The user ID who owns the contract (required)
            timestamp: Optional timestamp to use in the filename (format: YYYY-MM-DD-HHMMSS)
            
        Returns:
            str: The S3 URL of the uploaded file
            
        Raises:
            Exception: If upload fails or if user_id is not provided
        """
        try:
            if not user_id:
                raise Exception("user_id is required for uploading contracts")

            # Use provided timestamp or generate new one
            if not timestamp:
                timestamp = time.strftime("%Y-%m-%d-%H%M%S")
                
            # Build the key with consistent format using provided filename
            key = f"{user_id}/contracts/{timestamp}/{file_name}"
            
            print(f"Uploading file to S3 with key: {key}")
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_content,
                ContentType='application/pdf'
            )
            
            # Generate the S3 URL
            url = f"https://{self.bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
            print(f"Generated S3 URL: {url}")
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
            str: Presigned URL for downloading the empty contract
            
        Raises:
            Exception: If contract not found or if operation fails
        """
        try:
            key = "VAResidentialSalesContractP1.pdf"
            print(f"Getting empty contract: {key}")
            # Generate a presigned URL for the empty contract
            return self.generate_presigned_url(key)
        except Exception as e:
            print(f"Error getting empty contract: {str(e)}")
            raise

    def get_contract_by_id(self, user_id: str, contract_id: str) -> str:
        """
        Get a specific contract by its ID
        
        Args:
            user_id: The user ID who owns the contract
            contract_id: The unique identifier for the contract (format: contract_YYYY-MM-DD-HHMMSS)
            
        Returns:
            str: Presigned URL for downloading the contract
            
        Raises:
            Exception: If contract not found or if operation fails
        """
        try:
            # Extract timestamp from contract_id
            # contract_id format: contract_YYYY-MM-DD-HHMMSS
            timestamp = contract_id.replace('contract_', '')
            
            # Construct the key for the specific contract with timestamp in filename
            key = f"{user_id}/contracts/{timestamp}/ResidentialSalesContract_{timestamp}.pdf"
            print(f"Getting contract with key: {key}")
            
            # Check if the object exists
            try:
                self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    raise Exception(f"Contract not found: {contract_id}")
                raise
            
            # Generate presigned URL for the contract
            url = self.generate_presigned_url(key)
            print(f"Generated presigned URL for contract: {contract_id}")
            return url
            
        except ClientError as e:
            print(f"AWS Error in get_contract_by_id: {str(e)}")
            raise Exception(f"Failed to get contract: {str(e)}")
        except Exception as e:
            print(f"Unexpected error in get_contract_by_id: {str(e)}")
            raise

    def get_latest_contract(self, user_id: str) -> dict:
        """
        Get the latest contract from the S3 bucket for a specific user
        
        Args:
            user_id: User ID to filter contracts by (required)
            
        Returns:
            dict: Contains presigned URL and timestamp of the latest contract
            
        Raises:
            Exception: If no contracts found or if operation fails
        """
        try:
            if not user_id:
                raise Exception("user_id is required for getting latest contract")
                
            print(f"Attempting to list objects in bucket: {self.bucket_name}")
            
            # Set prefix to user's contracts folder
            prefix = f"{user_id}/contracts/"
            print(f"Using prefix: {prefix}")
            
            # List objects with the prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
            )
            
            print(f"Found {len(response.get('Contents', []))} objects with prefix")
            
            if 'Contents' not in response or not response['Contents']:
                print(f"No contracts found for user: {user_id}")
                raise Exception("No contracts found for this user")
            
            # Filter out non-PDF files and the template
            pdf_files = []
            for obj in response['Contents']:
                key = obj['Key']
                # Debug logging
                print(f"Checking object key: {key}")
                if (key.endswith('.pdf') and 
                    '/contracts/' in key and  # Must be in contracts folder
                    'VAResidentialSalesContractP1.pdf' not in key and  # Exclude template
                    'ResidentialSalesContract_' in key):  # Match our new filename format
                    pdf_files.append(obj)
                    print(f"Added to pdf_files: {key}")
            print(f"Found {len(pdf_files)} generated PDF contracts")
            
            if not pdf_files:
                print("No generated contracts found")
                # Return empty status instead of raising error
                return {
                    "status": "no_contract",
                    "message": "No contracts found for this user"
                }
            
            # Sort by last modified timestamp and get the latest
            latest_contract = max(pdf_files, key=lambda x: x['LastModified'])
            print(f"Latest contract found: {latest_contract['Key']}, Last modified: {latest_contract['LastModified']}")
            
            # Extract timestamp from the key
            # Key format: {user_id}/contracts/{timestamp}/ResidentialSalesContract.pdf
            key_parts = latest_contract['Key'].split('/')
            timestamp = key_parts[2] if len(key_parts) >= 4 else latest_contract['LastModified'].strftime("%Y-%m-%d-%H%M%S")
            
            # Generate presigned URL for the latest contract
            url = self.generate_presigned_url(latest_contract['Key'])
            print(f"Generated presigned URL for {latest_contract['Key']}")
            
            return {
                "url": url,
                "lastModified": timestamp
            }
            
        except ClientError as e:
            print(f"AWS Error in get_latest_contract: {str(e)}")
            raise Exception(f"Failed to get latest contract: {str(e)}")
        except Exception as e:
            print(f"Unexpected error in get_latest_contract: {str(e)}")
            raise
