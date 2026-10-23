
### IMPORT LIBRARIES
import pandas as pd
import numpy as np
# Geospatial library
from spotfire_geospatial import io_utilities, grid, contours

# Avoid the "A value is trying to set on a copy of a slice..." warning
pd.options.mode.chained_assignment = None 

######################################################################
### CONTOUR LINE & BINNED HEATMAP GENERATOR
######################################################################
# See Spot_Countours_Custom.guidance.md for detailed parameter documentation

######################################################################
### FUNCTIONS
######################################################################
def input_validation_and_defaults(grid_df, max_bins, bin_style,
                                remove_small_islands, output_binned_heatmap):
    """Validate inputs and assign parameter defaults."""
    
    ngridrows = len(grid_df)
    if ngridrows < 3:
        raise ValueError("grid_data must contain at least 3 valid grid cells for contouring.")
    
    # Assign default or validate max_bins
    if max_bins is None:
        max_bins = 10
    else:
        try:
            max_bins = float(max_bins)
        except (TypeError, ValueError):
            raise ValueError("max_bins must be an integer greater than or equal to 2.")
        if not np.isfinite(max_bins) or not max_bins.is_integer() or max_bins < 2:
            raise ValueError("max_bins must be an integer greater than or equal to 2.")
        max_bins = int(max_bins)
    
    # Validate and assign default bin_style
    if bin_style is None:
        bin_style = 'regular'
    else:
        ALLOWED_BIN_STYLES = ['regular','quantiles','jenks','hotspots']
        ALLOWED_BIN_STYLES_STR = ', '.join(ALLOWED_BIN_STYLES)
        bin_style = bin_style.lower()
        if bin_style not in ALLOWED_BIN_STYLES:
            raise ValueError(f'bin_style must be one of {ALLOWED_BIN_STYLES_STR}, got: {bin_style}')

    # Assign defaults for boolean flags
    if remove_small_islands is None:
        remove_small_islands = False
        
    if output_binned_heatmap is None:
        output_binned_heatmap = True

    return ngridrows, max_bins, bin_style, remove_small_islands, output_binned_heatmap


def _find_grid_column(grid_data, candidates):
    normalized_columns = {str(column).strip().lower(): column for column in grid_data.columns}
    for candidate in candidates:
        if candidate in normalized_columns:
            return normalized_columns[candidate]
    return None


def select_contour_input_data(grid_data):
    """Extract valid contour inputs and CRS from a grid table."""
    if not isinstance(grid_data, pd.DataFrame):
        raise ValueError("grid_data must be configured as a Spotfire Table input.")

    x_column = _find_grid_column(grid_data, ('grid_center_x', 'x'))
    y_column = _find_grid_column(grid_data, ('grid_center_y', 'y'))
    z_column = _find_grid_column(grid_data, ('interpolated_z',))
    crs_column = _find_grid_column(grid_data, ('grid_crs',))
    if x_column is None or y_column is None or z_column is None or crs_column is None:
        raise ValueError(
            "grid_data must contain grid_center_x, grid_center_y, interpolated_z, and grid_crs columns "
            "from 1.SpotGrid&Interp.py."
        )

    crs_values = grid_data[crs_column].dropna().astype(str).str.strip()
    crs_values = crs_values[crs_values != ''].unique()
    if len(crs_values) != 1:
        raise ValueError("grid_data must contain exactly one non-empty grid_crs value.")
    grid_crs = crs_values[0]

    grid_df = pd.DataFrame({
        'x': pd.to_numeric(grid_data[x_column], errors='coerce'),
        'y': pd.to_numeric(grid_data[y_column], errors='coerce'),
        z_column: pd.to_numeric(grid_data[z_column], errors='coerce'),
    }).replace([np.inf, -np.inf], np.nan)

    clip_column = _find_grid_column(grid_data, ('clip_flag',))
    if clip_column is not None:
        grid_df = grid_df.loc[grid_data[clip_column].fillna(False).astype(bool)]
    grid_df = grid_df.dropna()
    if grid_df[z_column].nunique() < 2:
        raise ValueError("grid_data must contain at least two distinct interpolated values for contouring.")

    return grid_df, z_column, grid_crs


