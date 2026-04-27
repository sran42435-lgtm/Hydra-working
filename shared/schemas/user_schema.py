"""
User Schema - Phase 1 (Tanpa Pydantic)
Mendefinisikan struktur data user untuk autentikasi dasar.
Menggunakan fungsi validasi manual sebagai pengganti Pydantic BaseModel.
"""

import re


# ---------------------------------------------------------------------------
# Validasi Helper
# ---------------------------------------------------------------------------

def validate_username(value: str) -> str:
    """Validasi username: 3-50 karakter, alfanumerik + underscore."""
    if not isinstance(value, str):
        raise ValueError("username harus berupa string")
    if len(value) < 3:
        raise ValueError("username minimal 3 karakter")
    if len(value) > 50:
        raise ValueError("username maksimal 50 karakter")
    if not re.match(r"^[a-zA-Z0-9_]+$", value):
        raise ValueError("username hanya boleh mengandung huruf, angka, dan underscore")
    return value


def validate_password(value: str) -> str:
    """Validasi password: minimal 8 karakter."""
    if not isinstance(value, str):
        raise ValueError("password harus berupa string")
    if len(value) < 8:
        raise ValueError("password minimal 8 karakter")
    if len(value) > 128:
        raise ValueError("password maksimal 128 karakter")
    return value


def validate_email(value: str) -> str:
    """Validasi email sederhana."""
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("email harus berupa string")
    if value and not re.match(r"^[^@]+@[^@]+\.[^@]+$", value):
        raise ValueError("format email tidak valid")
    return value


# ---------------------------------------------------------------------------
# User Create Request (Pengganti UserCreateRequest BaseModel)
# ---------------------------------------------------------------------------

def parse_user_create_request(request_data: dict) -> dict:
    """
    Memparsing dan memvalidasi request registrasi user baru.

    Args:
        request_data: Dictionary dengan key 'username', 'email' (opsional), 'password'.

    Returns:
        Dictionary yang sudah tervalidasi.

    Raises:
        ValueError: Jika validasi gagal.
    """
    username = request_data.get("username")
    password = request_data.get("password")
    email = request_data.get("email")

    if not username:
        raise ValueError("username wajib diisi")
    if not password:
        raise ValueError("password wajib diisi")

    return {
        "username": validate_username(username),
        "email": validate_email(email) if email else None,
        "password": validate_password(password)
    }


# ---------------------------------------------------------------------------
# User Login Request (Pengganti UserLoginRequest BaseModel)
# ---------------------------------------------------------------------------

def parse_user_login_request(request_data: dict) -> dict:
    """
    Memparsing dan memvalidasi request login user.

    Args:
        request_data: Dictionary dengan key 'username', 'password'.

    Returns:
        Dictionary yang sudah tervalidasi.

    Raises:
        ValueError: Jika validasi gagal.
    """
    username = request_data.get("username")
    password = request_data.get("password")

    if not username:
        raise ValueError("username wajib diisi")
    if not password:
        raise ValueError("password wajib diisi")

    return {
        "username": validate_username(username),
        "password": validate_password(password)
    }


# ---------------------------------------------------------------------------
# User Response (Pengganti UserResponse BaseModel)
# ---------------------------------------------------------------------------

def build_user_response(user_id: str, username: str, email: str = None, created_at: str = "") -> dict:
    """
    Membangun response data user (tanpa password).

    Args:
        user_id: ID unik user.
        username: Username.
        email: Email (opsional).
        created_at: Timestamp pendaftaran.

    Returns:
        Dictionary dengan key 'id', 'username', 'email', 'created_at'.
    """
    return {
        "id": user_id,
        "username": username,
        "email": email,
        "created_at": created_at
    }


# ---------------------------------------------------------------------------
# Token Response (Pengganti TokenResponse BaseModel)
# ---------------------------------------------------------------------------

def build_token_response(access_token: str, token_type: str = "bearer") -> dict:
    """
    Membangun response JWT token.

    Args:
        access_token: Token akses JWT.
        token_type: Tipe token (default: bearer).

    Returns:
        Dictionary dengan key 'access_token', 'token_type'.
    """
    return {
        "access_token": access_token,
        "token_type": token_type
    }
