"""
Auth Validation Middleware - Phase 1
Middleware untuk validasi autentikasi API key atau JWT token.
Di Phase 1 bersifat opsional (REQUIRE_AUTH=False).
"""

from fastapi import Header, HTTPException, Depends
from typing import Optional
from .config import API_KEY_HEADER, REQUIRE_AUTH


async def verify_token(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias=API_KEY_HEADER)
) -> bool:
    """
    Verifikasi token autentikasi.
    
    Args:
        authorization: Header Authorization (Bearer token).
        x_api_key: Header X-API-Key.
    
    Returns:
        True jika autentikasi valid atau tidak diperlukan.
    
    Raises:
        HTTPException 401 jika autentikasi diperlukan tetapi tidak valid.
    """
    # Jika auth tidak diwajibkan, langsung return True
    if not REQUIRE_AUTH:
        return True

    # Cek API key
    if x_api_key:
        # Di Phase 1, validasi sederhana: cek apakah key ada
        if len(x_api_key) > 0:
            return True

    # Cek Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        if len(token) > 0:
            return True

    # Jika tidak ada yang valid
    raise HTTPException(
        status_code=401,
        detail="Authentication required. Please provide a valid API key or Bearer token."
    )
