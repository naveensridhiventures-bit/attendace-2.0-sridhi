"""
POST /api/submit_permission
Body: { employee_name, reason, date, hours }

Logs a new pending permission request to this month's
"{Month}-{Year} Permission" tab (auto-created if needed).
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, india_now, next_sno


def post(handler, body):
    employee_name = (body.get("employee_name") or "").strip()
    reason = (body.get("reason") or "").strip()
    date = (body.get("date") or "").strip()
    hours = (body.get("hours") or "").strip()

    if not employee_name or not reason or not date or not hours:
        return 400, {"error": "employee_name, reason, date and hours are all required"}

    ws = get_or_create_month_tab("Permission")
    sno = next_sno(ws)
    submitted_at = india_now().strftime("%Y-%m-%d %I:%M %p")

    ws.append_row(
        [sno, employee_name, date, hours, reason, "Pending", "", submitted_at],
        value_input_option="USER_ENTERED",
    )

    return 200, {"ok": True, "id": sno}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
