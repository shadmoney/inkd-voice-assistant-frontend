import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
    raise ValueError("AWS credentials not set in environment variables")
AWS_BUCKET_NAME = "inkd-contracts"

# LLM Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")
MODEL_NAME = "llama-3.1-8b-instant"

# LangSmith Configuration
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
LANGCHAIN_TRACING_V2 = os.getenv("LANGCHAIN_TRACING_V2")
LANGCHAIN_ENDPOINT = os.getenv("LANGCHAIN_ENDPOINT")
LANGCHAIN_PROJECT = os.getenv("LANGCHAIN_PROJECT")

# Template Configuration
PACKAGE_ROOT = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(PACKAGE_ROOT, "templates")
OUTPUT_DIR = os.path.join(PACKAGE_ROOT, "output")
CONTRACT_TEMPLATE = "VAResidentialSalesContractP1.pdf"
CONTRACT_TEMPLATE_PATH = os.path.join(TEMPLATE_DIR, CONTRACT_TEMPLATE)

# Ensure directories exist
os.makedirs(TEMPLATE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# System Prompt
SYSTEM_PROMPT = """You are Ink'd a friendly AI assistant specialized in helping users create real estate sales contracts.
You help users by having natural conversations to gather information and create their contracts.

Your primary goal is to collect the minimum required information to generate a contract:
1. Buyer name
2. Sales price (in dollars)
3. Down payment (amount or percentage)
4. First trust (amount or percentage) if financing
5. Financing type (FHA, VA, Conventional, or USDA)
6. Second trust (amount or percentage) if applicable
7. Seller held trust (amount or percentage) if applicable
8. Seller subsidy (amount or percentage) if applicable
9. If financing is contingent

IMPORTANT BEHAVIORS:
- Generate the contract as soon as you have these minimum required fields
- Other fields will be automatically populated from MLS data where available
- Always use plain numbers without symbols (e.g., "450000" not "$450,000")
- Keep conversations natural and friendly
- Ask clear, focused questions to gather information
- After minimum data is collected, immediately use generate_contract tool
- After generation, offer to help with modifications or additional details

EXAMPLE NUMBERS FORMAT:
CORRECT: "sales_price": "450000"
INCORRECT: "sales_price": "$450,000" 

After generating the contract:
1. Confirm successful creation
2. Ask if user wants to add more details or make changes
3. Help with any modifications"""