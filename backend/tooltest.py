import pytest
from decimal import Decimal
from datetime import date
from pydantic import ValidationError
from tools import ContractData, fill_contract, MLSService
from main import generate_contract
from mls_mock_data import MLS_MOCK_DATA
from s3_utils import S3Utils
import json
import os
import sys
from urllib.parse import urlparse
import requests
import uuid

def test_contract_data_basic_validation():
    """Test basic contract data validation with field aliases"""
    data = {
        "Offer Date": date(2025, 1, 4),
        "Buyer Name": "John Doe",
        "Seller Name": "Jane Smith",
        "Street Address": "456 Oak Ave",
        "City": "Example City",
        "ZIP Code": "12345",
        "Sales Price": Decimal("500000"),
        "Down Payment $": Decimal("100000"),
        "Down Payment %": Decimal("20"),
        "First Trust $": Decimal("400000"),
        "First Trust %": Decimal("80"),
        "Conventional Financing": True,
        "Financing IS Contingent": True
    }
    
    contract = ContractData.model_validate(data)
    assert contract.buyer_name == "John Doe"
    assert contract.sales_price == Decimal("500000")
    assert contract.conventional_financing is True

def test_contract_data_financing_validation():
    """Test financing validation rules with model validator"""
    # Test case: No financing selected, down payment must equal sales price
    with pytest.raises(ValidationError) as exc_info:
        ContractData.model_validate({
            "Sales Price": Decimal("500000"),
            "Down Payment $": Decimal("100000"),
            "Down Payment %": Decimal("20"),
            "FHA Financing": False,
            "VA Financing": False,
            "Conventional Financing": False,
            "USDA Financing": False,
            "Other Financing": False
        })
    assert "down payment must equal sales price" in str(exc_info.value)
    
    # Test case: Valid all-cash offer
    contract = ContractData.model_validate({
        "Sales Price": Decimal("500000"),
        "Down Payment $": Decimal("500000"),
        "Down Payment %": Decimal("100"),
        "FHA Financing": False,
        "VA Financing": False,
        "Conventional Financing": False,
        "USDA Financing": False,
        "Other Financing": False
    })
    assert contract.down_payment_amount == contract.sales_price

def test_contract_data_financing_amounts():
    """Test financing amount calculations with model validator"""
    # Test case: Total financing must equal sum of trusts
    with pytest.raises(ValidationError) as exc_info:
        ContractData.model_validate({
            "Sales Price": Decimal("500000"),
            "Down Payment $": Decimal("100000"),
            "First Trust $": Decimal("300000"),
            "Second Trust $": Decimal("50000"),
            "Seller Held Trust $": Decimal("25000"),
            "Total Financing $": Decimal("400000"),  # Should be 375000
            "Conventional Financing": True
        })
    assert "Total financing must equal sum of all trust amounts" in str(exc_info.value)
    
    # Test case: Valid financing amounts
    contract = ContractData.model_validate({
        "Sales Price": Decimal("500000"),
        "Down Payment $": Decimal("125000"),
        "First Trust $": Decimal("300000"),
        "Second Trust $": Decimal("50000"),
        "Seller Held Trust $": Decimal("25000"),
        "Total Financing $": Decimal("375000"),
        "Conventional Financing": True
    })
    assert contract.total_financing_amount == (
        contract.first_trust_amount +
        contract.second_trust_amount +
        contract.seller_held_amount
    )

def test_contract_data_default_values():
    """Test default values and None conversion for amount fields"""
    contract = ContractData.model_validate({
        "Sales Price": Decimal("500000"),
        "Down Payment $": Decimal("500000")  # All cash offer
    })
    assert contract.seller_subsidy_amount == Decimal("0")
    assert contract.seller_subsidy_percentage == Decimal("0")
    assert contract.second_trust_amount == Decimal("0")
    assert contract.seller_held_amount == Decimal("0")
    assert contract.fha_financing is False

