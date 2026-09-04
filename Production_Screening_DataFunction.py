"""
3_Spotfire_Production_Screening_DataFunction.py
Spotfire Python Data Function - Production Analytics
====================================================
Receives the data already filtered/marked by Spotfire and returns the
production analytics outputs used by the Spotfire dashboard. The current
stable output is the GOR quadrant PNG plus a per-completion summary table.

═══ SPOTFIRE DATA FUNCTION SETUP ═══════════════════════════════════════════

Script type : Python

INPUTS
  Name              Kind        Source
  ──────────────────────────────────────────────────────────────────────────
  production_data   Data Table  The production data table.
                                Use "Limit data using markings" in the input
                                configuration so only marked rows are passed.
    production_data_fallback
                                        Data Table  Same production data table, without marking
                                                                limitation. Used only when production_data is
                                                                empty because no wells are selected.
    analysis_horizon  Value       String Document Property or control value:
                                LAST_12_MONTHS, LAST_24_MONTHS, or ALL_HISTORY.
    analysis_window_anchor Value String Document Property or control value:
                                GLOBAL_DATA_CUTOFF or WELL_LAST_VALID_MONTH.

OUTPUTS
  Name              Kind    Destination
  ──────────────────────────────────────────────────────────────────────────
    image_base64      Value   Document Property → GORvsOilRate  (type: Binary;
                                                            variable name retained for Spotfire compatibility,
                                                            output contains raw PNG bytes, not base64 text)
    well_summary      Data    Spotfire data table for quadrant summaries

═══ DISPLAYING IN SPOTFIRE ══════════════════════════════════════════════════

1. Create a Document Property named GORvsOilRate of type **Binary**.
2. The data function saves the PNG bytes directly into that property.
3. To display the image in a Text Area, use an IronPython data function or
   a custom visualization — Text Area HTML cannot read Binary properties
   directly.  Alternatively, use a "Label" viz with an image binding.

   For a Text Area approach, change the Document Property type to String
   and set the data function output to base64-encoded text instead.

4. Run the data function — the image refreshes automatically on each run.

═════════════════════════════════════════════════════════════════════════════
"""
import io
import re

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.lines import Line2D as _L2D

# ---------------------------------------------------------------------------
# THEME  (Shell palette)
# ---------------------------------------------------------------------------
_BG_OUTER   = "#F5F5F5"
_BG_INNER   = "#FFFFFF"
_GRID_COLOR = "#E0E0E0"
_REF_COLOR  = "#343132"
_TITLE_COL  = "#343132"
_AXIS_COL   = "#007A78"
_TICK_COL   = "#767676"

# Semantic 4-colour quadrant system
# Q2 top-left   : low rate + high GOR  → RED    (problem / urgent)
# Q1 top-right  : high rate + high GOR → AMBER  (monitor / caution)
# Q3 bottom-left: low rate + low GOR   → BLUE   (opportunity / potential)
# Q4 bottom-right:high rate + low GOR  → TEAL   (benchmark / best)
_Q = {
    "Q1": {"fill": "#FBCE07", "point": "#C99500", "label": "High Rate · High GOR"},
    "Q2": {"fill": "#DD1D21", "point": "#DD1D21", "label": "Low Rate · High GOR"},
    "Q3": {"fill": "#007A78", "point": "#4B92B4", "label": "Low Rate · Low GOR"},
    "Q4": {"fill": "#007A78", "point": "#007A78", "label": "High Rate · Low GOR"},
}

# ---------------------------------------------------------------------------
# RESOLVE INPUT
# In Spotfire: production_data is already the marked/filtered subset.
# If no rows are marked, production_data_fallback supplies the full table.
# Standalone fallback: read the enriched CSV filtered to local_campo_filter
# and local_yacimiento_filter (EL CARITO / SJN MUC-1 by default), then write
# canonical local PNG and CSV artifacts.
# ---------------------------------------------------------------------------
_production_data = globals().get("production_data")
_fallback_data = globals().get("production_data_fallback")
_is_local_run = _production_data is None and _fallback_data is None
if _production_data is not None and not _production_data.empty:
    _df = _production_data.copy()
    _input_source = "Marked or filtered production_data"
elif _fallback_data is not None and not _fallback_data.empty:
    _df = _fallback_data.copy()
    _input_source = "Fallback production_data_fallback"
elif _production_data is not None:
    raise ValueError("production_data is empty and production_data_fallback is missing or empty.")
else:
    from pathlib import Path
    _csv = (
        Path(__file__).parents[2]
        / "integration" / "output" / "enriched_inputs"
        / "Hist_Prod_UWI_with_relationship_key.csv"
    )
    _df = pd.read_csv(_csv, dtype=str, keep_default_na=False)
    _local_campo_filter = str(globals().get("local_campo_filter", "EL CARITO"))
    _df = _df[_df["CAMPO"].str.strip().str.upper() == _local_campo_filter.strip().upper()].copy()
    _local_yacimiento_filter = str(globals().get("local_yacimiento_filter", "SJN MUC-1")).strip()
    if _local_yacimiento_filter:
        if "YACIMIENTO" not in _df.columns:
            raise ValueError("Local yacimiento filtering requires a YACIMIENTO column.")
        _local_yacimiento_key = re.sub(r"[^A-Z0-9]+", "", _local_yacimiento_filter.upper())
        _df = _df[
            _df["YACIMIENTO"].astype(str).str.upper().str.replace(r"[^A-Z0-9]+", "", regex=True)
            == _local_yacimiento_key
        ].copy()
        if _df.empty:
            raise ValueError(
                "No local production rows found for "
                f"CAMPO='{_local_campo_filter}' and YACIMIENTO='{_local_yacimiento_filter}'."
            )
    _input_source = "Local enriched CSV"

_analysis_horizon = str(globals().get(
    "analysis_horizon",
    globals().get("local_analysis_horizon", "LAST_12_MONTHS"),
)).strip().upper()
_analysis_window_anchor = str(globals().get(
    "analysis_window_anchor",
    globals().get("local_analysis_window_anchor", "GLOBAL_DATA_CUTOFF"),
)).strip().upper()
_allowed_horizons = {"LAST_12_MONTHS", "LAST_24_MONTHS", "ALL_HISTORY"}
_allowed_window_anchors = {"GLOBAL_DATA_CUTOFF", "WELL_LAST_VALID_MONTH"}
if _analysis_horizon not in _allowed_horizons:
    raise ValueError(
        "analysis_horizon must be one of: " + ", ".join(sorted(_allowed_horizons)) + "."
    )
if _analysis_window_anchor not in _allowed_window_anchors:
    raise ValueError(
        "analysis_window_anchor must be one of: " + ", ".join(sorted(_allowed_window_anchors)) + "."
    )
_analysis_horizon_label = {
    "LAST_12_MONTHS": "Last 12 Months",
    "LAST_24_MONTHS": "Last 24 Months",
    "ALL_HISTORY": "All History",
}[_analysis_horizon]
_analysis_window_anchor_label = {
    "GLOBAL_DATA_CUTOFF": "Global Data Cutoff",
    "WELL_LAST_VALID_MONTH": "Per-Well Last Valid Month",
}[_analysis_window_anchor]

if _df.empty:
    raise ValueError("production_data is empty — check marking/filter in Spotfire.")

_required_columns = [
    "POZO_COMPLET",
    "TasaDiariaPetroleo(bbl/dia)",
    "GOR(scf/stb)",
    "FECHA",
    "PetroleoMensualbbl",
    "GasMensualMcf",
    "AguaMensualbbl",
    "DiasdeProduccion",
]
_missing_columns = [c for c in _required_columns if c not in _df.columns]
if _missing_columns:
    raise ValueError("production_data is missing required column(s): " + ", ".join(_missing_columns))

# Title label derived from the data itself
_campos = _df["CAMPO"].str.strip().unique().tolist() if "CAMPO" in _df.columns else []
if not _campos:
    _campo_label = "Selected data"
elif len(_campos) == 1:
    _campo_label = _campos[0]
else:
    _joined = ", ".join(_campos[:3])
    _campo_label = _joined if len(_joined) <= 45 else f"{_campos[0]}  +{len(_campos) - 1} more campos"

