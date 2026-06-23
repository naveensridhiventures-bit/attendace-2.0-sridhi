"""
POST /api/dashboard/unlock
Body: { pin }

Checks the PIN against the HR tab's B1 cell. Returns 200 if correct,
401 otherwise. Used by both SalaryPage and HRPage before they load data.
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_hr_pin


def post(handler, body):
    pin = str(body.get("pin", "")).strip()
    if pin == get_hr_pin():
        return 200, {"ok": True}
    return 401, {"error": "Wrong PIN"}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
