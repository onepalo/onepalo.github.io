import numpy as np
import pandas as pd

# ======================================================================
# MARKING-AWARE INPUT SELECTION (ADD THIS BLOCK)
# ======================================================================

def _has_rows(df):
    return df is not None and hasattr(df, "__len__") and len(df) > 0

if _has_rows(RSP_Selected):
    RSP_Inputs = RSP_Selected.copy()
    RUN_MODE = "MARKED_ROWS"
else:
    RSP_Inputs = RSP_All.copy()
    RUN_MODE = "ALL_ROWS"

# ======================================================================
# 0) Configuration (hardcoded safeguards and defaults)
# ======================================================================
ENFORCE_DEPTH_POSITIVE = True
EXP_CLIP = 700
GRID_N = 300
BOOTSTRAP_REPLICATES = 200
BOOTSTRAP_SEED = 20260724

# Spatial weighting safety clamps (hardcoded)
WSP_MIN = 0.05
WSP_MAX = 5.0
EARTH_RADIUS_MILES = 3958.7613

# Chunk size for pairwise computations (controls memory footprint)
PAIRWISE_BLOCK = 600


# ======================================================================
# 1) SciPy optional (curve_fit if available; stable fallback if not)
# ======================================================================
try:
    import scipy
    from scipy.optimize import curve_fit
    _USE_SCIPY = True
    _SCIPY_VERSION = scipy.__version__
except ImportError:
    _USE_SCIPY = False
    _SCIPY_VERSION = None


# ======================================================================
# 2) Data Function Inputs (bound in the data function UI)
# ======================================================================

def _to_bool(v, default=False):
    """Robust boolean parser in case Spotfire passes strings ('True'/'False')."""
    if isinstance(v, bool):
        return v
    if v is None:
        return default
    s = str(v).strip().lower()
    if s in ("true", "t", "1", "yes", "y", "on"):
        return True
    if s in ("false", "f", "0", "no", "n", "off"):
        return False
    return default

def _get_finite_float(name, value, minimum=None, strict_minimum=False):
    """Validate a numeric Spotfire input and return it as a finite float."""
    try:
        result = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be numeric. Received: {value!r}")
    if not np.isfinite(result):
        raise ValueError(f"{name} must be finite. Received: {value!r}")
    if minimum is not None:
        invalid = result <= minimum if strict_minimum else result < minimum
        comparison = ">" if strict_minimum else ">="
        if invalid:
            raise ValueError(f"{name} must be {comparison} {minimum}. Received: {value!r}")
    return result

# Read + sanitize inputs
SPATIAL_ON       = _to_bool(SpatialWeightingOn, default=True)
SPATIAL_MODE     = str(SpatialMode).strip().lower()
if SPATIAL_MODE not in ("radius", "kernel"):
    raise ValueError("SpatialMode must be 'radius' or 'kernel'. "
                     f"Received: {SpatialMode!r}")
SPATIAL_SCALE_MI = _get_finite_float("SpatialScaleMiles", SpatialScaleMiles,
                                     minimum=0.0, strict_minimum=True)
SPATIAL_POWER    = _get_finite_float("SpatialPower", SpatialPower, minimum=0.0)
APPLY_TAILS      = _to_bool(SpatialApplyToTails, default=False)

# ======================================================================
# 3) Input validation + cleaning
# ======================================================================
REQUIRED = [
    "uwbi", "top_tvdbml", "por_net_mean", "por_net_std",
    "net_sand_thickness_md", "BTM_LAT", "BTM_LONG"
]
missing = [c for c in REQUIRED if c not in RSP_Inputs.columns]
if missing:
    raise ValueError(f"Input table is missing required columns: {missing}")

df_in = RSP_Inputs[REQUIRED].copy().reset_index(drop=True)
df_in["_SOURCE_ROW"] = np.arange(len(df_in), dtype=int)

# Keep uwbi as string (robust to leading zeros, mixed types)
df_in["uwbi"] = df_in["uwbi"].where(df_in["uwbi"].notna(), np.nan)
df_in.loc[df_in["uwbi"].notna(), "uwbi"] = df_in.loc[df_in["uwbi"].notna(), "uwbi"].astype(str)