_yacimientos = _df["YACIMIENTO"].astype(str).str.strip().replace("", np.nan).dropna().unique().tolist() if "YACIMIENTO" in _df.columns else []
if len(_campos) == 1 and len(_yacimientos) == 1:
    _scope_status = "Focused scope: 1 CAMPO / 1 YACIMIENTO"
elif _yacimientos:
    _scope_status = "Mixed scope: exploratory comparison"
else:
    _scope_status = "YACIMIENTO unavailable: exploratory comparison"
_scope_campo = _campos[0] if len(_campos) == 1 else f"{len(_campos)} campos"
_scope_yacimiento = " ".join(_yacimientos[0].split()) if len(_yacimientos) == 1 else f"{len(_yacimientos)} yacimientos"
_selection_label = (
    f"{_campo_label} / {_scope_yacimiento}"
    if len(_campos) == 1 and len(_yacimientos) == 1
    else _campo_label
)

# ---------------------------------------------------------------------------
# NUMERIC CONVERSION
# ---------------------------------------------------------------------------
_df["_oil_rate"] = pd.to_numeric(_df["TasaDiariaPetroleo(bbl/dia)"], errors="coerce")
_df["_gor"]      = pd.to_numeric(_df["GOR(scf/stb)"],                errors="coerce")
_df["_fecha"]    = pd.to_datetime(_df["FECHA"], errors="coerce")
_df["_month"] = _df["_fecha"].dt.to_period("M")
_df["_oil_bbl"] = pd.to_numeric(
    _df["PetroleoMensualbbl"] if "PetroleoMensualbbl" in _df.columns else np.nan,
    errors="coerce",
)
_df["_gas_mcf"] = pd.to_numeric(
    _df["GasMensualMcf"] if "GasMensualMcf" in _df.columns else np.nan,
    errors="coerce",
)
_df["_water_bbl"] = pd.to_numeric(
    _df["AguaMensualbbl"] if "AguaMensualbbl" in _df.columns else np.nan,
    errors="coerce",
)
_df["_producing_days"] = pd.to_numeric(
    _df["DiasdeProduccion"] if "DiasdeProduccion" in _df.columns else np.nan,
    errors="coerce",
)
_df["_wcut"] = _df["_water_bbl"] / (_df["_water_bbl"] + _df["_oil_bbl"])
_df["_has_valid_measurements"] = _df["_oil_rate"].gt(0) & _df["_gor"].gt(0)
_df["_has_valid_metrics"] = _df["_fecha"].notna() & _df["_has_valid_measurements"]
_df["_has_valid_operational_measurements"] = (
    _df["_oil_bbl"].gt(0)
    & _df["_gas_mcf"].gt(0)
    & _df["_producing_days"].gt(0)
)

# ---------------------------------------------------------------------------
# MONTHLY ANALYTIC GRAIN
# Aggregate duplicate source records within a completion/month before any
# benchmark or variability calculation. All coverage cutoffs below therefore
# mean distinct calendar months, never source-row counts.
# ---------------------------------------------------------------------------
_MIN_MONTHS_FOR_BENCHMARK = 6
_REFERENCE_PERCENTILE = 0.95
_quality = (
    _df.groupby("POZO_COMPLET", as_index=False)
    .agg(
        n_source_rows=("POZO_COMPLET", "size"),
        n_invalid_date_rows=("_fecha", lambda s: s.isna().sum()),
        n_invalid_oil_gor_rows=("_has_valid_measurements", lambda s: (~s).sum()),
        n_excluded_rows=("_has_valid_metrics", lambda s: (~s).sum()),
    )
)
_monthly = (
    _df.loc[_df["_has_valid_metrics"], ["POZO_COMPLET", "_month", "_oil_rate", "_gor"]]
    .groupby(["POZO_COMPLET", "_month"], as_index=False)
    .agg(
        oil_rate=("_oil_rate", "mean"),
        gor=("_gor", "mean"),
        n_source_rows=("_oil_rate", "size"),
    )
)
_monthly_quality = (
    _monthly.groupby("POZO_COMPLET", as_index=False)
    .agg(
        n_valid_months=("_month", "size"),
        n_duplicate_month_rows=("n_source_rows", lambda s: (s - 1).sum()),
    )
)
_oil_month_counts = (
    _df.loc[_df["_fecha"].notna() & _df["_oil_rate"].gt(0), ["POZO_COMPLET", "_month"]]
    .drop_duplicates()
    .groupby("POZO_COMPLET")
    .size()
)

# ---------------------------------------------------------------------------
# PER-COMPLETION AVERAGES
# ---------------------------------------------------------------------------
_well = (
    _monthly.groupby("POZO_COMPLET", as_index=False)
    .agg(avg_oil=("oil_rate", "mean"), avg_gor=("gor", "mean"))
    .merge(_monthly_quality, on="POZO_COMPLET", how="left")
    .merge(_quality, on="POZO_COMPLET", how="left")
)
if "YACIMIENTO" in _df.columns:
    _yacimiento_by_well = (
        _df.loc[:, ["POZO_COMPLET", "YACIMIENTO"]]
        .assign(YACIMIENTO=lambda frame: frame["YACIMIENTO"].astype(str).str.replace(r"\s+", " ", regex=True).str.strip())
        .loc[lambda frame: frame["YACIMIENTO"].ne("")]
        .drop_duplicates()
        .groupby("POZO_COMPLET")["YACIMIENTO"]
        .agg(" | ".join)
        .to_dict()
    )
else:
    _yacimiento_by_well = {}
if "CAMPO" in _df.columns:
    _campo_by_well = (
        _df.loc[:, ["POZO_COMPLET", "CAMPO"]]
        .assign(CAMPO=lambda frame: frame["CAMPO"].astype(str).str.replace(r"\s+", " ", regex=True).str.strip())
        .loc[lambda frame: frame["CAMPO"].ne("")]
        .drop_duplicates()
        .groupby("POZO_COMPLET")["CAMPO"]
        .agg(" | ".join)
        .to_dict()
    )
else:
    _campo_by_well = {}

# ---------------------------------------------------------------------------
# NORMALIZATION
# Denominator = P95 of sufficiently sampled per-completion averages in the
# selected field/data. Low-coverage completions remain visible, but cannot
# influence the reference scale, thresholds, axes, or variability bars.
# ---------------------------------------------------------------------------
_benchmark_well = _well[_well["n_valid_months"] >= _MIN_MONTHS_FOR_BENCHMARK]
_reference_avg_oil = _benchmark_well["avg_oil"].quantile(_REFERENCE_PERCENTILE)
_reference_avg_gor = _benchmark_well["avg_gor"].quantile(_REFERENCE_PERCENTILE)

if not np.isfinite(_reference_avg_oil) or _reference_avg_oil <= 0:
    raise ValueError(
        "production_data has no completion with at least "
        f"{_MIN_MONTHS_FOR_BENCHMARK} months of positive oil-rate and GOR values."
    )
if not np.isfinite(_reference_avg_gor) or _reference_avg_gor <= 0:
    raise ValueError(
        "production_data has no completion with at least "
        f"{_MIN_MONTHS_FOR_BENCHMARK} months of positive oil-rate and GOR values."
    )

_monthly["_nX"] = _monthly["oil_rate"] / _reference_avg_oil
_monthly["_nY"] = _monthly["gor"]      / _reference_avg_gor
_well["nX"] = _well["avg_oil"] / _reference_avg_oil
_well["nY"] = _well["avg_gor"] / _reference_avg_gor
_well["Is_Historical_Benchmark_Eligible"] = _well["n_valid_months"].ge(_MIN_MONTHS_FOR_BENCHMARK)

_thr_X = _benchmark_well["avg_oil"].mean() / _reference_avg_oil
_thr_Y = _benchmark_well["avg_gor"].mean() / _reference_avg_gor

if not np.isfinite(_thr_X) or not np.isfinite(_thr_Y):
    raise ValueError("production_data does not contain enough numeric oil-rate/GOR rows to calculate plot thresholds.")

# ---------------------------------------------------------------------------
# QUADRANT ASSIGNMENT
# ---------------------------------------------------------------------------
def _assign(xv, yv, tx, ty):
    q = np.full(len(xv), "", dtype=object)
    q[ (xv >= tx) &  (yv >= ty)] = "Q1"
    q[~(xv >= tx) &  (yv >= ty)] = "Q2"
    q[~(xv >= tx) & ~(yv >= ty)] = "Q3"
    q[ (xv >= tx) & ~(yv >= ty)] = "Q4"
    return q

