"""
User Schema - Phase 1
Mendefinisikan struktur data user untuk autentikasi dasar.
Digunakan oleh auth_service jika diaktifkan.
"""

from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class UserCreateRequest(BaseModel):
    """
    Schema untuk request registrasi user baru.
    """
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: Optional[str] = Field(default=None)
    password: str = Field(..., min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    """
    Schema untuk request login user.
    """
    username: str
    password: str


class UserResponse(BaseModel):
    """
    Schema untuk response data user (tanpa password).
    """
    id: str
    username: str
    email: Optional[str] = None
    created_at: str


class TokenResponse(BaseModel):
    """
    Schema untuk response JWT token.
    """
    access_token: str
    token_type: str = "bearer"
