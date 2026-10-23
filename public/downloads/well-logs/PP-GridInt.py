### IMPORT LIBRARIES
import pandas as pd
import numpy as np
import time
from spotfire_geospatial import grid, io_utilities, crs_utilities, interpolation

pd.options.mode.chained_assignment = None

######################################################################
### GRID GENERATION & INTERPOLATION
######################################################################
# See SpotGrid&Interp.guidance.md for detailed parameter documentation
def input_validation_and_defaults( 
            x_or_longitude,y_or_latitude, 
            npointsx,npointsy,spacingx,spacingy,  
            buffer, buffer_fraction, honor_bounds, 
            clip_shape,  
            external_clip_geometry,
            interpolation_method):
    """Validate inputs and assign defaults."""
    nrows = len(x_or_longitude)
    if nrows != len(y_or_latitude):
        raise ValueError("x_or_longitude and y_or_latitude must have the same length.")

    allowed_clip_shapes = ('envelope', 'tightenvelope', 'hull', 'tighthull', 'polygon')
    if clip_shape is not None and clip_shape not in allowed_clip_shapes:
        raise ValueError(
            f"clip_shape '{clip_shape}' is not recognized. "
            f"Allowed values are: {', '.join(allowed_clip_shapes)}"
        )
    if clip_shape == 'polygon':
        if external_clip_geometry is None:
            raise ValueError("external_clip_geometry must be provided when clip_shape is 'polygon'.")
        
    # Validate interpolation method
    ALLOWED_INTERP_METHODS = ['idw', 'mc_tps']
    interpolation_method_lower = interpolation_method.lower() if interpolation_method else 'idw'
    if interpolation_method_lower not in ALLOWED_INTERP_METHODS:
        ALLOWED_METHODS_STR = ', '.join(ALLOWED_INTERP_METHODS)
        raise ValueError(f"interpolation_method '{interpolation_method}' is not recognized. Allowed methods are: {ALLOWED_METHODS_STR}")
    
    nullify_if_negative = lambda val: None if val is not None and val < 0 else val
    npointsx = nullify_if_negative(npointsx)
    npointsy = nullify_if_negative(npointsy)
    spacingx = nullify_if_negative(spacingx)
    spacingy = nullify_if_negative(spacingy)

    for name, value in (('npointsx', npointsx), ('npointsy', npointsy)):
        if value is not None and (int(value) != value or value <= 1):
            raise ValueError(f"{name} must be an integer greater than 1 when specified.")
    for name, value in (('spacingx', spacingx), ('spacingy', spacingy)):
        if value is not None and value == 0:
            raise ValueError(f"{name} must be greater than 0 when specified.")
    if buffer is not None and buffer < 0:
        raise ValueError("buffer must be greater than or equal to 0.")
    if buffer_fraction is not None and buffer_fraction < 0:
        raise ValueError("buffer_fraction must be greater than or equal to 0.")

    # Assign defaults for None values
    buffer_fraction = 0.5 if buffer_fraction is None else buffer_fraction
    buffer = 0 if buffer is None else buffer
    honor_bounds = False if honor_bounds is None else honor_bounds

    return nrows, npointsx, npointsy, spacingx, spacingy, buffer, buffer_fraction, honor_bounds, interpolation_method_lower

######################################################################
### FUNCTIONS - INTERPOLATION
######################################################################
def generate_interpolation(x, y, z, xi, yi,
                           interpolation_method,
                           idw_power, idw_nn, idw_mode,
                           rbf_smoothing, rbf_epsilon, rbf_neighbors):
    """
    Generate interpolation field using selected method (IDW or Minimum Curvature TPS).
    Returns: (zi, params_df, sigma)
    """
    sigma = None
    
    if interpolation_method == 'idw':
        idw_mode = 'distance' if idw_mode is None else str(idw_mode).strip().lower()
        idw_power = 2.0 if idw_power is None else idw_power
        idw_nn = 12 if idw_nn is None else idw_nn
        if idw_mode not in ('distance', 'elevation'):
            raise ValueError("idw_mode must be 'distance' or 'elevation'.")
        if idw_power <= 0:
            raise ValueError("idw_power must be greater than 0.")
        if int(idw_nn) != idw_nn or idw_nn < 1:
            raise ValueError("idw_nn must be an integer greater than 0.")
        idw_nn = min(int(idw_nn), len(x))
        zi, params_df = interpolation.idw.idw(x, y, z, xi, yi, power=idw_power, nn=idw_nn, mode=idw_mode)
        params_df['method'] = f'IDW with mode: {idw_mode}'

    elif interpolation_method == 'mc_tps':
        rbf_mode = 'auto_min_curvature_tps'
        rbf_smoothing_input = rbf_smoothing if rbf_smoothing is not None else 0.0
        rbf_smoothing_input = float(np.clip(rbf_smoothing_input, 0.0, 1.0))
        rbf_neighbors = 50 if rbf_neighbors is None else rbf_neighbors
        rbf_epsilon = 'auto' if rbf_epsilon is None else rbf_epsilon
        if int(rbf_neighbors) != rbf_neighbors or rbf_neighbors < 1:
            raise ValueError("rbf_neighbors must be an integer greater than 0.")
        # TPS kernel K(r) = r²·log(r) scales with xy_range²; scaling smoothing by xy_range²
        # puts it in the same order of magnitude as kernel values, making [0,1] meaningful
        xy_range = float(max(x.max() - x.min(), y.max() - y.min()))
        if xy_range < 1e-6:
            import warnings
            warnings.warn(
                f"[SpotGrid] TPS: spatial extent is very small (xy_range={xy_range:.2e}). "
                "Smoothing may be numerically unstable. Verify CRS/coordinate units or consider using IDW.",
                stacklevel=2
            )
        smoothing_actual = rbf_smoothing_input * (xy_range ** 2) if xy_range > 0 else 0.0
        zi, params_df = interpolation.rbf.rbf(x, y, z, xi, yi,
                            smoothing=smoothing_actual, epsilon=rbf_epsilon, neighbors=rbf_neighbors,
                            mode=rbf_mode)
        params_df['method'] = f'Minimum Curvature (TPS)'
        params_df['rbf_smoothing_input'] = rbf_smoothing_input
        params_df['rbf_smoothing_applied'] = round(smoothing_actual, 6)

    else:
        raise ValueError(f"Unsupported interpolation_method: '{interpolation_method}'")

    return zi, params_df, sigma


######################################################################
### FUNCTIONS - CLIPPING
######################################################################
def _get_buffer_distance(x, y, buffer, buffer_fraction):
    """Return the total clip/grid buffer in the current coordinate units."""
    extent = max(x.max() - x.min(), y.max() - y.min())
    return buffer + buffer_fraction * extent


def _expand_bounds(xmin, xmax, ymin, ymax, x, y, buffer, buffer_fraction):
    """Expand rectangular grid bounds by the configured fixed and proportional buffer."""
    buffer_distance = _get_buffer_distance(x, y, buffer, buffer_fraction)
    return (
        xmin - buffer_distance,
        xmax + buffer_distance,
        ymin - buffer_distance,
        ymax + buffer_distance,
    )


def _build_clip_boundary(clip_shape_lower, x, y, buffer, buffer_fraction):
    """Build a Shapely boundary geometry for auto-computed clip shapes."""
    from shapely.geometry import box, MultiPoint
    import shapely

    if clip_shape_lower == 'envelope':
        clip_boundary = box(x.min(), y.min(), x.max(), y.max())
    elif clip_shape_lower == 'tightenvelope':
        clip_boundary = MultiPoint(list(zip(x, y))).minimum_rotated_rectangle
    elif clip_shape_lower == 'hull':
        clip_boundary = MultiPoint(list(zip(x, y))).convex_hull
    elif clip_shape_lower == 'tighthull':
        point_cloud = MultiPoint(list(zip(x, y)))
        try:
            clip_boundary = shapely.concave_hull(point_cloud, ratio=0.3, allow_holes=False)
        except (AttributeError, TypeError):
            clip_boundary = point_cloud.convex_hull
    else:
        raise ValueError(f"Unknown clip_shape: '{clip_shape_lower}'")

    if buffer > 0 or buffer_fraction > 0:
        clip_boundary = clip_boundary.buffer(
            _get_buffer_distance(x, y, buffer, buffer_fraction)
        )

    return clip_boundary


######################################################################
### FUNCTIONS - WELL AGGREGATION
######################################################################
PROPERTY_TYPE_BY_NAME = {
    'gross_thickness_md': 'additive',
    'net_sand_thickness_md': 'additive',
    'gross_thickness_tvdss': 'additive',
    'ntg_sand': 'ratio',
    'vsh_mean': 'ratio',
    'por_mean': 'ratio',
    'por_net_mean': 'ratio',
    'por_net_std': 'ratio',
    'den_mean': 'ratio',
    'den_net_mean': 'ratio',
    'dt_mean': 'ratio',
    'dt_net_mean': 'ratio',
}

TABLE_COLUMN_ALIASES = {
    'x_or_longitude': ('long_interp', 'longitude', 'long', 'x', 'x_or_longitude'),
    'y_or_latitude': ('lat_interp', 'latitude', 'lat', 'y', 'y_or_latitude'),
    'well_id': ('uwbi', 'well_id', 'uwi', 'api', 'api_number'),
    'z_weight': ('gross_thickness_md', 'gross_thickness_tvdss', 'net_sand_thickness_md'),
}


def _find_table_column(input_data, candidates):
    normalized_columns = {str(column).strip().lower(): column for column in input_data.columns}
    for candidate in candidates:
        if candidate in normalized_columns:
            return normalized_columns[candidate]
    return None


def select_grid_input_columns(input_data, selected_property_name):
    """Select the mapped property and supporting columns from a Spotfire table input."""
    if not isinstance(input_data, pd.DataFrame):
        raise ValueError("input_data must be configured as a Spotfire Table input.")

    property_column = _find_table_column(input_data, (str(selected_property_name).strip().lower(),))
    if property_column is None:
        available_columns = ', '.join(map(str, input_data.columns))
        raise ValueError(
            f"selected_property_name '{selected_property_name}' is not a column in input_data. "
            f"Available columns: {available_columns}"
        )

    x_column = _find_table_column(input_data, TABLE_COLUMN_ALIASES['x_or_longitude'])
    y_column = _find_table_column(input_data, TABLE_COLUMN_ALIASES['y_or_latitude'])
    if x_column is None or y_column is None:
        raise ValueError(
            "input_data must contain coordinate columns matching one of: "
            f"X ({', '.join(TABLE_COLUMN_ALIASES['x_or_longitude'])}); "
            f"Y ({', '.join(TABLE_COLUMN_ALIASES['y_or_latitude'])})."
        )

    well_id_column = _find_table_column(input_data, TABLE_COLUMN_ALIASES['well_id'])
    weight_column = _find_table_column(input_data, TABLE_COLUMN_ALIASES['z_weight'])

    return (
        pd.to_numeric(input_data[x_column], errors='coerce'),
        pd.to_numeric(input_data[y_column], errors='coerce'),
        pd.to_numeric(input_data[property_column], errors='coerce'),
        input_data[well_id_column] if well_id_column is not None else None,
        input_data[weight_column] if weight_column is not None else None,
    )


def resolve_property_type(selected_property_name):
    """Return the aggregation type configured for a selected Spotfire property."""
    property_name = str(selected_property_name).strip().lower() if selected_property_name else ''
    if property_name in PROPERTY_TYPE_BY_NAME:
        return PROPERTY_TYPE_BY_NAME[property_name], 'property_catalog'

    allowed_properties = ', '.join(PROPERTY_TYPE_BY_NAME)
    raise ValueError(
        f"selected_property_name '{selected_property_name}' is not configured. "
        f"Choose one of: {allowed_properties}. "
        "Add new properties to PROPERTY_TYPE_BY_NAME with 'additive' or 'ratio'."
    )


def aggregate_by_well(x_or_longitude, y_or_latitude, z, well_id, property_type, z_weight=None):
    """
    Collapse multi-layer / multi-reservoir well data to one representative z value
    per unique well location before spatial interpolation.

    property_type:
        'additive' - sum per well (gross thickness, net pay, net sand, etc.)
                     Weighting is not applicable for additive properties.
        'ratio'    - mean per well (porosity, Sw, NTG, permeability, etc.)
                     If z_weight is provided, uses thickness-weighted average:
                         z_agg = sum(z * weight) / sum(weight)
                     If z_weight is None, uses simple arithmetic mean.

    z_weight:
        Array of per-layer weights (e.g. individual layer thicknesses) used only
        when property_type='ratio'. Must be same length as z. None = no weighting.

    Returns: x_agg, y_agg, z_agg as numpy arrays (one entry per unique well_id).
    """
    ALLOWED_PROP_TYPES = ('ratio', 'additive')
    property_type_lower = property_type.strip().lower() if property_type else None
    if property_type_lower not in ALLOWED_PROP_TYPES:
        raise ValueError(
            f"property_type '{property_type}' is not recognized. "
            f"Allowed values are: {', '.join(ALLOWED_PROP_TYPES)}"
        )

    df = pd.DataFrame({
        'well_id': well_id,
        'x': x_or_longitude,
        'y': y_or_latitude,
        'z': z
    })

    use_weighted = (property_type_lower == 'ratio') and (z_weight is not None)
    if use_weighted:
        df['z_weight'] = z_weight

    rows = []
    for wid, grp in df.groupby('well_id', sort=False):
        x_agg = grp['x'].mean()   # same well = same location; mean guards against micro float jitter
        y_agg = grp['y'].mean()

        if property_type_lower == 'additive':
            # Additive properties (thickness, net pay): sum across layers/reservoirs
            z_agg = grp['z'].sum()
        elif use_weighted:
            # Ratio properties with thickness weighting: weighted average across layers
            # z_agg = sum(z_i * h_i) / sum(h_i)
            w = np.asarray(pd.to_numeric(grp['z_weight'], errors='coerce'), dtype=float)
            zv = np.asarray(pd.to_numeric(grp['z'], errors='coerce'), dtype=float)
            valid_weight = np.isfinite(w) & np.isfinite(zv) & (w > 0)
            total_w = w[valid_weight].sum()
            z_agg = float((zv[valid_weight] * w[valid_weight]).sum() / total_w) if total_w > 0 else np.nan
        else:
            # Ratio properties without weighting: simple arithmetic mean
            z_agg = grp['z'].mean()

        rows.append((x_agg, y_agg, z_agg))

    arr = np.array(rows)
    return arr[:, 0], arr[:, 1], arr[:, 2]


######################################################################
### MAIN CODE
######################################################################
def main_entry_point(data_crs, grid_crs, input_data, selected_property_name,
            npointsx, npointsy, spacingx, spacingy, 
            buffer, buffer_fraction, honor_bounds,
            clip_shape, clip_action, 
            external_clip_geometry,
            interpolation_method,
            idw_mode, idw_power, idw_nn,
            rbf_smoothing, rbf_neighbors, rbf_epsilon):
    """Grid generation + surface interpolation in one operation."""
    startall = time.time()

    # ================================================================
    # PHASE 1: GRID GENERATION & CLIPPING
    # ================================================================
    
    xcol = 'x'
    ycol = 'y'
    sigmacol = 'sigma'
    geocol = 'geometry'
    grididcol = 'grid_id'
    gridxcol = 'grid_center_x'
    gridycol = 'grid_center_y'

    # ================================================================
    # PRE-PHASE: WELL AGGREGATION (multi-layer / multi-reservoir)
    # ================================================================
    x_or_longitude, y_or_latitude, z, well_id, z_weight = select_grid_input_columns(
        input_data, selected_property_name
    )
    clip_shape = str(clip_shape).strip().lower() if clip_shape is not None else None
    valid_inputs = input_validation_and_defaults(
            x_or_longitude, y_or_latitude, 
            npointsx, npointsy, spacingx, spacingy,  
            buffer, buffer_fraction, honor_bounds, 
            clip_shape, 
            external_clip_geometry,
            interpolation_method
            )
    nrows, npointsx, npointsy, spacingx, spacingy, buffer, buffer_fraction, honor_bounds, interpolation_method = valid_inputs

    if z is not None and len(z) != nrows:
        raise ValueError("z must have the same length as the coordinates.")
    if well_id is not None and len(well_id) != nrows:
        raise ValueError("well_id must have the same length as the coordinates.")
    if z_weight is not None and len(z_weight) != nrows:
        raise ValueError("z_weight must have the same length as z.")

    resolved_property_type, property_type_source = resolve_property_type(z.name)

    # When well_id is provided, collapse duplicate well locations to one
    # representative z per well before grid generation and interpolation.
    if well_id is not None and resolved_property_type is not None:
        if z is None:
            raise ValueError("z is required when aggregating data by well.")
        x_or_longitude, y_or_latitude, z = aggregate_by_well(
            x_or_longitude, y_or_latitude, z,
            well_id, resolved_property_type, z_weight
        )
    
    reproject_data_to_work = crs_utilities.crs_map_logic(data_crs, grid_crs)

    clip_action = str(clip_action).strip().lower() if clip_action is not None else None
    if clip_action is not None and clip_action not in ('flag', 'cut'):
        raise ValueError(f"clip_action must be 'flag' or 'cut', got '{clip_action}'")
    if clip_shape is not None and clip_action is None:
        raise ValueError(
            f"clip_action must be specified when clip_shape='{clip_shape}' is used. "
            "Set clip_action to 'flag' (keeps all cells + adds boolean column) or 'cut' (removes cells outside boundary)."
        )

    # Include z in cleanup so x, y, z stay index-aligned after NaN/Inf removal.
    # Without this, dropna() on x/y alone can misalign z if rows are dropped at different positions.
    _z_provided = z is not None and hasattr(z, '__len__') and len(z) > 0
    if _z_provided:
        df = pd.DataFrame({xcol: x_or_longitude, ycol: y_or_latitude, 'z_val': z})
    else:
        df = pd.DataFrame({xcol: x_or_longitude, ycol: y_or_latitude})
    _nrows_before = len(df)
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    _nrows_dropped = _nrows_before - len(df)
    if _nrows_dropped > 0:
        import warnings
        warnings.warn(
            f"[SpotGrid] {_nrows_dropped} row(s) removed due to NaN or Inf in x, y, or z. "
            f"{len(df)} of {_nrows_before} points remain.",
            stacklevel=2
        )
    # Preserve aligned z now — reproject_coordinates returns a new df without z_val
    z_clean = df['z_val'].to_numpy() if 'z_val' in df.columns else None

    is_polygon_clip = clip_shape is not None and clip_shape == 'polygon'
    clip_polygon = None
    
    if is_polygon_clip:
        clip_polygon = io_utilities.geo_series_from_wkb(external_clip_geometry, crs=data_crs)
    
    if reproject_data_to_work:
        df = crs_utilities.reproject_coordinates(data_crs, grid_crs, df[xcol], df[ycol])
        if is_polygon_clip:
            assert clip_polygon is not None
            clip_polygon = crs_utilities.reproject_geometry(data_crs, grid_crs, clip_polygon, to_spotfire=False)

    grid_crs_units = crs_utilities.crs_coordinate_units(grid_crs)
    if grid_crs_units is None:
        raise ValueError("Could not determine units of grid CRS.")

    unit_factor = io_utilities.convert_unit('meters', grid_crs_units)
    if spacingx is not None:
        spacingx = unit_factor * spacingx
    if spacingy is not None:
        spacingy = unit_factor * spacingy
    buffer = unit_factor * buffer

    x = df[xcol].to_numpy()
    y = df[ycol].to_numpy()

    # Reject negative z values — not physically valid for reservoir properties (thickness, porosity, etc.)
    if z_clean is not None:
        neg_mask = z_clean < 0
        if neg_mask.any():
            import warnings
            n_neg = int(neg_mask.sum())
            warnings.warn(
                f"[SpotGrid] {n_neg} negative z value(s) removed. "
                "Negative values are not valid for reservoir properties (e.g., thickness, porosity).",
                stacklevel=2
            )
            valid_mask = ~neg_mask
            x = x[valid_mask]
            y = y[valid_mask]
            z_clean = z_clean[valid_mask]

    if len(x) == 0:
        raise ValueError("No valid coordinate and z values remain after input cleaning.")

    if is_polygon_clip:
        assert clip_polygon is not None
        clip_polygon = clip_polygon.union_all()
        xmin_base, xmax_base, ymin_base, ymax_base = grid.get_geometry_base_bounds(clip_polygon)
    else:
        xmin_base, xmax_base, ymin_base, ymax_base = grid.get_base_bounds(x, y)

    xmin_base, xmax_base, ymin_base, ymax_base = _expand_bounds(
        xmin_base, xmax_base, ymin_base, ymax_base, x, y, buffer, buffer_fraction
    )

    xi, yi, actual_spacing_x, actual_spacing_y, actual_npointsx, actual_npointsy = grid.generate_grid_coordinates( 
                xmin_base, xmax_base, ymin_base, ymax_base,
                npointsx=npointsx, npointsy=npointsy, grid_spacing_x=spacingx, grid_spacing_y=spacingy, 
                preserve_bounds=honor_bounds)

    actual_spacing_x = actual_spacing_x / unit_factor
    actual_spacing_y = actual_spacing_y / unit_factor

    grid_gdf = grid.get_grid_as_polygons(xi, yi, grid_crs,
            x_col_name=xcol, y_col_name=ycol, id_col_name=grididcol, geometry_col_name=geocol)
    grid_gdf.rename(columns={xcol: gridxcol, ycol: gridycol}, inplace=True)

    final_crs = crs_utilities.get_crs_code(grid_crs)

    clip_flag = None
    
    if clip_shape is not None:
        use_flag_mode = clip_action == 'flag'
        
        if use_flag_mode:
            from shapely import points, covers

            if is_polygon_clip:
                assert clip_polygon is not None
                clip_boundary = clip_polygon.union_all() if hasattr(clip_polygon, 'union_all') else clip_polygon
            else:
                clip_boundary = _build_clip_boundary(
                    clip_shape.lower(), x, y, buffer, buffer_fraction
                )

            center_pts = points(grid_gdf[gridxcol].values, grid_gdf[gridycol].values)
            flags = covers(clip_boundary, center_pts)

            grid_gdf['clip_flag'] = flags
            clip_flag = flags
        else:
            NATIVE_CUT_SHAPES = {'tighthull', 'tightenvelope'}
            clip_shape_lower = clip_shape.lower()

            if not is_polygon_clip and clip_shape_lower in NATIVE_CUT_SHAPES:
                from shapely import points, covers
                clip_boundary = _build_clip_boundary(
                    clip_shape_lower, x, y, buffer, buffer_fraction
                )
                inside_mask = covers(
                    clip_boundary,
                    points(grid_gdf[gridxcol].values, grid_gdf[gridycol].values)
                )
                grid_gdf = grid_gdf.loc[inside_mask].reset_index(drop=True)
            elif is_polygon_clip:
                assert clip_polygon is not None
                grid_gdf, _ = grid.clip_grid_with_polygon(grid_gdf, gridxcol, gridycol, x, y, grid_crs,
                            clip_shape=clip_shape, clip_action=clip_action, buffer=buffer, buffer_fraction=buffer_fraction,
                            external_geometry=clip_polygon)
            else:
                grid_gdf, _ = grid.clip_grid_with_polygon(grid_gdf, gridxcol, gridycol, x, y, grid_crs,
                            clip_shape=clip_shape, clip_action=clip_action, buffer=buffer, buffer_fraction=buffer_fraction)

    # ================================================================
    # PHASE 2: INTERPOLATION ON GRID CENTERS
    # ================================================================

    interpolation_metrics = None
    interpolation_parms = None
    interpolation_sigma = None

    grid_centers_x = grid_gdf[gridxcol].values
    grid_centers_y = grid_gdf[gridycol].values
    
    try:
        if z_clean is None or len(z_clean) == 0:
            raise ValueError("z values are required but are empty or None (check for all-NaN, all-Inf, or all-negative inputs)")

        z_df = pd.DataFrame({xcol: x, ycol: y, 'z_val': z_clean})

        # TODO: Consider raising the minimum point threshold (currently >3) for production use.
        # Robust subsurface interpolation (thickness, porosity) typically needs at least 8-10 wells.
        if len(z_df) > 3:
            if clip_flag is not None:
                interp_indices = np.where(clip_flag)[0]
                xi_interp = grid_centers_x[interp_indices]
                yi_interp = grid_centers_y[interp_indices]
            else:
                xi_interp = grid_centers_x
                yi_interp = grid_centers_y
                interp_indices = np.arange(len(grid_centers_x))
            
            x_data = z_df[xcol].values
            y_data = z_df[ycol].values
            z_data = z_df['z_val'].values
            
            zi, interpolation_parms, interpolation_sigma = generate_interpolation(
                x_data, y_data, z_data, xi_interp, yi_interp,
                interpolation_method,
                idw_power, idw_nn, idw_mode,
                rbf_smoothing, rbf_epsilon, rbf_neighbors)      
            
            metrics1 = interpolation.base.evaluate_structure_similarity_spearman(
                x_data, y_data, z_data, xi_interp, yi_interp, zi)
            metrics2 = interpolation.base.evaluate_grid_variability(z_data, zi)
            interpolation_metrics = pd.concat([metrics1, metrics2], axis=1)
            
            zi_full = np.full(len(grid_centers_x), np.nan)
            zi_full[interp_indices] = zi

            # Clamp negative output values — TPS (minimum curvature) can oscillate below zero
            # in sparse or boundary areas. All reservoir properties (thickness, porosity, etc.)
            # are physically non-negative, so any negative interpolated value is meaningless.
            n_neg_output = int(np.sum(zi_full[interp_indices] < 0))
            if n_neg_output > 0:
                import warnings
                warnings.warn(
                    f"[SpotGrid] {n_neg_output} interpolated grid cell(s) had negative values "
                    "and were clamped to 0. This is typical TPS boundary behaviour in sparse areas.",
                    stacklevel=2
                )
            zi_full = np.where(zi_full < 0, 0.0, zi_full)

            if interpolation_sigma is not None:
                sigma_full = np.full(len(grid_centers_x), np.nan)
                sigma_full[interp_indices] = interpolation_sigma
                interpolation_sigma = sigma_full
        else:
            zi_full = np.full(len(grid_centers_x), np.nan)
            interpolation_parms = pd.DataFrame({'result': 'Insufficient data points for interpolation (need > 3)'})
            
    except (FloatingPointError, np.linalg.LinAlgError) as e:
        zi_full = np.full(len(grid_centers_x), np.nan)
        interpolation_parms = pd.DataFrame({'result': f'Interpolation error: {str(e)}'})

    extra_col_names = grid_gdf.columns.difference([geocol]).tolist()
    extra_columns = grid_gdf[extra_col_names] if len(extra_col_names) > 0 else None
    grid_gdf = io_utilities.create_shapefile_output(grid_gdf, 
                            to_spotfire=True, add_spotfire_metadata=False,
                            crs=grid_crs,
                            extra_columns=extra_columns)

    grid_gdf['interpolated_z'] = zi_full
    grid_gdf['grid_crs'] = final_crs
    if interpolation_sigma is not None:
        grid_gdf['interpolation_sigma'] = interpolation_sigma

    grid_gdf = io_utilities.add_metadata_to_spotfire(grid_gdf)

    if interpolation_parms is not None:
        interpolation_parms['aggregation_property_type'] = resolved_property_type
        interpolation_parms['property_type_source'] = property_type_source
        interpolation_parms['selected_property_name'] = selected_property_name
 
    endall = time.time()
    time_elapsed = round(endall - startall, 4)

    return (grid_gdf, actual_spacing_x, actual_spacing_y, actual_npointsx, actual_npointsy, 
            final_crs, zi_full, interpolation_parms, interpolation_metrics, time_elapsed, interpolation_sigma)

if __name__ in ["__main__", "builtins"]:
    results = main_entry_point(
                    data_crs, grid_crs,
                    input_data, selected_property_name,
                    npointsx, npointsy, spacingx, spacingy,
                    buffer, buffer_fraction, honor_bounds,
                    clip_shape, clip_action,
                    external_clip_geometry,
                    interpolation_method, idw_mode, idw_power, idw_nn,
                    rbf_smoothing, rbf_neighbors, rbf_epsilon)
    
    (grid_gdf, actual_spacing_x, actual_spacing_y, actual_npointsx, actual_npointsy, 
     final_crs, interpolated_z, interpolation_parms, interpolation_metrics, 
     time_elapsed, interpolation_sigma) = results

### END
