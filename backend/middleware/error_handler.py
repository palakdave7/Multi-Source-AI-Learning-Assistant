from fastapi import Request
from fastapi.responses import JSONResponse
from logger import get_logger

logger = get_logger("error_handler")


async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
    )


async def http_exception_handler(request: Request, exc):
    logger.warning(f"HTTP error {exc.status_code} on {request.method} {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )