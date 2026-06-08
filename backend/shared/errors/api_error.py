"""
API Error Definitions - Phase 1
Mendefinisikan error spesifik untuk layer API dan komunikasi antar service.
Turunan dari HydraBaseError dengan konteks tambahan untuk tracing.
"""

from typing import Optional, Any
from .base_error import HydraBaseError


class APIError(HydraBaseError):
    """
    Error spesifik untuk kegagalan di API layer.
    
    Attributes tambahan:
        trace_id: ID tracing untuk melacak request lintas service.
        endpoint: Endpoint yang gagal (untuk debugging).
        service: Nama service yang menghasilkan error.
    """
    
    def __init__(
        self,
        message: str = "API Error",
        code: str = "ERR_API",
        status_code: int = 500,
        trace_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        service: Optional[str] = None,
        details: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=details
        )
        self.trace_id = trace_id
        self.endpoint = endpoint
        self.service = service
    
    def to_dict(self) -> dict:
        """Override to_dict untuk menambahkan trace_id jika ada."""
        result = super().to_dict()
        if self.trace_id:
            result["trace_id"] = self.trace_id
        return result


class BadRequestError(APIError):
    """Error untuk request yang tidak valid (400)."""
    
    def __init__(
        self,
        message: str = "Bad request",
        trace_id: Optional[str] = None,
        details: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            code="ERR_BAD_REQUEST",
            status_code=400,
            trace_id=trace_id,
            details=details
        )


class RateLimitExceededError(APIError):
    """Error untuk rate limit yang terlampaui (429)."""
    
    def __init__(
        self,
        message: str = "Terlalu banyak request. Silakan coba lagi nanti.",
        retry_after: int = 60,
        trace_id: Optional[str] = None
    ):
        super().__init__(
            message=message,
            code="ERR_RATE_LIMIT",
            status_code=429,
            trace_id=trace_id,
            details={"retry_after": retry_after}
        )
        self.retry_after = retry_after
    
    def to_dict(self) -> dict:
        result = super().to_dict()
        result["retry_after"] = self.retry_after
        return result


class ContentBlockedError(APIError):
    """Error untuk konten yang diblokir oleh safety pipeline (400)."""
    
    def __init__(
        self,
        message: str = "Konten diblokir oleh safety policy",
        reason: Optional[str] = None,
        trace_id: Optional[str] = None
    ):
        super().__init__(
            message=message,
            code="ERR_CONTENT_BLOCKED",
            status_code=400,
            trace_id=trace_id,
            details={"reason": reason} if reason else None
        )


class GatewayTimeoutError(APIError):
    """Error untuk timeout di gateway level (504)."""
    
    def __init__(
        self,
        service: str = "",
        trace_id: Optional[str] = None
    ):
        super().__init__(
            message=f"Timeout menunggu respons dari {service}" if service else "Gateway timeout",
            code="ERR_GATEWAY_TIMEOUT",
            status_code=504,
            trace_id=trace_id,
            service=service
        )
