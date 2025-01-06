import pdfrw

def print_pdf_fields(pdf_path):
    """Print all form fields in a PDF"""
    template = pdfrw.PdfReader(pdf_path)
    
    print("\nForm Fields:")
    for page in template.pages:
        annotations = page['/Annots']
        if annotations:
            for annotation in annotations:
                if annotation['/T']:
                    print(f"- {annotation['/T']}")

if __name__ == "__main__":
    pdf_path = "VAResidential Sales Contract-p1.pdf"
    print_pdf_fields(pdf_path)
