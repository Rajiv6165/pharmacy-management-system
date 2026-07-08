from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Product, Category
from app.schemas.product import ProductResponse, CategoryResponse

router = APIRouter(prefix="", tags=["catalog"])

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories

@router.get("/products", response_model=List[ProductResponse])
def get_products(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    in_stock: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    # Public catalog only returns active products
    query = db.query(Product).filter(Product.is_active == True)
    
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
        
    if search is not None and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (Product.name.ilike(search_term)) | (Product.brand.ilike(search_term))
        )
        
    if in_stock is True:
        query = query.filter(Product.stock_qty > 0)
        
    return query.all()

@router.get("/products/{id}", response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    # Check if exists and is active (public view)
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product