# Coerce numeric columns
num_cols = ["top_tvdbml", "por_net_mean", "por_net_std", "net_sand_thickness_md", "BTM_LAT", "BTM_LONG"]
for c in num_cols:
    df_in[c] = pd.to_numeric(df_in[c], errors="coerce")

invalid_lat = df_in["BTM_LAT"].notna() & ~df_in["BTM_LAT"].between(-90.0, 90.0)
invalid_lon = df_in["BTM_LONG"].notna() & ~df_in["BTM_LONG"].between(-180.0, 180.0)
if invalid_lat.any() or invalid_lon.any():
    invalid_fields = []
    if invalid_lat.any():
        invalid_fields.append(f"BTM_LAT ({int(invalid_lat.sum())} rows)")
    if invalid_lon.any():
        invalid_fields.append(f"BTM_LONG ({int(invalid_lon.sum())} rows)")
    raise ValueError("Coordinates are outside valid geographic ranges: " + ", ".join(invalid_fields))

# Normalize to internal names
df_normalized = df_in.rename(columns={
    "uwbi": "WELL_ID",
    "top_tvdbml": "TVDBML_mid",
    "por_net_mean": "POR_MEAN",
    "por_net_std": "POR_NET_STD",
    "net_sand_thickness_md": "NET_SAND",
    "BTM_LAT": "LAT",
    "BTM_LONG": "LON"
})

quality_checks = [
    (df_normalized["WELL_ID"].isna() | df_normalized["WELL_ID"].astype(str).str.strip().eq(""), "MISSING_WELL_ID"),
    (df_normalized["TVDBML_mid"].isna(), "MISSING_DEPTH"),
    (df_normalized["POR_MEAN"].isna() | ~df_normalized["POR_MEAN"].between(0.0, 0.45, inclusive="neither"), "INVALID_POR_MEAN"),
    (df_normalized["POR_NET_STD"].isna() | ~df_normalized["POR_NET_STD"].between(0.0, 0.15, inclusive="neither"), "INVALID_POR_NET_STD"),
    (df_normalized["NET_SAND"].isna() | df_normalized["NET_SAND"].le(0.0), "INVALID_NET_SAND"),
]
if ENFORCE_DEPTH_POSITIVE:
    quality_checks.append((df_normalized["TVDBML_mid"].notna() & df_normalized["TVDBML_mid"].le(0.0), "NONPOSITIVE_DEPTH"))

exclusion_reason = pd.Series("", index=df_normalized.index, dtype=object)
for failed, reason in quality_checks:
    previous_reason = exclusion_reason.copy()
    exclusion_reason = pd.Series(
        np.where(
            failed,
            np.where(previous_reason.eq(""), reason, previous_reason + "; " + reason),
            previous_reason,
        ),
        index=df_normalized.index,
        dtype=object,
    )

fit_included = exclusion_reason.eq("")
df_normalized["FIT_STATUS"] = np.where(fit_included, "INCLUDED", "EXCLUDED")
df_normalized["EXCLUSION_REASON"] = exclusion_reason.where(~fit_included, "")
df = df_normalized.loc[fit_included].copy().reset_index(drop=True)

if df.empty:
    raise ValueError("No rows left after filtering – revise limits or disable depth > 0 filter.")

if len(df) < 2 or df["TVDBML_mid"].nunique() < 2:
    raise ValueError("At least two qualifying rows at distinct TVDBML depths are required to fit a trend.")

# Arrays for fitting
depth = df.TVDBML_mid.values.astype(float)
phi   = df.POR_MEAN.values.astype(float)
sigma = df.POR_NET_STD.values.astype(float)
net   = df.NET_SAND.values.astype(float)


# ======================================================================
# 4) Core math helpers (exponential model + robust fitting)
# ======================================================================
def _exp(x, A, B):
    """A * exp(B*x) with exponent clipping for numerical stability."""
    z = np.clip(B * x, -EXP_CLIP, EXP_CLIP)
    return A * np.exp(z)

