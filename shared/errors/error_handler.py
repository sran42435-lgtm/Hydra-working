"""
Global Error Handler - Phase 1
Menangani semua exception di level aplikasi FastAPI dan mengembalikan response JSON yang konsisten.
Dapat digunakan oleh semua service dengan cara mendaftarkannya ke app FastAPI.
"""

import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from .base_error import HydraBaseError
from .api_error import APIError


def setup_error_handlers(app: FastAPI) -> None:
    """
    Mendaftarkan semua exception handler ke aplikasi FastAPI.
    Panggil fungsi ini di main.py setiap service: setup_error_handlers(app)
    """

    @app.exception_handler(HydraBaseError)
    async def hydra_base_error_handler(request: Request, exc: HydraBaseError):
        """Handler untuk semua error yang mewarisi HydraBaseError."""
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict()
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        """Handler untuk ValueError (biasanya dari validasi input)."""
        return JSONResponse(
            status_code=400,
            content={
                "error": str(exc),
                "code": "ERR_VALIDATION"
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        """Handler untuk exception yang tidak tertangani (fallback)."""
        # Log error untuk debugging
        print(f"Unhandled exception: {type(exc).__name__}: {str(exc)}")
        print(traceback.format_exc())

        return JSONResponse(
            status_code=500,
            content={
                "error": "Terjadi kesalahan internal",
                "code": "ERR_INTERNAL"
            }
        )
