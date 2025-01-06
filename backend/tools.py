# tools.py
from pydantic import BaseModel, Field, model_validator, field_validator
from typing import Optional, Union, Any, Dict
from datetime import date
import decimal
from decimal import Decimal
from PyPDFForm import FormWrapper
import json
from mls_mock_data import MLS_MOCK_DATA

class ContractData(BaseModel):
    """Pydantic model for contract data with matching field names"""
    offer_date: Optional[date] = Field(None, alias="Offer Date")
    buyer_name: Optional[str] = Field(None, alias="Buyer Name")
    seller_name: Optional[str] = Field(None, alias="Seller Name")
    listing_brokerage: Optional[str] = Field(None, alias="Listing Brokerage represents Seller")
    cooperating_brokerage: Optional[str] = Field(None, alias="Buyers Brokerage represents Buyer")
    tax_map_id: Optional[str] = Field(None, alias="TAX MapID")
    legal_description: Optional[str] = Field(None, alias="Legal Description Lots")
    section: Optional[str] = Field(None, alias="Section")
    subdivision: Optional[str] = Field(None, alias="Subdivision or Condominium")
    parking_spaces: Optional[str] = Field(None, alias="Parking Spaces")
    county: Optional[str] = Field(None, alias="CountyMunicipality")
    deed_book: Optional[str] = Field(None, alias="Deed BookLiber")
    page_number: Optional[str] = Field(None, alias="PageFolio")
    street_address: Optional[str] = Field(None, alias="Street Address")
    unit: Optional[str] = Field(None, alias="Unit")
    city: Optional[str] = Field(None, alias="City")
    zip_code: Optional[str] = Field(None, alias="ZIP Code")
    sales_price: Optional[Decimal] = Field(None, alias="Sales Price")
    down_payment_amount: Optional[Decimal] = Field(default=Decimal('0'), alias="Down Payment $")
    down_payment_percentage: Optional[Decimal] = Field(default=Decimal('0'), alias="Down Payment %")
    first_trust_amount: Optional[Decimal] = Field(default=Decimal('0'), alias="First Trust $")
    first_trust_percentage: Optional[Decimal] = Field(default=Decimal('0'), alias="First Trust %")
    fha_financing: bool = Field(default=False, alias="FHA Financing")
    va_financing: bool = Field(default=False, alias="VA Financing")
    conventional_financing: bool = Field(default=False, alias="Conventional Financing")
    usda_financing: bool = Field(default=False, alias="USDA Financing")
    other_financing: bool = Field(default=False, alias="Other Financing")
    other_financing_type: Optional[str] = Field(None, alias="Other Financing Type")
    second_trust_amount: Optional[Decimal] = Field(default=Decimal('0'), alias="Second Trust $")
    second_trust_percentage: Optional[Decimal] = Field(default=Decimal('0'), alias="Second Trust %")
    seller_held_amount: Optional[Decimal] = Field(default=Decimal('0'), alias="Seller Held Trust $")
    seller_held_percentage: Optional[Decimal] = Field(default=Decimal('0'), alias="Seller Held Trust %")
    total_financing_amount: Optional[Decimal] = Field(None, alias="Total Financing $")
    total_financing_percentage: Optional[Decimal] = Field(None, alias="Total Financing %")
    seller_subsidy_amount: Optional[Decimal] = Field(default=Decimal('0'), alias="Seller Subsidy $")
    seller_subsidy_percentage: Optional[Decimal] = Field(default=Decimal('0'), alias="Seller Subsidy %")
    seller_net_reduced_amount: Optional[Decimal] = Field(default=Decimal('0'), alias="Seller Net Reduced by $")
    seller_net_reduced_percentage: Optional[Decimal] = Field(default=Decimal('0'), alias="Seller Net Reduced by %")
    financing_contingent: Optional[bool] = Field(None, alias="Financing IS Contingent")

    class Config:
        populate_by_name = True
        validate_assignment = True

    def enrich_with_mls_data(self) -> 'ContractData':
        """
        Enriches the contract data with MLS data if available
        """
        if not self.street_address:
            return self
            
        mls_data = MLSService.get_property_details(self.street_address)
        if not mls_data:
            return self
            
        # Only update fields that aren't already set
        for field_name, field in self.model_fields.items():
            alias = field.alias
            if alias in mls_data and getattr(self, field_name) is None:
                value = mls_data[alias]
                if value is None:
                    continue
                    
                # Keep strings as strings
                if field.annotation == Optional[str]:
                    setattr(self, field_name, str(value))
                # Handle Decimal fields
                elif isinstance(field.annotation, type(Optional[Decimal])):
                    try:
                        value = Decimal(str(value))
                        setattr(self, field_name, value)
                    except (TypeError, decimal.InvalidOperation):
                        continue
                # Handle other types
                else:
                    setattr(self, field_name, value)
                    
        return self

    @model_validator(mode='after')
    def validate_financing(self) -> 'ContractData':
        """Validate financing rules"""
        # Skip validation if required fields are missing
        if self.sales_price is None or self.down_payment_amount is None:
            return self
            
        # Check if any financing type is selected
        has_financing = any([
            self.fha_financing,
            self.va_financing,
            self.conventional_financing,
            self.usda_financing,
            self.other_financing
        ])
        
        # All-cash offer: down payment must equal sales price
        if not has_financing and self.down_payment_amount != self.sales_price:
            raise ValueError("For all-cash offers, down payment must equal sales price")
            
        # Validate total financing if present
        if self.total_financing_amount is not None:
            total_trust = sum(filter(None, [
                self.first_trust_amount,
                self.second_trust_amount,
                self.seller_held_amount
            ]))
            if total_trust != self.total_financing_amount:
                raise ValueError("Total financing must equal sum of all trust amounts")
                
        return self

