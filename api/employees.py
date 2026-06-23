"""
GET /api/employees

Returns the live list of active employees from the "Employees" tab, so the
EmployeeSelect dropdown reflects the sheet instead of a hardcoded array.
Shape: { employees: [{ name, role }] }

Inactive employees (Active column set to FALSE/NO/0) are excluded, so
"deleting" someone from the dropdown is as simple as flipping that column
in the sheet — no need to delete the row and lose their history.
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_employees_tab, rows_as_dicts


def get(handler, body):
    ws = get_employees_tab()
    records = rows_as_dicts(ws)

    employees = []
    for r in records:
        name = (r.get("Name") or "").strip()
        if not name:
            continue
        if str(r.get("Active", "TRUE")).strip().upper() in ("FALSE", "NO", "0"):
            continue
        employees.append({"name": name, "role": r.get("Role", "")})

    return 200, {"employees": employees}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        json_handler(self, get)

    def do_OPTIONS(self):
        options_response(self)
