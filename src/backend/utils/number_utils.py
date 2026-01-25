def safe_float(value):
    """
    Converts jobspy values safely:
    - numbers → float
    - 'N/A', '', None → None
    """
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        value = value.strip().lower()
        if value in ("n/a", "", "none"):
            return None

        try:
            return float(value.replace(",", ""))
        except ValueError:
            return None

    return None
