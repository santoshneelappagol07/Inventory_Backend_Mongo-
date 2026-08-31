"""
routes/auth_routes.py
----------------------
Login endpoint. Currently checks credentials against .env values
(placeholder, per the chat note) -- swapping this for a MongoDB users
collection later only means changing the check inside login(), nothing
else in the auth flow changes.
"""

import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from auth import create_access_token

load_dotenv()

router = APIRouter(tags=["Auth"])

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2PasswordRequestForm expects form-data (not JSON), with fields
    named "username" and "password". This is required for FastAPI's
    /docs "Authorize" button to work automatically.

    In Postman: set the request Body type to x-www-form-urlencoded,
    with keys "username" and "password" -- NOT raw JSON.
    """
    if form_data.username != ADMIN_USERNAME or form_data.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = create_access_token(data={"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}