"""Create initial admin user."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.db.init_db import create_initial_admin


def main() -> None:
    db = SessionLocal()
    try:
        admin = create_initial_admin(db)
        print(f"Admin user ready: {admin.username}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