_xv = _well["nX"].to_numpy(dtype=float)
_yv = _well["nY"].to_numpy(dtype=float)
_nm = _well["POZO_COMPLET"].values
_ok = (~np.isnan(_xv)) & (~np.isnan(_yv)) & (_xv > 0) & (_yv > 0)
_xv, _yv, _nm = _xv[_ok], _yv[_ok], _nm[_ok]
_qs  = _assign(_xv, _yv, _thr_X, _thr_Y)
_w2q = dict(zip(_nm, _qs))

_nX = _monthly["_nX"].to_numpy(dtype=float)
_nY = _monthly["_nY"].to_numpy(dtype=float)
_mv = (~np.isnan(_nX)) & (~np.isnan(_nY)) & (_nX > 0) & (_nY > 0)
_mx = _nX[_mv]
_my = _nY[_mv]
_monthly_wells = _monthly["POZO_COMPLET"].values[_mv]
_mq = np.array([_w2q.get(w, "Q3") for w in _monthly_wells])
_eligible_wells = set(_benchmark_well["POZO_COMPLET"])
_monthly_is_eligible = np.array([w in _eligible_wells for w in _monthly_wells])

if len(_xv) == 0 or len(_mx) == 0:
    raise ValueError("production_data has no valid completion/month rows after numeric conversion.")

_qc  = {q: int((_qs == q).sum()) for q in ["Q1","Q2","Q3","Q4"]}
_well_nmo = dict(zip(_well["POZO_COMPLET"].values, _well["n_valid_months"].values))
_variability = (
    _monthly.loc[_mv, ["POZO_COMPLET", "_nX", "_nY"]]
    .groupby("POZO_COMPLET")
    .agg(
        x_p25=("_nX", lambda s: s.quantile(0.25)),
        x_p75=("_nX", lambda s: s.quantile(0.75)),
        y_p25=("_nY", lambda s: s.quantile(0.25)),
        y_p75=("_nY", lambda s: s.quantile(0.75)),
        n_valid_months=("_nX", "count"),
    )
)
_var_lookup = {idx: row.to_dict() for idx, row in _variability.iterrows()}

# ---------------------------------------------------------------------------
# SUMMARY TABLE → Spotfire output variable: well_summary  (type: Data Table)
# ---------------------------------------------------------------------------
_well_vals = _well.set_index("POZO_COMPLET")[["avg_oil", "avg_gor"]]
_avg_oil_by_well = _well_vals["avg_oil"].astype(float).to_dict()
_avg_gor_by_well = _well_vals["avg_gor"].astype(float).to_dict()
_var_summary = _variability.reindex(_nm)
_x_p25 = _var_summary["x_p25"].to_numpy(dtype=float)
_x_p75 = _var_summary["x_p75"].to_numpy(dtype=float)
_y_p25 = _var_summary["y_p25"].to_numpy(dtype=float)
_y_p75 = _var_summary["y_p75"].to_numpy(dtype=float)
_is_historical_benchmark_eligible = np.array([n in _eligible_wells for n in _nm])

# Spotfire error bars add/subtract the Upper/Lower value from the marker's
# own position (like matplotlib's xerr/yerr) — they are NOT absolute axis
# coordinates. So we export distances-from-center, not the raw P25/P75
# values, otherwise Spotfire double-applies the center offset.
# Low-side distance is capped below the center value so the resulting
# lower bound stays positive (required for log-scale axes).
_oil_err_low  = np.where(_is_historical_benchmark_eligible, np.minimum(np.maximum(_xv - _x_p25, 0.0), _xv * 0.97), np.nan)
_oil_err_high = np.where(_is_historical_benchmark_eligible, np.maximum(_x_p75 - _xv, 0.0), np.nan)
_gor_err_low  = np.where(_is_historical_benchmark_eligible, np.minimum(np.maximum(_yv - _y_p25, 0.0), _yv * 0.97), np.nan)
_gor_err_high = np.where(_is_historical_benchmark_eligible, np.maximum(_y_p75 - _yv, 0.0), np.nan)

# ---------------------------------------------------------------------------
# LAST-12-MONTHS SNAPSHOT (anchored to each well's own last reported month)
# Kept separate from the lifetime average used for the quadrant/scatter plot
# (which stays stable for cross-well benchmarking). This gives a "current
# condition" view without letting old wells' historical peaks distort it.
# ---------------------------------------------------------------------------
_last_month_by_well = _monthly.groupby("POZO_COMPLET")["_month"].transform("max")
_last12_mask = _monthly["_month"] >= (_last_month_by_well - 11)

_last12 = (
    _monthly.loc[_last12_mask, ["POZO_COMPLET", "oil_rate", "gor", "_month"]]
    .groupby("POZO_COMPLET")
    .agg(
        avg_oil_12mo=("oil_rate", "mean"),
        avg_gor_12mo=("gor", "mean"),
        n_valid_months_12mo=("_month", "count"),
        last_reported_month=("_month", "max"),
    )
)
_last12_reindexed = _last12.reindex(_nm)
_avg_oil_12mo = _last12_reindexed["avg_oil_12mo"].to_numpy(dtype=float)
_avg_gor_12mo = _last12_reindexed["avg_gor_12mo"].to_numpy(dtype=float)
_n_valid_months_12mo = _last12_reindexed["n_valid_months_12mo"].fillna(0).to_numpy(dtype=int)
_last_reported_month = _last12_reindexed["last_reported_month"]

_norm_oil_12mo = _avg_oil_12mo / _reference_avg_oil
_norm_gor_12mo = _avg_gor_12mo / _reference_avg_gor

# The historical-scale metrics above answer how recent performance compares
# with the best lifetime result. The fields below instead rank eligible wells
# against the best current 12-month average, so each current cluster has a 1.0
# benchmark. Keep low-coverage and stale wells out of the denominator and
# expose the rule explicitly for filtering in Spotfire.
_MIN_MONTHS_LAST12 = 6
_MAX_REPORTING_LAG_MONTHS = 18
_latest_data_month = _monthly["_month"].max()
if pd.notna(_latest_data_month):
    _current_cluster_recency_cutoff = _latest_data_month - _MAX_REPORTING_LAG_MONTHS
    _recently_reported = _last_reported_month.ge(_current_cluster_recency_cutoff).fillna(False).to_numpy(dtype=bool)
    _latest_data_date_label = _latest_data_month.to_timestamp(how="end").strftime("%Y-%m-%d")
else:
    _current_cluster_recency_cutoff = None
    _recently_reported = np.zeros(len(_nm), dtype=bool)
    _latest_data_date_label = ""
_last12_eligible = (
    (_n_valid_months_12mo >= _MIN_MONTHS_LAST12)
    & _recently_reported
    & np.isfinite(_avg_oil_12mo)
    & np.isfinite(_avg_gor_12mo)
    & (_avg_oil_12mo > 0)
    & (_avg_gor_12mo > 0)
)
if _last12_eligible.any():
    _max_avg_oil_12mo = _avg_oil_12mo[_last12_eligible].max()
    _max_avg_gor_12mo = _avg_gor_12mo[_last12_eligible].max()
    _norm_oil_12mo_cluster = np.where(_last12_eligible, _avg_oil_12mo / _max_avg_oil_12mo, np.nan)
    _norm_gor_12mo_cluster = np.where(_last12_eligible, _avg_gor_12mo / _max_avg_gor_12mo, np.nan)
    _thr_x_12mo_cluster = float(np.nanmean(_norm_oil_12mo_cluster))
    _thr_y_12mo_cluster = float(np.nanmean(_norm_gor_12mo_cluster))
else:
    _max_avg_oil_12mo = np.nan
    _max_avg_gor_12mo = np.nan
    _norm_oil_12mo_cluster = np.full(len(_nm), np.nan)
    _norm_gor_12mo_cluster = np.full(len(_nm), np.nan)
    _thr_x_12mo_cluster = np.nan
    _thr_y_12mo_cluster = np.nan

_quadrant_12mo_cluster = np.full(len(_nm), "Insufficient Data", dtype=object)
if _last12_eligible.any():
    _quadrant_12mo_cluster[_last12_eligible] = _assign(
        _norm_oil_12mo_cluster[_last12_eligible],
        _norm_gor_12mo_cluster[_last12_eligible],
        _thr_x_12mo_cluster,
        _thr_y_12mo_cluster,
    )

