"""Creates the first admin account so you can log into the console.

Run once, after migrations are applied:
    python -m app.scripts.seed_admin
"""
from app.core.security import hash_password
from app.common.enums import AccountRole
from app.db.session import SessionLocal
from app.modules.accounts.models import Account

# Importing app.main (rather than just the accounts models) pulls in every
# module's routers, and with them every ORM model. SQLAlchemy relationships
# declared as string references (e.g. relationship("Driver", ...)) can only
# be resolved once the referenced class has actually been imported somewhere
# -- otherwise mapper configuration fails with "failed to locate a name".
import app.main  # noqa: F401

ADMIN_EMAIL = "admin@freightflow.dev"
ADMIN_PASSWORD = "ChangeMe123!"
ADMIN_NAME = "FreightFlow Admin"


def run() -> None:
    db = SessionLocal()
    try:
        existing = db.query(Account).filter(Account.email == ADMIN_EMAIL).first()
        if existing:
            print(f"Admin account already exists: {ADMIN_EMAIL}")
            return

        admin = Account(
            full_name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=AccountRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Created admin account: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print("Log in, then change this password via your own workflow.")
    finally:
        db.close()


if __name__ == "__main__":
    run()