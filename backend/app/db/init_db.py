from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole


def create_initial_admin(db: Session) -> User:
    existing_admin = db.query(User).filter(
        User.username == settings.first_superuser_username
    ).first()
    if existing_admin:
        return existing_admin
    admin = User(
        username=settings.first_superuser_username,
        hashed_password=get_password_hash(settings.first_superuser_password),
        full_name="System Administrator",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