def fill_contract(data: Union[dict, str], template_path: str) -> bytes:
    """Fill contract PDF with provided data."""
    try:
        # Validate and create ContractData instance
        validated_data = ContractData.model_validate(data)
        
        # Enrich with MLS data
        validated_data = validated_data.enrich_with_mls_data()
        
        pdf_data = {
            "Offer Date": validated_data.offer_date.strftime("%m/%d/%Y") if validated_data.offer_date else "",
            "Buyer Name": validated_data.buyer_name or "",
            "Seller Name": validated_data.seller_name or "",
            "Listing Brokerage represents Seller": validated_data.listing_brokerage or "",
            "Buyers Brokerage represents Buyer": validated_data.cooperating_brokerage or "",
            "TAX MapID": validated_data.tax_map_id or "",
            "Legal Description Lots": validated_data.legal_description or "",
            "Section": validated_data.section or "",
            "Subdivision or Condominium": validated_data.subdivision or "",
            "Parking Spaces": validated_data.parking_spaces or "",
            "CountyMunicipality": validated_data.county or "",
            "Deed BookLiber": validated_data.deed_book or "",
            "PageFolio": validated_data.page_number or "",
            "Street Address": validated_data.street_address or "",
            "Unit": validated_data.unit or "",
            "City": validated_data.city or "",
            "ZIP Code": validated_data.zip_code or "",
            "Sales Price": str(validated_data.sales_price or ""),
            "Down Payment $": str(validated_data.down_payment_amount),
            "Down Payment %": str(validated_data.down_payment_percentage),
            "First Trust $": str(validated_data.first_trust_amount),
            "First Trust %": str(validated_data.first_trust_percentage),
            "FHA Financing": validated_data.fha_financing,
            "VA Financing": validated_data.va_financing,
            "Conventional Financing": validated_data.conventional_financing,
            "USDA Financing": validated_data.usda_financing,
            "Other Financing": validated_data.other_financing,
            "Other Financing Type": validated_data.other_financing_type or "",
            "Second Trust $": str(validated_data.second_trust_amount),
            "Second Trust %": str(validated_data.second_trust_percentage),
            "Seller Held Trust $": str(validated_data.seller_held_amount),
            "Seller Held Trust %": str(validated_data.seller_held_percentage),
            "Total Financing $": str(validated_data.total_financing_amount or ""),
            "Total Financing %": str(validated_data.total_financing_percentage or ""),
            "Seller Subsidy $": str(validated_data.seller_subsidy_amount),
            "Seller Subsidy %": str(validated_data.seller_subsidy_percentage),
            "Seller Net Reduced by $": str(validated_data.seller_net_reduced_amount),
            "Seller Net Reduced by %": str(validated_data.seller_net_reduced_percentage),
            "Financing IS Contingent": validated_data.financing_contingent,
            "Financing IS NOT Contingent": not validated_data.financing_contingent if validated_data.financing_contingent is not None else False,
        }
        
        filled_pdf = FormWrapper(template_path).fill(
            pdf_data,
            flatten=False
        )
        return filled_pdf.read()   
    except Exception as e:
        raise Exception(f"Error filling contract: {str(e)}")

class MLSService:
    @staticmethod
    def get_property_details(address: str) -> Optional[Dict]:
        """
        Mock MLS API call to get property details
        
        Args:
            address: The property address to look up
            
        Returns:
            Dict containing property details or None if not found
        """
        return MLS_MOCK_DATA.get(address)