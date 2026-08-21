from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password


def create_manager():
    db = SessionLocal()

    try:
        email = "manager@fleetflow.com"
        username = "Manager"
        password = "manager123"

        # Check whether manager already exists
        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("Manager already exists.")

            # Optional: update role and password
            existing_user.username = username
            existing_user.role = "manager"
            existing_user.password = hash_password(password)

            db.commit()

            print("Existing user updated as manager.")
            return

        # Create new manager
        manager = User(
            username=username,
            email=email,
            password=hash_password(password),
            role="manager"
        )

        db.add(manager)
        db.commit()
        db.refresh(manager)

        print("Manager created successfully!")
        print("Email:", email)
        print("Password:", password)
        print("Role:", manager.role)

    except Exception as e:
        db.rollback()
        print("Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    create_manager()