def _calculate_nice_edges(z_min, z_max, max_bins):
    """
    Generate human-readable contour levels using the 'nice numbers' algorithm.

    Computes a rounded step size — a multiple of 1, 2, 2.5 or 5 scaled by a
    power of 10 — so contour values are clean and easy to read on a map.
    ``max_bins`` is a *target*; the actual number of levels may differ slightly
    to keep values round (e.g. step=20 yields 7 clean levels instead of 10
    arbitrary ones like 119.35, 135.39, 151.43 …).

    Precision adapts automatically to the data scale:
        Large range  (100–300)  →  integer steps     (100, 120, 140 …)
        Medium range (1–10)     →  1-decimal steps   (1.0, 1.5, 2.0 …)
        Small range  (0–1)      →  2+ decimal steps  (0.00, 0.25, 0.50 …)

    Parameters
    ----------
    z_min, z_max : float  Data range (from the active grid cells).
    max_bins     : int    Target number of intervals (level count ≈ max_bins).

    Returns
    -------
    edges : np.ndarray  Sorted array of rounded contour level values.
    """
    data_range = z_max - z_min
    if data_range <= 0 or max_bins <= 0:
        return np.array([z_min, z_max])

    raw_step   = data_range / max_bins
    magnitude  = 10.0 ** np.floor(np.log10(raw_step))
    normalized = raw_step / magnitude   # always in [1, 10)

    # Snap to the nearest 'nice' multiplier: {1, 2, 2.5, 5, 10}
    if   normalized <= 1.0: nice_mult = 1.0
    elif normalized <= 2.0: nice_mult = 2.0
    elif normalized <= 2.5: nice_mult = 2.5
    elif normalized <= 5.0: nice_mult = 5.0
    else:                   nice_mult = 10.0

    step = nice_mult * magnitude

    # Align to exact multiples of step inside [z_min, z_max]
    first = np.ceil(z_min  / step) * step
    last  = np.floor(z_max / step) * step

    n     = int(round((last - first) / step)) + 1
    edges = np.array([first + i * step for i in range(n)])

    # Eliminate floating-point noise (e.g. 119.9999 → 120, 2.4999 → 2.5)
    extra_decimal  = 1 if nice_mult == 2.5 else 0
    decimal_places = max(0, -int(np.floor(np.log10(step))) + extra_decimal)
    edges          = np.round(edges, decimal_places)

    return edges


######################################################################
### MAIN CODE
######################################################################
def main_entry_point(grid_data, max_bins,
                            bin_style,
                            contour_smooth,
                            remove_small_islands,
                            output_binned_heatmap):
    """
    Generate contour lines and optional binned heatmaps from gridded data.
    
    Returns:
        contour_lines (GeoDataFrame): Contour line geometries with z_value attribute
        binned_heatmap (GeoDataFrame/DataFrame): Grid cell polygons with bin assignments or placeholder
        levels (DataFrame): Contour levels with columns 'level' and 'flag' ('min'/'bin'/'max')
    
    See Spot_Countours_Custom.guidance.md for parameter details.
    """
    
    # Column name mappings
    xcol = 'x'
    ycol = 'y'
    polygon_id_col = 'polygon_id'

    grid_df, zcol, grid_crs = select_contour_input_data(grid_data)
    valid_inputs = input_validation_and_defaults(
        grid_df, max_bins, bin_style, remove_small_islands, output_binned_heatmap
    )
    ngridrows, max_bins, bin_style, remove_small_islands, output_binned_heatmap = valid_inputs
    
    # Calculate bin edges.
    # For 'regular' binning: apply the 'nice numbers' algorithm so contour
    # levels are rounded and easy to read (e.g. 100, 120, 140 instead of
    # 119.35, 135.39, 151.43). max_bins is treated as a target; the actual
    # count may differ slightly to preserve round values.
    # For statistical styles (quantiles, jenks, hotspots): keep the library's
    # computation since those values carry data-driven meaning.
    if bin_style == 'regular':
        edges = _calculate_nice_edges(
            grid_df[zcol].min(), grid_df[zcol].max(), max_bins
        )
    else:
        edges, _ = contours.calculate_bins(grid_df[zcol], max_bins, bin_style)

    # Generate contour lines
    contour_lines = contours.calculate_contour_lines(grid_df, edges, grid_crs, 
                                                     contour_smooth=contour_smooth,
                                                     remove_small_islands=remove_small_islands,
                                                     x_column_name=xcol, 
                                                     y_column_name=ycol, 
                                                     z_column_name=zcol)
    
    # Generate binned heatmap if requested
    if output_binned_heatmap:
        grid_df_polygons = grid.get_grid_as_polygons_from_dataframe(grid_df, 
                                                                     crs=grid_crs, 
                                                                     x_col_name=xcol,
                                                                     y_col_name=ycol,
                                                                     geometry_col_name='geometry')
        
        binned_heatmap = contours.generate_binned_heatmap(grid_df_polygons, edges, 
                                                          z_column_name=zcol)
        binned_heatmap[polygon_id_col] = binned_heatmap.index.astype(str)
    
    # Calculate level definitions
    unique_z_levels = np.sort(contour_lines['z_value'].unique())
    z_min = grid_df[zcol].min()
    z_max = grid_df[zcol].max()
    
    levels_flag = ['bin'] * len(unique_z_levels)
    levels_flag.insert(0, 'min')
    levels_flag.append('max')
    
    all_levels = np.concatenate(([z_min], unique_z_levels, [z_max]))
    levels = pd.DataFrame({'level': all_levels, 'flag': levels_flag})
    
    # Prepare output for Spotfire
    contour_lines = io_utilities.prepare_geo_dataframe_for_spotfire(contour_lines)
    
    if output_binned_heatmap:
        binned_heatmap = io_utilities.prepare_geo_dataframe_for_spotfire(binned_heatmap)
    else:
        binned_heatmap = pd.DataFrame({'binned_heatmap': ['NA']})
    
    return contour_lines, binned_heatmap, levels

if __name__ in ["__main__", "builtins"]:
    results = main_entry_point(grid_data, max_bins,
                               bin_style,
                               contour_smooth,
                               remove_small_islands,
                               output_binned_heatmap)
    
    contour_lines, binned_heatmap, levels = results

### END