def _fit_AB_weighted(x, y, w):
    """
    Fit φ = A * exp(B*x).
      - Preferred: SciPy curve_fit with sigma = 1/sqrt(w)
      - Fallback: weighted least squares in log-space via np.linalg.lstsq
    """
    y = np.maximum(y, 1e-12)

    # Initial guess: log-linear
    b0, logA0 = np.polyfit(x, np.log(y), 1)
    p0 = (np.exp(logA0), b0)

    # Clean weights
    w = np.asarray(w, dtype=float)
    w[~np.isfinite(w)] = 0.0
    if np.all(w <= 0) or not np.isfinite(w).any():
        w = np.ones_like(x)

    if _USE_SCIPY:
        w_safe = np.maximum(w, 1e-12)
        sigma_cf = 1.0 / np.sqrt(w_safe)
        bounds = (np.array([0.0, -np.inf]), np.array([np.inf, np.inf]))  # A>0
        try:
            popt, _ = curve_fit(
                _exp, x, y, p0=p0,
                sigma=sigma_cf, absolute_sigma=False,
                bounds=bounds, max_nfev=4000
            )
            return float(popt[0]), float(popt[1]), "SCIPY_CURVE_FIT"
        except Exception:
            pass

    # Fallback: log-space WLS
    X = np.vstack([np.ones_like(x), x]).T
    ylog = np.log(y)

    ws = np.sqrt(np.maximum(w, 0.0))
    Xw = ws[:, None] * X
    yw = ws * ylog

    beta, *_ = np.linalg.lstsq(Xw, yw, rcond=None)
    return float(np.exp(beta[0])), float(beta[1]), "NUMPY_LOG_WLS_FALLBACK"

def _fit_A_fixedB(x, y, w, B):
    """
    Given fixed B, solve A analytically in log-space:
      ln A = Σ w (ln y - Bx) / Σ w
    """
    y = np.maximum(y, 1e-12)
    w = np.asarray(w, dtype=float)
    w[~np.isfinite(w)] = 0.0

    valid = (w > 0) & np.isfinite(x) & np.isfinite(y) & (y > 0)
    if valid.sum() == 0:
        return float(np.exp(np.mean(np.log(y) - B * x)))

    xv = x[valid]; yv = y[valid]; wv = w[valid]
    num = np.sum(wv * (np.log(yv) - B * xv))
    den = np.sum(wv)
    if den <= 0 or not np.isfinite(num):
        return float(np.exp(np.mean(np.log(y) - B * x)))
    return float(np.exp(num / den))


# ======================================================================
# 5) Spatial functions (haversine + WELL-level declustering + spacing)
# ======================================================================
def _haversine_miles(lat1, lon1, lat2, lon2):
    """
    Vectorized haversine distance in miles.
    lat1, lon1: (b,1) arrays; lat2, lon2: (1,m) arrays
    returns: (b,m)
    """
    lat1 = np.deg2rad(lat1); lon1 = np.deg2rad(lon1)
    lat2 = np.deg2rad(lat2); lon2 = np.deg2rad(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2.0)**2
    c = 2.0 * np.arcsin(np.minimum(1.0, np.sqrt(a)))
    return EARTH_RADIUS_MILES * c

def _well_spatial_metrics(lat, lon, mode="radius", scale_miles=1.0, power=1.0,
                          wmin=WSP_MIN, wmax=WSP_MAX, block=PAIRWISE_BLOCK):
    """
    Compute WELL-level spatial declustering weights + supporting metrics without allocating NxN matrix.

    Returns dict with:
      - wsp: spatial weight per well (mean-normalized), clipped
      - nn: nearest-neighbor distance per well (miles), NaN if cannot compute
      - aux: neighbor count (radius) OR density (kernel)
      - aux_name: "NEIGHBOR_COUNT" or "DENSITY"
      - ok: boolean mask of wells with valid coords
    """
    lat = np.asarray(lat, dtype=float)
    lon = np.asarray(lon, dtype=float)
    n = len(lat)

    ok = np.isfinite(lat) & np.isfinite(lon)
    wsp = np.ones(n, dtype=float)
    nn  = np.full(n, np.nan, dtype=float)
    aux = np.full(n, np.nan, dtype=float)

    if ok.sum() < 2:
        return {"wsp": wsp, "nn": nn, "aux": aux, "aux_name": "NEIGHBOR_COUNT", "ok": ok}

    mode = (mode or "radius").strip().lower()
    s = max(float(scale_miles), 1e-6)
    p = max(float(power), 0.0)

    idx = np.where(ok)[0]
    latv = lat[ok]
    lonv = lon[ok]
    m = len(latv)

    # Storage for valid wells
    wv = np.ones(m, dtype=float)
    nnv = np.full(m, np.nan, dtype=float)
    auxv = np.zeros(m, dtype=float)

    # Chunked distance evaluation
    for start in range(0, m, block):
        end = min(start + block, m)
        lat_block = latv[start:end][:, None]
        lon_block = lonv[start:end][:, None]

        d = _haversine_miles(lat_block, lon_block, latv[None, :], lonv[None, :])  # (b,m)

        # Nearest neighbor: ignore self by setting diagonal entries to inf for this block
        d_nn = d.copy()
        # diagonal positions in this block correspond to global indices [start:end)
        rows = np.arange(end - start)
        cols = np.arange(start, end)
        d_nn[rows, cols] = np.inf
        nnv[start:end] = np.min(d_nn, axis=1)

        if mode == "kernel":
            K = np.exp(-0.5 * (d / s) ** 2)          # includes self term (=1)
            dens = np.sum(K, axis=1)
            auxv[start:end] = dens
        else:
            cnt = np.sum(d <= s, axis=1).astype(float)  # includes self
            auxv[start:end] = cnt

    # Convert aux to weights
    if mode == "kernel":
        aux_name = "DENSITY"
        wv = 1.0 / np.power(np.maximum(auxv, 1e-12), p)
    else:
        aux_name = "NEIGHBOR_COUNT"
        wv = 1.0 / np.power(np.maximum(auxv, 1.0), p)

    # Clip and mean-normalize (so it acts as a relative modifier)
    wv = np.clip(wv, wmin, wmax)
    mean_w = np.mean(wv)
    if np.isfinite(mean_w) and mean_w > 0:
        wv = wv / mean_w

    # Write back to full arrays
    wsp[ok] = wv
    nn[ok]  = nnv
    aux[ok] = auxv

    return {"wsp": wsp, "nn": nn, "aux": aux, "aux_name": aux_name, "ok": ok}

def _kish_neff(weights):
    """
    Kish effective sample size:
      Neff = (sum w)^2 / sum(w^2)
    Useful to quantify how concentrated weights are.
    """
    w = np.asarray(weights, dtype=float)
    w = w[np.isfinite(w) & (w > 0)]
    if w.size == 0:
        return np.nan
    return float((w.sum() ** 2) / np.sum(w ** 2))


# ======================================================================
# 6) WELL-level declustering: compute per-well location, weights, spacing
# ======================================================================
# Per-well location (median is robust if repeated)
well_loc = (
    df.groupby("WELL_ID", as_index=False)[["LAT", "LON"]]
      .median()
)
n_wells_total = int(len(well_loc))

# Compute per-well spatial weights + nearest neighbor spacing + density/count
if SPATIAL_ON and n_wells_total >= 2:
    sm = _well_spatial_metrics(
        well_loc["LAT"].values,
        well_loc["LON"].values,
        mode=SPATIAL_MODE,
        scale_miles=SPATIAL_SCALE_MI,
        power=SPATIAL_POWER,
        wmin=WSP_MIN, wmax=WSP_MAX,
        block=PAIRWISE_BLOCK
    )
    wsp_well = sm["wsp"]
    nn_well  = sm["nn"]
    aux_well = sm["aux"]
    aux_name = sm["aux_name"]
    ok_well  = sm["ok"]
else:
    # Spatial OFF -> unity weights
    wsp_well = np.ones(n_wells_total, dtype=float)
    nn_well  = np.full(n_wells_total, np.nan, dtype=float)
    aux_well = np.full(n_wells_total, np.nan, dtype=float)
    aux_name = "NEIGHBOR_COUNT"
    ok_well  = np.isfinite(well_loc["LAT"].values) & np.isfinite(well_loc["LON"].values)

# Map per-well weight to rows
wsp_map = pd.Series(wsp_well, index=well_loc["WELL_ID"].values)
wsp_row = df["WELL_ID"].map(wsp_map).fillna(1.0).values.astype(float)

# Within-well row normalization (hardcoded best practice)
n_rows_per_well = df.groupby("WELL_ID")["WELL_ID"].transform("count").values.astype(float)
w_wellcount = 1.0 / np.maximum(n_rows_per_well, 1.0)


# ======================================================================
# 7) Fit P50: weight = (net/sigma) * spatial(well) * 1/nRows(well)
# ======================================================================
w50_raw = (net / sigma) * wsp_row * w_wellcount
w50 = w50_raw.copy()

# Clean, cap at P90, normalize
w50[~np.isfinite(w50)] = 0.0
pos = w50 > 0
if np.any(pos):
    p90_cap = np.nanpercentile(w50[pos], 90)
    if np.isfinite(p90_cap) and p90_cap > 0:
        w50 = np.minimum(w50, p90_cap)

w_sum = w50.sum()
if w_sum <= 0:
    w50 = np.ones_like(w50) / len(w50)
else:
    w50 = w50 / w_sum

A50, B50, FIT_METHOD = _fit_AB_weighted(depth, phi, w50)
phi50    = _exp(depth, A50, B50)


# ======================================================================
# 8) Tails: standardized residual selection, then parallel envelopes
# ======================================================================
res_std = (phi - phi50) / sigma
thr = float(np.percentile(np.abs(res_std), 80))

mask_hi = res_std > +thr
mask_lo = res_std < -thr

if mask_hi.sum() < 4 or mask_lo.sum() < 4:
    raise ValueError("Too few points in the tails for P10/P90 (after standardized residual selection).")

# Tail weights: (phi/sigma) * (optional spatial) * 1/nRows(well)
if APPLY_TAILS and SPATIAL_ON:
    w_hi = (phi[mask_hi] / sigma[mask_hi]) * wsp_row[mask_hi] * w_wellcount[mask_hi]
    w_lo = (phi[mask_lo] / sigma[mask_lo]) * wsp_row[mask_lo] * w_wellcount[mask_lo]
else:
    w_hi = (phi[mask_hi] / sigma[mask_hi]) * w_wellcount[mask_hi]
    w_lo = (phi[mask_lo] / sigma[mask_lo]) * w_wellcount[mask_lo]

w_hi[~np.isfinite(w_hi)] = 0.0
w_lo[~np.isfinite(w_lo)] = 0.0
if w_hi.sum() <= 0: w_hi = np.ones_like(w_hi)
if w_lo.sum() <= 0: w_lo = np.ones_like(w_lo)

A90 = _fit_A_fixedB(depth[mask_hi], phi[mask_hi], w_hi, B50)
A10 = _fit_A_fixedB(depth[mask_lo], phi[mask_lo], w_lo, B50)


# ======================================================================
# 9) NEW OUTPUT: PorosityFitDiagnostics (row-level fit audit)
# ======================================================================
diagnostic_columns = [
    "SOURCE_ROW", "WELL_ID", "TVDBML_mid", "POR_MEAN", "POR_NET_STD", "NET_SAND", "LAT", "LON",
    "FIT_STATUS", "EXCLUSION_REASON", "HAS_VALID_COORDS", "W_SPATIAL", "N_ROWS_IN_WELL",
    "W50_RAW", "W50_FINAL", "P50_FIT", "P10_FIT", "P90_FIT", "STD_RESIDUAL", "TAIL_CLASS"
]
PorosityFitDiagnostics = (
    df_normalized.rename(columns={"_SOURCE_ROW": "SOURCE_ROW"})
    .reindex(columns=diagnostic_columns)
    .copy()
)
PorosityFitDiagnostics["HAS_VALID_COORDS"] = (
    PorosityFitDiagnostics["LAT"].notna() & PorosityFitDiagnostics["LON"].notna()
)
for column in ["W_SPATIAL", "N_ROWS_IN_WELL", "W50_RAW", "W50_FINAL", "P50_FIT", "P10_FIT", "P90_FIT", "STD_RESIDUAL"]:
    PorosityFitDiagnostics[column] = np.nan
