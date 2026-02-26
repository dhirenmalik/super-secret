from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import pandas as pd
import numpy as np
import io
from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import List, Dict, Any
from pydantic import BaseModel
from app.services.anomaly_agent import preprocess_data, generate_anomalies, assign_brands_to_anomalies, summarize_observations_llm, SPEND_COLS, IMP_COLS

router = APIRouter()

class AnomalyRecordsRequest(BaseModel):
    records: List[Dict[str, Any]]


DEFAULT_CATEGORY_CODE = ""
DEFAULT_MODEL_GROUP = ""

TACTIC_LABELS = {
    'M_SP_AB_SPEND': 'Sponsored Products Automatic',
    'M_SP_KWB_SPEND': 'Sponsored Products Manual',
    'M_SBA_SPEND': 'Sponsored Brands',
    'M_SV_SPEND': 'Sponsored ProductS Video',
    'M_ON_DIS_AT_SPEND': 'Onsite Display Audience Targeting',
    'M_ON_DIS_CT_SPEND': 'Onsite Display Contextual Targeting',
    'M_ON_DIS_CATTO_SPEND': 'Onsite Display Category Takeover',
    'M_ON_DIS_KW_SPEND': 'Onsite Display Keyword',
    'M_ON_DIS_ROS_SPEND': 'Onsite Display Run-of-site',
    'M_ON_DIS_TOTAL_HPLO_SPEND': 'Onsite Display Total HPLO',
    'M_ON_DIS_HP_SPEND': 'Onsite Display Homepage',
    'M_ON_DIS_HPTO_SPEND': 'Onsite Display Homepage Takeover',
    'M_ON_DIS_HPGTO_SPEND': 'Onsite Display Homepage Gallery Takeover',
    'M_OFF_DIS_FB_SPEND': 'Offsite Display Facebook',
    'M_OFF_DIS_PIN_SPEND': 'Offsite Display Pinterest',
    'M_OFF_DIS_WN_WITHOUTCTV_SPEND': 'Offsite WN - Display & Preroll',
    'M_OFF_DIS_DSP_CTV_SPEND': 'Offsite Display Walmart DSP CTV',
    'M_INSTORE_TV_WALL_SPEND': 'TV Wall',
}

SPENDS_ALL = [
    'M_SEARCH_SPEND',
    'M_SP_AB_SPEND', 'M_SP_KWB_SPEND', 'M_SBA_SPEND', 'M_SV_SPEND',
    'M_ON_DIS_TOTAL_SPEND',
    'M_ON_DIS_AT_SPEND', 'M_ON_DIS_CT_SPEND', 'M_ON_DIS_CATTO_SPEND',
    'M_ON_DIS_KW_SPEND', 'M_ON_DIS_ROS_SPEND', 'M_ON_DIS_TOTAL_HPLO_SPEND',
    'M_ON_DIS_HP_SPEND', 'M_ON_DIS_HPTO_SPEND', 'M_ON_DIS_HPGTO_SPEND',
    'M_OFF_DIS_TOTAL_SPEND',
    'M_OFF_DIS_FB_SPEND', 'M_OFF_DIS_PIN_SPEND',
    'M_OFF_DIS_WN_WITHOUTCTV_SPEND', 'M_OFF_DIS_DSP_CTV_SPEND',
    'M_INSTORE_TV_WALL_SPEND',
]

SPENDS_GRANULAR = [
    'M_SP_AB_SPEND', 'M_SP_KWB_SPEND', 'M_SBA_SPEND', 'M_SV_SPEND',
    'M_ON_DIS_AT_SPEND', 'M_ON_DIS_CT_SPEND', 'M_ON_DIS_CATTO_SPEND',
    'M_ON_DIS_KW_SPEND', 'M_ON_DIS_ROS_SPEND', 'M_ON_DIS_TOTAL_HPLO_SPEND',
    'M_ON_DIS_HP_SPEND', 'M_ON_DIS_HPTO_SPEND', 'M_ON_DIS_HPGTO_SPEND',
    'M_OFF_DIS_FB_SPEND', 'M_OFF_DIS_PIN_SPEND',
    'M_OFF_DIS_WN_WITHOUTCTV_SPEND', 'M_OFF_DIS_DSP_CTV_SPEND',
    'M_INSTORE_TV_WALL_SPEND',
]

SPENDS_TOTAL = [
    'M_SEARCH_SPEND', 'M_ON_DIS_TOTAL_SPEND',
    'M_OFF_DIS_TOTAL_SPEND', 'M_INSTORE_TV_WALL_SPEND',
]

IMP_COLS = [
    'M_SEARCH_CLK',
    'M_SP_AB_CLK', 'M_SP_KWB_CLK', 'M_SBA_CLK', 'M_SV_CLK',
    'M_ON_DIS_TOTAL_IMP',
    'M_ON_DIS_AT_IMP', 'M_ON_DIS_CT_IMP', 'M_ON_DIS_CATTO_IMP',
    'M_ON_DIS_KW_IMP', 'M_ON_DIS_ROS_IMP', 'M_ON_DIS_TOTAL_HPLO_IMP',
    'M_ON_DIS_HP_IMP', 'M_ON_DIS_HPTO_IMP', 'M_ON_DIS_HPGTO_IMP',
    'M_OFF_DIS_TOTAL_IMP',
    'M_OFF_DIS_FB_IMP', 'M_OFF_DIS_PIN_IMP',
    'M_OFF_DIS_WN_WITHOUTCTV_IMP', 'M_OFF_DIS_DSP_CTV_IMP',
    'M_INSTORE_TV_WALL_IMP',
]

