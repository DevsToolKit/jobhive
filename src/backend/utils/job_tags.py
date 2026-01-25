from datetime import datetime
import re
from typing import Dict, List

# =========================================================
# NORMALIZATION
# =========================================================

def normalize(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\+\.\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# =========================================================
# TAG DEFINITIONS
# =========================================================

SKILL_TAGS: Dict[str, str] = {
    "python": "Python",
    "java": "Java",
    "javascript": "JavaScript",
    "react": "React",
    "next.js": "Next.js",
    "node": "Node.js",
    "php": "PHP",
    "laravel": "Laravel",
    "sql": "SQL",
    "mysql": "MySQL",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "c++": "C++",
    "spark": "Spark",
    "etl": "ETL",
    "machine learning": "AI / ML",
    "deep learning": "AI / ML",
    "data engineering": "Data Engineering"
}

ROLE_KEYWORDS = {
    "Frontend": ["frontend", "react", "ui", "ux", "html", "css"],
    "Backend": ["backend", "java", "python", "node", "php", "api", "microservices"],
    "Full Stack": ["full stack", "mern", "laravel", "django"],
    "Data": ["data", "etl", "spark", "analytics", "ml"]
}

DOMAIN_KEYWORDS = {
    "AI / ML": ["machine learning", "deep learning", "lstm", "ai"],
    "Cloud": ["aws", "azure", "gcp", "cloud"],
    "Finance": ["trading", "bank", "finance", "equity", "electronic trading"]
}

SENIOR_KEYWORDS = ["lead", "senior", "principal", "staff"]
JUNIOR_KEYWORDS = ["junior", "fresher", "entry"]


# =========================================================
# CORE TAG EXTRACTOR
# =========================================================

def extract_tags(row: dict) -> List[str]:
    """
    Extracts and ranks tags for a job.
    Returns max 3 tags.
    """

    tag_scores: Dict[str, int] = {}

    title = normalize(row.get("title"))
    description = normalize(row.get("description"))
    text = f"{title} {description}"

    # -----------------------------------------------------
    # PRIMARY SKILLS (highest weight)
    # -----------------------------------------------------
    for keyword, tag in SKILL_TAGS.items():
        if keyword in text:
            tag_scores[tag] = tag_scores.get(tag, 0) + 6

    # -----------------------------------------------------
    # ROLE TYPE
    # -----------------------------------------------------
    for role, keywords in ROLE_KEYWORDS.items():
        if any(k in text for k in keywords):
            tag_scores[role] = tag_scores.get(role, 0) + 5

    # -----------------------------------------------------
    # SENIORITY
    # -----------------------------------------------------
    if any(k in title for k in SENIOR_KEYWORDS):
        tag_scores["Senior"] = 6
    elif any(k in title for k in JUNIOR_KEYWORDS):
        tag_scores["Junior"] = 6

    # -----------------------------------------------------
    # DOMAIN
    # -----------------------------------------------------
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(k in text for k in keywords):
            tag_scores[domain] = tag_scores.get(domain, 0) + 4

    # -----------------------------------------------------
    # WORK MODE
    # -----------------------------------------------------
    if row.get("is_remote") is True:
        tag_scores["Remote"] = 4
    elif "hybrid" in text:
        tag_scores["Hybrid"] = 3

    # -----------------------------------------------------
    # FRESHNESS
    # -----------------------------------------------------
    try:
        posted = datetime.fromisoformat(str(row.get("date_posted")))
        if (datetime.now() - posted).days <= 3:
            tag_scores["New"] = 2
    except Exception:
        pass

    # -----------------------------------------------------
    # FINAL RANKING
    # -----------------------------------------------------
    ranked = sorted(tag_scores.items(), key=lambda x: x[1], reverse=True)

    return [tag for tag, _ in ranked[:3]]
