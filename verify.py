"""
FleetFlow — Full system verification script.
Run from FleetFlow/backend with venv active:
    python ../../verify.py
"""
import json
import sys
import urllib.request
import urllib.error

BASE = "http://localhost:8000"
PASS = "\033[92m✅\033[0m"
FAIL = "\033[91m❌\033[0m"
results = []


def req(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def check(label, condition, got=""):
    icon = PASS if condition else FAIL
    results.append(condition)
    print(f"  {icon}  {label}")
    if not condition:
        print(f"       got: {got}")


print("\n" + "=" * 60)
print("  FleetFlow — Task Completion Verification")
print("=" * 60)

# ── 1. PostgreSQL / DB health ────────────────────────────────
print("\n[i] PostgreSQL Integration")
code, body = req("GET", "/health/db")
check("GET /health/db → 200 database connected", code == 200 and body.get("status") == "database connected", body)

# ── 2. Register ──────────────────────────────────────────────
print("\n[v] JWT Auth — Register")
code, body = req("POST", "/auth/register", {"email": "verify_admin@ff.com", "password": "pass1234!", "role": "ADMIN"})
admin_ok = code in (201, 400)  # 400 means already registered — that's fine
check("POST /auth/register (ADMIN) → 201 or already-exists-400", admin_ok, body)

code, body = req("POST", "/auth/register", {"email": "verify_driver@ff.com", "password": "pass1234!", "role": "DRIVER"})
check("POST /auth/register (DRIVER) → 201 or already-exists-400", code in (201, 400), body)

# ── 3. Login + JWT ───────────────────────────────────────────
print("\n[v] JWT Auth — Login & token structure")
code, body = req("POST", "/auth/login", {"email": "verify_admin@ff.com", "password": "pass1234!"})
check("POST /auth/login → 200", code == 200, body)
check("Response has access_token", "access_token" in body.get("tokens", {}), body)
check("Response has refresh_token", "refresh_token" in body.get("tokens", {}), body)
check("Response has user.role = ADMIN", body.get("user", {}).get("role") == "ADMIN", body)
admin_token = body.get("tokens", {}).get("access_token", "")

code, body = req("POST", "/auth/login", {"email": "verify_driver@ff.com", "password": "pass1234!"})
check("DRIVER login → 200", code == 200, body)
driver_token = body.get("tokens", {}).get("access_token", "")

# ── 4. Refresh token ─────────────────────────────────────────
code, login_body = req("POST", "/auth/login", {"email": "verify_admin@ff.com", "password": "pass1234!"})
refresh_tok = login_body.get("tokens", {}).get("refresh_token", "")
code, body = req("POST", "/auth/refresh", {"refresh_token": refresh_tok})
check("POST /auth/refresh → new token pair", code == 200 and "access_token" in body, body)

# ── 5. Protected route — /auth/me ────────────────────────────
print("\n[v] JWT Protected Routes")
code, body = req("GET", "/auth/me", token=admin_token)
check("GET /auth/me with token → 200", code == 200 and body.get("email") == "verify_admin@ff.com", body)

code, body = req("GET", "/auth/me")
check("GET /auth/me with NO token → 401", code == 401, body)

code, body = req("GET", "/dashboard")
check("GET /dashboard with NO token → 401", code == 401, body)

# ── 6. Role-based access ─────────────────────────────────────
print("\n[v] Role-Based Access Control")
code, body = req("POST", "/vehicles",
    {"registration_number": "VRF-TEST-001", "vehicle_type": "Van", "capacity": 2.0, "fuel_type": "Petrol"},
    token=driver_token)
check("DRIVER POST /vehicles → 403 Forbidden", code == 403, body)

code, body = req("POST", "/vehicles",
    {"registration_number": "VRF-TEST-001", "vehicle_type": "Van", "capacity": 2.0, "fuel_type": "Petrol"},
    token=admin_token)
check("ADMIN POST /vehicles → 201 Created", code in (201, 400), body)  # 400 = already exists

# ── 7. Vehicle CRUD ──────────────────────────────────────────
print("\n[vii] Vehicle Registration Workflow")
code, body = req("POST", "/vehicles",
    {"registration_number": "VRF-TEST-002", "vehicle_type": "Truck", "capacity": 5.0, "fuel_type": "Diesel"},
    token=admin_token)
check("Create vehicle → 201", code == 201, body)
veh_id = body.get("id")

code, body = req("GET", "/vehicles", token=admin_token)
check("List vehicles → 200", code == 200 and isinstance(body, list), body)

code, body = req("GET", f"/vehicles/{veh_id}", token=admin_token)
check(f"Get vehicle by id → 200", code == 200 and body.get("id") == veh_id, body)

code, body = req("PUT", f"/vehicles/{veh_id}",
    {"registration_number": "VRF-TEST-002", "vehicle_type": "Truck", "capacity": 5.0,
     "fuel_type": "Diesel", "current_status": "MAINTENANCE"},
    token=admin_token)
check("Update vehicle status → MAINTENANCE", code == 200 and body.get("current_status") == "MAINTENANCE", body)

# ── 8. Fleet monitoring dashboard ───────────────────────────
print("\n[vi] Fleet Monitoring Dashboard")
code, body = req("GET", "/dashboard", token=admin_token)
check("GET /dashboard → 200", code == 200, body)
check("Dashboard has totalVehicles key", "totalVehicles" in body, body)
check("Dashboard has active key", "active" in body, body)
check("Dashboard has maintenance key", "maintenance" in body, body)
check("Dashboard has available key", "available" in body, body)
check("maintenance count ≥ 1 (we just set one)", body.get("maintenance", 0) >= 1, body)
print(f"       dashboard: {body}")

# ── 9. Driver management ─────────────────────────────────────
print("\n[Driver] Driver/User Management Basics")
# Get admin user id
code, me = req("GET", "/auth/me", token=admin_token)
admin_id = me.get("id")

code, body = req("POST", "/drivers",
    {"user_id": admin_id, "license_details": "DL-VERIFY-001"},
    token=admin_token)
check("POST /drivers → 201 or already-exists-400", code in (201, 400), body)
drv_id = body.get("id") or 1

code, body = req("GET", "/drivers", token=admin_token)
check("GET /drivers → 200 list", code == 200 and isinstance(body, list), body)

code, body = req("PATCH", f"/drivers/{drv_id}", {"license_details": "DL-VERIFY-UPDATED"}, token=admin_token)
check("PATCH /drivers/{id} → 200", code == 200, body)

# ── 10. Delete vehicle (cleanup) ─────────────────────────────
code, body = req("DELETE", f"/vehicles/{veh_id}", token=admin_token)
check("DELETE /vehicles/{id} → 204", code == 204, "")

# ── Summary ──────────────────────────────────────────────────
total = len(results)
passed = sum(results)
failed = total - passed
print("\n" + "=" * 60)
print(f"  Results: {passed}/{total} checks passed")
if failed:
    print(f"  {FAIL} {failed} check(s) failed — see details above")
else:
    print(f"  {PASS} All checks passed — system fully verified!")
print("=" * 60 + "\n")
sys.exit(0 if failed == 0 else 1)
