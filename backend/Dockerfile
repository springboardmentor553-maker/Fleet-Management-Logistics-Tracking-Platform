FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python -m alembic upgrade 2c3e30562e25 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]