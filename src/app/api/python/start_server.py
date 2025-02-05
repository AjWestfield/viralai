import uvicorn
import os
import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    try:
        # Add the project root to Python path
        project_root = Path(__file__).parent.parent.parent.parent
        sys.path.append(str(project_root))
        
        # Download required models if not present
        from app.api.python.download_models import main as download_models
        download_models()
        
        # Start the FastAPI server
        logger.info("Starting FastAPI server...")
        uvicorn.run(
            "app.api.python.video-analysis.route:app",
            host="0.0.0.0",
            port=8001,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 