PorosityFitDiagnostics["TAIL_CLASS"] = np.where(
    PorosityFitDiagnostics["FIT_STATUS"].eq("EXCLUDED"), "EXCLUDED", "INCLUDED_NOT_FITTED"
)

fit_source_rows = df["_SOURCE_ROW"].values.astype(int)
tail_class = np.where(mask_hi, "P90_UPPER_TAIL", np.where(mask_lo, "P10_LOWER_TAIL", "CENTRAL"))
PorosityFitDiagnostics.loc[fit_source_rows, "W_SPATIAL"] = wsp_row
PorosityFitDiagnostics.loc[fit_source_rows, "N_ROWS_IN_WELL"] = n_rows_per_well
PorosityFitDiagnostics.loc[fit_source_rows, "W50_RAW"] = w50_raw
PorosityFitDiagnostics.loc[fit_source_rows, "W50_FINAL"] = w50
PorosityFitDiagnostics.loc[fit_source_rows, "P50_FIT"] = phi50
PorosityFitDiagnostics.loc[fit_source_rows, "P10_FIT"] = _exp(depth, A10, B50)
PorosityFitDiagnostics.loc[fit_source_rows, "P90_FIT"] = _exp(depth, A90, B50)
PorosityFitDiagnostics.loc[fit_source_rows, "STD_RESIDUAL"] = res_std
PorosityFitDiagnostics.loc[fit_source_rows, "TAIL_CLASS"] = tail_class


