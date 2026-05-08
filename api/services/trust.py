"""
Trust score engine — Phase 6 headless.

compute_trust_score(product, reviews, transactions) → TrustScore

Score breakdown (100 pts):
  25  — security scan clean (virus_scan_status == 'clean' on approved listing)
  20  — marketplace verified (product.is_verified)
  20  — purchase history     (≥10 completed transactions = 20, ≥1 = 10)
  20  — review quality       (Bayesian-smoothed rating, ≥4.5 = 20, ≥4.0 = 15, ≥3.0 = 8)
  10  — listing age          (≥90 days = 10, ≥30 days = 5)
   5  — quality score        (product.quality_score ≥ 60 = 5, ≥ 40 = 3)

Grade: S ≥ 90, A ≥ 75, B ≥ 55, C ≥ 35, D < 35
Risk label: low / medium / high / critical
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional


@dataclass
class TrustScore:
    score: int               # 0-100
    grade: str               # S / A / B / C / D
    risk_label: str          # low / medium / high / critical
    breakdown: dict          # component scores for transparency
    signals: List[str]       # human-readable positive signals
    warnings: List[str]      # human-readable negative signals


_BAYESIAN_PRIOR_COUNT = 5    # weight of prior when listing has few reviews
_BAYESIAN_PRIOR_MEAN  = 3.0  # assumed mean rating before any reviews


def _bayesian_rating(ratings: List[int]) -> float:
    if not ratings:
        return _BAYESIAN_PRIOR_MEAN
    n   = len(ratings)
    raw = sum(ratings) / n
    return (_BAYESIAN_PRIOR_COUNT * _BAYESIAN_PRIOR_MEAN + sum(ratings)) / (_BAYESIAN_PRIOR_COUNT + n)


def compute_trust_score(
    is_verified: bool,
    quality_score: int,
    download_count: int,
    created_at: datetime,
    virus_scan_status: str,          # 'clean' | 'infected' | 'pending' | 'failed' | ''
    completed_transaction_count: int,
    ratings: List[int],              # list of integer ratings (1-5)
) -> TrustScore:

    breakdown: dict = {}
    signals:   List[str] = []
    warnings:  List[str] = []

    # --- Security scan (25 pts) ---
    if virus_scan_status == "clean":
        breakdown["scan"] = 25
        signals.append("passed VirusTotal security scan")
    elif virus_scan_status == "infected":
        breakdown["scan"] = 0
        warnings.append("FAILED security scan — do not install")
    else:
        breakdown["scan"] = 0
        warnings.append("security scan pending or unavailable")

    # --- Marketplace verified (20 pts) ---
    if is_verified:
        breakdown["verified"] = 20
        signals.append("verified by Agent Resources team")
    else:
        breakdown["verified"] = 0
        warnings.append("not yet verified by marketplace team")

    # --- Purchase history (20 pts) ---
    if completed_transaction_count >= 10:
        breakdown["purchases"] = 20
        signals.append(f"{completed_transaction_count} verified purchases")
    elif completed_transaction_count >= 1:
        breakdown["purchases"] = 10
        signals.append(f"{completed_transaction_count} verified purchase(s)")
    else:
        breakdown["purchases"] = 0
        warnings.append("no purchase history yet")

    # --- Review quality (20 pts, Bayesian smoothed) ---
    bay_rating = _bayesian_rating(ratings)
    if bay_rating >= 4.5:
        breakdown["reviews"] = 20
    elif bay_rating >= 4.0:
        breakdown["reviews"] = 15
    elif bay_rating >= 3.0:
        breakdown["reviews"] = 8
    else:
        breakdown["reviews"] = 0

    if ratings:
        signals.append(f"{len(ratings)} review(s), avg {bay_rating:.1f}/5")
    else:
        warnings.append("no reviews yet")

    # --- Listing age (10 pts) ---
    now = datetime.utcnow()
    created_naive = created_at.replace(tzinfo=None) if created_at.tzinfo else created_at
    age_days = (now - created_naive).days
    if age_days >= 90:
        breakdown["age"] = 10
        signals.append(f"established listing ({age_days} days old)")
    elif age_days >= 30:
        breakdown["age"] = 5
    else:
        breakdown["age"] = 0
        warnings.append("newly listed (< 30 days)")

    # --- Quality score (5 pts) ---
    if quality_score >= 60:
        breakdown["quality"] = 5
        signals.append(f"quality score {quality_score}/100")
    elif quality_score >= 40:
        breakdown["quality"] = 3
    else:
        breakdown["quality"] = 0

    total = sum(breakdown.values())

    # Grade
    if total >= 90:
        grade = "S"
    elif total >= 75:
        grade = "A"
    elif total >= 55:
        grade = "B"
    elif total >= 35:
        grade = "C"
    else:
        grade = "D"

    # Risk label — hard override if scan failed
    if virus_scan_status == "infected":
        risk_label = "critical"
    elif total >= 75:
        risk_label = "low"
    elif total >= 55:
        risk_label = "medium"
    elif total >= 35:
        risk_label = "high"
    else:
        risk_label = "critical"

    return TrustScore(
        score=total,
        grade=grade,
        risk_label=risk_label,
        breakdown=breakdown,
        signals=signals,
        warnings=warnings,
    )


def trust_score_dict(ts: TrustScore) -> dict:
    return {
        "score":      ts.score,
        "grade":      ts.grade,
        "risk_label": ts.risk_label,
        "breakdown":  ts.breakdown,
        "signals":    ts.signals,
        "warnings":   ts.warnings,
    }
