from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.driver import Driver, DriverStatus
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.utils.auth import get_password_hash, verify_password, create_access_token, blacklist_token
from app.utils.dependencies import get_current_user, get_current_active_user, oauth2_scheme, RoleChecker, require_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Register a new user.
    - If no users exist, allow the registration of the initial administrator.
    - Admins can create Administrators, Fleet Managers, Dispatchers, and Drivers.
    - Fleet Managers can create Drivers.
    - If creating a Driver, driver details (license_number, phone_number) are required and created.
    """
    # Check if this user is allowed to register the new role
    if current_user.role == UserRole.ADMIN:
        # Admin can create anyone
        pass
    elif current_user.role == UserRole.MANAGER and user_data.role == UserRole.DRIVER:
        # Fleet manager can only create drivers
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to register a user with this role."
        )

    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Handle driver details validations
    if user_data.role == UserRole.DRIVER:
        if not user_data.license_number or not user_data.phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License number and phone number are required for registering drivers."
            )
        # Check if driver license number is unique
        existing_license = db.query(Driver).filter(Driver.license_number == user_data.license_number).first()
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Driver license number already exists."
            )

    try:
        # Create User record
        new_user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=True
        )
        db.add(new_user)
        db.flush()  # Generate user id to link driver

        # Create Driver record if applicable
        if user_data.role == UserRole.DRIVER:
            new_driver = Driver(
                user_id=new_user.id,
                license_number=user_data.license_number,
                phone_number=user_data.phone_number,
                status=DriverStatus.AVAILABLE
            )
            db.add(new_driver)

        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering user: {str(e)}"
        )

@router.post("/register-admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def register_initial_admin(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Unprotected helper endpoint to register the very first Administrator when the database is empty.
    """
    user_count = db.query(User).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="An Administrator already exists. Subsequent users must be registered by authenticated Admins/Managers."
        )
    
    if user_data.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The initial registered user must have the ADMIN role."
        )

    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user via JSON payload and return a JWT access token.
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )
        
    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name
    }

@router.post("/token", response_model=Token, include_in_schema=False)
def login_for_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate a user via OAuth2 Password Bearer form data (needed for Swagger UI).
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )
        
    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Fetch the currently logged in user profile.
    """
    return current_user

@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """
    List all registered users (Administrators only).
    """
    return db.query(User).order_by(User.created_at.desc()).all()

@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    """
    Invalidate the current user's session by blacklisting the JWT.
    """
    if token:
        blacklist_token(token)
    return {"message": "Successfully logged out"}
