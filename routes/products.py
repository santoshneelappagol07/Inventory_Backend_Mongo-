from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import verify_request
from database import product_collection
from models import ProductCreate, ProductReplace, ProductUpdate, ProductOut, StatusEnum

# APIRouter lets us define routes in this file and plug them into the main
# app later, instead of needing a single global `app` object everywhere.
router = APIRouter(tags=["Products"], dependencies=[Depends(verify_request)])


def product_helper(doc: dict) -> dict:
    """Converts a raw MongoDB document into a dict that matches ProductOut.
    Mongo's _id is an ObjectId, not a string, so FastAPI/Pydantic can't
    serialize it directly to JSON — we convert it here."""
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


def to_object_id(product_id: str) -> ObjectId:
    """Validates and converts a string id into an ObjectId, or raises a
    clean 400 error instead of letting an ugly Mongo error bubble up."""
    try:
        return ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product id")


# ---------- POST: create ----------
@router.post("/products/create_product/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(product: ProductCreate):
    doc = product.model_dump()
    doc["added_on"] = datetime.now(timezone.utc)  # server sets this, not the client
    result = await product_collection.insert_one(doc)
    new_doc = await product_collection.find_one({"_id": result.inserted_id})
    return product_helper(new_doc)




# ---------- GET: list all (with optional filters) ----------
@router.get("/products/all_products", response_model=List[ProductOut])
async def list_products(
    status_filter: Optional[StatusEnum] = Query(None, alias="status"),
    tag: Optional[str] = Query(None, description="Filter by a single tag"),
):
    query = {}
    if status_filter:
        query["status"] = status_filter.value
    if tag:
        query["tags"] = tag  # Mongo matches this against any element in the array

    docs = await product_collection.find(query).to_list(length=None)
    return [product_helper(doc) for doc in docs]


# ---------- GET: single product by id ----------
@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    obj_id = to_object_id(product_id)
    doc = await product_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product_helper(doc)


# ---------- PUT: full replace ----------
@router.put("/update_all/{product_id}", response_model=ProductOut)
async def replace_product(product_id: str, product: ProductReplace):
    obj_id = to_object_id(product_id)
    existing = await product_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    doc = product.model_dump()
    doc["added_on"] = existing["added_on"]  # a PUT replaces the content, not the creation date
    await product_collection.replace_one({"_id": obj_id}, doc)
    updated = await product_collection.find_one({"_id": obj_id})
    return product_helper(updated)


# ---------- PATCH: partial update ----------
@router.patch("/update_partial/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, product: ProductUpdate):
    obj_id = to_object_id(product_id)
    existing = await product_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # exclude_unset=True means fields the client never sent are dropped
    # entirely, not included as None — that's the core of a partial update.
    update_data = product.model_dump(exclude_unset=True)

    # quantity_delta is a relative adjustment, not a field that exists on
    # the document itself, so pull it out and apply it separately.
    delta = update_data.pop("quantity_delta", None)
    if delta is not None:
        new_qty = existing["quantity_in_stock"] + delta
        if new_qty < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"quantity_delta would drop stock below 0 (current: {existing['quantity_in_stock']})",
            )
        update_data["quantity_in_stock"] = new_qty

    if update_data:
        await product_collection.update_one({"_id": obj_id}, {"$set": update_data})

    updated = await product_collection.find_one({"_id": obj_id})
    return product_helper(updated)


# ---------- DELETE ----------
@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str):
    obj_id = to_object_id(product_id)
    result = await product_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    # 204 responses must not return a body — FastAPI enforces this for us.