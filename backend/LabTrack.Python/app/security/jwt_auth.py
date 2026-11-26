from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import time
from jose import jwt, JWTError
from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

class TokenPayload(BaseModel):
    sub: str = Field(...)
    email: Optional[str] = Field(None)
    role: Optional[str] = Field(None)
    roles: List[str] = Field(default_factory=list)
    exp: int = Field(...)
    iss: Optional[str] = Field(None)
    aud: Optional[str] = Field(None)

class SecurityConfig(BaseModel):
    secret_key: str = Field(default_factory=lambda: settings.JWT_SECRET_KEY)
    algorithm: str = Field("HS256")
    issuer: str = Field("LabTrack.API")
    audience: str = Field("LabTrack.Services")

async def verify_jwt_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    token: Optional[str] = None,
    config: Optional[SecurityConfig] = None
) -> TokenPayload:
    cfg = config or SecurityConfig()
    raw_token = token or (credentials.credentials if isinstance(credentials, HTTPAuthorizationCredentials) else None)
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication credentials were not provided.", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload_dict = jwt.decode(raw_token, cfg.secret_key, algorithms=[cfg.algorithm], options={"verify_exp": False, "verify_aud": False, "verify_iss": False})
        exp_val = int(payload_dict.get("exp", 0))
        iat_val = int(payload_dict.get("iat", 0))
        now_naive = int(datetime.utcnow().timestamp())
        now_epoch = int(time.time())
        ref_now = now_naive if (iat_val and abs(iat_val - now_naive) < abs(iat_val - now_epoch)) else now_epoch
        if exp_val < ref_now:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.", headers={"WWW-Authenticate": "Bearer"})
        roles_claim = payload_dict.get("roles") or payload_dict.get("role") or payload_dict.get("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", [])
        roles_list = [roles_claim] if isinstance(roles_claim, str) else (roles_claim if isinstance(roles_claim, list) else [])
        primary_role = roles_list[0] if roles_list else None
        return TokenPayload(sub=payload_dict.get("sub", ""), email=payload_dict.get("email"), role=primary_role, roles=roles_list, exp=exp_val, iss=payload_dict.get("iss"), aud=payload_dict.get("aud"))
    except HTTPException:
        raise
    except JWTError as err:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid authentication token: {err}", headers={"WWW-Authenticate": "Bearer"})

__all__ = ["TokenPayload", "SecurityConfig", "verify_jwt_token"]