def _recent_flag(recent, p25, p75):
    if np.isnan(recent):
        return "Insufficient Data"
    if recent < p25:
        return "Below P25 (declining)"
    if recent > p75:
        return "Above P75 (improving)"
    return "Within P25-P75 (stable)"

_recent_oil_flag = [_recent_flag(r, p25, p75) for r, p25, p75 in zip(_norm_oil_12mo, _x_p25, _x_p75)]
_recent_gor_flag = [_recent_flag(r, p25, p75) for r, p25, p75 in zip(_norm_gor_12mo, _y_p25, _y_p75)]

# ---------------------------------------------------------------------------
# SELECTED-HORIZON EXPLORATORY SCREENING
# Historical quadrant fields above remain unchanged for dashboard continuity.
# These Selected_* columns use operational volumetric calculations.
# ---------------------------------------------------------------------------
_ANALYSIS_MIN_MONTHS = 6
_analysis_row_mask = _df["_fecha"].notna() & _df["_has_valid_operational_measurements"]
_analysis_monthly_all = (
    _df.loc[
        _analysis_row_mask,
        [
            "POZO_COMPLET", "_month", "_oil_bbl", "_gas_mcf", "_water_bbl",
            "_producing_days",
        ],
    ]
    .groupby(["POZO_COMPLET", "_month"], as_index=False)
    .agg(
        oil_bbl=("_oil_bbl", "sum"),
        gas_mcf=("_gas_mcf", "sum"),
        water_bbl=("_water_bbl", lambda s: s.sum(min_count=1)),
        producing_days=("_producing_days", "sum"),
        n_source_rows=("_oil_bbl", "size"),
    )
)
_analysis_monthly_all["oil_rate"] = (
    _analysis_monthly_all["oil_bbl"]
    / _analysis_monthly_all["producing_days"].where(_analysis_monthly_all["producing_days"].gt(0))
)
_analysis_monthly_all["gor"] = (
    1000 * _analysis_monthly_all["gas_mcf"]
    / _analysis_monthly_all["oil_bbl"].where(_analysis_monthly_all["oil_bbl"].gt(0))
)
_analysis_monthly_all["wcut"] = (
    _analysis_monthly_all["water_bbl"]
    / (_analysis_monthly_all["water_bbl"] + _analysis_monthly_all["oil_bbl"])
)

if _analysis_monthly_all.empty:
    raise ValueError("production_data has no valid operational volume rows.")

_analysis_end_month = _analysis_monthly_all["_month"].max()
_analysis_horizon_months = {
    "LAST_12_MONTHS": 12,
    "LAST_24_MONTHS": 24,
    "ALL_HISTORY": None,
}[_analysis_horizon]
if _analysis_horizon_months is None:
    _analysis_start_month = _analysis_monthly_all["_month"].min()
    _analysis_selected_monthly = _analysis_monthly_all.copy()
    _analysis_prior_monthly = _analysis_monthly_all.iloc[0:0].copy()
    _analysis_window_start_label = _analysis_start_month.strftime("%Y-%m")
    _analysis_window_end_label = _analysis_end_month.strftime("%Y-%m")
    _analysis_window_caption = f"All History: {_analysis_window_start_label} to {_analysis_window_end_label}"
elif _analysis_window_anchor == "GLOBAL_DATA_CUTOFF":
    _analysis_start_month = _analysis_end_month - (_analysis_horizon_months - 1)
    _analysis_selected_monthly = _analysis_monthly_all.loc[
        _analysis_monthly_all["_month"].between(_analysis_start_month, _analysis_end_month)
    ].copy()
    _analysis_prior_start_month = _analysis_start_month - _analysis_horizon_months
    _analysis_prior_end_month = _analysis_start_month - 1
    _analysis_prior_monthly = _analysis_monthly_all.loc[
        _analysis_monthly_all["_month"].between(_analysis_prior_start_month, _analysis_prior_end_month)
    ].copy()
    _analysis_window_start_label = _analysis_start_month.strftime("%Y-%m")
    _analysis_window_end_label = _analysis_end_month.strftime("%Y-%m")
    _analysis_window_caption = (
        f"{_analysis_horizon_label}: {_analysis_window_start_label} to {_analysis_window_end_label}"
    )
else:
    _analysis_last_month_by_well = _analysis_monthly_all.groupby("POZO_COMPLET")["_month"].transform("max")
    _analysis_selected_monthly = _analysis_monthly_all.loc[
        _analysis_monthly_all["_month"].ge(_analysis_last_month_by_well - (_analysis_horizon_months - 1))
    ].copy()
    _analysis_prior_monthly = _analysis_monthly_all.loc[
        _analysis_monthly_all["_month"].ge(_analysis_last_month_by_well - (2 * _analysis_horizon_months - 1))
        & _analysis_monthly_all["_month"].le(_analysis_last_month_by_well - _analysis_horizon_months)
    ].copy()
    _analysis_start_month = _analysis_end_month - (_analysis_horizon_months - 1)
    _analysis_window_start_label = "Per-well trailing window"
    _analysis_window_end_label = "Per-well last valid month"
    _analysis_window_caption = (
        f"{_analysis_horizon_label}: trailing window anchored to each well's last valid month"
    )

def _summarize_analysis_window(monthly, prefix):
    _summary_columns = [
        "POZO_COMPLET", f"{prefix}_N_Valid_Months", f"{prefix}_Latest_Month",
        f"{prefix}_Total_Oil_bbl", f"{prefix}_Total_Gas_Mcf", f"{prefix}_Total_Water_bbl",
        f"{prefix}_Producing_Days", f"{prefix}_Oil_Rate_bbl_d", f"{prefix}_GOR_scf_stb",
        f"{prefix}_WCut_Fraction",
    ]
    if monthly.empty:
        return pd.DataFrame(columns=_summary_columns)
    _summary = (
        monthly.groupby("POZO_COMPLET", as_index=False)
        .agg(
            n_valid_months=("_month", "size"),
            latest_month=("_month", "max"),
            oil_bbl=("oil_bbl", lambda s: s.sum(min_count=1)),
            gas_mcf=("gas_mcf", lambda s: s.sum(min_count=1)),
            water_bbl=("water_bbl", lambda s: s.sum(min_count=1)),
            producing_days=("producing_days", lambda s: s.sum(min_count=1)),
            oil_rate=("oil_rate", "mean"),
            gor=("gor", "mean"),
            wcut=("wcut", "mean"),
        )
    )
    _summary["oil_rate"] = _summary["oil_bbl"] / _summary["producing_days"].where(_summary["producing_days"].gt(0))
    _summary["gor"] = 1000 * _summary["gas_mcf"] / _summary["oil_bbl"].where(_summary["oil_bbl"].gt(0))
    _summary["wcut"] = _summary["water_bbl"] / (_summary["water_bbl"] + _summary["oil_bbl"])
    return _summary.rename(columns={
        "n_valid_months": f"{prefix}_N_Valid_Months",
        "latest_month": f"{prefix}_Latest_Month",
        "oil_bbl": f"{prefix}_Total_Oil_bbl",
        "gas_mcf": f"{prefix}_Total_Gas_Mcf",
        "water_bbl": f"{prefix}_Total_Water_bbl",
        "producing_days": f"{prefix}_Producing_Days",
        "oil_rate": f"{prefix}_Oil_Rate_bbl_d",
        "gor": f"{prefix}_GOR_scf_stb",
        "wcut": f"{prefix}_WCut_Fraction",
    })

_analysis_selected = _summarize_analysis_window(_analysis_selected_monthly, "Selected")
_analysis_prior = _summarize_analysis_window(_analysis_prior_monthly, "Prior")
_analysis_selected["Is_Selected_Horizon_Recently_Reported"] = _analysis_selected["Selected_Latest_Month"].ge(
    _analysis_end_month - _MAX_REPORTING_LAG_MONTHS
)
_analysis_selected["Has_Selected_Horizon_Coverage"] = (
    _analysis_selected["Selected_N_Valid_Months"].ge(_ANALYSIS_MIN_MONTHS)
    & _analysis_selected["Selected_Oil_Rate_bbl_d"].gt(0)
    & _analysis_selected["Selected_GOR_scf_stb"].gt(0)
)
_requires_selected_recency = (
    _analysis_horizon != "ALL_HISTORY"
    and _analysis_window_anchor == "GLOBAL_DATA_CUTOFF"
)
_analysis_selected["Is_Selected_Horizon_Eligible"] = (
    _analysis_selected["Has_Selected_Horizon_Coverage"]
    & (
        _analysis_selected["Is_Selected_Horizon_Recently_Reported"]
        if _requires_selected_recency
        else True
    )
)
_analysis_benchmark = _analysis_selected.loc[_analysis_selected["Is_Selected_Horizon_Eligible"]].copy()
if _analysis_benchmark.empty:
    _analysis_reference_oil = np.nan
    _analysis_reference_gor = np.nan
    _analysis_thr_x = np.nan
    _analysis_thr_y = np.nan
    _analysis_wcut_reference = np.nan
