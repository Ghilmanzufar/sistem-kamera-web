def get_rules_for_side(all_rules: list, side: str) -> list:
    """
    Filter aturan berdasarkan sisi ('f-' untuk Front/Depan, 'r-' untuk Rear/Belakang).
    Mendukung input: 'F', 'FRONT', 'R', 'REAR'.
    Menjamin sisi Depan (F) selalu terisolasi secara ketat dari sisi Belakang (R).
    """
    side_str = str(side or 'F').strip().upper()
    is_rear = side_str in ["R", "REAR", "BELAKANG"]
    prefix = "r-" if is_rear else "f-"
    
    # 1. Filter berdasarkan prefix nama_komponen ('f-' atau 'r-')
    filtered = [r for r in all_rules if str(r.get("nama_komponen", "")).lower().startswith(prefix)]
    if filtered:
        return filtered
    
    # 2. Filter berdasarkan field 'sisi' di database
    side_char = "R" if is_rear else "F"
    filtered_by_col = [r for r in all_rules if str(r.get("sisi", "")).strip().upper() == side_char]
    if filtered_by_col:
        return filtered_by_col

    return all_rules

def calculate_inspection_metrics(aturan_aktif: list, label_counts: dict, detected_confidences: list) -> dict:
    """
    Menghitung metrik kelengkapan label dan rata-rata skor keyakinan untuk sisi aktif.
    """
    required_labels = list(set(r.get("nama_komponen", "").lower() for r in aturan_aktif if r.get("nama_komponen")))
    target_avg_conf = aturan_aktif[0].get("avg_confidence", 0.75) if aturan_aktif else 0.75
    target_coverage = aturan_aktif[0].get("min_coverage", 1.0) if aturan_aktif else 1.0
    
    current_avg_conf = (sum(detected_confidences) / len(detected_confidences)) if detected_confidences else 0.0
    detected_required_count = sum(1 for req_lbl in required_labels if label_counts.get(req_lbl, 0) > 0)
    total_required_count = len(required_labels)
    
    detected_ratio = detected_required_count / total_required_count if total_required_count > 0 else 1.0
    labels_complete = (detected_ratio >= target_coverage)
    avg_conf_ok = (current_avg_conf >= target_avg_conf)

    return {
        "required_labels": required_labels,
        "target_avg_conf": target_avg_conf,
        "target_coverage": target_coverage,
        "current_avg_conf": current_avg_conf,
        "detected_required_count": detected_required_count,
        "total_required_count": total_required_count,
        "detected_ratio": detected_ratio,
        "labels_complete": labels_complete,
        "avg_conf_ok": avg_conf_ok
    }
