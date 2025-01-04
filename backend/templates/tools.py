from typing import Dict, Any, List, Optional
from langchain_core.tools import tool
from pydantic import BaseModel, Field
import json
from datetime import datetime

class PropertyInfo(BaseModel):
    """Property information from MLS"""
    seller_email: str
    seller_name: str
    tax_id: str
    legal_description: str
    section: str
    subdivision: str
    parking: str
    county: str
    deed_book: str
    page: str
    unit: Optional[str]
    city: str
    zip: str
    utilities: List[str]
    fixtures: List[str]

class ContractInfo(BaseModel):
    """Contract information provided by user"""
    property_address: str
    offer_price: float
    down_payment: float
    financing_type: str
    financing_amount: float
    buyer_deposit: float
    seller_subsidy: bool = False
    financing_contingency: bool = False
    appraisal_contingency: bool = False

class MLSData:
    """Mock MLS data storage"""
    data = {
        "123 Main St": {
            "seller_email": "agent@test.com",
            "seller_name": "John Doe",
            "tax_id": "12345",
            "legal_description": "Lot 1, Block A",
            "section": "Northwest",
            "subdivision": "Main Heights",
            "parking": "2 Car Garage",
            "county": "Example County",
            "deed_book": "1234",
            "page": "56",
            "unit": None,
            "city": "Example City",
            "zip": "12345",
            "utilities": ["Water", "Electric", "Gas"],
            "fixtures": ["Dishwasher", "Range", "Refrigerator"]
        }
    }

    @classmethod
    def get_property_info(cls, address: str) -> Optional[PropertyInfo]:
        """Get property information from MLS"""
        if data := cls.data.get(address):
            return PropertyInfo(**data)
        return None

def validate_contract_info(info: Dict[str, Any]) -> ContractInfo:
    """Validate contract information"""
    return ContractInfo(**info)

@tool
def generate_sales_contract(contract_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a sales contract with all required information.
    Handles MLS data fetching and contract generation in one step.
    
    Args:
        contract_info: Dictionary containing contract information
            - property_address: str
            - offer_price: float
            - down_payment: float
            - financing_type: str
            - financing_amount: float
            - buyer_deposit: float
            - seller_subsidy: bool
            - financing_contingency: bool
            - appraisal_contingency: bool
    
    Returns:
        Dictionary containing:
            - status: "success" or "error"
            - contract_path: path to generated contract (if successful)
            - message: success or error message
            - metadata: additional information (if successful)
    """
    try:
        # Validate contract information
        validated_info = validate_contract_info(contract_info)
        
        # Get MLS data
        property_data = MLSData.get_property_info(validated_info.property_address)
        if not property_data:
            return {
                "status": "error",
                "message": f"Property not found: {validated_info.property_address}"
            }
        
        # Combine all data
        complete_data = {
            **validated_info.dict(),
            **property_data.dict(),
            "generation_date": datetime.now().isoformat()
        }
        
        # Generate contract path
        safe_address = validated_info.property_address.replace(' ', '_')
        contract_path = f"contracts/{safe_address}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # In prototype, just return success
        # In production, this would generate actual PDF using template
        return {
            "status": "success",
            "contract_path": contract_path,
            "message": "Contract generated successfully",
            "metadata": {
                "generation_time": datetime.now().isoformat(),
                "contract_type": "sales",
                "property_address": validated_info.property_address,
                "offer_amount": validated_info.offer_price
            }
        }
        
    except ValueError as e:
        return {
            "status": "error",
            "message": f"Invalid contract information: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }