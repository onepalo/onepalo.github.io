import warnings

import numpy as np
import pandas as pd

# ===========================================================
# Spotfire Data Function Inputs (expected):
# - Vw_PSI_GOM_NOFS : DataFrame with at least:
#     (Depth column chosen by DepthColumnName), GenLitho, and a well identifier.
#     Required only with HC enabled: PHIE, SWE, PERM, VSH, SAND.
#     Optional supporting columns: AGE, NPHI, RHOB, DPHI, GR, other known curves.
#     Required: API (or API_UWI, UWI, WELL_API, WELL_ID, WELLID)
#     Depths/thicknesses must be in feet; PERM in mD; fractions in [0, 1].
#     Supply a continuous regular source-depth grid per well, including null-lithology rows.
#     Missing TVD/TVDSM stays Invalid when finite source DEPTH locates the row.
#     Depth null codes are negative only; positive log null codes are valid depths.
# - shale_thickness : float (max NonSand gap thickness to bridge within a Sand sequence)
# - sand_cutoff     : float (minimum net sand thickness to keep a sequence as RSP)
# - DepthColumnName : string (Document Property dropdown)
#     Expected values: 'DEPTH', 'TVD', 'TVDSM'
# - Resolution      : float (legacy Document Property; calculations retain native samples)
#     Expected fixed values: 0.5 (default), 1.0, 2.0, 3.0
# - DoHCScreening   : bool (Document Property dropdown)
#     True = compute HC flags + summary_out
#     False = skip HC and return empty summary_out
# - Optional HC properties: HC_SWE_Max, HC_PHIE_Min, HC_PERM_Min, HC_VSH_Max,
#     HC_SAND_Min, HC_MinNetThickness, HC_HighNetThickness
#
# Outputs:
# - rsp_sequence : DataFrame at native sample grain, with RSP and optional HC flags
# - summary_out  : DataFrame summary by RSP (Potential/High only) [empty if DoHCScreening=False]
# - hc_interval_summary : DataFrame summary by contiguous qualified sand interval
# - rsp_summary  : DataFrame summary by RSP (one row per RSP), including AGE
# ===========================================================

# ---------------- Global null/sentinel policy ----------------
NULL_SENTINEL = -999.25
NULL_SENTINELS_IN = {NULL_SENTINEL, -999.0, 999.25, 999.0, 9999.0, -9999.0}
DEPTH_NULL_SENTINELS = {NULL_SENTINEL, -999.0, -9999.0}

# ---------------- Behavior parameters ----------------
include_varied_in_net = False
renumber_after_cutoff = True

# ---------------- Helper ----------------
def mode_nonnull(s):
    s = s.dropna()
    if s.empty:
        return np.nan
    m = s.mode(dropna=True)
    return m.iloc[0] if not m.empty else s.iloc[0]

def maybe_to_category(s, max_unique=256, max_ratio=0.25):
    if not (pd.api.types.is_object_dtype(s) or pd.api.types.is_string_dtype(s)):
        return s
    n = len(s)
    if n == 0:
        return s
    nunique = s.nunique(dropna=True)
    if (nunique <= max_unique) or (nunique <= max(1, int(n * max_ratio))):
        return s.astype('category')
    return s

def coerce_numeric_keep_nan(s):
    x = pd.to_numeric(s, errors='coerce')
    if pd.api.types.is_numeric_dtype(x):
        x = x.replace(list(NULL_SENTINELS_IN), np.nan)
    x = x.astype('float64')
    return x.where(np.isfinite(x), np.nan)

def coerce_depth_keep_nan(s):
    x = pd.to_numeric(s, errors='coerce').astype('float64')
    x = x.replace(list(DEPTH_NULL_SENTINELS), np.nan)
    return x.where(np.isfinite(x), np.nan)

def normalize_spotfire_bool(value, default=True):
    if value is None:
        return default
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in ('1', 'true', 't', 'yes', 'y', 'on'):
            return True
        if normalized in ('0', 'false', 'f', 'no', 'n', 'off'):
            return False
    elif isinstance(value, (bool, np.bool_)):
        return bool(value)
    elif isinstance(value, (int, float, np.integer, np.floating)) and value in (0, 1):
        return bool(value)
    raise ValueError("DoHCScreening must be a boolean or an explicit true/false value. Received: {0!r}".format(value))

def get_numeric_property(name, default=None, minimum=None, maximum=None):
    value = globals().get(name, default)
    if value is None or (isinstance(value, str) and value.strip() == ''):
        value = default
    if isinstance(value, (bool, np.bool_)):
        raise ValueError("{0} must be a finite number, not a boolean.".format(name))
    try:
        value = float(value)
    except (TypeError, ValueError):
        raise ValueError("{0} must be a finite number. Received: {1!r}".format(name, value))
    if not np.isfinite(value):
        raise ValueError("{0} must be a finite number. Received: {1!r}".format(name, value))
    if minimum is not None and value < minimum:
        raise ValueError("{0} must be greater than or equal to {1}. Received: {2}".format(name, minimum, value))
    if maximum is not None and value > maximum:
        raise ValueError("{0} must be less than or equal to {1}. Received: {2}".format(name, maximum, value))
    return value

def finalize_for_spotfire(df_out, known_string_cols):
    for col in df_out.columns:
        if col in known_string_cols:
            df_out[col] = df_out[col].astype('string')
            continue
        df_out[col] = pd.to_numeric(df_out[col], errors='coerce').astype('float64')
        df_out[col] = df_out[col].where(np.isfinite(df_out[col]), np.nan)
        df_out[col] = df_out[col].fillna(NULL_SENTINEL)
    return df_out

# ---------------- Prep / Standardize API + AGE ----------------
if 'Vw_PSI_GOM_NOFS' not in globals():
    raise ValueError("Missing required input table: Vw_PSI_GOM_NOFS.")
if not isinstance(Vw_PSI_GOM_NOFS, pd.DataFrame):
    raise TypeError("Vw_PSI_GOM_NOFS must be a pandas DataFrame.")