else:
    _analysis_reference_oil = _analysis_benchmark["Selected_Oil_Rate_bbl_d"].quantile(_REFERENCE_PERCENTILE)
    _analysis_reference_gor = _analysis_benchmark["Selected_GOR_scf_stb"].quantile(_REFERENCE_PERCENTILE)
    _analysis_selected["Selected_Norm_Oil_Rate"] = (
        _analysis_selected["Selected_Oil_Rate_bbl_d"] / _analysis_reference_oil
    )
    _analysis_selected["Selected_Norm_GOR"] = (
        _analysis_selected["Selected_GOR_scf_stb"] / _analysis_reference_gor
    )
    _analysis_thr_x = _analysis_selected.loc[
        _analysis_selected["Is_Selected_Horizon_Eligible"], "Selected_Norm_Oil_Rate"
    ].mean()
    _analysis_thr_y = _analysis_selected.loc[
        _analysis_selected["Is_Selected_Horizon_Eligible"], "Selected_Norm_GOR"
    ].mean()
    _analysis_wcut_reference = _analysis_selected.loc[
        _analysis_selected["Is_Selected_Horizon_Eligible"], "Selected_WCut_Fraction"
    ].mean()

if "Selected_Norm_Oil_Rate" not in _analysis_selected.columns:
    _analysis_selected["Selected_Norm_Oil_Rate"] = np.nan
    _analysis_selected["Selected_Norm_GOR"] = np.nan
_selected_variability = pd.DataFrame(columns=[
    "POZO_COMPLET", "Selected_Norm_Oil_Rate_P25", "Selected_Norm_Oil_Rate_P75",
    "Selected_Norm_GOR_P25", "Selected_Norm_GOR_P75",
])
if np.isfinite(_analysis_reference_oil) and np.isfinite(_analysis_reference_gor):
    _analysis_selected_monthly["_selected_nX"] = (
        _analysis_selected_monthly["oil_rate"] / _analysis_reference_oil
    )
    _analysis_selected_monthly["_selected_nY"] = (
        _analysis_selected_monthly["gor"] / _analysis_reference_gor
    )
    _selected_variability = (
        _analysis_selected_monthly.loc[
            _analysis_selected_monthly["_selected_nX"].gt(0)
            & _analysis_selected_monthly["_selected_nY"].gt(0),
            ["POZO_COMPLET", "_selected_nX", "_selected_nY"],
        ]
        .groupby("POZO_COMPLET", as_index=False)
        .agg(
            Selected_Norm_Oil_Rate_P25=("_selected_nX", lambda s: s.quantile(0.25)),
            Selected_Norm_Oil_Rate_P75=("_selected_nX", lambda s: s.quantile(0.75)),
            Selected_Norm_GOR_P25=("_selected_nY", lambda s: s.quantile(0.25)),
            Selected_Norm_GOR_P75=("_selected_nY", lambda s: s.quantile(0.75)),
        )
    )
_analysis_selected["Selected_Quadrant"] = "Insufficient Current Coverage"
if _requires_selected_recency:
    _analysis_selected.loc[
        _analysis_selected["Has_Selected_Horizon_Coverage"]
        & ~_analysis_selected["Is_Selected_Horizon_Recently_Reported"],
        "Selected_Quadrant",
    ] = "Stale / Historical Context"
if np.isfinite(_analysis_thr_x) and np.isfinite(_analysis_thr_y):
    _analysis_eligible_index = _analysis_selected["Is_Selected_Horizon_Eligible"]
    _analysis_selected.loc[_analysis_eligible_index, "Selected_Quadrant"] = _assign(
        _analysis_selected.loc[_analysis_eligible_index, "Selected_Norm_Oil_Rate"].to_numpy(),
        _analysis_selected.loc[_analysis_eligible_index, "Selected_Norm_GOR"].to_numpy(),
        _analysis_thr_x,
        _analysis_thr_y,
    )

_analysis_summary = _analysis_selected.merge(_analysis_prior, on="POZO_COMPLET", how="left")
_analysis_summary["Selected_vs_Prior_Oil_Rate_Change_pct"] = 100 * (
    _analysis_summary["Selected_Oil_Rate_bbl_d"]
    / _analysis_summary["Prior_Oil_Rate_bbl_d"].replace(0, np.nan)
    - 1
)
_analysis_summary["Selected_vs_Prior_GOR_Change_pct"] = 100 * (
    _analysis_summary["Selected_GOR_scf_stb"]
    / _analysis_summary["Prior_GOR_scf_stb"].replace(0, np.nan)
    - 1
)
_analysis_summary["Selected_vs_Prior_WCut_Change_pp"] = 100 * (
    _analysis_summary["Selected_WCut_Fraction"] - _analysis_summary["Prior_WCut_Fraction"]
)
for _screening_numeric_column in (
    "Selected_N_Valid_Months", "Selected_Total_Oil_bbl", "Selected_Total_Gas_Mcf",
    "Selected_Total_Water_bbl", "Selected_Producing_Days", "Selected_Oil_Rate_bbl_d",
    "Selected_GOR_scf_stb", "Selected_WCut_Fraction", "Selected_Norm_Oil_Rate",
    "Selected_Norm_GOR", "Prior_N_Valid_Months", "Prior_Total_Oil_bbl",
    "Prior_Total_Gas_Mcf", "Prior_Total_Water_bbl", "Prior_Producing_Days",
    "Prior_Oil_Rate_bbl_d", "Prior_GOR_scf_stb", "Prior_WCut_Fraction",
    "Selected_vs_Prior_Oil_Rate_Change_pct", "Selected_vs_Prior_GOR_Change_pct",
    "Selected_vs_Prior_WCut_Change_pp",
):
    _analysis_summary[_screening_numeric_column] = pd.to_numeric(
        _analysis_summary[_screening_numeric_column], errors="coerce"
    ).astype(float)
_analysis_summary["Diagnostic_Flag"] = "No Primary Diagnostic Flag"
_analysis_summary.loc[
    _analysis_summary["Selected_Quadrant"].eq("Insufficient Current Coverage"),
    "Diagnostic_Flag",
] = "Insufficient Current Coverage"
_analysis_summary.loc[
    _analysis_summary["Selected_Quadrant"].eq("Stale / Historical Context"),
    "Diagnostic_Flag",
] = "Stale / Historical Context"
_analysis_high_water = (
    _analysis_summary["Is_Selected_Horizon_Eligible"]
    & _analysis_summary["Selected_WCut_Fraction"].ge(_analysis_wcut_reference)
)
_analysis_high_gor = _analysis_summary["Selected_Quadrant"].isin(["Q1", "Q2"])
_analysis_low_rate = _analysis_summary["Selected_Quadrant"].isin(["Q2", "Q3"])
_analysis_summary.loc[_analysis_high_gor & _analysis_high_water, "Diagnostic_Flag"] = "Mixed Signals"
_analysis_summary.loc[_analysis_high_water & ~_analysis_high_gor, "Diagnostic_Flag"] = "Water Management Review"
_analysis_summary.loc[_analysis_high_gor & ~_analysis_high_water, "Diagnostic_Flag"] = "Gas Behavior Review"
_analysis_summary.loc[
    _analysis_low_rate & ~_analysis_high_gor & ~_analysis_high_water,
    "Diagnostic_Flag",
] = "Productivity / Deliverability Review"
_analysis_summary = (
    pd.DataFrame({"POZO_COMPLET": _nm})
    .merge(_analysis_summary, on="POZO_COMPLET", how="left")
    .merge(_selected_variability, on="POZO_COMPLET", how="left")
)
for _analysis_flag_column in (
    "Has_Selected_Horizon_Coverage",
    "Is_Selected_Horizon_Recently_Reported",
    "Is_Selected_Horizon_Eligible",
):
    _analysis_summary[_analysis_flag_column] = _analysis_summary[_analysis_flag_column].fillna(False)
