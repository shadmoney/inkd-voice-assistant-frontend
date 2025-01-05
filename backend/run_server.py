import uvicorn
import os
import sys

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from templates.main import app

if __name__ == "__main__":
    uvicorn.run("templates.main:app", host="0.0.0.0", port=8000, reload=True)
