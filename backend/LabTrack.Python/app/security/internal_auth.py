from fastapi import Header, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime
import hmac
import hashlib
import time
from typing import Optional
from app.core.config import settings

MAX_TIMESTAMP_DELTA_SECONDS = 300

class ServiceIdentity(BaseModel):
    service_name: str = Field(...)
    timestamp: int = Field(...)

def generate_internal_signature(service_name: str, timestamp: str, secret: Optional[str] = None) -> str:
    sec = secret or settings.INTERNAL_SERVICE_SECRET
    payload = f"{service_name}:{timestamp}".encode("utf-8")
    return hmac.new(sec.encode("utf-8"), payload, hashlib.sha256).hexdigest()

async def verify_internal_service_signature(
    x_service_name: Optional[str] = Header(None, alias="X-Service-Name"),
    x_timestamp: Optional[str] = Header(None, alias="X-Timestamp"),
    x_signature: Optional[str] = Header(None, alias="X-Signature")
) -> ServiceIdentity:
    if not x_service_name or not x_timestamp or not x_signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing required internal service authentication headers.")
    try:
        req_timestamp = int(x_timestamp)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid timestamp header format.")
    delta = min(abs(int(time.time()) - req_timestamp), abs(int(datetime.utcnow().timestamp()) - req_timestamp))
    if delta > MAX_TIMESTAMP_DELTA_SECONDS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Request timestamp has expired.")
    expected_signature = generate_internal_signature(x_service_name, x_timestamp, settings.INTERNAL_SERVICE_SECRET)
    if not hmac.compare_digest(expected_signature, x_signature):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid inter-service HMAC signature.")
    return ServiceIdentity(service_name=x_service_name, timestamp=req_timestamp)
