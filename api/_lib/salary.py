"""
Salary calculation logic.

Formula (confirmed with the client):
    Paid Days = P x 1 + WO x 1 + WOP x 2 + A x 0 + NA x 0
    Per Day   = Monthly Salary / 30          (always divide by 30, regardless
                                               of how many days are in the month)
    Gross     = Per Day x Paid Days
    Net       = Gross - Advance

  P    -> present, normal paid day               (counts as 1 day)
  WO   -> week off, paid rest day                 (counts as 1 day)
  WOP  -> worked on a holiday/week-off, double pay (counts as 2 days)
  A    -> absent                                  (counts as 0 days)
  NA   -> not marked / relieved                   (counts as 0 days)

This file is intentionally the ONLY place this formula lives, so if the
rule ever changes you only have to edit it here.
"""


def calc_salary(monthly_salary, p_count, wo_count, wop_count, a_count, na_count, advance, total_days=None):
    monthly_salary = _num(monthly_salary)
    p = _num(p_count)
    wo = _num(wo_count)
    wop = _num(wop_count)
    a = _num(a_count)
    na = _num(na_count)
    advance = _num(advance)

    paid_days = (p * 1) + (wo * 1) + (wop * 2) + (a * 0) + (na * 0)
    per_day = monthly_salary / 30 if monthly_salary else 0
    gross = per_day * paid_days
    net = gross - advance
    if paid_days == 0:
        net = 0

    warning = "OK"
    if monthly_salary == 0:
        warning = "NO SALARY SET"
    elif net < 0:
        warning = "ADVANCE > NET"
    elif paid_days == 0:
        warning = "NO ATTENDANCE"

    return {
        "paid_days": round(paid_days, 2),
        "per_day_salary": round(per_day, 2),
        "gross_salary": round(gross, 2),
        "net_salary": round(net, 2),
        "warning": warning,
        "p_count": int(p),
        "wo_count": int(wo),
        "wop_count": int(wop),
        "a_count": int(a),
        "na_count": int(na),
        "advance": round(advance, 2),
        "monthly_salary": round(monthly_salary, 2),
        "total_days": total_days if total_days is not None else int(p + wo + wop + a + na),
    }


def _num(v):
    try:
        if v in ("", None):
            return 0
        return float(v)
    except (TypeError, ValueError):
        return 0
