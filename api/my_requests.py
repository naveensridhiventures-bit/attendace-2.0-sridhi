"""
POST /api/my_requests
Body: { employee_name }

Returns this employee's leave requests, in the shape LeavePage.jsx expects:
{ requests: [{ type, from_date, to_date, days, reason, status, hr_comments }] }

Scans the current month plus the previous 5 months' Leave tabs (skipping
any that don't exist yet) so a request doesn't go missing just because a
month boundary passed.
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, india_now, rows_as_dicts


def post(handler, body):
    employee_name = (body.get("employee_name") or "").strip()
    if not employee_name:
        return 400, {"error": "employee_name is required"}

    now = india_now()
    requests = []
    for i in range(6):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        ws = get_or_create_month_tab("Leave", m, y)
        for r in rows_as_dicts(ws):
            if (r.get("Employee") or "").strip() == employee_name:
                requests.append({
                    "id": r.get("SNo"),
                    "type": r.get("Type", ""),
                    "from_date": r.get("From", ""),
                    "to_date": r.get("To", ""),
                    "days": r.get("Days", ""),
                    "reason": r.get("Reason", ""),
                    "status": r.get("Status", ""),
                    "hr_comments": r.get("HR Comments", ""),
                })

    requests.sort(key=lambda r: r.get("from_date") or "", reverse=True)
    return 200, {"requests": requests}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
