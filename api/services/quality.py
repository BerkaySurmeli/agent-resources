"""
Listing quality scoring — called at product creation (approve) time.

Score breakdown (100 pts):
  30  — description length  (≥150 chars = 30, ≥50 = 15, else 0)
  20  — tags                (≥3 = 20, ≥1 = 10, else 0)
  10  — explicit version    (anything other than '1.0.0')
  10  — paid listing        (price_cents > 0)
  30  — Claudia-reviewed    (is_verified = True on the product)

Grade mapping: A ≥ 80, B ≥ 60, C ≥ 40, D < 40
"""


def compute_quality_score(
    description: str,
    tags: list,
    version: str,
    price_cents: int,
    is_verified: bool,
) -> int:
    score = 0

    desc_len = len((description or "").strip())
    if desc_len >= 150:
        score += 30
    elif desc_len >= 50:
        score += 15

    tag_count = len(tags or [])
    if tag_count >= 3:
        score += 20
    elif tag_count >= 1:
        score += 10

    if (version or "1.0.0") != "1.0.0":
        score += 10

    if price_cents > 0:
        score += 10

    if is_verified:
        score += 30

    return score


def quality_grade(score: int) -> str:
    if score >= 80:
        return "A"
    if score >= 60:
        return "B"
    if score >= 40:
        return "C"
    return "D"