HP_SPEND = [
    'M_ON_DIS_CATTO_SPEND', 'M_ON_DIS_TOTAL_HPLO_SPEND',
    'M_ON_DIS_HP_SPEND', 'M_ON_DIS_HPTO_SPEND', 'M_ON_DIS_HPGTO_SPEND',
]

METRIC_TYPE = {
    'M_SEARCH_SPEND': 'CPC', 'M_SP_AB_SPEND': 'CPC', 'M_SP_KWB_SPEND': 'CPC',
    'M_SBA_SPEND': 'CPC', 'M_SV_SPEND': 'CPC',
    'M_ON_DIS_TOTAL_SPEND': 'CPM', 'M_ON_DIS_AT_SPEND': 'CPM',
    'M_ON_DIS_CT_SPEND': 'CPM',
    'M_ON_DIS_CATTO_SPEND': 'CPD', 'M_ON_DIS_KW_SPEND': 'CPM', 'M_ON_DIS_ROS_SPEND': 'CPM',
    'M_ON_DIS_TOTAL_HPLO_SPEND': 'CPD',
    'M_ON_DIS_HP_SPEND': 'CPD', 'M_ON_DIS_HPTO_SPEND': 'CPD', 'M_ON_DIS_HPGTO_SPEND': 'CPD',
    'M_OFF_DIS_TOTAL_SPEND': 'CPM', 'M_OFF_DIS_FB_SPEND': 'CPM', 'M_OFF_DIS_PIN_SPEND': 'CPM',
    'M_OFF_DIS_WN_WITHOUTCTV_SPEND': 'CPM', 'M_OFF_DIS_DSP_CTV_SPEND': 'CPM',
    'M_INSTORE_TV_WALL_SPEND': 'CPM',
}

# ── Chart sheet column definitions (matching template exactly) ──
CHART_UNITS_TREND = ['O_SALE', 'O_UNIT', 'O_SALE_OG', 'O_SALE_DOTCOM', 'O_UNIT_OG', 'O_UNIT_DOTCOM']
CHART_UNITS_VS_SPENDS = ['O_UNIT', 'M_SEARCH_SPEND', 'M_ON_DIS_TOTAL_SPEND', 'M_OFF_DIS_TOTAL_SPEND', 'M_INSTORE_TV_WALL_SPEND', 'Total_spends']
CHART_SPENDS_VS_IMPS = ['M_SP_AB_CLK', 'M_SP_AB_SPEND', 'M_SP_KWB_CLK', 'M_SP_KWB_SPEND', 'M_SBA_CLK', 'M_SBA_SPEND', 'M_SV_CLK', 'M_SV_SPEND',
                         'M_ON_DIS_AT_IMP', 'M_ON_DIS_AT_SPEND', 'M_ON_DIS_CT_IMP', 'M_ON_DIS_CT_SPEND',
                         'M_OFF_DIS_FB_IMP', 'M_OFF_DIS_FB_SPEND', 'M_OFF_DIS_PIN_IMP', 'M_OFF_DIS_PIN_SPEND']
CHART_UNITS_VS_SEARCH = ['O_UNIT', 'M_SP_AB_CLK', 'M_SP_KWB_CLK', 'M_SBA_CLK', 'M_SV_CLK']
CHART_UNITS_VS_ONSITE = ['O_UNIT', 'M_ON_DIS_AT_IMP', 'M_ON_DIS_CT_IMP', 'M_ON_DIS_KW_IMP', 'M_ON_DIS_HP_IMP',
                          'M_ON_DIS_ROS_IMP', 'M_ON_DIS_HPLO_IMP', 'M_ON_DIS_APP_HPLO_IMP']
CHART_UNITS_VS_OFFSITE = ['O_UNIT', 'M_OFF_DIS_WN_WITHOUTCTV_IMP', 'M_OFF_DIS_DSP_CTV_IMP', 'M_OFF_DIS_FB_IMP', 'M_OFF_DIS_PIN_IMP']
CHART_UNITS_VS_INSTORE = ['O_UNIT', 'M_INSTORE_TV_WALL_IMP', 'M_INSTORE_TV_WALL_SPEND']


