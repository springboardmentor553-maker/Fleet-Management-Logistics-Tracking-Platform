from fastapi import FastAPI
from app.routers import auth

app = FastAPI(title="Fleet Management API")

app.include_router(auth.router)


@app.get("/")
def home():
    return {"message": "Fleet Management API is running"}