_analysis_summary["Selected_Quadrant"] = _analysis_summary["Selected_Quadrant"].fillna(
    "Insufficient Current Coverage"
)
_analysis_summary["Diagnostic_Flag"] = _analysis_summary["Diagnostic_Flag"].fillna(
    "Insufficient Current Coverage"
)
_selected_error_eligible = _analysis_summary["Is_Selected_Horizon_Eligible"].eq(True)
_analysis_summary["Selected_Norm_Oil_Rate_Err_Low"] = np.where(
    _selected_error_eligible,
    np.minimum(
        np.maximum(
            _analysis_summary["Selected_Norm_Oil_Rate"]
            - _analysis_summary["Selected_Norm_Oil_Rate_P25"],
            0.0,
        ),
        _analysis_summary["Selected_Norm_Oil_Rate"] * 0.97,
    ),
    np.nan,
).astype(float)
_analysis_summary["Selected_Norm_Oil_Rate_Err_High"] = np.where(
    _selected_error_eligible,
    np.maximum(
        _analysis_summary["Selected_Norm_Oil_Rate_P75"]
        - _analysis_summary["Selected_Norm_Oil_Rate"],
        0.0,
    ),
    np.nan,
).astype(float)
_analysis_summary["Selected_Norm_GOR_Err_Low"] = np.where(
    _selected_error_eligible,
    np.minimum(
        np.maximum(
            _analysis_summary["Selected_Norm_GOR"]
            - _analysis_summary["Selected_Norm_GOR_P25"],
            0.0,
        ),
        _analysis_summary["Selected_Norm_GOR"] * 0.97,
    ),
    np.nan,
).astype(float)
_analysis_summary["Selected_Norm_GOR_Err_High"] = np.where(
    _selected_error_eligible,
    np.maximum(
        _analysis_summary["Selected_Norm_GOR_P75"]
        - _analysis_summary["Selected_Norm_GOR"],
        0.0,
    ),
    np.nan,
).astype(float)
_analysis_summary = _analysis_summary.drop(columns=[
    "Selected_Norm_Oil_Rate_P25", "Selected_Norm_Oil_Rate_P75",
    "Selected_Norm_GOR_P25", "Selected_Norm_GOR_P75",
])
_analysis_summary["Analysis_Horizon"] = _analysis_horizon
_analysis_summary["Analysis_Window_Anchor"] = _analysis_window_anchor
_analysis_summary["Analysis_Window_Anchor_Label"] = _analysis_window_anchor_label
_analysis_summary["Analysis_Window_Start"] = _analysis_window_start_label
_analysis_summary["Analysis_Window_End"] = _analysis_window_end_label
_analysis_summary["Analysis_Global_Data_Cutoff"] = _analysis_end_month.strftime("%Y-%m")
_analysis_summary["Analysis_Scope_Status"] = _scope_status
_analysis_summary["Scope_Campo"] = _scope_campo
_analysis_summary["Scope_Yacimiento"] = _scope_yacimiento
_analysis_summary["Input_Source"] = _input_source
_analysis_summary["Selected_Peer_Group_Size"] = len(_analysis_benchmark)
_analysis_summary["Selected_P95_Oil_Rate_bbl_d"] = _analysis_reference_oil
_analysis_summary["Selected_P95_GOR_scf_stb"] = _analysis_reference_gor
_analysis_summary["Selected_Threshold_Norm_Oil_Rate"] = _analysis_thr_x
_analysis_summary["Selected_Threshold_Norm_GOR"] = _analysis_thr_y
_analysis_summary["Selected_WCut_Peer_Average"] = _analysis_wcut_reference
_analysis_summary["Selected_Last_Reported_Date"] = _analysis_summary["Selected_Latest_Month"].astype(str).replace("NaT", "")
_analysis_summary = _analysis_summary.drop(columns=["Selected_Latest_Month", "Prior_Latest_Month"], errors="ignore")

# ---------------------------------------------------------------------------
# SELECTED-HORIZON PNG
# The exported PNG is the operational screening view. Historical quadrant
# fields remain in well_summary as context, but do not drive this graphic.
# ---------------------------------------------------------------------------
_selected_plot_wells = _analysis_summary.loc[
    _analysis_summary["Is_Selected_Horizon_Eligible"].eq(True)
    & _analysis_summary["Selected_Quadrant"].isin(_Q)
].copy()
_selected_plot_monthly = _analysis_selected_monthly.copy()
_selected_plot_monthly["_nX"] = (
    _selected_plot_monthly["oil_rate"] / _analysis_reference_oil
)
_selected_plot_monthly["_nY"] = (
    _selected_plot_monthly["gor"] / _analysis_reference_gor
)
_selected_quadrant_by_well = dict(zip(
    _selected_plot_wells["POZO_COMPLET"],
    _selected_plot_wells["Selected_Quadrant"],
))
_selected_plot_monthly["_quadrant"] = _selected_plot_monthly["POZO_COMPLET"].map(
    _selected_quadrant_by_well
)
_selected_plot_monthly = _selected_plot_monthly.loc[
    _selected_plot_monthly["_nX"].gt(0)
    & _selected_plot_monthly["_nY"].gt(0)
    & _selected_plot_monthly["_quadrant"].isin(_Q)
].copy()
_selected_plot_points = _analysis_summary.loc[
    _analysis_summary["Selected_Norm_Oil_Rate"].gt(0)
    & _analysis_summary["Selected_Norm_GOR"].gt(0)
].copy()
_selected_plot_counts = {
    quadrant: int(_selected_plot_wells["Selected_Quadrant"].eq(quadrant).sum())
    for quadrant in ["Q1", "Q2", "Q3", "Q4"]
}
_selected_low_coverage_count = int(
    _analysis_summary["Is_Selected_Horizon_Eligible"].ne(True).sum()
)
_selected_exclusion_label = (
    "Coverage or recency excluded"
    if _requires_selected_recency
    else "Coverage excluded"
)

_selected_fig, _selected_ax = plt.subplots(figsize=(16, 10.6), facecolor=_BG_OUTER)
_selected_ax.set_facecolor(_BG_INNER)
if _selected_plot_wells.empty:
    _selected_ax.text(
        0.5, 0.5,
        "No completions meet the selected-horizon coverage and recency rule.",
        ha="center", va="center", color=_TITLE_COL, fontsize=12,
        transform=_selected_ax.transAxes,
    )
    _selected_ax.set_axis_off()