df = Vw_PSI_GOM_NOFS.copy()
if not df.columns.is_unique:
    raise ValueError("Duplicate column names in Vw_PSI_GOM_NOFS: {0}".format(
        df.columns[df.columns.duplicated()].tolist()
    ))
source_columns = set(df.columns)

# HC screening properties are optional Document Properties with conservative defaults.
_do_hc = normalize_spotfire_bool(globals().get('DoHCScreening'), default=True)
shale_thickness = get_numeric_property('shale_thickness', minimum=0.0)
sand_cutoff = get_numeric_property('sand_cutoff', minimum=0.0)
target_res = get_numeric_property('Resolution', 0.5)
if target_res not in (0.5, 1.0, 2.0, 3.0):
    raise ValueError("Resolution must be one of 0.5, 1.0, 2.0, 3.0. Received: {0}".format(target_res))
if target_res != 0.5:
    warnings.warn(
        "Resolution no longer coarsens interpretation inputs; native samples are retained "
        "to preserve thin beds, invalid data and HC continuity. Set Resolution=0.5.",
        UserWarning
    )

if _do_hc:
    hc_swe_max = get_numeric_property('HC_SWE_Max', 0.50, minimum=0.0, maximum=1.0)
    hc_phie_min = get_numeric_property('HC_PHIE_Min', 0.10, minimum=0.0, maximum=1.0)
    hc_perm_min = get_numeric_property('HC_PERM_Min', 10.0, minimum=0.0)
    hc_vsh_max = get_numeric_property('HC_VSH_Max', 0.30, minimum=0.0, maximum=1.0)
    hc_sand_min = get_numeric_property('HC_SAND_Min', 0.50, minimum=0.0, maximum=1.0)
    hc_min_net_thickness = get_numeric_property('HC_MinNetThickness', 3.0, minimum=0.0)
    hc_high_net_thickness = get_numeric_property('HC_HighNetThickness', 10.0, minimum=hc_min_net_thickness)
    hc_required_source_columns = ['PHIE', 'SWE', 'PERM', 'VSH', 'SAND']
    missing_hc_source_columns = [col for col in hc_required_source_columns if col not in source_columns]
    if missing_hc_source_columns:
        raise ValueError(
            "Missing required source columns for HC screening: {0}. Available columns: {1}. "
            "Map the missing curves or set DoHCScreening=False.".format(
                missing_hc_source_columns, sorted(source_columns)
            )
        )

if 'GenLitho' not in source_columns:
    raise ValueError("Missing required column: GenLitho. Available columns: {0}".format(sorted(source_columns)))

api_aliases = ('API', 'API_UWI', 'UWI', 'WELL_API', 'WELL_ID', 'WELLID')
api_candidates = [c for alias in api_aliases for c in df.columns if c.upper() == alias]
if not api_candidates and not df.empty:
    raise ValueError("Missing well identifier: map API or one of {0}.".format(api_aliases[1:]))
df['API'] = df[api_candidates[0]].astype('string').str.strip() if api_candidates else pd.Series(dtype='string')
missing_api = df['API'].isna() | df['API'].str.lower().isin(
    ['', 'none', 'nan', 'null', '<na>', 'na']
)
if missing_api.any():
    raise ValueError("Missing well identifier in {0} rows; supply a valid API for every sample.".format(int(missing_api.sum())))

required_numeric_cols = ['NPHI', 'RHOB', 'DPHI', 'PHIE', 'SWE', 'PERM', 'GR', 'VSH', 'SAND']
for col in required_numeric_cols:
    if col not in df.columns:
        df[col] = np.nan
        df[col] = df[col].astype('float64')
    else:
        df[col] = coerce_numeric_keep_nan(df[col])

optional_numeric_cols = ['DTC', 'DTM', 'DTS', 'SONIC', 'GAMMA', 'CALIPER', 'SPE', 'RESD', 'RESS', 'PE']
for col in optional_numeric_cols:
    if col in df.columns:
        df[col] = coerce_numeric_keep_nan(df[col])
    else:
        df[col] = np.nan
        df[col] = df[col].astype('float64')

for col in required_numeric_cols + optional_numeric_cols:
    if col in source_columns:
        original = Vw_PSI_GOM_NOFS[col]
        malformed = original.notna() & df[col].isna() & ~original.isin(NULL_SENTINELS_IN)
        if malformed.any():
            warnings.warn("{0}: {1} nonnumeric or nonfinite values excluded.".format(
                col, int(malformed.sum())
            ), UserWarning)

for col in ('PHIE', 'SWE', 'VSH', 'SAND', 'PERM'):
    valid = df[col] >= 0.0 if col == 'PERM' else df[col].between(0.0, 1.0)
    invalid = df[col].notna() & ~valid
    if invalid.any():
        warnings.warn("{0}: {1} out-of-range values excluded from HC and RSP averages.".format(
            col, int(invalid.sum())
        ), UserWarning)
        df.loc[invalid, col] = np.nan

categorical_cols = ['GenLitho', 'AGE']
for col in categorical_cols:
    if col in df.columns:
        df[col] = df[col].astype(object)
    else:
        df[col] = pd.Categorical(['Unknown'] * len(df))

df['AGE'] = df['AGE'].astype(object)
df['AGE'] = df['AGE'].replace(['', 'None', 'nan', 'NaN'], np.nan)

# ===========================================================
# Depth selection controlled by Document Property
# ===========================================================
depth_col = str(DepthColumnName).strip() if 'DepthColumnName' in globals() else 'DEPTH'
if depth_col == '' or depth_col.lower() == 'none':
    depth_col = 'DEPTH'

allowed_depth_cols = ['DEPTH', 'TVD', 'TVDSM']  # TVDSS removed per instruction
if depth_col not in allowed_depth_cols:
    raise ValueError("DepthColumnName must be one of {0}. Received: '{1}'".format(allowed_depth_cols, depth_col))

if depth_col not in df.columns:
    raise ValueError(
        "Selected depth column '{0}' not found in input table. Available columns include: {1}".format(
            depth_col, sorted(df.columns.tolist())
        )
    )

selected_depth = coerce_depth_keep_nan(df[depth_col])
source_depth_name = 'DEPTH' if 'DEPTH' in source_columns else depth_col
source_depth = coerce_depth_keep_nan(df[source_depth_name])
if source_depth.isna().any():
    invalid_source = source_depth.isna()
    raise ValueError(
        "Invalid source {0} depth: {1} rows for API {2}. Source depth is required to locate "
        "samples and preserve continuity; map/correct finite source depths in feet. "
        "Missing selected {3} values can be retained as Invalid when source DEPTH is valid. "
        "Negative depth null codes are {4}; positive 999, 999.25 and 9999 are valid depths.".format(
            source_depth_name, int(invalid_source.sum()),
            df.loc[invalid_source, 'API'].unique().tolist()[:5], depth_col,
            sorted(DEPTH_NULL_SENTINELS)
        )
    )
if selected_depth.isna().any():
    warnings.warn(
        "{0}: {1} missing, nonnumeric, nonfinite or sentinel depths for API {2}; "
        "rows retained as Invalid in source DEPTH order. Intervals touching them have "
        "zero thickness and cannot bridge; no depth interpolation is performed.".format(
            depth_col, int(selected_depth.isna().sum()),
            df.loc[selected_depth.isna(), 'API'].unique().tolist()[:5]
        ),
        UserWarning
    )
df['_source_depth'] = source_depth
df[depth_col] = selected_depth
df['DEPTH'] = selected_depth

if depth_col != 'DEPTH' and 'DEPTH' in source_columns:
    ordered = df.loc[df['DEPTH'].notna()].sort_values(['API', '_source_depth'])
    source_step = ordered.groupby('API', sort=False)['_source_depth'].diff()
    selected_step = ordered.groupby('API', sort=False)['DEPTH'].diff()
    if ((source_step > 0.0) & (selected_step <= 0.0)).any():
        raise ValueError(
            "{0} must be strictly increasing along source DEPTH within each API. "
            "Nonmonotonic or repeated vertical depths cannot define a unique vertical sequence.".format(depth_col)
        )

df = df.sort_values(by=['API', '_source_depth']).reset_index(drop=True)

# ===========================================================
# (1) DUPLICATE-RESOLUTION (before dz/run computations)
# ===========================================================
if df.duplicated(['API', '_source_depth']).any():
    duplicate_rows = df.loc[df.duplicated(['API', '_source_depth'], keep=False)]
    conflicts = duplicate_rows.groupby(['API', '_source_depth'], sort=False).nunique(dropna=False).gt(1)
    if conflicts.any(axis=None):
        raise ValueError(
            "Conflicting duplicate API/depth samples. Resolve source curves/lithology before "
            "running; averaging conflicting samples can create artificial HC candidates. Keys: {0}".format(
                conflicts.index[conflicts.any(axis=1)].tolist()[:5]
            )
        )
    duplicate_count = int(df.duplicated(['API', '_source_depth']).sum())
    warnings.warn("Removed {0} identical duplicate API/depth samples.".format(duplicate_count), UserWarning)
    df = df.drop_duplicates(['API', '_source_depth']).reset_index(drop=True)

source_step = df.groupby('API', sort=False)['_source_depth'].diff()
nominal_step = source_step.where(source_step > 0.0).groupby(df['API'], sort=False).transform('min')
irregular = source_step.notna() & ~np.isclose(source_step, nominal_step, rtol=1e-6, atol=1e-6)
if irregular.any():
    raise ValueError(
        "Irregular source-depth sampling for API {0}: continuity cannot be inferred across gaps "
        "or mixed sampling intervals. Supply the complete regular source grid (including "
        "null-lithology rows for unclassified intervals), or process each verified continuous "
        "sampling section separately. No missing thickness has been counted.".format(
            df.loc[irregular, 'API'].unique().tolist()[:5]
        )
    )

litho_isnull_orig = df['GenLitho'].isna()
df['GenLitho'] = df['GenLitho'].astype(str).str.strip().str.title()
df.loc[litho_isnull_orig, 'GenLitho'] = np.nan
df.loc[df['GenLitho'].isin(['', 'Unknown', 'None', 'Nan', 'Null', '<Na>']), 'GenLitho'] = np.nan

df['GenLitho'] = maybe_to_category(df['GenLitho'])
df['AGE'] = maybe_to_category(df['AGE'])

# ===========================================================
# Calculations retain native resolution to preserve threshold crossings.
# ===========================================================
# Invalid rows: cannot be used for sequencing
invalid_mask_global = df['DEPTH'].isna() | df['GenLitho'].isna()

# ===========================================================
# dz per row per API  (last sample dz=0 preserved)
# ===========================================================
next_depth = df.groupby('API', sort=False)['DEPTH'].shift(-1)
dz_raw = next_depth - df['DEPTH']
df['dz'] = dz_raw.fillna(0.0).astype('float64')

# ===========================================================
# RSP sequence construction (VECTORIZED)
# ===========================================================
df['_is_sand'] = df['GenLitho'].eq('Sand').fillna(False) & (~invalid_mask_global)

# ===========================================================
# Interval-consistent boundary weighting (dz_eff)
# ===========================================================
same_api_next = df['API'].eq(df['API'].shift(-1)).fillna(False)
next_is_sand = df.groupby('API', sort=False)['_is_sand'].shift(-1)

interval_thick = df['dz'].where(same_api_next, 0.0)
change_interval = same_api_next & (df['_is_sand'] != next_is_sand.fillna(False))

share_current = np.where(change_interval, 0.5, 1.0)
share_next = np.where(change_interval, 0.5, 0.0)

contrib_current = interval_thick.to_numpy(dtype='float64', copy=False) * share_current
contrib_to_next = interval_thick.to_numpy(dtype='float64', copy=False) * share_next

dz_eff_arr = contrib_current + np.roll(contrib_to_next, 1)
if len(df):
    dz_eff_arr[0] = contrib_current[0]

first_of_api = df['API'].ne(df['API'].shift(1)).fillna(True).to_numpy(dtype=bool)
dz_eff_arr[first_of_api] = contrib_current[first_of_api]

df['dz_eff'] = dz_eff_arr.astype('float64')
carried_thickness = dz_eff_arr - contrib_current
df['_support_top'] = df['DEPTH'] - carried_thickness
df['_support_base'] = df['DEPTH'] + contrib_current

# ---------------- Run-length IDs (sand vs non-sand) ----------------
prev_is_sand = df.groupby('API', sort=False)['_is_sand'].shift(1, fill_value=False)
run_boundary = prev_is_sand.isna() | (df['_is_sand'] != prev_is_sand)
df['run_id'] = run_boundary.groupby(df['API'], sort=False).cumsum()

# ---------------- Bridge detection using FULL dz ----------------
runs = (
    df.groupby(['API', 'run_id'], dropna=False, sort=False)
      .agg(run_thick=('dz', 'sum'),
           run_is_sand=('_is_sand', 'first'),
           run_valid_count=('GenLitho', 'count'),
           run_valid_depth_count=('DEPTH', 'count'),
           run_sample_count=('DEPTH', 'size'))
      .reset_index()
      .sort_values(['API', 'run_id'])
      .reset_index(drop=True)
)

runs['prev_is_sand'] = runs.groupby('API', sort=False)['run_is_sand'].shift(1).eq(True)
runs['next_is_sand'] = runs.groupby('API', sort=False)['run_is_sand'].shift(-1).eq(True)

runs['bridge'] = (
    (~runs['run_is_sand'])
    & (runs['run_valid_count'] == runs['run_sample_count'])
    & (runs['run_valid_depth_count'] == runs['run_sample_count'])
    & (runs['run_thick'] <= float(shale_thickness))
    & (runs['prev_is_sand'])
    & (runs['next_is_sand'])
)

bridge_lookup = runs.set_index(['API', 'run_id'])['bridge']
row_run_index = pd.MultiIndex.from_arrays(
    [df['API'].to_numpy(copy=False), df['run_id'].to_numpy(copy=False)],
    names=['API', 'run_id']
)
df['bridge_gap'] = bridge_lookup.reindex(row_run_index, fill_value=False).to_numpy(dtype=bool, copy=False)

df['_is_member'] = (df['_is_sand'] | df['bridge_gap']) & (~invalid_mask_global)

prev_member = df.groupby('API', sort=False)['_is_member'].shift(1, fill_value=False).fillna(False)
start_of_seq = df['_is_member'] & (~prev_member)
df['seq_id'] = start_of_seq.groupby(df['API'], sort=False).cumsum().where(df['_is_member'], np.nan)

# ---------------- Net / cutoff per sequence ----------------
net_mask = df['GenLitho'].eq('Sand')
if include_varied_in_net:
    net_mask = net_mask | df['GenLitho'].eq('Varied')
net_mask = net_mask & df['seq_id'].notna() & (~invalid_mask_global)

df['is_net'] = net_mask

df['net_thick_seq'] = (
    df['dz_eff'].where(net_mask, 0.0)
      .groupby([df['API'], df['seq_id']], sort=False)
      .transform('sum')
)
df.loc[df['seq_id'].isna(), 'net_thick_seq'] = np.nan

net_thick_by_seq = (
    df.loc[net_mask]
      .groupby(['API', 'seq_id'], dropna=True, sort=False)['dz_eff']
      .sum()
)
passing = net_thick_by_seq[(net_thick_by_seq > 0.0) & (net_thick_by_seq >= sand_cutoff)]

# ---------------- Renumber sequences by top depth after cutoff ----------------
if not passing.empty:
    top_depth_by_seq = (
        df.loc[df['seq_id'].notna() & (~invalid_mask_global)]
          .groupby(['API', 'seq_id'], dropna=True, sort=False)['DEPTH']
          .min()
    )

    pass_df = passing.reset_index()
    pass_df.columns = ['API', 'seq_id', 'net_thick']
    pass_df['top_depth'] = pass_df.set_index(['API', 'seq_id']).index.map(top_depth_by_seq)

    if renumber_after_cutoff:
        pass_df = pass_df.sort_values(['API', 'top_depth'])
        pass_df['RSP_Number'] = pass_df.groupby('API', sort=False).cumcount() + 1
    else:
        pass_df['RSP_Number'] = pd.to_numeric(pass_df['seq_id'], errors='coerce').astype('Int64')

    map_df = pass_df[['API', 'seq_id', 'RSP_Number']].copy()
else:
    map_df = pd.DataFrame(columns=['API', 'seq_id', 'RSP_Number'])

# ---------------- Final labels per row ----------------
invalid_mask_arr = invalid_mask_global.to_numpy(copy=False)

final_labels_arr = np.full(len(df), 'Seal', dtype=object)
final_labels_arr[invalid_mask_arr] = 'Invalid'

if not map_df.empty:
    rsp_lookup = map_df.set_index(['API', 'seq_id'])['RSP_Number']
    row_seq_index = pd.MultiIndex.from_arrays(
        [df['API'].to_numpy(copy=False), df['seq_id'].to_numpy(copy=False)],
        names=['API', 'seq_id']
    )
    rsp_num_vals = rsp_lookup.reindex(row_seq_index).to_numpy()
    mask_has_rsp = pd.notna(rsp_num_vals) & (~invalid_mask_arr)

    if mask_has_rsp.any():
        final_labels_arr[mask_has_rsp] = (
            'RSP' + pd.Series(rsp_num_vals[mask_has_rsp]).astype(int).astype(str).to_numpy()
        )

df['RSP_Sequence'] = final_labels_arr

rsp_sequence = df
rsp_sequence['DEPTH'] = pd.to_numeric(rsp_sequence['DEPTH'], errors='coerce').astype('float64')

# ===========================================================
# (4) HYDROCARBON SCREENING (OPTIONAL via DoHCScreening)
# ===========================================================

# Prepare empty schemas for HC outputs.
HC_SUMMARY_COLUMNS = [
    'API', 'RSP_Sequence', 'HC_Interval_Count', 'Min_Depth', 'Max_Depth',
    'Avg_DPHI', 'Avg_PHIE', 'Avg_PERM', 'Avg_SWE', 'Avg_GR', 'Avg_VSH', 'Avg_SAND',
    'HC_Thickness_ft', 'HC_NetThickness_ft', 'RSP_Gross_ft', 'HC_Frac_of_RSP',
    'HC_Qualified_Interval_Count', 'HC_Screening_Tier',
    'HC_SWE_Max_Used', 'HC_PHIE_Min_Used', 'HC_PERM_Min_Used', 'HC_VSH_Max_Used',
    'HC_SAND_Min_Used', 'HC_MinNetThickness_Used', 'HC_HighNetThickness_Used'
]
HC_INTERVAL_COLUMNS = [
    'API', 'RSP_Sequence', 'HC_Interval_ID', 'HC_Screening_Tier',
    'HC_Interval_Top_ft', 'HC_Interval_Base_ft', 'HC_Interval_Sample_Count',
    'HC_NetThickness_ft', 'Avg_DPHI', 'Avg_PHIE', 'Avg_PERM', 'Avg_SWE',
    'Avg_GR', 'Avg_VSH', 'Avg_SAND',
    'HC_SWE_Max_Used', 'HC_PHIE_Min_Used', 'HC_PERM_Min_Used', 'HC_VSH_Max_Used',
    'HC_SAND_Min_Used', 'HC_MinNetThickness_Used', 'HC_HighNetThickness_Used'
]
HC_NUMERIC_SUMMARY_COLUMNS = [
    'HC_Interval_Count', 'Min_Depth', 'Max_Depth', 'Avg_DPHI', 'Avg_PHIE',
    'Avg_PERM', 'Avg_SWE', 'Avg_GR', 'Avg_VSH', 'Avg_SAND',
    'HC_Thickness_ft', 'HC_NetThickness_ft', 'RSP_Gross_ft', 'HC_Frac_of_RSP',
    'HC_Qualified_Interval_Count', 'HC_SWE_Max_Used', 'HC_PHIE_Min_Used',
    'HC_PERM_Min_Used', 'HC_VSH_Max_Used', 'HC_SAND_Min_Used',
    'HC_MinNetThickness_Used', 'HC_HighNetThickness_Used'
]
HC_NUMERIC_INTERVAL_COLUMNS = [
    'HC_Interval_ID', 'HC_Interval_Top_ft', 'HC_Interval_Base_ft',
    'HC_Interval_Sample_Count', 'HC_NetThickness_ft', 'Avg_DPHI', 'Avg_PHIE',
    'Avg_PERM', 'Avg_SWE', 'Avg_GR', 'Avg_VSH', 'Avg_SAND',
    'HC_SWE_Max_Used', 'HC_PHIE_Min_Used', 'HC_PERM_Min_Used', 'HC_VSH_Max_Used',
    'HC_SAND_Min_Used', 'HC_MinNetThickness_Used', 'HC_HighNetThickness_Used'
]

def _empty_summary_out():
    return pd.DataFrame({
        col: pd.Series(dtype='float64' if col in HC_NUMERIC_SUMMARY_COLUMNS else 'string')
        for col in HC_SUMMARY_COLUMNS
    })

def _empty_hc_interval_summary():
    return pd.DataFrame({
        col: pd.Series(dtype='float64' if col in HC_NUMERIC_INTERVAL_COLUMNS else 'string')
        for col in HC_INTERVAL_COLUMNS
    })

def hc_weighted_average(df_in, group_columns, column):
    values = pd.to_numeric(df_in[column], errors='coerce').astype('float64')
    weights = pd.to_numeric(df_in['dz_eff'], errors='coerce').astype('float64')
    valid = values.notna() & np.isfinite(values) & weights.notna() & np.isfinite(weights) & (weights > 0)
    numerator = (values.where(valid, 0.0) * weights.where(valid, 0.0)).groupby(
        [df_in[column_name] for column_name in group_columns], sort=False
    ).sum()
    denominator = weights.where(valid, 0.0).groupby(
        [df_in[column_name] for column_name in group_columns], sort=False
    ).sum()
    return (numerator / denominator).replace([np.inf, -np.inf], np.nan).rename('Avg_' + column)

for col in ('Criteria_Met', 'Confidence_Score', 'HC_Interval_ID'):
    rsp_sequence[col] = np.nan
for col in ('Hydrocarbon_Potential_Flag', 'Potential_Flag', 'HC_Screening_Status'):
    rsp_sequence[col] = pd.Series('', index=rsp_sequence.index, dtype='string')
rsp_sequence['HC_Screening_Status'] = 'Not_RSP' if _do_hc else 'Screening_Off'

# If HC screening is OFF, skip and keep outputs consistent
if not _do_hc:
    summary_out = _empty_summary_out()
    hc_interval_summary = _empty_hc_interval_summary()

