def calculate_normalized_velocity_score(lvi_current, lvi_min=0, lvi_max=150):
    if lvi_current > lvi_max:
        return 100
    return round(((lvi_current - lvi_min) / (lvi_max - lvi_min)) * 100, 2)