else:
    _selected_x_values = pd.concat([
        _selected_plot_monthly["_nX"],
        _selected_plot_wells["Selected_Norm_Oil_Rate"],
    ]).dropna().to_numpy(dtype=float)
    _selected_y_values = pd.concat([
        _selected_plot_monthly["_nY"],
        _selected_plot_wells["Selected_Norm_GOR"],
    ]).dropna().to_numpy(dtype=float)
    _selected_xlo = max(np.percentile(_selected_x_values, 1) * 0.4, _analysis_thr_x * 0.03)
    _selected_xhi = _selected_x_values.max() * 3.0
    _selected_ylo = max(np.percentile(_selected_y_values, 1) * 0.4, _analysis_thr_y * 0.03)
    _selected_yhi = _selected_y_values.max() * 2.5

    for _qid, _x1, _x2, _y1, _y2 in [
        ("Q1", _analysis_thr_x, _selected_xhi, _analysis_thr_y, _selected_yhi),
        ("Q2", _selected_xlo, _analysis_thr_x, _analysis_thr_y, _selected_yhi),
        ("Q3", _selected_xlo, _analysis_thr_x, _selected_ylo, _analysis_thr_y),
        ("Q4", _analysis_thr_x, _selected_xhi, _selected_ylo, _analysis_thr_y),
    ]:
        _selected_ax.fill_between(
            [_x1, _x2], [_y1, _y1], [_y2, _y2],
            color=_Q[_qid]["fill"], alpha=0.12, zorder=1,
        )

    for _qid in ["Q1", "Q2", "Q3", "Q4"]:
        _selected_monthly_quadrant = _selected_plot_monthly["_quadrant"].eq(_qid)
        _selected_ax.scatter(
            _selected_plot_monthly.loc[_selected_monthly_quadrant, "_nX"],
            _selected_plot_monthly.loc[_selected_monthly_quadrant, "_nY"],
            s=8, color=_Q[_qid]["point"], alpha=0.10, linewidths=0, zorder=2,
        )

    for _, _selected_row in _selected_plot_wells.iterrows():
        _selected_qid = _selected_row["Selected_Quadrant"]
        _selected_ax.errorbar(
            _selected_row["Selected_Norm_Oil_Rate"],
            _selected_row["Selected_Norm_GOR"],
            xerr=np.array([[
                _selected_row["Selected_Norm_Oil_Rate_Err_Low"],
                _selected_row["Selected_Norm_Oil_Rate_Err_High"],
            ]]).T,
            yerr=np.array([[
                _selected_row["Selected_Norm_GOR_Err_Low"],
                _selected_row["Selected_Norm_GOR_Err_High"],
            ]]).T,
            fmt="none", ecolor=_Q[_selected_qid]["point"], elinewidth=1.0,
            capsize=2.4, capthick=0.9, alpha=0.54, zorder=4,
        )
        _selected_ax.scatter(
            _selected_row["Selected_Norm_Oil_Rate"],
            _selected_row["Selected_Norm_GOR"],
            s=260, color=_Q[_selected_qid]["point"], alpha=0.96,
            linewidths=1.0, edgecolors="#343132", zorder=5,
        )
        _selected_ax.annotate(
            _selected_row["POZO_COMPLET"],
            xy=(
                _selected_row["Selected_Norm_Oil_Rate"],
                _selected_row["Selected_Norm_GOR"],
            ),
            xytext=(7, 6), textcoords="offset points", fontsize=6.8,
            color="#343132", fontweight="bold", zorder=6,
            bbox=dict(
                boxstyle="round,pad=0.24", facecolor=_Q[_selected_qid]["point"],
                alpha=0.90, edgecolor="#343132", linewidth=0.7,
            ),
        )

    _selected_noneligible = _selected_plot_points.loc[
        _selected_plot_points["Is_Selected_Horizon_Eligible"].ne(True)
    ]
    _selected_ax.scatter(
        _selected_noneligible["Selected_Norm_Oil_Rate"],
        _selected_noneligible["Selected_Norm_GOR"],
        s=90, marker="x", color="#9B9B9B", alpha=0.85,
        linewidths=1.4, zorder=4,
    )
    _selected_ax.axvline(
        _analysis_thr_x, color="#767676", linewidth=1.2,
        linestyle="--", alpha=0.70, zorder=3,
    )
    _selected_ax.axhline(
        _analysis_thr_y, color="#767676", linewidth=1.2,
        linestyle="--", alpha=0.70, zorder=3,
    )
    _selected_ax.set_xscale("log")
    _selected_ax.set_yscale("log")
    _selected_ax.set_xlim(_selected_xlo, _selected_xhi)
    _selected_ax.set_ylim(_selected_ylo, _selected_yhi)
    _selected_ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda value, _: f"{value:g}"))
    _selected_ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda value, _: f"{value:g}"))
    _selected_ax.grid(True, color=_GRID_COLOR, linewidth=0.6, which="major", alpha=0.42, zorder=0)
    _selected_ax.grid(True, color=_GRID_COLOR, linewidth=0.45, which="minor", alpha=0.16, zorder=0)
    _selected_ax.set_axisbelow(True)
    for _selected_spine in _selected_ax.spines.values():
        _selected_spine.set_color("#767676")
    _selected_ax.tick_params(colors=_TICK_COL, which="both", labelsize=9)
    _selected_ax.set_xlabel("Selected-Horizon Normalized Oil Rate (log scale)", color=_AXIS_COL, fontsize=10, labelpad=8)
    _selected_ax.set_ylabel("Selected-Horizon Normalized GOR (log scale)", color=_AXIS_COL, fontsize=10, labelpad=8)
    _selected_legend_handles = [
        _L2D([0], [0], marker="o", color="none", markerfacecolor=_Q[_qid]["point"],
             markeredgecolor=_Q[_qid]["point"], markersize=7, linewidth=0)
        for _qid in ["Q1", "Q2", "Q3", "Q4"]
    ]
    _selected_legend_handles.append(
        _L2D([0], [0], marker="x", color="#9B9B9B", markersize=7, linewidth=0)
    )
    _selected_legend_labels = [
        f"{_qid} · {_Q[_qid]['label']} · {_selected_plot_counts[_qid]} wells"
        for _qid in ["Q1", "Q2", "Q3", "Q4"]
    ]
    _selected_legend_labels.append(
        f"{_selected_exclusion_label} · {_selected_low_coverage_count} wells"
    )
    _selected_ax.legend(
        _selected_legend_handles, _selected_legend_labels,
        loc="upper center", bbox_to_anchor=(0.5, -0.125), ncol=3, fontsize=7.6,
        framealpha=0.96, labelcolor="#343132", facecolor="#FFFFFF", edgecolor="#E0E0E0",
        borderpad=0.55, handletextpad=0.42, columnspacing=1.1,
    )

_selected_ax.set_title(
    f"Production Screening: GOR vs. Oil Rate (Selected Horizon, Log-Log)\n"
    f"{_analysis_window_caption}  ·  {_analysis_window_anchor_label}  ·  Operational Volumetric\n"
    f"{_selection_label}  ·  {len(_analysis_summary)} completions  ·  P95 reference from {_analysis_benchmark.shape[0]} comparable wells",
    color=_TITLE_COL, fontsize=11, loc="left", pad=10,
)
_selected_fig.tight_layout(rect=(0, 0.08, 1, 1))
_selected_buf = io.BytesIO()
try:
    _selected_fig.savefig(
        _selected_buf, format="png", dpi=200, bbox_inches="tight", facecolor=_BG_OUTER,
    )
    _selected_buf.seek(0)
    image_base64 = _selected_buf.read()
finally:
    plt.close(_selected_fig)
    _selected_buf.close()

