from typing import Dict, Any
from pydantic import BaseModel
import pdfrw
import io

class ContractData(BaseModel):
    propertyAddress: str
    buyerName: str
    sellerName: str
    purchasePrice: str
    downPayment: str
    downPaymentPercent: str
    loanAmount: str
    financingType: str
    buyerDeposit: str
    closingDate: str
    inspectionPeriod: str
    contingencies: str
    otherTerms: str

def fill_contract(data: Dict[str, Any], template_path: str) -> bytes:
    """Fill a PDF contract with the provided data"""
    try:
        # Read the template PDF
        template = pdfrw.PdfReader(template_path)
        
        # Map data to form fields
        field_mapping = {
            'property_address': data.get('propertyAddress', ''),
            'buyer_name': data.get('buyerName', ''),
            'seller_name': data.get('sellerName', ''),
            'purchase_price': data.get('purchasePrice', ''),
            'down_payment': data.get('downPayment', ''),
            'financing_type': data.get('financingType', ''),
            'buyer_deposit': data.get('buyerDeposit', ''),
            'closing_date': data.get('closingDate', ''),
            'inspection_period': data.get('inspectionPeriod', ''),
            'contingencies': data.get('contingencies', ''),
            'other_terms': data.get('otherTerms', '')
        }
        
        # Fill form fields
        for page in template.pages:
            annotations = page['/Annots']
            if annotations:
                for annotation in annotations:
                    if annotation['/T'] and str(annotation['/T']) in field_mapping:
                        annotation.update(
                            pdfrw.PdfDict(V=pdfrw.PdfString(field_mapping[str(annotation['/T'])])))
        
        # Write to buffer
        output_buffer = io.BytesIO()
        pdfrw.PdfWriter().write(output_buffer, template)
        
        return output_buffer.getvalue()
            
    except Exception as e:
        raise Exception(f"Error filling contract: {str(e)}")
