"""
routes/auth_routes.py
----------------------
Two-step login flow:
  1. POST /login       -> checks username/password, emails an OTP,
                           returns a message ONLY -- no token yet.
  2. POST /verify-otp  -> checks the OTP; only on success is the
                           JWT actually created and returned.

Splitting these into two endpoints (rather than one that does both)
is what makes this a genuine two-factor flow: possessing the password
alone is no longer enough to get a token.
"""

import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from auth import create_access_token
from models import OTPVerifyRequest
from otp_utils import create_and_send_otp, verify_otp

load_dotenv()

router = APIRouter(tags=["Auth"])

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Step 1. Body: x-www-form-urlencoded, keys "username"/"password"
    (unchanged from before). On correct credentials, this now emails
    an OTP instead of returning a token directly.
    """
    if form_data.username != ADMIN_USERNAME or form_data.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    create_and_send_otp(form_data.username)
    return {"message": "OTP sent to the registered email. Call /verify-otp to complete login."}


@router.post("/verify-otp")
async def verify_otp_route(payload: OTPVerifyRequest):
    """
    Step 2. Body: raw JSON -- e.g. {"username": "admin", "otp": "123456"}.
    Note this is JSON, NOT form-urlencoded like /login -- there's no
    OAuth2-spec requirement here, so we use a normal Pydantic model.
    Only a correct, non-expired OTP results in a JWT being issued.
    """
    if not verify_otp(payload.username, payload.otp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )

    token = create_access_token(data={"sub": payload.username})
    return {"access_token": token, "token_type": "bearer"}