def test_contract_data_full_example():
    """Test a complete contract data example with all fields"""
    data = {
        "Offer Date": date(2025, 1, 4),
        "Buyer Name": "John Doe",
        "Seller Name": "Jane Smith",
        "Listing Brokerage represents Seller": "ABC Realty",
        "Buyers Brokerage represents Buyer": "XYZ Homes",
        "TAX MapID": "12345",
        "Legal Description Lots": "Lot 1, Block A",
        "Section": "Northwest",
        "Subdivision or Condominium": "Main Heights",
        "Parking Spaces": "2",
        "CountyMunicipality": "Example County",
        "Deed BookLiber": "1234",
        "PageFolio": "56",
        "Street Address": "123 Main Street",
        "Unit": "",
        "City": "Example City",
        "ZIP Code": "12345",
        "Sales Price": Decimal("500000"),
        "Down Payment $": Decimal("100000"),
        "Down Payment %": Decimal("20"),
        "First Trust $": Decimal("400000"),
        "First Trust %": Decimal("80"),
        "Conventional Financing": True,
        "Total Financing $": Decimal("400000"),
        "Total Financing %": Decimal("80"),
        "Seller Subsidy $": Decimal("5000"),
        "Seller Subsidy %": Decimal("1"),
        "Seller Net Reduced by $": Decimal("5000"),
        "Seller Net Reduced by %": Decimal("1"),
        "Financing IS Contingent": True,
        "Other Financing Type": None
    }
    
    contract = ContractData.model_validate(data)
    assert contract.sales_price == Decimal("500000")
    assert contract.total_financing_amount == contract.first_trust_amount
    assert contract.conventional_financing is True
    assert contract.financing_contingent is True

def test_contract_data_mls_enrichment():
    """Test MLS data enrichment functionality"""
    # Test with address that exists in MLS
    contract = ContractData.model_validate({
        "Street Address": "123 Main Street",
        "Sales Price": Decimal("500000"),
        "Down Payment $": Decimal("500000")  # All cash offer
    })
    
    enriched = contract.enrich_with_mls_data()
    assert enriched.seller_name == "Skyline Properties"
    assert enriched.listing_brokerage == "Premier Realty"
    assert enriched.tax_map_id == "23-4567-890"
    
    # Test with address that doesn't exist in MLS
    contract = ContractData.model_validate({
        "Street Address": "999 Nonexistent St",
        "Sales Price": Decimal("500000"),
        "Down Payment $": Decimal("500000")  # All cash offer
    })
    
    enriched = contract.enrich_with_mls_data()
    assert enriched.seller_name is None
    assert enriched.tax_map_id is None

def test_contract_data_json_serialization():
    """Test JSON serialization and deserialization"""
    data = {
        "Offer Date": "2025-01-04",
        "Buyer Name": "John Doe",
        "Sales Price": "500000",
        "Down Payment $": "500000",  # All cash offer
        "Conventional Financing": False
    }
    
    # Test JSON string input
    json_str = json.dumps(data)
    contract = ContractData.model_validate_json(json_str)
    assert contract.buyer_name == "John Doe"
    assert contract.sales_price == Decimal("500000")


def test_fill_and_save_contract():
    """Test contract PDF filling and saving to file"""
    # Use current time in filename to avoid conflicts
    timestamp = "2025-01-05-185752"
    output_path = f"test_output/contract_{timestamp}.pdf"
    
    data = {
        "Offer Date": date(2025, 1, 4),
        "Buyer Name": "John Doe",
        "Seller Name": "Jane Smith",
        "Street Address": "123 Main Street",
        "Sales Price": Decimal("500000"),
        "Down Payment $": Decimal("100000"),
        "First Trust $": Decimal("400000"),
        "Conventional Financing": True,
        "Total Financing $": Decimal("400000"),
        "Seller Subsidy $": Decimal("5000"),
        "Financing IS Contingent": True
    }
    
    contract = ContractData.model_validate(data)
    template_path = "templates/VAResidentialSalesContractP1.pdf"
    filled_pdf = fill_contract(contract, template_path)
    
    # Save the filled PDF
    with open(output_path, "wb") as f:
        f.write(filled_pdf)
    
    # Verify the file was created and has content
    assert os.path.exists(output_path)
    assert os.path.getsize(output_path) > 0