else:
    valid_rsp_mask_hc = rsp_sequence['RSP_Sequence'].astype(str).str.startswith('RSP')

    hc_work_cols = [
        'API', 'DEPTH', 'dz', 'dz_eff', '_support_top', '_support_base', 'RSP_Sequence', 'GenLitho',
        'NPHI', 'RHOB', 'PHIE', 'DPHI', 'SWE',
        'PERM', 'GR', 'VSH', 'SAND'
    ]

    rsp_hc = rsp_sequence.loc[valid_rsp_mask_hc, hc_work_cols].copy()

    if rsp_hc.empty:
        summary_out = _empty_summary_out()
        hc_interval_summary = _empty_hc_interval_summary()

    else:
        for col in ['NPHI', 'RHOB', 'PHIE', 'DPHI', 'SWE', 'PERM', 'GR', 'VSH', 'SAND']:
            rsp_hc[col] = pd.to_numeric(rsp_hc[col], errors='coerce').astype('float64')

        finite_primary = np.isfinite(rsp_hc[['PHIE', 'SWE', 'PERM', 'VSH', 'SAND']]).all(axis=1)
        valid_ranges = (
            rsp_hc['PHIE'].between(0.0, 1.0)
            & rsp_hc['SWE'].between(0.0, 1.0)
            & (rsp_hc['PERM'] >= 0.0)
            & rsp_hc['VSH'].between(0.0, 1.0)
            & rsp_hc['SAND'].between(0.0, 1.0)
        )
        valid_hc_input = finite_primary & valid_ranges
        sand_member = rsp_hc['GenLitho'].eq('Sand').fillna(False)
        swe_gate = rsp_hc['SWE'] < hc_swe_max
        phie_gate = rsp_hc['PHIE'] > hc_phie_min
        perm_gate = rsp_hc['PERM'] > hc_perm_min
        rock_quality_gate = (rsp_hc['VSH'] < hc_vsh_max) & (rsp_hc['SAND'] > hc_sand_min)
        candidate_row = valid_hc_input & sand_member & swe_gate & phie_gate & perm_gate & rock_quality_gate

        rsp_hc['HC_Screening_Status'] = np.select(
            [
                ~sand_member,
                ~valid_hc_input,
                ~swe_gate,
                ~phie_gate,
                ~perm_gate,
                ~rock_quality_gate
            ],
            [
                'Not_Sand',
                'Invalid_HC_Input',
                'Failed_Fluid_Gate',
                'Failed_Storage_Gate',
                'Failed_Deliverability_Gate',
                'Failed_Rock_Quality'
            ],
            default='Candidate'
        )
        criteria_met = np.column_stack([swe_gate, phie_gate, perm_gate, rock_quality_gate]).sum(axis=1)
        rsp_hc['Criteria_Met'] = np.where(valid_hc_input & sand_member, criteria_met, 0).astype('float64')
        rsp_hc['Confidence_Score'] = (rsp_hc['Criteria_Met'] / 4.0) * 100.0

        prior_candidate = candidate_row.shift(1, fill_value=False)
        same_rsp_as_prior = (
            rsp_hc['API'].eq(rsp_hc['API'].shift(1))
            & rsp_hc['RSP_Sequence'].eq(rsp_hc['RSP_Sequence'].shift(1))
        )
        candidate_start = candidate_row & (~prior_candidate | ~same_rsp_as_prior)
        rsp_hc['HC_Interval_ID'] = (
            candidate_start.groupby([rsp_hc['API'], rsp_hc['RSP_Sequence']], sort=False)
            .cumsum()
            .where(candidate_row, np.nan)
        )

        candidate_rows = rsp_hc.loc[candidate_row].copy()
        candidate_rows['HC_NetThickness_ft'] = candidate_rows.groupby(
            ['API', 'RSP_Sequence', 'HC_Interval_ID'], sort=False
        )['dz_eff'].transform('sum')
        candidate_rows['HC_Screening_Tier'] = np.where(
            (candidate_rows['HC_NetThickness_ft'] > 0.0)
            & (candidate_rows['HC_NetThickness_ft'] >= hc_high_net_thickness),
            'High',
            np.where(
                (candidate_rows['HC_NetThickness_ft'] > 0.0)
                & (candidate_rows['HC_NetThickness_ft'] >= hc_min_net_thickness),
                'Potential', ''
            )
        )
        candidate_rows['HC_Screening_Status'] = np.where(
            candidate_rows['HC_Screening_Tier'].eq(''),
            'Below_Min_Net_Thickness',
            'Qualified_Pay_Candidate'
        )

        rsp_hc.loc[candidate_rows.index, 'HC_Screening_Status'] = candidate_rows['HC_Screening_Status']
        rsp_hc['Hydrocarbon_Potential_Flag'] = ''
        rsp_hc.loc[candidate_rows.index, 'Hydrocarbon_Potential_Flag'] = candidate_rows['HC_Screening_Tier']
        rsp_hc['Potential_Flag'] = rsp_hc['Hydrocarbon_Potential_Flag']

        rsp_sequence.loc[valid_rsp_mask_hc, 'Criteria_Met'] = rsp_hc['Criteria_Met'].to_numpy()
        rsp_sequence.loc[valid_rsp_mask_hc, 'Confidence_Score'] = rsp_hc['Confidence_Score'].to_numpy()
        rsp_sequence.loc[valid_rsp_mask_hc, 'HC_Screening_Status'] = rsp_hc['HC_Screening_Status'].to_numpy()
        rsp_sequence.loc[valid_rsp_mask_hc, 'HC_Interval_ID'] = rsp_hc['HC_Interval_ID'].to_numpy()
        rsp_sequence.loc[valid_rsp_mask_hc, 'Hydrocarbon_Potential_Flag'] = rsp_hc['Hydrocarbon_Potential_Flag'].to_numpy()
        rsp_sequence.loc[valid_rsp_mask_hc, 'Potential_Flag'] = rsp_hc['Potential_Flag'].to_numpy()

        hc_zones = candidate_rows[candidate_rows['HC_Screening_Tier'] != ''].copy()

        if hc_zones.empty:
            summary_out = _empty_summary_out()
            hc_interval_summary = _empty_hc_interval_summary()
        else:
            interval_summary = hc_zones.groupby(['API', 'RSP_Sequence', 'HC_Interval_ID'], sort=False).agg(
                HC_Screening_Tier=('HC_Screening_Tier', 'first'),
                HC_Interval_Top_ft=('_support_top', 'min'),
                HC_Interval_Base_ft=('_support_base', 'max'),
                HC_Interval_Sample_Count=('DEPTH', 'count'),
                HC_NetThickness_ft=('dz_eff', 'sum')
            ).reset_index()
            for col in ['DPHI', 'PHIE', 'PERM', 'SWE', 'GR', 'VSH', 'SAND']:
                interval_summary = interval_summary.merge(
                    hc_weighted_average(hc_zones, ['API', 'RSP_Sequence', 'HC_Interval_ID'], col).reset_index(),
                    on=['API', 'RSP_Sequence', 'HC_Interval_ID'], how='left'
                )
            for col, value in {
                'HC_SWE_Max_Used': hc_swe_max,
                'HC_PHIE_Min_Used': hc_phie_min,
                'HC_PERM_Min_Used': hc_perm_min,
                'HC_VSH_Max_Used': hc_vsh_max,
                'HC_SAND_Min_Used': hc_sand_min,
                'HC_MinNetThickness_Used': hc_min_net_thickness,
                'HC_HighNetThickness_Used': hc_high_net_thickness
            }.items():
                interval_summary[col] = value
            hc_interval_summary = interval_summary.reindex(columns=HC_INTERVAL_COLUMNS).sort_values(
                ['API', 'RSP_Sequence', 'HC_Interval_Top_ft']
            ).reset_index(drop=True)

            summary = hc_zones.groupby(['API', 'RSP_Sequence'], sort=False).agg(
                HC_Interval_Count=('HC_Interval_ID', 'nunique'),
                Min_Depth=('DEPTH', 'min'),
                Max_Depth=('DEPTH', 'max'),
                HC_Thickness_ft=('dz_eff', 'sum'),
                HC_NetThickness_ft=('dz_eff', 'sum')
            ).reset_index()
            for col in ['DPHI', 'PHIE', 'PERM', 'SWE', 'GR', 'VSH', 'SAND']:
                summary = summary.merge(
                    hc_weighted_average(hc_zones, ['API', 'RSP_Sequence'], col).reset_index(),
                    on=['API', 'RSP_Sequence'], how='left'
                )
            rsp_tiers = hc_interval_summary.groupby(['API', 'RSP_Sequence'], sort=False)['HC_Screening_Tier'].agg(
                lambda tiers: 'High' if tiers.eq('High').any() else 'Potential'
            )
            qualified_interval_count = hc_interval_summary.groupby(['API', 'RSP_Sequence'], sort=False).size()
            summary_index = pd.MultiIndex.from_frame(summary[['API', 'RSP_Sequence']])
            summary['HC_Screening_Tier'] = summary_index.map(rsp_tiers)
            summary['HC_Qualified_Interval_Count'] = summary_index.map(qualified_interval_count)

            valid_rsp_mask_for_gross = rsp_sequence['RSP_Sequence'].astype(str).str.startswith('RSP')
            rsp_gross_work = rsp_sequence.loc[valid_rsp_mask_for_gross, ['API', 'RSP_Sequence', 'dz_eff']].copy()
            rsp_gross_work['dz_eff'] = pd.to_numeric(rsp_gross_work['dz_eff'], errors='coerce').astype('float64')
            rsp_gross = rsp_gross_work.groupby(['API', 'RSP_Sequence'], sort=False)['dz_eff'].sum().reset_index()
            rsp_gross.rename(columns={'dz_eff': 'RSP_Gross_ft'}, inplace=True)

            summary = summary.merge(rsp_gross, on=['API', 'RSP_Sequence'], how='left')

            summary['HC_Frac_of_RSP'] = (summary['HC_Thickness_ft'] / summary['RSP_Gross_ft']).replace(
                [np.inf, -np.inf], np.nan
            )

            for col, value in {
                'HC_SWE_Max_Used': hc_swe_max,
                'HC_PHIE_Min_Used': hc_phie_min,
                'HC_PERM_Min_Used': hc_perm_min,
                'HC_VSH_Max_Used': hc_vsh_max,
                'HC_SAND_Min_Used': hc_sand_min,
                'HC_MinNetThickness_Used': hc_min_net_thickness,
                'HC_HighNetThickness_Used': hc_high_net_thickness
            }.items():
                summary[col] = value

            summary_out = summary.reindex(columns=HC_SUMMARY_COLUMNS).sort_values(
                by=['API', 'HC_NetThickness_ft'], ascending=[True, False]
            ).reset_index(drop=True)
            for col in HC_NUMERIC_SUMMARY_COLUMNS:
                if col in summary_out.columns:
                    summary_out[col] = pd.to_numeric(summary_out[col], errors='coerce').astype('float64')

