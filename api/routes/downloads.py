"""
File download system for Agent Resources
Secure file serving with purchase verification
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlmodel import select
from typing import Optional
from datetime import datetime
import os
import mimetypes

from core.config import settings
from core.database import get_session
from models import User, Product, Transaction, Listing
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/downloads", tags=["Downloads"])

# Upload directory from environment or default
# Note: In production, this should be a persistent volume mount
# For Railway, add a volume mounted at /app/uploads
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/uploads")


def get_file_metadata(file_path: str):
    """Get file metadata for serving"""
    if not os.path.exists(file_path):
        return None
    
    stat = os.stat(file_path)
    return {
        "size": stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime),
        "mime_type": mimetypes.guess_type(file_path)[0] or "application/octet-stream"
    }


@router.get("/purchases/{product_id}")
async def download_purchased_file(
    product_id: str,
    request: Request,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """
    Download a file for a purchased product.
    Verifies the user has purchased the product before serving the file.
    """
    # Get product
    product = session.exec(
        select(Product).where(Product.id == product_id)
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user has purchased this product
    transaction = session.exec(
        select(Transaction).where(
            Transaction.buyer_id == current_user.id,
            Transaction.product_id == product.id,
            Transaction.status == "completed"
        )
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=403, 
            detail="You have not purchased this product"
        )
    
    # Get the listing to find the file path
    listing = session.exec(
        select(Listing).where(Listing.product_id == product.id)
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Determine file path
    file_path = listing.file_path
    
    # If file_path is relative, make it absolute
    if not file_path.startswith("/"):
        file_path = os.path.join(UPLOAD_DIR, file_path)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404, 
            detail="File not found on server"
        )
    
    # Get file metadata
    metadata = get_file_metadata(file_path)
    if not metadata:
        raise HTTPException(status_code=404, detail="Could not read file")
    
    # Update download count
    product.download_count += 1
    session.commit()
    
    # Serve file with proper headers
    filename = os.path.basename(file_path)
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=metadata["mime_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Product-Name": product.name,
            "X-Download-Count": str(product.download_count)
        }
    )


@router.get("/purchases/{product_id}/info")
async def get_download_info(
    product_id: str,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """
    Get download information for a purchased product.
    Returns file metadata without serving the actual file.
    """
    # Get product
    product = session.exec(
        select(Product).where(Product.id == product_id)
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user has purchased this product
    transaction = session.exec(
        select(Transaction).where(
            Transaction.buyer_id == current_user.id,
            Transaction.product_id == product.id,
            Transaction.status == "completed"
        )
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=403, 
            detail="You have not purchased this product"
        )
    
    # Get the listing
    listing = session.exec(
        select(Listing).where(Listing.product_id == product.id)
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Determine file path
    file_path = listing.file_path
    if not file_path.startswith("/"):
        file_path = os.path.join(UPLOAD_DIR, file_path)
    
    # Check if file exists
    file_exists = os.path.exists(file_path)
    
    metadata = None
    if file_exists:
        metadata = get_file_metadata(file_path)
    
    return {
        "product_id": str(product.id),
        "product_name": product.name,
        "purchased_at": transaction.created_at.isoformat() if transaction else None,
        "download_count": product.download_count,
        "file_exists": file_exists,
        "file_name": os.path.basename(file_path) if file_exists else None,
        "file_size": metadata["size"] if metadata else None,
        "file_size_formatted": format_file_size(metadata["size"]) if metadata else None,
        "mime_type": metadata["mime_type"] if metadata else None
    }


@router.get("/my-purchases")
async def get_my_purchases(
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """
    Get all purchases for the current user with download availability.
    """
    transactions = session.exec(
        select(Transaction, Product)
        .join(Product)
        .where(
            Transaction.buyer_id == current_user.id,
            Transaction.status == "completed"
        )
        .order_by(Transaction.created_at.desc())
    ).all()
    
    purchases = []
    for transaction, product in transactions:
        # Get listing for file info
        listing = session.exec(
            select(Listing).where(Listing.product_id == product.id)
        ).first()
        
        file_available = False
        file_name = None
        file_size = None
        
        if listing and listing.file_path:
            file_path = listing.file_path
            if not file_path.startswith("/"):
                file_path = os.path.join(UPLOAD_DIR, file_path)
            
            if os.path.exists(file_path):
                file_available = True
                file_name = os.path.basename(file_path)
                metadata = get_file_metadata(file_path)
                if metadata:
                    file_size = format_file_size(metadata["size"])
        
        purchases.append({
            "transaction_id": str(transaction.id),
            "product_id": str(product.id),
            "product_name": product.name,
            "product_slug": product.slug,
            "purchased_at": transaction.created_at.isoformat(),
            "amount_paid_cents": transaction.amount_cents,
            "download_available": file_available,
            "file_name": file_name,
            "file_size": file_size,
            "download_url": f"/downloads/purchases/{product.id}" if file_available else None
        })
    
    return {"purchases": purchases}


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"
