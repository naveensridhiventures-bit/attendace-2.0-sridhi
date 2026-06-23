"""
POST /api/hr/decide
Body: { id, type, action, hr_comments, pin }
  type   -> "leave" | "permission"
  action -> "approve" | "reject"

PIN-protected. Finds the row by SNo in this month's Leave or Permission
tab and updates its Status (and HR Comments) column in place.
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, get_hr_pin, find_row_index


def post(handler, body):
    pin = str(body.get("pin", "")).strip()
    if pin != get_hr_pin():
        return 401, {"error": "Wrong PIN"}

    row_id = body.get("id")
    kind = (body.get("type") or "").strip().lower()
    action = (body.get("action") or "").strip().lower()
    hr_comments = (body.get("hr_comments") or "").strip()

    if kind not in ("leave", "permission"):
        return 400, {"error": "type must be 'leave' or 'permission'"}
    if action not in ("approve", "reject"):
        return 400, {"error": "action must be 'approve' or 'reject'"}
    if row_id in (None, ""):
        return 400, {"error": "id is required"}

    ws = get_or_create_month_tab("Leave" if kind == "leave" else "Permission")
    headers = ws.row_values(1)
    row_num = find_row_index(ws, "SNo", row_id, headers)
    if not row_num:
        return 404, {"error": "Request not found (it may be from a previous month)"}

    status_col = headers.index("Status") + 1
    comments_col = headers.index("HR Comments") + 1
    new_status = "Approved" if action == "approve" else "Rejected"

    ws.update_cell(row_num, status_col, new_status)
    if hr_comments:
        ws.update_cell(row_num, comments_col, hr_comments)

    return 200, {"ok": True, "id": row_id, "status": new_status}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