# ======================================================================
# 10) NEW OUTPUT: PorosityBootstrapCoverage (well-level OOB validation)
# ======================================================================
def _bootstrap_oob_coverage():
    """Resample wells and score only out-of-bag wells against refitted curves."""
    unique_wells = pd.unique(df["WELL_ID"])
    if len(unique_wells) < 2:
        return {
            "BOOTSTRAP_REPLICATES_REQUESTED": BOOTSTRAP_REPLICATES,
            "BOOTSTRAP_REPLICATES_COMPLETED": 0,
            "OOB_ROW_SCORES": 0,
            "OOB_WELL_SCORES": 0,
            "OOB_FRAC_AT_OR_ABOVE_P10": np.nan,
            "OOB_FRAC_AT_OR_BELOW_P50": np.nan,
            "OOB_FRAC_AT_OR_BELOW_P90": np.nan,
            "OOB_FRAC_WITHIN_P10_P90": np.nan,
        }

    rng = np.random.default_rng(BOOTSTRAP_SEED)
    scores_p10 = []
    scores_p50 = []
    scores_p90 = []
    scores_within = []
    completed = 0
    oob_well_scores = 0

    for _ in range(BOOTSTRAP_REPLICATES):
        sampled_wells = rng.choice(unique_wells, size=len(unique_wells), replace=True)
        draw_count = (
            pd.Series(sampled_wells).value_counts()
            .reindex(df["WELL_ID"])
            .fillna(0.0)
            .to_numpy(dtype=float)
        )
        train_mask = draw_count > 0
        oob_mask = ~train_mask
        if not oob_mask.any() or np.unique(depth[train_mask]).size < 2:
            continue

        train_w50 = w50 * draw_count
        A50_boot, B50_boot, _ = _fit_AB_weighted(depth[train_mask], phi[train_mask], train_w50[train_mask])
        phi50_boot = _exp(depth, A50_boot, B50_boot)
        res_boot = (phi - phi50_boot) / sigma
        threshold_boot = float(np.percentile(np.abs(res_boot[train_mask]), 80))
        hi_boot = train_mask & (res_boot > threshold_boot)
        lo_boot = train_mask & (res_boot < -threshold_boot)
        if hi_boot.sum() < 4 or lo_boot.sum() < 4:
            continue

        if APPLY_TAILS and SPATIAL_ON:
            hi_weight = (phi[hi_boot] / sigma[hi_boot]) * wsp_row[hi_boot] * w_wellcount[hi_boot] * draw_count[hi_boot]
            lo_weight = (phi[lo_boot] / sigma[lo_boot]) * wsp_row[lo_boot] * w_wellcount[lo_boot] * draw_count[lo_boot]
        else:
            hi_weight = (phi[hi_boot] / sigma[hi_boot]) * w_wellcount[hi_boot] * draw_count[hi_boot]
            lo_weight = (phi[lo_boot] / sigma[lo_boot]) * w_wellcount[lo_boot] * draw_count[lo_boot]

        A90_boot = _fit_A_fixedB(depth[hi_boot], phi[hi_boot], hi_weight, B50_boot)
        A10_boot = _fit_A_fixedB(depth[lo_boot], phi[lo_boot], lo_weight, B50_boot)
        p10_boot = _exp(depth[oob_mask], A10_boot, B50_boot)
        p50_boot = _exp(depth[oob_mask], A50_boot, B50_boot)
        p90_boot = _exp(depth[oob_mask], A90_boot, B50_boot)
        phi_oob = phi[oob_mask]

        scores_p10.extend(phi_oob >= p10_boot)
        scores_p50.extend(phi_oob <= p50_boot)
        scores_p90.extend(phi_oob <= p90_boot)
        scores_within.extend((phi_oob >= p10_boot) & (phi_oob <= p90_boot))
        completed += 1
        oob_well_scores += int(pd.unique(df.loc[oob_mask, "WELL_ID"]).size)

    def coverage(values):
        return float(np.mean(values)) if values else np.nan

    return {
        "BOOTSTRAP_REPLICATES_REQUESTED": BOOTSTRAP_REPLICATES,
        "BOOTSTRAP_REPLICATES_COMPLETED": completed,
        "OOB_ROW_SCORES": len(scores_p10),
        "OOB_WELL_SCORES": oob_well_scores,
        "OOB_FRAC_AT_OR_ABOVE_P10": coverage(scores_p10),
        "OOB_FRAC_AT_OR_BELOW_P50": coverage(scores_p50),
        "OOB_FRAC_AT_OR_BELOW_P90": coverage(scores_p90),
        "OOB_FRAC_WITHIN_P10_P90": coverage(scores_within),
    }

bootstrap_metrics = _bootstrap_oob_coverage()
PorosityBootstrapCoverage = pd.DataFrame([{
    "BOOTSTRAP_SEED": BOOTSTRAP_SEED,
    "BOOTSTRAP_UNIT": "WELL_OUT_OF_BAG",
    **bootstrap_metrics,
}])


# ======================================================================
# 11) Output curves: smooth grid
# ======================================================================
z = np.linspace(depth.min(), depth.max(), GRID_N)
PorosityPercentileCurves = (
    pd.DataFrame({
        "TVDBML": z,
        "P50": _exp(z, A50, B50),
        "P90": _exp(z, A90, B50),
        "P10": _exp(z, A10, B50)
    })
    .sort_values("TVDBML")
    .reset_index(drop=True)
)


# ======================================================================
# 10) NEW OUTPUT: PorositySpatialWellMetrics (per-well diagnostics)
# ======================================================================
# Build well-level metrics table (includes pad spacing proxy: nearest-neighbor distance)
PorositySpatialWellMetrics = well_loc.copy()
PorositySpatialWellMetrics["W_SPATIAL"] = wsp_well
PorositySpatialWellMetrics["NN_DIST_MI"] = nn_well
PorositySpatialWellMetrics[aux_name] = aux_well