# ===========================================================
# (5) RSP SUMMARY (one row per RSP) – NaN-aware weighted averages
# Top/base depths use the same boundary support as dz_eff.
# ===========================================================
valid_rsp_mask = rsp_sequence['RSP_Sequence'].astype(str).str.startswith('RSP')

rsp_work_cols = [
    'API', 'RSP_Sequence', 'DEPTH', 'dz', 'dz_eff', '_support_top', '_support_base', 'GenLitho',
    'PHIE', 'DPHI', 'SWE', 'PERM', 'VSH', 'GR', 'SAND', 'AGE'
]

df_rsp = rsp_sequence.loc[valid_rsp_mask, rsp_work_cols].copy()

if df_rsp.empty:
    # Create empty DataFrame with explicit dtypes for SBDF export compatibility
    dtype_spec = {
        'API': 'string',
        'RSP_Sequence': 'string',
        'Top_Depth_ft': 'float64',
        'Base_Depth_ft': 'float64',
        'Gross_ft': 'float64',
        'Net_ft': 'float64',
        'N_over_G_frac': 'float64',
        'Avg_PHIE_thick_net': 'float64',
        'Avg_DPHI_thick_net': 'float64',
        'Avg_SWE_thick_net': 'float64',
        'Avg_PERM_geo_net': 'float64',
        'Avg_PERM_arit_net': 'float64',
        'Avg_PHIE_thick_gross': 'float64',
        'Avg_DPHI_thick_gross': 'float64',
        'Avg_VSH_thick_gross': 'float64',
        'Avg_GR_thick_gross': 'float64',
        'Avg_SAND_thick_gross': 'float64',
        'AGE': 'string'
    }
    rsp_summary = pd.DataFrame({col: pd.Series(dtype=dtype) for col, dtype in dtype_spec.items()})

