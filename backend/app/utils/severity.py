# backend/app/utils/severity.py
"""
Single source of truth for task cost severity thresholds.
The tasks-detail endpoint, future supervisor-filter view, and Power BI
all inherit from SEVERITY_THRESHOLDS — never duplicate these numbers.
"""

SEVERITY_THRESHOLDS = [
    (15_000, 'sev1'),  # task_cost > ₹15,000  →  भारी
    (10_000, 'sev2'),  # ₹10,000 – ₹15,000   →  अधिक
    ( 5_000, 'sev3'),  # ₹5,000  – ₹10,000   →  मध्यम
]


def cost_severity(task_cost: float):
    """
    Derive severity from live task cost (sum of WO resources).
    Returns None when cost == 0 so the frontend skips the badge entirely.
    """
    if task_cost <= 0:
        return None
    for threshold, level in SEVERITY_THRESHOLDS:
        if task_cost > threshold:
            return level
    return 'sev4'  # ₹1 – ₹5,000  →  सामान्य
