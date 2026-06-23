"""
POST /api/notifications/check
Body: { employee_name }

Lightweight polling endpoint: returns whether this employee has any
leave/permission requests that were decided (approved/rejected) in the
current month, so the frontend can show a "decision ready" badge without
needing real push delivery wired up.

Shape: { notifications: [{ type, status, date }] }
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, rows_as_dicts


def post(handler, body):
    employee_name = (body.get("employee_name") or "").strip()
    if not employee_name:
        return 400, {"error": "employee_name is required"}

    notifications = []

    leave_ws = get_or_create_month_tab("Leave")
    for r in rows_as_dicts(leave_ws):
        if (r.get("Employee") or "").strip() == employee_name and r.get("Status") in ("Approved", "Rejected"):
            notifications.append({"type": "leave", "status": r.get("Status"), "date": r.get("From", "")})

    perm_ws = get_or_create_month_tab("Permission")
    for r in rows_as_dicts(perm_ws):
        if (r.get("Employee") or "").strip() == employee_name and r.get("Status") in ("Approved", "Rejected"):
            notifications.append({"type": "permission", "status": r.get("Status"), "date": r.get("Date", "")})

    return 200, {"notifications": notifications}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