else:
    keys = [df_rsp['API'], df_rsp['RSP_Sequence']]

    for c in ['DEPTH', 'dz', 'dz_eff', 'PHIE', 'DPHI', 'SWE', 'PERM', 'VSH', 'GR', 'SAND']:
        if c in df_rsp.columns:
            df_rsp[c] = pd.to_numeric(df_rsp[c], errors='coerce').astype('float64')

    top_depth = df_rsp.groupby(keys, sort=False)['_support_top'].min().rename('Top_Depth_ft')
    base_depth = df_rsp.groupby(keys, sort=False)['_support_base'].max().rename('Base_Depth_ft')

    gross_thick = df_rsp.groupby(keys, sort=False)['dz_eff'].sum().rename('Gross_ft')

    sand_mask = df_rsp['GenLitho'].eq('Sand').fillna(False)
    w_net_base = df_rsp['dz_eff'].where(sand_mask, 0.0).astype('float64')
    net_thick = w_net_base.groupby(keys, sort=False).sum().rename('Net_ft')

    n_over_g = (net_thick / gross_thick).replace([np.inf, -np.inf], np.nan).rename('N_over_G_frac')

    def net_wavg(colname):
        s = df_rsp[colname]
        w = df_rsp['dz_eff'].where(sand_mask & s.notna(), 0.0)
        num = (s.where(s.notna(), 0.0) * w).groupby(keys, sort=False).sum()
        den = w.groupby(keys, sort=False).sum()
        return (num / den).replace([np.inf, -np.inf], np.nan)

    avg_phie_net = net_wavg('PHIE').rename('Avg_PHIE_thick_net')
    avg_dphi_net = net_wavg('DPHI').rename('Avg_DPHI_thick_net')
    avg_swe_net  = net_wavg('SWE').rename('Avg_SWE_thick_net')
    avg_perm_arit_net = net_wavg('PERM').rename('Avg_PERM_arit_net')

    def gross_wavg(colname):
        s = df_rsp[colname]
        w = df_rsp['dz_eff'].where(s.notna(), 0.0)
        num = (s.where(s.notna(), 0.0) * w).groupby(keys, sort=False).sum()
        den = w.groupby(keys, sort=False).sum()
        return (num / den).replace([np.inf, -np.inf], np.nan)

    avg_phie_gross = gross_wavg('PHIE').rename('Avg_PHIE_thick_gross')
    avg_dphi_gross = gross_wavg('DPHI').rename('Avg_DPHI_thick_gross')
    avg_vsh_gross  = gross_wavg('VSH').rename('Avg_VSH_thick_gross')
    avg_gr_gross   = gross_wavg('GR').rename('Avg_GR_thick_gross')
    avg_sand_gross = gross_wavg('SAND').rename('Avg_SAND_thick_gross')

    perm = df_rsp['PERM'].to_numpy(dtype='float64', copy=False)
    w = df_rsp['dz_eff'].to_numpy(dtype='float64', copy=False)
    sand = sand_mask.to_numpy(copy=False)

    mask_perm = sand & np.isfinite(w) & (w > 0) & np.isfinite(perm) & (perm > 0)
    ln_perm = np.full_like(perm, np.nan, dtype='float64')
    ln_perm[mask_perm] = np.log(perm[mask_perm])

    ln_series = pd.Series(ln_perm, index=df_rsp.index)
    w_series = pd.Series(w, index=df_rsp.index)

    num_ln = (ln_series.where(np.isfinite(ln_series), 0.0) * w_series.where(mask_perm, 0.0)).groupby(keys, sort=False).sum()
    den_ln = w_series.where(mask_perm, 0.0).groupby(keys, sort=False).sum()

    ratio = np.divide(num_ln, den_ln, where=den_ln > 0, out=np.full_like(num_ln, np.nan, dtype='float64'))
    avg_perm_geo_net = np.exp(ratio).replace([np.inf, -np.inf], np.nan).rename('Avg_PERM_geo_net')

    age_by_rsp = df_rsp.groupby(keys, sort=False)['AGE'].apply(mode_nonnull).rename('AGE')

    rsp_summary = pd.concat([
        top_depth, base_depth,
        gross_thick, net_thick, n_over_g,
        avg_phie_net, avg_dphi_net, avg_swe_net,
        avg_perm_geo_net, avg_perm_arit_net,
        avg_phie_gross, avg_dphi_gross, avg_vsh_gross, avg_gr_gross, avg_sand_gross,
        age_by_rsp
    ], axis=1).reset_index()

    numeric_cols = [
        'Top_Depth_ft', 'Base_Depth_ft', 'Gross_ft', 'Net_ft', 'N_over_G_frac',
        'Avg_PHIE_thick_net', 'Avg_DPHI_thick_net', 'Avg_SWE_thick_net',
        'Avg_PERM_geo_net', 'Avg_PERM_arit_net',
        'Avg_PHIE_thick_gross', 'Avg_DPHI_thick_gross', 'Avg_VSH_thick_gross',
        'Avg_GR_thick_gross', 'Avg_SAND_thick_gross'
    ]
    for col in numeric_cols:
        if col in rsp_summary.columns:
            rsp_summary[col] = pd.to_numeric(rsp_summary[col], errors='coerce').astype('float64')

    rsp_summary = rsp_summary.sort_values(by=['API', 'Top_Depth_ft'], ascending=[True, True]).reset_index(drop=True)

# ===========================================================
# FINAL SAFETY: convert numeric NaNs to NULL_SENTINEL for Spotfire outputs
# ===========================================================
known_string_output_cols = {
    'API', 'RSP_Sequence', 'Hydrocarbon_Potential_Flag', 'Potential_Flag',
    'HC_Screening_Tier', 'AGE'
}

summary_out = finalize_for_spotfire(summary_out, known_string_output_cols)
hc_interval_summary = finalize_for_spotfire(hc_interval_summary, known_string_output_cols)
rsp_summary = finalize_for_spotfire(rsp_summary, known_string_output_cols)
for col in known_string_output_cols | {'GenLitho', 'HC_Screening_Status'}:
    if col in rsp_sequence.columns:
        rsp_sequence[col] = rsp_sequence[col].astype('string')
rsp_sequence.drop(columns=['_source_depth', '_support_top', '_support_base'], inplace=True)
