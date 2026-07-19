"""
normalizer.py
Min-Max normalization for the NetworkVelocityScore (LVI - Layering Velocity Index).

Formula (per Phase 2 spec, section 2.6.1):
    Velocity Score = [ (LVI_current - LVI_min) / (LVI_max - LVI_min) ] * 100

UPDATED: LVI_MIN and LVI_MAX below are now computed from the REAL PaySim
dataset (not the originally hardcoded placeholder values of 0 and 150).

Source: load_paysim_data.py, run against a 50,000-row sample containing
3,539 transactions from 1,776 accounts that transacted 2+ times (out of
~2.77M unique accounts scanned in the full PaySim CSV).

Real computed values:
    LVI_min (actual minimum observed)     = 0.0001
    LVI_max (actual maximum observed)     = 0.1000
    LVI_p95 (95th percentile, used below) = 0.0167

We use the 95th percentile as LVI_MAX rather than the raw max, because a
single hyperactive mule account produced an LVI far above the rest of the
distribution -- using the raw max as the ceiling would compress almost every
other account's score down near 0. The 95th percentile keeps normal accounts
spread meaningfully across the 0-100 range while still flagging the top ~5%
of high-velocity accounts as maxed out (capped at 100).
"""

LVI_MIN = 0.0001
LVI_MAX = 0.0167  # 95th percentile from real PaySim data (see docstring above)


def normalize_lvi(lvi_current: float) -> float:
    """
    Normalizes a raw LVI value to a 0-100 NetworkVelocityScore using
    min-max normalization, capped at 100 for anything above LVI_MAX.

    Args:
        lvi_current: the raw LVI value for an account
                      (LVI = transactions_per_minute * distinct_destination_count)

    Returns:
        A float in [0, 100].
    """
    if lvi_current <= LVI_MIN:
        return 0.0

    score = ((lvi_current - LVI_MIN) / (LVI_MAX - LVI_MIN)) * 100
    return min(score, 100.0)


if __name__ == "__main__":
    # quick sanity checks
    test_values = [0.0, 0.0001, 0.005, 0.0167, 0.05, 0.1]
    for v in test_values:
        print(f"LVI={v:.4f}  ->  NetworkVelocityScore={normalize_lvi(v):.2f}")