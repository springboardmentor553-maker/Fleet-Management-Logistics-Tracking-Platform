import asyncio
from app.database import SessionLocal
from app.routers.dashboard import dashboard
from app.models.user import User

async def main():
    db = SessionLocal()
    user = User(id=1, email="admin@fleetflow.com", role="ADMIN")
    summary = dashboard(db=db, current_user=user)
    print("Success:", summary.dict())
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
