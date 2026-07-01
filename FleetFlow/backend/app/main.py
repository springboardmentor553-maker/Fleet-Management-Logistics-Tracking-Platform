from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }
