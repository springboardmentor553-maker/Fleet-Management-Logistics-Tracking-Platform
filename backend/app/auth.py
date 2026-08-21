from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.security import (
    OAuth2PasswordRequestForm,
)

from sqlalchemy.orm import Session

from app.dependencies import (
    get_db,
    get_current_user,
    require_role,
)

from app.models.user import User

from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    PasswordChange,
    Token,
)

from app.security import (
    hash_password,
    verify_password,
    create_access_token,
)


router = APIRouter()


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):

    existing_user = (
        db.query(User)
        .filter(
            User.email == user.email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    hashed_password = hash_password(
        user.password
    )

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=Token,
)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    db_user = (
        db.query(User)
        .filter(
            User.email
            == form_data.username
        )
        .first()
    )

    if not db_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        form_data.password,
        db_user.hashed_password,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# PROFILE
# ============================================================

@router.get(
    "/profile",
    response_model=UserResponse,
)
def get_profile(
    current_user: User = Depends(
        get_current_user
    ),
):

    return current_user


# ============================================================
# UPDATE PROFILE
# ============================================================

@router.put(
    "/profile",
    response_model=UserResponse,
)
def update_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    if user_data.email:

        existing_user = (
            db.query(User)
            .filter(
                User.email
                == user_data.email,
                User.id
                != current_user.id,
            )
            .first()
        )

        if existing_user:

            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

    update_data = user_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():

        setattr(
            current_user,
            key,
            value,
        )

    db.commit()
    db.refresh(current_user)

    return current_user


# ============================================================
# CHANGE PASSWORD
# ============================================================

@router.put(
    "/password",
)
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    if not verify_password(
        password_data.current_password,
        current_user.hashed_password,
    ):

        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    if password_data.current_password == password_data.new_password:

        raise HTTPException(
            status_code=400,
            detail="New password must be different",
        )

    current_user.hashed_password = hash_password(
        password_data.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully",
    }


# ============================================================
# ROLE DASHBOARDS
# ============================================================

@router.get("/admin")
def admin_dashboard(
    current_user: User = Depends(
        require_role("admin")
    ),
):

    return welcome_message(
        current_user
    )


@router.get("/fleet-manager")
def fleet_manager_dashboard(
    current_user: User = Depends(
        require_role("fleet manager")
    ),
):

    return welcome_message(
        current_user
    )


@router.get("/dispatcher")
def dispatcher_dashboard(
    current_user: User = Depends(
        require_role("dispatcher")
    ),
):

    return welcome_message(
        current_user
    )


@router.get("/driver")
def driver_dashboard(
    current_user: User = Depends(
        require_role("driver")
    ),
):

    return welcome_message(
        current_user
    )


def welcome_message(
    current_user: User,
):

    return {
        "message": (
            f"Welcome "
            f"{current_user.role} "
            f"{current_user.name}"
        ),
        "role": current_user.role,
    }