def test_generate_contract():
    """Test contract generation through the assistant's generate_contract function"""
    # Initialize S3 utils
    s3_utils = S3Utils()
    
    # Test data matching the format expected by generate_contract
    contract_data = {
        "sales_price": "500000",
        "down_payment_amount": "100000",
        "buyer_name": "John Doe",
        "street_address": "123 Main Street",
        "conventional_financing": True,
        "financing_contingent": True
    }
    
    # Save contract locally first
    local_path = os.path.join("test_output", f"contract_test_{uuid.uuid4().hex[:8]}.pdf")
    os.makedirs("test_output", exist_ok=True)
    
    # Generate contract using fill_contract directly
    contract = ContractData.model_validate(contract_data)
    template_path = "templates/VAResidentialSalesContractP1.pdf"
    filled_pdf = fill_contract(contract, template_path)
    
    # Save locally
    with open(local_path, "wb") as f:
        f.write(filled_pdf)
    
    # Verify local file
    assert os.path.exists(local_path)
    assert os.path.getsize(local_path) > 0
    
    # Now upload to S3 using generate_contract
    result = generate_contract.invoke(contract_data)
    
    # Verify success message
    assert "Contract generated successfully" in result
    
    # Extract the S3 URL from the success message
    s3_url = result.split(": ")[1]
    
    # Parse the S3 URL to get the key
    parsed_url = urlparse(s3_url)
    key = parsed_url.path.lstrip('/')
    
    try:
        # Generate a presigned URL to download the file
        presigned_url = s3_utils.generate_presigned_url(key)
        assert presigned_url is not None, "Failed to generate presigned URL for S3 file"
        
        # Download the file using the presigned URL
        response = requests.get(presigned_url)
        assert response.status_code == 200, "Failed to download file from S3"
        
        # Save the PDF temporarily to verify its contents
        temp_pdf_path = "test_output/temp_test.pdf"
        os.makedirs(os.path.dirname(temp_pdf_path), exist_ok=True)
        with open(temp_pdf_path, "wb") as f:
            f.write(response.content)
            
        # Verify the file exists and has content
        assert os.path.exists(temp_pdf_path)
        assert os.path.getsize(temp_pdf_path) > 0
        
        # Clean up the temporary files
        os.remove(temp_pdf_path)
        os.remove(local_path)
        
    except Exception as e:
        pytest.fail(f"Failed to verify contract in S3: {str(e)}")

if __name__ == "__main__":
    # Read contract data from stdin
    try:
        contract_data = json.load(sys.stdin)
        print("Received contract data:", contract_data)
        
        # Extract user_id from the input data
        user_id = contract_data.pop("user_id", None)
        print("User ID:", user_id)
        
        # Convert the data to the format expected by ContractData
        formatted_data = {
            "Sales Price": contract_data["sales_price"],
            "Down Payment $": contract_data["down_payment_amount"],
            "Buyer Name": contract_data["buyer_name"],
            "Street Address": contract_data["street_address"],
            "Conventional Financing": contract_data["conventional_financing"],
            "Financing IS Contingent": contract_data["financing_contingent"]
        }
        
        # Generate contract
        contract = ContractData.model_validate(formatted_data)
        template_path = "templates/VAResidentialSalesContractP1.pdf"
        filled_pdf = fill_contract(contract, template_path)
        
        # Save locally first
        timestamp = date.today().strftime("%Y-%m-%d-%H%M%S")
        local_path = os.path.join("output", f"contract_{timestamp}.pdf")
        os.makedirs("output", exist_ok=True)
        
        with open(local_path, "wb") as f:
            f.write(filled_pdf)
            
        # Upload to S3 with user_id for folder organization
        s3 = S3Utils()
        s3_url = s3.upload_file(filled_pdf, f"contract_{timestamp}.pdf", user_id)
        
        print("Contract generated successfully")
        sys.exit(0)
        
    except Exception as e:
        print(f"Error generating contract: {str(e)}", file=sys.stderr)
        sys.exit(1)