def _scalar(v):
    if isinstance(v, (pd.Series, np.ndarray)):
        v = v.iloc[0] if isinstance(v, pd.Series) else v.item()
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return 0.0 if (np.isnan(v) or np.isinf(v)) else float(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    return v


def _pct(v):
    v = _scalar(v)
    try:
        f = float(v)
        return 0.0 if (np.isnan(f) or np.isinf(f)) else round(f * 100, 1)
    except (TypeError, ValueError):
        return 0.0


def _num(v, d=1):
    v = _scalar(v)
    try:
        f = float(v)
        return 0.0 if (np.isnan(f) or np.isinf(f)) else round(f, d)
    except (TypeError, ValueError):
        return 0.0


def _fdate(dt_str, fmt="%b'%y"):
    return datetime.strptime(dt_str, '%Y-%m-%d').strftime(fmt)


def _safe_div(a, b):
    return a / b if b != 0 else 0


def _ks(df_ks, col, field):
    if col not in df_ks.index or field not in df_ks.columns:
        return 0.0
    return _scalar(df_ks.loc[col, field])


def _build_chart_series(df, columns, periods_map):
    """Build time-series data + period aggregates for chart sheets."""
    # Daily time-series (full resolution for accurate peak/dip/event plotting)
    # Ensure INDEX is datetime and properly sorted
    df_ts = df[['INDEX', 'year_flag'] + [c for c in columns if c in df.columns]].copy()
    
    # Robust numeric conversion for INDEX/date column if it's not already datetime
    if not np.issubdtype(df_ts['INDEX'].dtype, np.datetime64):
         df_ts['INDEX'] = pd.to_datetime(df_ts['INDEX'], errors='coerce')
    
    df_ts = df_ts.dropna(subset=['INDEX']).sort_values('INDEX')
    
    time_series = []
    for _, row in df_ts.iterrows():
        # Use strftime to ensure it is a standard string 'YYYY-MM-DD'
        date_str = row['INDEX'].strftime('%Y-%m-%d')
        point = {'date': date_str}
        for c in columns:
            if c in row.index:
                point[c] = _scalar(row[c])
        time_series.append(point)

    # Period aggregates (3-period summary like rows 6-8 in chart sheets)
    period_agg = {}
    for flag, label in periods_map.items():
        sub = df[df['year_flag'] == flag]
        period_agg[label] = {}
        
        # Calculate weeks based on unique dates or min/max range
        if len(sub) > 0:
            weeks = (sub['INDEX'].max() - sub['INDEX'].min()).days / 7.0
            period_agg[label]['Weeks'] = round(weeks, 1) if weeks > 0 else 0
        else:
            period_agg[label]['Weeks'] = 0

        for c in columns:
            if c in sub.columns:
                period_agg[label][c] = _scalar(sub[c].sum())

    return {'time_series': time_series, 'period_agg': period_agg, 'columns': [c for c in columns if c in df.columns]}


def _calculate_peaks_dips(df, column='O_UNIT', peak_percentile=99, dip_percentile=1):
    """Calculate significant peaks and dips based on percentiles."""
    if column not in df.columns:
        return [], []

    peak_threshold = np.percentile(df[column], peak_percentile)
    dip_threshold = np.percentile(df[column], dip_percentile)

    peaks = df[df[column] > peak_threshold].copy()
    dips = df[df[column] < dip_threshold].copy()

    # Format for frontend
    peak_list = []
    for _, row in peaks.iterrows():
        peak_list.append({
            'date': row['INDEX'].strftime('%Y-%m-%d'),
            'value': _scalar(row[column]),
            'type': 'PEAK'
        })

    dip_list = []
    for _, row in dips.iterrows():
        dip_list.append({
            'date': row['INDEX'].strftime('%Y-%m-%d'),
            'value': _scalar(row[column]),
            'type': 'DIP'
        })

    return peak_list, dip_list


def _get_holiday_events():
    """Return hardcoded holiday events for chart highlighting."""
    return [
        {'label': 'Christmas', 'date': '2022-12-25', 'color': '#FF0000'},
        {'label': 'Christmas', 'date': '2023-12-25', 'color': '#FF0000'},
        {'label': 'Christmas', 'date': '2024-12-25', 'color': '#FF0000'},
        {'label': 'Thanksgiving', 'date': '2022-11-24', 'color': '#008000'},
        {'label': 'Thanksgiving', 'date': '2023-11-23', 'color': '#008000'},
        {'label': 'Thanksgiving', 'date': '2024-11-28', 'color': '#008000'},
        {'label': 'Easter', 'date': '2023-04-08', 'color': '#FFFF00'},
        {'label': 'Easter', 'date': '2024-03-30', 'color': '#FFFF00'},
        {'label': 'Easter', 'date': '2025-04-19', 'color': '#FFFF00'},
        {'label': 'Valentines', 'date': '2023-02-11', 'color': '#0000FF'},
        {'label': 'Valentines', 'date': '2024-02-10', 'color': '#0000FF'},
        {'label': 'Valentines', 'date': '2025-02-08', 'color': '#0000FF'},
        {'label': 'July 4th', 'date': '2023-07-03', 'color': '#808080'},
        {'label': 'July 4th', 'date': '2024-07-03', 'color': '#808080'},
    ]

import json
import os
import csv as csv_module

# ── Module-level singleton cache for cleanbrand data ──
# Loads once on server startup; all requests reuse the pre-indexed dataframe.
def _load_clean_brand_cache():
    clean_path = "/Users/dhiren/walmart/walmart-etl-eda/data/Stack Output/cleanbrand_agg.csv"
    result = {'df': pd.DataFrame(), 'num_brands': 0}
    try:
        # Peek at headers to find safe columns
        with open(clean_path, 'r') as f:
            available_cols = next(csv_module.reader(f))
        
        all_metrics = list(set(SPEND_COLS + IMP_COLS))
        safe_metrics = [c for c in all_metrics if c in available_cols and ("IMP" in c or "CLK" in c or "SPEND" in c)]
        
        df = pd.read_csv(clean_path, usecols=['INDEX', 'UNIQUE_BRAND_NAME'] + safe_metrics)
        result['num_brands'] = int(df['UNIQUE_BRAND_NAME'].nunique())
        df['INDEX'] = pd.to_datetime(df['INDEX'], errors='coerce').dt.normalize()
        df = df.set_index('INDEX').sort_index()
        result['df'] = df
        print(f"Cleanbrand cache loaded: {len(df)} rows, {result['num_brands']} brands, {len(safe_metrics)} metrics")
    except Exception as e:
        print(f"Warning: Could not load cleanbrand cache: {e}")
    return result

_CLEAN_BRAND_CACHE = _load_clean_brand_cache()

@router.post("/analysis")
async def post_discovery_analysis():
    """Accept agg brand file, load local clean brand data, and return analysis."""
    try:
        # ── Read dataset ──
        dataset_path = "/Users/dhiren/walmart/walmart-etl-eda/data/Stack Output/aggbrand_modelingstack.csv"
        
        if not os.path.exists(dataset_path):
             raise HTTPException(status_code=404, detail="Aggbrand Modeling Stack dataset not found.")
        
        agg_df = pd.read_csv(dataset_path)

        # ── Use cached cleanbrand data ──
        clean_df = _CLEAN_BRAND_CACHE['df']
        num_brands = _CLEAN_BRAND_CACHE['num_brands']
        
        # ── Advanced Discovery Agent Logic (Native Only) ──
        agent_insights = ""
        agent_anomalies_table = []
        try:
            clean_agg = preprocess_data(agg_df)
            base_anoms = generate_anomalies(clean_agg)
            
            if not base_anoms.empty:
                if not clean_df.empty:
                    base_anoms = assign_brands_to_anomalies(clean_df, base_anoms, brand_threshold=15.0)
                else:
                    base_anoms['Brands_list'] = ""
                    base_anoms['Contribution'] = ""

                # Store anomalies for frontend
                # Note: The original code had `final_anoms` which was assigned `base_anoms` right before this line.
                # I'm assuming `final_anoms` should now refer to the potentially modified `base_anoms`.
                agent_anomalies_table = base_anoms.fillna("").to_dict(orient="records") if not base_anoms.empty else []
        except Exception as ex:
            print(f"Error processing agent AI logic: {ex}")
            agent_insights = "Error generating anomaly data."
        # ─────────────────────────────────────
        
        category_code = DEFAULT_CATEGORY_CODE
        model_group = DEFAULT_MODEL_GROUP
        
        # Attempt to find main_config.json in parent directories
        base_dir = os.getcwd()
        config_path = os.path.join(base_dir, "..", "..", "..", "main_config.json") # Approx mapping to notebook's ../../../
        if not os.path.exists(config_path):
             config_path = os.path.join(base_dir, "main_config.json") # Check local

        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    category_code = config.get("CATEGORY_CODE", category_code)
                    model_group = config.get("CATEGORY_NAME", model_group)
            except Exception:
                pass # Silent fallback to defaults

        subcategories = model_group.upper()

        df = agg_df

        if 'INDEX' not in df.columns:
            raise HTTPException(status_code=400, detail="Agg Brand CSV must contain an 'INDEX' column")

        df['INDEX'] = pd.to_datetime(df['INDEX'])

        # ── Derive columns ──
        new_cols = {}
        for col in ['M_INSTORE_TV_WALL_SPEND', 'M_INSTORE_TV_WALL_IMP']:
            if col not in df.columns:
                new_cols[col] = 0
        for col in ['M_ON_DIS_HPLO_SPEND', 'M_ON_DIS_APP_HPLO_SPEND', 'M_ON_DIS_HPLO_IMP', 'M_ON_DIS_APP_HPLO_IMP']:
            if col not in df.columns:
                new_cols[col] = 0
        if new_cols:
            df = pd.concat([df, pd.DataFrame(new_cols, index=df.index)], axis=1)

        derived = pd.DataFrame(index=df.index)
        derived['M_SEARCH_SPEND'] = df['M_SP_AB_SPEND'] + df['M_SP_KWB_SPEND'] + df['M_SBA_SPEND'] + df['M_SV_SPEND']
        derived['M_ON_DIS_TOTAL_SPEND'] = (
            df['M_ON_DIS_AT_SPEND'] + df['M_ON_DIS_CT_SPEND'] + df['M_ON_DIS_CATTO_SPEND'] +
            df['M_ON_DIS_KW_SPEND'] + df['M_ON_DIS_ROS_SPEND'] + df['M_ON_DIS_HPLO_SPEND'] +
            df['M_ON_DIS_APP_HPLO_SPEND'] + df['M_ON_DIS_HP_SPEND'] + df['M_ON_DIS_HPTO_SPEND'] +
            df['M_ON_DIS_HPGTO_SPEND']
        )
        derived['M_OFF_DIS_TOTAL_SPEND'] = (
            df['M_OFF_DIS_FB_SPEND'] + df['M_OFF_DIS_PIN_SPEND'] +
            df['M_OFF_DIS_WN_WITHOUTCTV_SPEND'] + df['M_OFF_DIS_DSP_CTV_SPEND']
        )
        derived['M_ON_DIS_TOTAL_HPLO_SPEND'] = df['M_ON_DIS_HPLO_SPEND'] + df['M_ON_DIS_APP_HPLO_SPEND']
        derived['M_ON_DIS_TOTAL_HPLO_IMP'] = df.get('M_ON_DIS_HPLO_IMP', 0) + df.get('M_ON_DIS_APP_HPLO_IMP', 0)
        derived['M_SEARCH_CLK'] = df.get('M_SP_AB_CLK', 0) + df.get('M_SP_KWB_CLK', 0) + df.get('M_SBA_CLK', 0) + df.get('M_SV_CLK', 0)
        derived['M_ON_DIS_TOTAL_IMP'] = (
            df.get('M_ON_DIS_AT_IMP', 0) + df.get('M_ON_DIS_CT_IMP', 0) + df.get('M_ON_DIS_CATTO_IMP', 0) +
            df.get('M_ON_DIS_KW_IMP', 0) + df.get('M_ON_DIS_ROS_IMP', 0) + df.get('M_ON_DIS_HPLO_IMP', 0) +
            df.get('M_ON_DIS_APP_HPLO_IMP', 0) + df.get('M_ON_DIS_HP_IMP', 0) + df.get('M_ON_DIS_HPTO_IMP', 0) +
            df.get('M_ON_DIS_HPGTO_IMP', 0)
        )
        derived['M_OFF_DIS_TOTAL_IMP'] = (
            df.get('M_OFF_DIS_FB_IMP', 0) + df.get('M_OFF_DIS_PIN_IMP', 0) +
            df.get('M_OFF_DIS_WN_WITHOUTCTV_IMP', 0) + df.get('M_OFF_DIS_DSP_CTV_IMP', 0)
        )
        derived['Total_spends'] = derived['M_SEARCH_SPEND'] + derived['M_ON_DIS_TOTAL_SPEND'] + derived['M_OFF_DIS_TOTAL_SPEND'] + df['M_INSTORE_TV_WALL_SPEND']

        # Avoid DataFrame fragmentation by using concat instead of loop assignment
        cols_to_update = derived.columns
        df = df.drop(columns=[c for c in cols_to_update if c in df.columns])
        df = pd.concat([df, derived], axis=1)

        # ── Time Periods ──
        modeling_end_date = df['INDEX'].max()
        modeling_end = modeling_end_date.strftime('%Y-%m-%d')
        modeling_start_date = (modeling_end_date - pd.DateOffset(months=31)).replace(day=1)
        modeling_start = modeling_start_date.strftime('%Y-%m-%d')

        ly_end = modeling_end
        ly_start_date = (modeling_end_date - pd.DateOffset(months=11)).replace(day=1)
        ly_start = ly_start_date.strftime('%Y-%m-%d')

        py_end_date = ly_start_date - pd.DateOffset(days=1)
        py_end = py_end_date.strftime('%Y-%m-%d')
        py_start_date = (py_end_date - pd.DateOffset(months=11)).replace(day=1)
        py_start = py_start_date.strftime('%Y-%m-%d')

        other_end_date = py_start_date - pd.DateOffset(days=1)
        other_end = other_end_date.strftime('%Y-%m-%d')
        other_start = modeling_start

        other_time = f"{_fdate(other_start)} - {_fdate(other_end)}"
        py_time = f"{_fdate(py_start)} - {_fdate(py_end)}"
        ly_time = f"{_fdate(ly_start)} - {_fdate(ly_end)}"

        df = df[(df['INDEX'] >= modeling_start) & (df['INDEX'] <= modeling_end)]
        df = df.copy()
        df['year_flag'] = np.where(
            (df['INDEX'] >= ly_start) & (df['INDEX'] <= ly_end), 'LY',
            np.where((df['INDEX'] >= py_start) & (df['INDEX'] <= py_end), 'PY', 'other')
        )

        periods = ['other', 'PY', 'LY']
        periods_map = {'other': other_time, 'PY': py_time, 'LY': ly_time}

        # Removed arbitrary Brand logic

        # ── YOY Change % ──
        t1 = df[['year_flag', 'O_UNIT', 'O_SALE', 'Total_spends']].groupby('year_flag').sum(numeric_only=True).T
        if 'LY' in t1.columns and 'PY' in t1.columns:
            t1['YOY %'] = (t1['LY'] / t1['PY']) - 1
        else:
            t1['YOY %'] = 0

        yoy_change = {
            'omni_unit_sales': _pct(t1.at['O_UNIT', 'YOY %']) if 'O_UNIT' in t1.index else 0,
            'omni_gmv': _pct(t1.at['O_SALE', 'YOY %']) if 'O_SALE' in t1.index else 0,
            'wmc_spends': _pct(t1.at['Total_spends', 'YOY %']) if 'Total_spends' in t1.index else 0,
        }

        yoy_abs = {}
        for p in periods:
            label = periods_map[p]
            row = t1[p] if p in t1.columns else pd.Series()
            yoy_abs[p] = {
                'period': label,
                'omni_unit_sales': _num(row.get('O_UNIT', 0), 0),
                'omni_gmv': _num(row.get('O_SALE', 0), 0),
                'wmc_spends': _num(row.get('Total_spends', 0), 0),
            }

        # ── Key Metrics ──
        t2_cols = ['year_flag', 'O_UNIT', 'O_UNIT_OG', 'O_UNIT_DOTCOM',
                   'O_SALE', 'O_SALE_OG', 'O_SALE_DOTCOM', 'Total_spends']
        t2 = df[t2_cols].groupby('year_flag').sum(numeric_only=True)
        t2['O_UNIT_ONLINE'] = t2['O_UNIT_OG'] + t2['O_UNIT_DOTCOM']
        t2['O_SALE_ONLINE'] = t2['O_SALE_OG'] + t2['O_SALE_DOTCOM']
        t2['spends/sales'] = t2['Total_spends'] / t2['O_SALE']
        t2['price'] = t2['O_SALE'] / t2['O_UNIT']
        t2['online unit sales%'] = t2['O_UNIT_ONLINE'] / t2['O_UNIT']
        t2['online gmv sales%'] = t2['O_SALE_ONLINE'] / t2['O_SALE']

        overall_period = {
            'wmc_penetration': _pct(_safe_div(t2['Total_spends'].sum(), t2['O_SALE'].sum())),
            'price': _num(_safe_div(t2['O_SALE'].sum(), t2['O_UNIT'].sum()), 1),
            'unit_sales_online': _pct(_safe_div(t2['O_UNIT_ONLINE'].sum(), t2['O_UNIT'].sum())),
            'gmv_sales_online': _pct(_safe_div(t2['O_SALE_ONLINE'].sum(), t2['O_SALE'].sum())),
        }

        key_metrics_summary = []
        for p in periods:
            if p in t2.index:
                row = t2.loc[p]
                key_metrics_summary.append({
                    'period': periods_map[p],
                    'online_unit_sales': _pct(row['online unit sales%']),
                    'online_gmv_sales': _pct(row['online gmv sales%']),
                    'wmc_penetration': _pct(row['spends/sales']),
                    'price': _num(row['price'], 1),
                })

        if 'LY' in t2.index and 'PY' in t2.index:
            ly_r, py_r = t2.loc['LY'], t2.loc['PY']
            key_metrics_summary.append({
                'period': 'Change YOY %',
                'online_unit_sales': _pct(_safe_div(ly_r['O_UNIT_ONLINE'], py_r['O_UNIT_ONLINE']) - 1),
                'online_gmv_sales': _pct(_safe_div(ly_r['O_SALE_ONLINE'], py_r['O_SALE_ONLINE']) - 1),
                'wmc_penetration': _pct(_safe_div(ly_r['spends/sales'], py_r['spends/sales']) - 1),
                'price': _pct(_safe_div(ly_r['price'], py_r['price']) - 1),
            })

        # ── Media Mix ──
        t3_cols = ['year_flag', 'M_SEARCH_SPEND', 'M_ON_DIS_TOTAL_SPEND', 'M_OFF_DIS_TOTAL_SPEND', 'M_INSTORE_TV_WALL_SPEND']
        t3 = df[t3_cols].groupby('year_flag').sum(numeric_only=True)
        t3['total'] = t3.sum(axis=1)
        for c in ['M_SEARCH_SPEND', 'M_ON_DIS_TOTAL_SPEND', 'M_OFF_DIS_TOTAL_SPEND', 'M_INSTORE_TV_WALL_SPEND']:
            t3[f'{c}_%'] = t3[c] / t3['total']

        media_mix = []
        for p in periods:
            if p in t3.index:
                media_mix.append({
                    'period': periods_map[p],
                    'search': _pct(t3.at[p, 'M_SEARCH_SPEND_%']),
                    'onsite_display': _pct(t3.at[p, 'M_ON_DIS_TOTAL_SPEND_%']),
                    'offsite_display': _pct(t3.at[p, 'M_OFF_DIS_TOTAL_SPEND_%']),
                    'tv_wall': _pct(t3.at[p, 'M_INSTORE_TV_WALL_SPEND_%']),
                })

        if 'LY' in t3.index and 'PY' in t3.index:
            spend_cols = ['M_SEARCH_SPEND', 'M_ON_DIS_TOTAL_SPEND', 'M_OFF_DIS_TOTAL_SPEND', 'M_INSTORE_TV_WALL_SPEND']
            yoy_mix = {}
            for c in spend_cols:
                yoy_mix[c] = _pct(_safe_div(t3.at['LY', c], t3.at['PY', c]) - 1)
            media_mix.append({
                'period': 'Change YOY %',
                'search': yoy_mix['M_SEARCH_SPEND'],
                'onsite_display': yoy_mix['M_ON_DIS_TOTAL_SPEND'],
                'offsite_display': yoy_mix['M_OFF_DIS_TOTAL_SPEND'],
                'tv_wall': yoy_mix['M_INSTORE_TV_WALL_SPEND'],
            })

        media_spends_table = []
        for p in periods:
            if p in t3.index:
                media_spends_table.append({
                    'period': periods_map[p],
                    'search': _num(t3.at[p, 'M_SEARCH_SPEND'], 0),
                    'onsite_display': _num(t3.at[p, 'M_ON_DIS_TOTAL_SPEND'], 0),
                    'offsite_display': _num(t3.at[p, 'M_OFF_DIS_TOTAL_SPEND'], 0),
                    'tv_wall': _num(t3.at[p, 'M_INSTORE_TV_WALL_SPEND'], 0),
                    'total': _num(t3.at[p, 'total'], 0),
                })

        # ── Media Tactics ──
        t4 = df[['year_flag'] + SPENDS_ALL].groupby('year_flag').sum(numeric_only=True).T
        if 'LY' in t4.columns and 'PY' in t4.columns:
            t4['change YOY %'] = ((t4['LY'] / t4['PY']) - 1).replace([np.inf, -np.inf], 0).fillna(0)
        else:
            t4['change YOY %'] = 0

        t4_T = t4.T
        total_df = t4_T[SPENDS_TOTAL].T.copy()
        granular_df = t4_T[SPENDS_GRANULAR].T.copy()

        for p in periods:
            if p in total_df.columns:
                s = total_df[p].sum()
                total_df[f'{p} %'] = total_df[p] / s if s != 0 else 0
            if p in granular_df.columns:
                s = granular_df[p].sum()
                granular_df[f'{p} %'] = granular_df[p] / s if s != 0 else 0

        pct_cols = [f'{p} %' for p in periods if f'{p} %' in total_df.columns]
        key_spend = pd.concat([total_df[pct_cols], granular_df[pct_cols]])
        key_spend['YOY%'] = t4['change YOY %']

        t5 = df[['year_flag'] + SPENDS_ALL + IMP_COLS].groupby('year_flag').sum(numeric_only=True)
        cp_results = {}
        for s, i in zip(SPENDS_ALL, IMP_COLS):
            key = f'CPC_{s}' if i.endswith('CLK') else f'CPM_{s}'
            for p in periods:
                if p in t5.index:
                    if i.endswith('CLK'):
                        cp_results[(key, p)] = _safe_div(t5.at[p, s], t5.at[p, i])
                    else:
                        cp_results[(key, p)] = _safe_div(t5.at[p, s], t5.at[p, i]) * 1000

        cpd_results = {}
        for var in HP_SPEND:
            for p in periods:
                if p in t5.index:
                    days_active = (df[df['year_flag'] == p][var] > 0).sum()
                    cpd_results[(f'CPD_{var}', p)] = _safe_div(t5.at[p, var], days_active) if days_active > 0 else 0

        search_items = ['M_SP_AB_SPEND', 'M_SP_KWB_SPEND', 'M_SBA_SPEND', 'M_SV_SPEND']
        onsite_items = ['M_ON_DIS_AT_SPEND', 'M_ON_DIS_CT_SPEND', 'M_ON_DIS_CATTO_SPEND',
                        'M_ON_DIS_KW_SPEND', 'M_ON_DIS_ROS_SPEND', 'M_ON_DIS_TOTAL_HPLO_SPEND',
                        'M_ON_DIS_HP_SPEND', 'M_ON_DIS_HPTO_SPEND', 'M_ON_DIS_HPGTO_SPEND']
        offsite_items = ['M_OFF_DIS_FB_SPEND', 'M_OFF_DIS_PIN_SPEND',
                         'M_OFF_DIS_WN_WITHOUTCTV_SPEND', 'M_OFF_DIS_DSP_CTV_SPEND']

        def build_tactic(col, is_total=False):
            label = TACTIC_LABELS.get(col, col)
            metric = METRIC_TYPE.get(col, 'CPM')
            cp_key = f'CPD_{col}' if col in HP_SPEND else (f'CPC_{col}' if metric == 'CPC' else f'CPM_{col}')
            cp_data = cpd_results if col in HP_SPEND else cp_results

            ly_val = cp_data.get((cp_key, 'LY'), 0)
            py_val = cp_data.get((cp_key, 'PY'), 0)
            cp_yoy = _safe_div(ly_val, py_val) - 1 if py_val != 0 else 0

            spends: dict = {}
            for p in periods:
                spends[p] = _num(t4.at[col, p] if col in t4.index and p in t4.columns else 0, 0)
            spend_yoy = _pct(_safe_div(t4.at[col, 'LY'], t4.at[col, 'PY']) - 1) if col in t4.index and 'LY' in t4.columns and 'PY' in t4.columns and t4.at[col, 'PY'] != 0 else 0

            ly_spend = t4.at[col, 'LY'] if col in t4.index and 'LY' in t4.columns else 0
            status = 'No Data' if _scalar(ly_spend) == 0 else ''

            return {
                'name': label, 'is_total': is_total, 'metric_type': metric,
                'other_share': _pct(_ks(key_spend, col, 'other %')),
                'py_share': _pct(_ks(key_spend, col, 'PY %')),
                'ly_share': _pct(_ks(key_spend, col, 'LY %')),
                'yoy_change': _pct(_ks(key_spend, col, 'YOY%')),
                'cpc_cpm_ly': _num(ly_val, 2),
                'cpc_cpm_yoy': _pct(cp_yoy),
                'status': status,
                'spend_other': spends.get('other', 0),
                'spend_py': spends.get('PY', 0),
                'spend_ly': spends.get('LY', 0),
                'spend_yoy': spend_yoy,
            }

        media_tactics = []
        media_tactics.append(build_tactic('M_SEARCH_SPEND', is_total=True))
        media_tactics[-1]['name'] = 'Search Total'
        for c in search_items:
            media_tactics.append(build_tactic(c))
        media_tactics.append(build_tactic('M_ON_DIS_TOTAL_SPEND', is_total=True))
        media_tactics[-1]['name'] = 'Onsite Display Total'
        for c in onsite_items:
            media_tactics.append(build_tactic(c))
        media_tactics.append(build_tactic('M_OFF_DIS_TOTAL_SPEND', is_total=True))
        media_tactics[-1]['name'] = 'Offsite Display Total'
        for c in offsite_items:
            media_tactics.append(build_tactic(c))
        media_tactics.append(build_tactic('M_INSTORE_TV_WALL_SPEND', is_total=True))
        media_tactics[-1]['name'] = 'TV Wall'

        # ── On-Air / Off-Air ──
        total_days = len(df)
        oad_data = df[SPENDS_GRANULAR].apply(lambda x: (x > 0).sum())
        on_air_analysis = []
        for col in SPENDS_GRANULAR:
            label = TACTIC_LABELS.get(col, col)
            oad = int(oad_data[col])
            on_pct = _safe_div(oad, total_days)
            on_air_analysis.append({'name': label, 'oad': oad, 'on_air': _pct(on_pct), 'off_air': _pct(1 - on_pct)})

        # ── Value Added ──
        value_added = []
        for s, i in zip(SPENDS_ALL, IMP_COLS):
            df_zero = df[(df[i] != 0) & (df[s] == 0)]
            total_imp = df[i].sum()
            av_imp = df_zero[i].sum()
            if av_imp == 0:
                continue
            value_added.append({
                'tactic': TACTIC_LABELS.get(s, i),
                'total_imp': _scalar(total_imp),
                'av_imp': _scalar(av_imp),
                'pct_av': _num(_safe_div(av_imp, total_imp) * 100, 1),
                'num_days': int(df_zero['INDEX'].nunique()),
            })
        value_added.sort(key=lambda x: x['av_imp'], reverse=True)

        # ── Chart Data (7 chart sheets) ──
        charts = {
            'units_trend': _build_chart_series(df, CHART_UNITS_TREND, periods_map),
            'units_vs_spends': _build_chart_series(df, CHART_UNITS_VS_SPENDS, periods_map),
            'spends_vs_imps': _build_chart_series(df, CHART_SPENDS_VS_IMPS, periods_map),
            'units_vs_search': _build_chart_series(df, CHART_UNITS_VS_SEARCH, periods_map),
            'units_vs_onsite': _build_chart_series(df, CHART_UNITS_VS_ONSITE, periods_map),
            'units_vs_offsite': _build_chart_series(df, CHART_UNITS_VS_OFFSITE, periods_map),
            'units_vs_instore': _build_chart_series(df, CHART_UNITS_VS_INSTORE, periods_map),
            'all_tactics': _build_chart_series(df, SPEND_COLS + IMP_COLS, periods_map),
        }

        # ── Peak/Dip Detection ──
        peaks, dips = _calculate_peaks_dips(df, 'O_UNIT')
        
        # ── Events ──
        events = _get_holiday_events()

        # ── Input sheet data ──
        input_sheet = {
            'brand': 'Agg Brand',
            'start_date': modeling_start,
            'end_date': modeling_end,
            'custom_periods': [
                {'label': 'Period 1', 'start': other_start, 'end': other_end, 'months': (other_end_date - modeling_start_date).days // 30},
                {'label': 'Period 2', 'start': py_start, 'end': py_end, 'months': 12},
                {'label': 'Period 3', 'start': ly_start, 'end': ly_end, 'months': 12},
            ],
        }

        category_info = {
            'category': f"{DEFAULT_CATEGORY_CODE} {DEFAULT_MODEL_GROUP.upper()}",
            'modeling_period': f"{_fdate(modeling_start)} - {_fdate(modeling_end)}",
            'subcategories': subcategories,
        }

        return {
            'num_brands': num_brands,
            'category_info': category_info,
            'input_sheet': input_sheet,
            'time_periods': {'other': other_time, 'py': py_time, 'ly': ly_time},
            'yoy_change': yoy_change,
            'yoy_abs': yoy_abs,
            'overall_period': overall_period,
            'key_metrics_summary': key_metrics_summary,
            'media_mix': media_mix,
            'media_spends_table': media_spends_table,
            'media_tactics': media_tactics,
            'on_air_analysis': on_air_analysis,
            'value_added': value_added,
            'charts': charts,
            'agent_insights': agent_insights,
            'agent_anomalies': agent_anomalies_table,
            'anomalies': {'peaks': peaks, 'dips': dips},
            'events': events,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-insights")
def generate_insights_dynamically(request: AnomalyRecordsRequest):
    """
    Accepts a pre-filtered list of anomaly records from the frontend UI and dynamically
    re-runs the LangChain summarizer pipeline to generate newly tailored Operational Conclusions.
    """
    try:
        # Reconstruct the pandas dataframe from the JSON array
        df = pd.DataFrame(request.records)
        
        if df.empty:
             return {"agent_insights": "No records provided to analyze."}
             
        observations = summarize_observations_llm(df)
        
        return {
            "agent_insights": observations
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

