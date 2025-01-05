from PyPDF2 import PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

def create_fillable_pdf(output_path):
    # Create a new PDF with form fields using ReportLab
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    
    # Add some text
    c.drawString(100, 700, "Contract Details")
    c.drawString(100, 650, "Property Address:")
    c.drawString(100, 600, "Buyer Name:")
    c.drawString(100, 550, "Seller Name:")
    c.drawString(100, 500, "Purchase Price:")
    
    c.save()
    
    # Move to the beginning of the StringIO buffer
    packet.seek(0)
    
    # Create a new PDF with form fields
    writer = PdfWriter()
    writer.add_page()
    
    # Add form fields
    writer.update_page_form_field_values(
        writer.pages[0],
        {
            "property_address": "",
            "buyer_name": "",
            "seller_name": "",
            "purchase_price": ""
        }
    )
    
    # Write the output to a file
    with open(output_path, 'wb') as output_file:
        writer.write(output_file)

if __name__ == "__main__":
    create_fillable_pdf("test_contract.pdf")
    print("Created test PDF with form fields")
