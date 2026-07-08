from fastapi import Depends, HTTPException

from backend.app.dependencies import get_current_user


def role_required(allowed_roles):

    def checker(current_user=Depends(get_current_user)):

        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Permission Denied"
            )

        return current_user

    return checker