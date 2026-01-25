import re
from typing import Optional, Tuple

# -------------------------------------------------
# REGEX (DECIMAL + ESCAPE SAFE)
# -------------------------------------------------

RANGE_PATTERN = re.compile(
    r"""
    (?P<currency>₹|\$)?\s*
    (?P<min>[\d,]+(?:\.\d+)?)\s*
    (?:-|to)\s*
    (?P<currency2>₹|\$)?\s*
    (?P<max>[\d,]+(?:\.\d+)?)\s*
    (?P<interval>per\s*month|monthly|per\s*year|yearly|annum|pa)
    """,
    re.IGNORECASE | re.VERBOSE
)

SINGLE_PATTERN = re.compile(
    r"""
    (?P<currency>₹|\$)?\s*
    (?P<amount>[\d,]+(?:\.\d+)?)\s*
    (?P<interval>per\s*month|monthly|per\s*year|yearly|annum|pa)
    """,
    re.IGNORECASE | re.VERBOSE
)

CURRENCY_MAP = {
    "₹": "INR",
    "$": "USD"
}


# -------------------------------------------------
# HELPERS
# -------------------------------------------------

def _safe_float(value: str) -> Optional[float]:
    try:
        return float(value.replace(",", ""))
    except Exception:
        return None


def _normalize_interval(raw: str) -> str:
    raw = raw.lower()
    if "month" in raw:
        return "month"
    return "year"


# -------------------------------------------------
# MAIN EXTRACTOR
# -------------------------------------------------

def extract_compensation_from_text(
    text: Optional[str]
) -> Tuple[Optional[float], Optional[float], Optional[str], Optional[str]]:
    """
    Extract salary info from CLEANED job description text.

    Returns:
    (min_amount, max_amount, currency, interval)
    """

    if not text or not isinstance(text, str):
        return None, None, None, None

    # IMPORTANT: text must already be cleaned
    text = text.replace("\\.", ".")  # safety for escaped decimals

    # ---------- RANGE FIRST ----------
    match = RANGE_PATTERN.search(text)
    if match:
        min_amt = _safe_float(match.group("min"))
        max_amt = _safe_float(match.group("max"))

        currency_symbol = match.group("currency") or match.group("currency2")
        currency = CURRENCY_MAP.get(currency_symbol, "INR")

        interval = _normalize_interval(match.group("interval"))

        if min_amt and max_amt:
            return min_amt, max_amt, currency, interval

    # ---------- SINGLE VALUE ----------
    match = SINGLE_PATTERN.search(text)
    if match:
        amount = _safe_float(match.group("amount"))
        currency = CURRENCY_MAP.get(match.group("currency"), "INR")
        interval = _normalize_interval(match.group("interval"))

        if amount:
            return amount, None, currency, interval

    return None, None, None, None
