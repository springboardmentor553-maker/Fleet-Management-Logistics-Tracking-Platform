from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
)
from app.services.user import (
    create_user,
    get_user,
    get_users,
    update_user,
    delete_user,
    login_user, 
)
from app.auth.oauth2 import (
    get_current_user,
    get_current_admin,
)



router = APIRouter(
    prefix="/users",
    tags=["Users"]
    )

@router.post("/", response_model=UserResponse)
def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    return create_user(db, user)

@router.get("/", response_model=list[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    return get_users(db)

@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    user = get_user(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user     

@router.put("/{user_id}", response_model=UserResponse)
def update_existing_user(
    user_id: int,
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    updated_user = update_user(db, user_id, user)

    if updated_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return updated_user

@router.delete("/{user_id}")
def delete_existing_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    deleted_user = delete_user(db, user_id)

    if deleted_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {"message": "User deleted successfully"}



@router.post(
    "/login",
    response_model=Token
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    token = login_user(
        db,
        form_data
    )

    if token is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    return token