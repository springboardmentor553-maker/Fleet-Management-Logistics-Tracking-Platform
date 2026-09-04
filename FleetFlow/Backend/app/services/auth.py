from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin
from app.utils.security import hash_password, verify_password, create_access_token


from datetime import datetime
from sqlalchemy import func
from app.models.driver import Driver


def register_user(data: UserRegister, db: Session) -> User:
    if db.query(User).filter(func.lower(User.email) == data.email.lower()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        name=data.name.strip(),
        email=data.email.strip(),
        hashed_password=hash_password(data.password),
        role=data.role.strip(),
    )
    db.add(user)
    db.flush()

    if data.role.strip().lower() == "driver":
        existing_driver = db.query(Driver).filter(func.lower(Driver.email) == data.email.lower()).first()
        if not existing_driver:
            phone_val = getattr(data, "phone", None)
            if not phone_val or not str(phone_val).strip():
                phone_val = f"+9198765{10000 + user.id}"

            license_val = getattr(data, "license_number", None)
            if not license_val or not str(license_val).strip():
                email_prefix = data.email.split('@')[0].upper().replace('.', '').replace('-', '')[:8]
                license_val = f"DL-{email_prefix}-{user.id}"

            lic_check = db.query(Driver).filter(Driver.license_number == str(license_val).strip()).first()
            if lic_check:
                license_val = f"DL-{user.id}-{int(datetime.utcnow().timestamp())}"

            driver = Driver(
                name=user.name,
                email=user.email,
                phone=str(phone_val).strip(),
                license_number=str(license_val).strip(),
                is_available=True,
                attendance_status="present",
                safety_score=95,
                completed_trips_count=0,
                total_distance_km=0.0,
                rating=4.8,
            )
            db.add(driver)

    try:
        db.commit()
        db.refresh(user)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {exc}"
        )

    return user


def login_user(data: UserLogin, db: Session) -> dict:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}
