"""
POST /api/hr/pending_requests
Body: { pin }

PIN-protected. Returns all "Pending" rows from this month's Leave and
Permission tabs, in the shape HRPage.jsx expects:
{ leaves: [...], permissions: [...] }

Each leave/permission item includes its SNo as "id" so the frontend's
decide() call (which sends back id + type) can find the right row again.
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, get_hr_pin, rows_as_dicts


def post(handler, body):
    pin = str(body.get("pin", "")).strip()
    if pin != get_hr_pin():
        return 401, {"error": "Wrong PIN"}

    leave_ws = get_or_create_month_tab("Leave")
    leaves = [
        {
            "id": r.get("SNo"),
            "employee_name": r.get("Employee", ""),
            "type": r.get("Type", ""),
            "from_date": r.get("From", ""),
            "to_date": r.get("To", ""),
            "days": r.get("Days", ""),
            "reason": r.get("Reason", ""),
            "status": r.get("Status", ""),
        }
        for r in rows_as_dicts(leave_ws)
        if (r.get("Status") or "").strip().lower() == "pending"
    ]

    perm_ws = get_or_create_month_tab("Permission")
    permissions = [
        {
            "id": r.get("SNo"),
            "employee_name": r.get("Employee", ""),
            "date": r.get("Date", ""),
            "hours": r.get("Hours", ""),
            "reason": r.get("Reason", ""),
            "status": r.get("Status", ""),
        }
        for r in rows_as_dicts(perm_ws)
        if (r.get("Status") or "").strip().lower() == "pending"
    ]

    return 200, {"leaves": leaves, "permissions": permissions}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
