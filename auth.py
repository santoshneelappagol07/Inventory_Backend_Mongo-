"""
auth.py
-------
Two independent checks live here:
  1. verify_jwt      -> decodes the JWT, confirms signature + expiry
  2. verify_api_key  -> compares a custom header against .env
Both are combined in verify_request(), which every protected route
depends on. If either check fails, the route function never runs.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "2"))
API_KEY = os.getenv("API_KEY")

if not JWT_SECRET_KEY or not API_KEY:
    raise RuntimeError("JWT_SECRET_KEY or API_KEY missing from .env")

# tokenUrl tells FastAPI's auto-generated /docs page where to send the
# username/password when you click the "Authorize" lock icon there.
# This has no effect on Postman -- Postman builds its own header.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def create_access_token(data: dict) -> str:
    """
    Builds the JWT. See the chat explanation for the 5-step breakdown --
    in short: copy payload -> add exp claim -> jwt.encode() does the
    Base64URL-encoding of header+payload and the HMAC-SHA256 signing.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_jwt(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Runs before every protected route. jwt.decode() checks the signature
    AND compares the "exp" claim against the current time internally --
    if the token is expired, it raises ExpiredSignatureError before this
    function can return anything, which is what we catch below.
    """
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )


def verify_api_key(x_api_key: str = Header(...)) -> None:
    """
    Reads the custom "X-API-Key" header. FastAPI maps the parameter name
    x_api_key -> the header name X-API-Key automatically (underscores
    become hyphens, and it's case-insensitive on the wire).
    """
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key.",
        )


def verify_request(
    token_payload: dict = Depends(verify_jwt),
    _: None = Depends(verify_api_key),
) -> dict:
    """
    Combined gatekeeper used on every protected route. Both Depends()
    above are evaluated first -- if either raises, this function's body
    never runs, and neither does the route behind it.
    """
    return token_payload