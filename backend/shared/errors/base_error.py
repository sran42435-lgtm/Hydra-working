"""
Base Error Definitions - Phase 1
Mendefinisikan hierarki error dasar untuk seluruh sistem Hydra.
Semua custom exception di service lain harus mewarisi dari class-class di sini.
"""

from typing import Optional, Any


class HydraBaseError(Exception):
    """
    Base exception untuk seluruh sistem Hydra.
    
    Attributes:
        message: Pesan error yang dapat ditampilkan ke user.
        code: Kode error unik untuk identifikasi (contoh: "ERR_GATEWAY_001").
        status_code: HTTP status code yang sesuai.
        details: Informasi tambahan untuk debugging (tidak ditampilkan ke user).
    """
    
    def __init__(
        self,
        message: str = "Terjadi kesalahan internal",
        code: str = "ERR_INTERNAL",
        status_code: int = 500,
        details: Optional[Any] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)
    
    def to_dict(self) -> dict:
        """Konversi error ke format dictionary untuk response API."""
        result = {
            "error": self.message,
            "code": self.code
        }
        if self.details:
            result["details"] = self.details
        return result


class ValidationError(HydraBaseError):
    """Error untuk validasi input yang gagal."""
    
    def __init__(self, message: str = "Input tidak valid", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="ERR_VALIDATION",
            status_code=400,
            details=details
        )


class NotFoundError(HydraBaseError):
    """Error untuk resource yang tidak ditemukan."""
    
    def __init__(self, message: str = "Resource tidak ditemukan", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="ERR_NOT_FOUND",
            status_code=404,
            details=details
        )


class UnauthorizedError(HydraBaseError):
    """Error untuk akses tanpa otorisasi."""
    
    def __init__(self, message: str = "Tidak memiliki izin akses", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="ERR_UNAUTHORIZED",
            status_code=401,
            details=details
        )


class ServiceUnavailableError(HydraBaseError):
    """Error ketika service yang dibutuhkan tidak tersedia."""
    
    def __init__(self, service_name: str = "Service", details: Optional[Any] = None):
        super().__init__(
            message=f"{service_name} tidak tersedia. Silakan coba lagi nanti.",
            code="ERR_SERVICE_UNAVAILABLE",
            status_code=503,
            details=details
        )


class TimeoutError(HydraBaseError):
    """Error untuk operasi yang timeout."""
    
    def __init__(self, message: str = "Request timeout", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="ERR_TIMEOUT",
            status_code=504,
            details=details
        )