well_summary = pd.DataFrame({
    "POZO_COMPLET":       _nm,
    "CAMPO":              [_campo_by_well.get(n, "") for n in _nm],
    "YACIMIENTO":         [_yacimiento_by_well.get(n, "") for n in _nm],
    "Historical_Quadrant": _qs,
    "Historical_Quadrant_Label": [_Q[q]["label"] for q in _qs],
    "Quadrant":           _qs,
    "Quadrant_Label":     [_Q[q]["label"] for q in _qs],
    "Norm_Oil_Rate":      np.round(_xv, 6),
    "Norm_GOR":           np.round(_yv, 6),
    "Plot_Avg_X_Line":    round(float(_thr_X), 6),
    "Plot_Avg_Y_Line":    round(float(_thr_Y), 6),
    "Summary_Avg_X_Line": round(float(np.mean(_xv)), 6),
    "Summary_Avg_Y_Line": round(float(np.mean(_yv)), 6),
    "Threshold_Basis":    f"Per-completion monthly averages; normalized by P95 of completions with >= {_MIN_MONTHS_FOR_BENCHMARK} valid calendar months",
    "N_Months":           [int(_well_nmo.get(n, 0)) for n in _nm],
    "N_Oil_Rate_Months":  [int(_oil_month_counts.get(n, 0)) for n in _nm],
    "N_Valid_GOR_Oil_Months": [int(_well_nmo.get(n, 0)) for n in _nm],
    "Is_Historical_Benchmark_Eligible": _is_historical_benchmark_eligible,
    "N_Source_Rows": [int(_well.loc[_well["POZO_COMPLET"].eq(n), "n_source_rows"].iloc[0]) for n in _nm],
    "N_Invalid_Date_Rows": [int(_well.loc[_well["POZO_COMPLET"].eq(n), "n_invalid_date_rows"].iloc[0]) for n in _nm],
    "N_Invalid_Oil_GOR_Rows": [int(_well.loc[_well["POZO_COMPLET"].eq(n), "n_invalid_oil_gor_rows"].iloc[0]) for n in _nm],
    "N_Excluded_Rows": [int(_well.loc[_well["POZO_COMPLET"].eq(n), "n_excluded_rows"].iloc[0]) for n in _nm],
    "N_Duplicate_Month_Rows": [int(_well.loc[_well["POZO_COMPLET"].eq(n), "n_duplicate_month_rows"].iloc[0]) for n in _nm],
    "Data_Quality_Status": [
        "Low Coverage" if not eligible else "Has Excluded Rows" if excluded else "Duplicate Months Consolidated" if duplicates else "Ready"
        for eligible, excluded, duplicates in zip(
            _is_historical_benchmark_eligible,
            [_well.loc[_well["POZO_COMPLET"].eq(n), "n_excluded_rows"].iloc[0] > 0 for n in _nm],
            [_well.loc[_well["POZO_COMPLET"].eq(n), "n_duplicate_month_rows"].iloc[0] > 0 for n in _nm],
        )
    ],
    "Avg_Oil_Rate_bbl_d": [round(_avg_oil_by_well[n], 1) for n in _nm],
    "Avg_GOR_scf_stb":    [round(_avg_gor_by_well[n], 1) for n in _nm],
    "Norm_Oil_Rate_P25":  np.round(_x_p25, 6),
    "Norm_Oil_Rate_P75":  np.round(_x_p75, 6),
    "Norm_GOR_P25":       np.round(_y_p25, 6),
    "Norm_GOR_P75":       np.round(_y_p75, 6),
    "Norm_Oil_Rate_Err_Low":  np.round(_oil_err_low, 6),
    "Norm_Oil_Rate_Err_High": np.round(_oil_err_high, 6),
    "Norm_GOR_Err_Low":       np.round(_gor_err_low, 6),
    "Norm_GOR_Err_High":      np.round(_gor_err_high, 6),
    "N_Valid_GOR_Oil_Months_Last12Mo": _n_valid_months_12mo,
    "Last_Reported_Date": _last_reported_month.dt.to_timestamp(how="end").dt.strftime("%Y-%m-%d").fillna(""),
    "Latest_Data_Date":             _latest_data_date_label,
    "Is_Recently_Reported":         _recently_reported,
    "Is_Last12Mo_Eligible":         _last12_eligible,
    "Avg_Oil_Rate_Last12Mo_bbl_d":  np.round(_avg_oil_12mo, 1),
    "Avg_GOR_Last12Mo_scf_stb":     np.round(_avg_gor_12mo, 1),
    "Norm_Oil_Rate_Last12Mo":       np.round(_norm_oil_12mo, 6),
    "Norm_GOR_Last12Mo":            np.round(_norm_gor_12mo, 6),
    "Norm_Oil_Rate_Last12Mo_Cluster": np.round(_norm_oil_12mo_cluster, 6),
    "Norm_GOR_Last12Mo_Cluster":      np.round(_norm_gor_12mo_cluster, 6),
    "Plot_Avg_X_Line_Last12Mo_Cluster": round(_thr_x_12mo_cluster, 6),
    "Plot_Avg_Y_Line_Last12Mo_Cluster": round(_thr_y_12mo_cluster, 6),
    "Current_Cluster_Quadrant":       _quadrant_12mo_cluster,
    "Current_Cluster_Benchmark_Basis": "Eligible wells: >= 6 valid calendar months in the well-specific trailing 12-month window; last report within 18 calendar months of selected-data maximum; normalized by best last-12-month average",
    "Recent_OilRate_vs_Historical": _recent_oil_flag,
    "Recent_GOR_vs_Historical":     _recent_gor_flag,
}).reset_index(drop=True)
well_summary = well_summary.merge(_analysis_summary, on="POZO_COMPLET", how="left")
_selected_quadrant_order = {
    "Q2": 0,
    "Q1": 1,
    "Q3": 2,
    "Q4": 3,
    "Stale / Historical Context": 4,
    "Insufficient Current Coverage": 5,
}
well_summary["Selected_Quadrant_Sort_Order"] = well_summary["Selected_Quadrant"].map(
    _selected_quadrant_order
).fillna(99).astype(int)
well_summary = well_summary.sort_values(
    ["Selected_Quadrant_Sort_Order", "Is_Selected_Horizon_Eligible", "Selected_Norm_Oil_Rate"],
    ascending=[True, False, False],
).drop(columns="Selected_Quadrant_Sort_Order").reset_index(drop=True)

if _is_local_run:
    from pathlib import Path

    _local_output_dir = Path(globals().get(
        "local_output_dir",
        Path(__file__).parent / "output_visualizations" / "3_Spotfire_Production_Screening_DataFunction",
    ))
    _local_output_dir.mkdir(parents=True, exist_ok=True)
    _local_file_stem = re.sub(r"[^A-Za-z0-9]+", "_", _selection_label).strip("_")
    _local_png = _local_output_dir / f"{_local_file_stem}_GOR_vs_OilRate_SpotfireCanonical.png"
    _local_summary_csv = _local_output_dir / f"{_local_file_stem}_GOR_Quadrant_Summary_SpotfireCanonical.csv"
    _local_png.write_bytes(image_base64)
    well_summary.to_csv(_local_summary_csv, index=False)
    print(f"Saved PNG: {_local_png}")
    print(f"Saved summary: {_local_summary_csv}")

for _cleanup_name in (
    "_production_data", "_fallback_data", "_df", "_quality", "_monthly", "_monthly_quality", "_well", "_benchmark_well", "_oil_month_counts", "_well_vals", "_avg_oil_by_well", "_avg_gor_by_well", "_campo_by_well", "_yacimiento_by_well",
    "_xv", "_yv", "_nm", "_qs", "_w2q", "_nX", "_nY", "_mv", "_mx", "_my", "_mq", "_qc",
    "_well_nmo", "_variability", "_var_lookup", "_var_summary", "_max_avg_oil", "_max_avg_gor",
    "_x_p25", "_x_p75", "_y_p25", "_y_p75", "_oil_err_low", "_oil_err_high", "_gor_err_low", "_gor_err_high",
    "_last_date_by_well", "_cutoff_by_well", "_last12_mask", "_last12", "_last12_reindexed",
    "_avg_oil_12mo", "_avg_gor_12mo", "_n_mo_12mo", "_n_gor_12mo", "_last_reported_date",
    "_norm_oil_12mo", "_norm_gor_12mo", "_MIN_MONTHS_FOR_BENCHMARK", "_MIN_MONTHS_LAST12", "_MAX_REPORTING_LAG_MONTHS",
    "_latest_data_date", "_latest_data_date_label", "_current_cluster_recency_cutoff", "_recently_reported", "_last12_eligible",
    "_max_avg_oil_12mo", "_max_avg_gor_12mo", "_norm_oil_12mo_cluster", "_norm_gor_12mo_cluster",
    "_thr_x_12mo_cluster", "_thr_y_12mo_cluster", "_quadrant_12mo_cluster",
    "_recent_flag", "_recent_oil_flag", "_recent_gor_flag",
    "_analysis_row_mask", "_analysis_monthly_all", "_analysis_selected_monthly", "_analysis_prior_monthly",
    "_analysis_selected", "_analysis_prior", "_analysis_benchmark", "_analysis_summary", "_analysis_eligible_index", "_requires_selected_recency",
    "_analysis_last_month_by_well", "_analysis_window_start_label", "_analysis_window_end_label", "_analysis_window_caption",
    "_selected_variability", "_selected_error_eligible",
    "_analysis_high_water", "_analysis_high_gor", "_analysis_low_rate", "_analysis_flag_column",
    "_selected_plot_wells", "_selected_plot_monthly", "_selected_quadrant_by_well", "_selected_plot_points",
    "_selected_plot_counts", "_selected_low_coverage_count", "_selected_fig", "_selected_ax", "_selected_buf",
    "_selected_x_values", "_selected_y_values", "_selected_xlo", "_selected_xhi", "_selected_ylo", "_selected_yhi",
    "_selected_qid", "_selected_x1", "_selected_x2", "_selected_y1", "_selected_y2", "_selected_monthly_quadrant",
    "_selected_row", "_selected_noneligible", "_selected_spine", "_selected_legend_handles", "_selected_legend_labels",
    "_selected_quadrant_order", "_selected_exclusion_label",
    "_is_local_run", "_local_campo_filter", "_local_yacimiento_filter", "_local_yacimiento_key",
    "_local_output_dir", "_local_file_stem", "_local_png", "_local_summary_csv",
):
    globals().pop(_cleanup_name, None)
globals().pop("_cleanup_name", None)

