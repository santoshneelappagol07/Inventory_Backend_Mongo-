from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class StatusEnum(str, Enum):
    """
    Enum = a fixed, closed set of allowed values. Inheriting from `str`
    as well as `Enum` means it behaves like a string for JSON serialization
    but Pydantic still rejects any value outside these three.
    """
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
    DISCONTINUED = "discontinued"


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0, description="Must be greater than 0")
    quantity_in_stock: int = Field(..., ge=0, description="Cannot be negative")
    is_active: bool = True
    tags: List[str] = Field(default_factory=list)
    # enum (closed set of strings)
    status: StatusEnum = StatusEnum.IN_STOCK


class ProductCreate(ProductBase):
    """Used for POST. Note: no `added_on` here — the server sets that,
    not the client, so it's not something the user can fake or omit."""
    pass


class ProductReplace(ProductBase):
    """Used for PUT. Same required fields as create — a PUT is meant to
    fully replace the resource, so partial data isn't allowed here."""
    pass


class ProductUpdate(BaseModel):
    """
    Used for PATCH. Every field is Optional, defaulting to None.
    In the route handler, we only apply fields that are NOT None —
    that's what makes this a *partial* update instead of overwriting
    everything with defaults.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    status: Optional[StatusEnum] = None
    # Relative stock adjustment, e.g. -3 to sell 3 units, +10 to restock.
    # This is separate from quantity_in_stock (a direct overwrite) so both
    # update styles are supported — see the design note in chat.
    quantity_delta: Optional[int] = None


class ProductOut(ProductBase):
    """Used for responses. Includes the Mongo-generated id and timestamp,
    which the client never sends but always receives back."""
    id: str
    # datetime
    added_on: datetime

    class Config:
        # Allows this model to be built directly from a dict with extra
        # Mongo fields (like _id) without raising validation errors.
        populate_by_name = True