# Add N_ROWS per well (how many RSP rows contributed)
rows_per_well_tbl = df.groupby("WELL_ID").size().rename("N_ROWS").reset_index()
PorositySpatialWellMetrics = PorositySpatialWellMetrics.merge(rows_per_well_tbl, on="WELL_ID", how="left")
PorositySpatialWellMetrics["N_ROWS"] = PorositySpatialWellMetrics["N_ROWS"].fillna(0).astype(int)

# Flag missing coords
PorositySpatialWellMetrics["HAS_COORDS"] = np.isfinite(PorositySpatialWellMetrics["LAT"]) & np.isfinite(PorositySpatialWellMetrics["LON"])


# ======================================================================
# 11) NEW OUTPUT: PorositySpatialRunMetrics (1-row run summary)
# ======================================================================
# Compute pad spacing stats from nearest-neighbor distances (valid only)
nn_valid = PorositySpatialWellMetrics.loc[
    PorositySpatialWellMetrics["HAS_COORDS"] & np.isfinite(PorositySpatialWellMetrics["NN_DIST_MI"]),
    "NN_DIST_MI"
].values.astype(float)

def _safe_stats(x):
    if x.size == 0:
        return {"mean": np.nan, "p10": np.nan, "p50": np.nan, "p90": np.nan}
    return {
        "mean": float(np.mean(x)),
        "p10": float(np.percentile(x, 10)),
        "p50": float(np.percentile(x, 50)),
        "p90": float(np.percentile(x, 90)),
    }

nn_stats = _safe_stats(nn_valid)

# Spatial weight stats (well-level)
wsp_valid = PorositySpatialWellMetrics.loc[:, "W_SPATIAL"].values.astype(float)
wsp_stats = _safe_stats(wsp_valid[np.isfinite(wsp_valid)])

# Effective number of wells after spatial weights (Kish Neff)
# Use well-level weights normalized to sum=1 so Neff is interpretable.
wtmp = wsp_valid.copy()
wtmp = wtmp[np.isfinite(wtmp) & (wtmp > 0)]
wtmp = wtmp / wtmp.sum() if wtmp.size > 0 else wtmp
neff_wells = _kish_neff(wtmp)

# Counts
n_rows_used = int(len(df))
n_wells_used = int(PorositySpatialWellMetrics["N_ROWS"].gt(0).sum())
n_wells_coords = int(PorositySpatialWellMetrics["HAS_COORDS"].sum())
n_wells_missing_coords = int((~PorositySpatialWellMetrics["HAS_COORDS"]).sum())

# Tail counts
n_hi = int(mask_hi.sum())
n_lo = int(mask_lo.sum())

PorositySpatialRunMetrics = pd.DataFrame([{
    # Run configuration
    "RUN_MODE": RUN_MODE,
    "SpatialWeightingOn": SPATIAL_ON,
    "SpatialMode": SPATIAL_MODE,
    "SpatialScaleMiles": SPATIAL_SCALE_MI,
    "SpatialPower": SPATIAL_POWER,
    "SpatialApplyToTails": APPLY_TAILS,

    # Data volume
    "N_ROWS_USED": n_rows_used,
    "N_WELLS_USED": n_wells_used,
    "N_WELLS_WITH_COORDS": n_wells_coords,
    "N_WELLS_MISSING_COORDS": n_wells_missing_coords,

    # Pad spacing proxy (nearest-neighbor)
    "NN_MEAN_MI": nn_stats["mean"],
    "NN_P10_MI": nn_stats["p10"],
    "NN_P50_MI": nn_stats["p50"],   # <- "typical pad spacing" proxy
    "NN_P90_MI": nn_stats["p90"],

    # Spatial weight distribution
    "WSP_P10": wsp_stats["p10"],
    "WSP_P50": wsp_stats["p50"],
    "WSP_P90": wsp_stats["p90"],
    "NEFF_WELLS_SPATIAL": neff_wells,

    # Fit / selection diagnostics
    "FIT_METHOD": FIT_METHOD,
    "SCIPY_VERSION": _SCIPY_VERSION,
    "A50": float(A50),
    "B50": float(B50),
    "TailThr_AbsStdRes_P80": float(thr),
    "N_TAIL_HI": n_hi,
    "N_TAIL_LO": n_lo
}])

