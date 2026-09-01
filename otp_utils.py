"""
otp_utils.py
------------
Generates one-time passcodes, emails them via Gmail SMTP, and verifies
them against an in-memory store with expiry. In-memory storage is fine
here since there's a single admin user and no persistence requirement
across server restarts -- with multiple real users, this would move to
a MongoDB collection (keyed by user id) instead of a plain dict.
"""

import os
import random
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", "25"))

if not SMTP_USERNAME or not SMTP_PASSWORD or not ADMIN_EMAIL:
    raise RuntimeError("SMTP_USERNAME, SMTP_PASSWORD, or ADMIN_EMAIL missing from .env")

# In-memory OTP store: { username: {"otp": "123456", "expires_at": datetime} }
# Resets to empty on every server restart -- acceptable for a single
# hardcoded admin user, not something you'd rely on with real users.
_otp_store: dict = {}


def generate_otp() -> str:
    """Random 6-digit numeric code, zero-padded (e.g. '004821')."""
    return f"{random.randint(0, 999999):06d}"


def send_otp_email(otp: str) -> None:
    """
    Sends the OTP via Gmail SMTP over TLS (port 587).
    Requires a Gmail App Password in SMTP_PASSWORD -- your normal Gmail
    account password will NOT work here. Gmail blocks plain-password
    SMTP logins from apps by default; an App Password is a separate
    16-character credential generated specifically for this purpose,
    which requires 2-Step Verification to be enabled on the Google
    account first.
    """
    message = MIMEText(
        f"Your one-time verification code is: {otp}\n"
        f"It expires in {OTP_EXPIRE_MINUTES} minute(s)."
    )
    message["Subject"] = "Your OTP Code"
    message["From"] = SMTP_FROM_EMAIL
    message["To"] = ADMIN_EMAIL

    # Port 587 uses starttls() to upgrade a plain connection to an
    # encrypted one -- this is Gmail's standard submission port.
    # (Port 465 would use smtplib.SMTP_SSL instead, encrypted from the start.)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, ADMIN_EMAIL, message.as_string())


def create_and_send_otp(username: str) -> None:
    """Generates a fresh OTP, stores it with an expiry, and emails it."""
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)
    _otp_store[username] = {"otp": otp, "expires_at": expires_at}
    send_otp_email(otp)


def verify_otp(username: str, otp: str) -> bool:
    """
    Checks the submitted OTP against the stored one. Returns True only
    if a record exists, the code matches exactly, and it hasn't expired.

    The record is popped (removed) either way -- this makes OTPs
    single-use: a correct code can't be replayed on a second request,
    and a stale/expired entry gets cleaned up instead of lingering.
    """
    record = _otp_store.pop(username, None)
    if record is None:
        return False
    if datetime.now(timezone.utc) > record["expires_at"]:
        return False
    return record["otp"] == otp