from fastapi import Request, status
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """Base class for business-rule violations raised inside service functions."""

    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(DomainError):
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(DomainError):
    status_code = status.HTTP_409_CONFLICT


class UnauthorizedError(DomainError):
    status_code = status.HTTP_401_UNAUTHORIZED


class ForbiddenError(DomainError):
    status_code = status.HTTP_403_FORBIDDEN


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})
