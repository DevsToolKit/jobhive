import re
from typing import Optional

# -------------------------------------------------
# COMMON JOB BOARD JUNK PHRASES
# -------------------------------------------------

JUNK_PATTERNS = [
    r"equal opportunity employer.*$",
    r"about us.*$",
    r"working conditions.*$",
    r"legal entity.*$",
    r"disclaimer.*$",
    r"how to apply.*$",
]

# -------------------------------------------------
# MAIN CLEANER
# -------------------------------------------------

def clean_description(text: Optional[str]) -> Optional[str]:
    """
    Cleans job description text for storage & NLP.
    Safe, deterministic, and idempotent.
    """

    if not text or not isinstance(text, str):
        return None

    # Normalize newlines early
    text = text.replace("\r", "\n")

    # Remove markdown symbols (*, **, __)
    text = re.sub(r"(\*\*|\*|__)", "", text)

    # Remove bullets and decorative symbols
    text = re.sub(r"[•▪●◦►▶◆▪]", " ", text)

    # Remove escaped junk (\\n, \\-, \\t)
    text = re.sub(r"\\[ntr]", " ", text)
    text = re.sub(r"\\-", "-", text)

    # Remove URLs (optional but recommended)
    text = re.sub(r"https?://\S+", " ", text)

    # Remove boilerplate sections
    for pattern in JUNK_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
        if match:
            text = text[: match.start()]

    # Collapse whitespace
    text = re.sub(r"\s+", " ", text)

    # Final cleanup
    text = text.strip()

    # Guard against tiny garbage strings
    if len(text) < 50:
        return None

    return text
