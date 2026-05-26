from datetime import datetime, timedelta, timezone
from enum import StrEnum
from jose import jwt
from pwdlib import PasswordHash
from app.core.config import settings

password_hash = PasswordHash.recommended()


class TokenType(StrEnum):
    ACCESS = "access"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {"sub": subject, "type": TokenType.ACCESS, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")
