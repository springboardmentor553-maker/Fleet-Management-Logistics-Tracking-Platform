# FleetFlow

FleetFlow is a FastAPI backend project.

## Project Structure

```text
backend/
  app/
    __init__.py
    main.py
    database.py
    models.py
    routers/
      __init__.py
      config.py
  requirements.txt
```

## Run The Backend

From the repository root:

```bash
cd backend
../venv/bin/uvicorn app.main:app --reload
```

If you want to use the virtual environment directly, activate it first:

```bash
source ../venv/bin/activate
uvicorn app.main:app --reload
```

## Dependencies

Install the backend dependencies with:

```bash
pip install -r backend/requirements.txt
```
