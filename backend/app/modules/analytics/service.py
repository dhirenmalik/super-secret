import os
import json
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import uuid4
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core import storage as file_storage
from . import schemas, models

# ==========================================================
# CONSTANTS & PATHS
# ==========================================================
MAPPING_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "mappings"))
EDA_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "produce_category_data.csv"))

# ==========================================================
# CORE ENGINES (MIGRATED FROM LEGACY SERVICES)
# ==========================================================

def _coerce_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(",", "", regex=False)
    return pd.to_numeric(cleaned, errors="coerce").fillna(0)

def calculate_summary(df: pd.DataFrame, group_by: str = "L2") -> pd.DataFrame:
    """Core logic to calculate subcategory summary metrics with flexible column mapping."""
    print(f"[DEBUG] Calculating summary. Columns: {df.columns.tolist()}")
    
    # Define mapping of logical fields to possible CSV column names
    mapping = {
        "sales": ["Sales", "O_SALE", "Sale", "Total_Sales"],
        "units": ["Units", "O_UNIT", "Unit", "Total_Units"],
        "search_spends": ["M_SEARCH_SPEND", "Search_Spend", "SEARCH_SPEND"],
        "onsite_display_spends": ["M_ON_DIS_TOTAL_SPEND", "ONDisplay_Spend", "ON_DIS_SPEND"],
        "offsite_display_spends": ["M_OFF_DIS_TOTAL_SPEND", "OFFDisplay_Spend", "OFF_DIS_SPEND"],
        "total_spends": ["Total", "Total_Spend", "TOTAL_SPEND", "SPEND_TOTAL"]
    }

    # Resolve actual columns in df
    resolved_mapping = {}
    cols_upper = {c.upper(): c for c in df.columns}
    
    for logical, alternatives in mapping.items():
        found = False
        for alt in alternatives:
            if alt.upper() in cols_upper:
                resolved_mapping[logical] = cols_upper[alt.upper()]
                found = True
                break
        if not found:
             print(f"[WARNING] Could not resolve column for logical field: {logical}")
    
    # Ensure numeric and aggregate
    for logical, physical in resolved_mapping.items():
        df[physical] = _coerce_numeric(df[physical])

    # Resolving group_col
    target_group = "L2" if group_by.lower() == "l2" else "Model_Group"
    group_col = cols_upper.get(target_group.upper(), cols_upper.get("L2", df.columns[0]))

    print(f"[DEBUG] Grouping by: {group_col}")

    # Aggregator
    agg_map = {physical: "sum" for physical in resolved_mapping.values()}
    summary = df.groupby(group_col).agg(agg_map).reset_index()

    # Re-map back to logical names
    inv_map = {v: k for k, v in resolved_mapping.items()}
    summary = summary.rename(columns={group_col: "subcategory"})
    summary = summary.rename(columns=inv_map)

    # Ensure all columns exist
    for col in mapping.keys():
        if col not in summary.columns:
            summary[col] = 0.0

    # Calculated derived fields
    summary["avg_price"] = summary["sales"] / summary["units"].replace(0, np.nan)
    summary["spends_per_sales"] = summary["total_spends"] / summary["sales"].replace(0, np.nan)
    
    # Share Percentages
    tot_sales = summary["sales"].sum()
    tot_units = summary["units"].sum()
    tot_spends = summary["total_spends"].sum()
    tot_search = summary["search_spends"].sum()
    tot_onsite = summary["onsite_display_spends"].sum()
    tot_offsite = summary["offsite_display_spends"].sum()

    summary["sales_share_pct"] = (summary["sales"] / tot_sales * 100) if tot_sales > 0 else 0
    summary["unit_share_pct"] = (summary["units"] / tot_units * 100) if tot_units > 0 else 0
    summary["total_spends_pct"] = (summary["total_spends"] / tot_spends * 100) if tot_spends > 0 else 0
    summary["search_spends_pct"] = (summary["search_spends"] / tot_search * 100) if tot_search > 0 else 0
    summary["onsite_display_spends_pct"] = (summary["onsite_display_spends"] / tot_onsite * 100) if tot_onsite > 0 else 0
    summary["offsite_display_spends_pct"] = (summary["offsite_display_spends"] / tot_offsite * 100) if tot_offsite > 0 else 0

    return summary.fillna(0)

# ==========================================================
# FILE OPERATIONS
# ==========================================================
def load_data(file_id: str) -> pd.DataFrame:
    saved_path = None
    db = SessionLocal()
    try:
        try:
            db_id = int(file_id)
            from app.modules.governance.models import ModelFile
            db_file = db.query(ModelFile).filter(ModelFile.file_id == db_id).first()
            if db_file:
                saved_path = db_file.file_path
        except (ValueError, TypeError):
            pass
    finally:
        db.close()

    if not saved_path:
        try:
            manifest = file_storage.read_manifest(str(file_id))
            saved_path = manifest.get("saved_path")
        except FileNotFoundError:
            pass

    if not saved_path or not os.path.exists(saved_path):
        raise FileNotFoundError(f"Source file not found for: {file_id}")

    if str(saved_path).lower().endswith(".parquet"):
        return pd.read_parquet(saved_path)
    return pd.read_csv(saved_path)

async def handle_file_upload(db: Session, file: UploadFile, user_id: int, category: Optional[str] = None):
    file_storage.ensure_upload_root()
    file_id = str(uuid4())
    file_path, manifest_path = file_storage.build_file_paths(file_id, file.filename)
    
    size = 0
    with open(file_path, "wb") as target:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            target.write(chunk)
            
    file_storage.write_manifest(manifest_path, {"file_id": file_id, "filename": file.filename, "saved_path": file_path})
    from app.modules.governance import service as gov_service
    from app.modules.governance.schemas import ModelCreate

    # Create a model record for this analysis file
    model_name = category if category else f"Analysis_{file.filename}"
    model_in = ModelCreate(model_name=model_name, model_type="analytics")
    db_model = gov_service.create_model(db, model_in, user_id)

    # Link file to model
    db_file = gov_service.register_file(
        db, 
        file.filename, 
        file_path, 
        model_id=db_model.model_id, 
        uploaded_by=user_id, 
        category=category
    )
    return {"file_id": db_file.file_id, "filename": file.filename, "category": category, "model_id": db_model.model_id}

def get_latest_file_record(db: Session):
    from app.modules.governance.models import ModelFile
    return db.query(ModelFile).order_by(ModelFile.uploaded_at.desc()).first()

def get_all_files_records(db: Session):
    from app.modules.governance.models import ModelFile
    return db.query(ModelFile).order_by(ModelFile.uploaded_at.desc()).all()

def _get_model_id_from_file_id(db: Session, file_id: int) -> int:
    from app.modules.governance.models import ModelFile
    db_file = db.query(ModelFile).filter(ModelFile.file_id == file_id).first()
    if not db_file:
        return None
    if db_file.model_id:
        return db_file.model_id

    # Fallback: Create a model for legacy records that were uploaded without association
    from app.modules.governance import service as gov_service
    from app.modules.governance.schemas import ModelCreate
    
    model_name = db_file.file_category if db_file.file_category else f"Legacy_Analysis_{file_id}"
    model_in = ModelCreate(model_name=model_name, model_type="analytics")
    creator_id = db_file.uploaded_by if db_file.uploaded_by else 1
    
    db_model = gov_service.create_model(db, model_in, creator_id)
    db_file.model_id = db_model.model_id
    db.add(db_file)
    db.commit()
    
    return db_model.model_id

def preview_auto_model_groups_data(db: Session, file_id: str, reference_path: str):
    """Parses a reference CSV and maps L2s from the current file to model groups."""
    import ast
    import pandas as pd
    
    # 1. Resolve absolute path for reference
    # Frontend sends 'data/Subcat Output/Subcat_Output.csv' relative to root
    project_root = "/Users/abhizirange/walmart_git/super-secret"
    abs_ref_path = os.path.join(project_root, reference_path)
    
    if not os.path.exists(abs_ref_path):
        raise FileNotFoundError(f"Reference file not found: {abs_ref_path}")
        
    ref_df = pd.read_csv(abs_ref_path)
    
    # Mapping structure: { L2: { group_name: ..., historical: ... } }
    mapping = {}
    for _, row in ref_df.iterrows():
        group_name = str(row['Group Name'])
        hist_group = str(row['Historical Model Group']) if 'Historical Model Group' in row else group_name
        
        # Parse str representation of list "['A', 'B']"
        try:
            l2_list_str = row['All Subcategories in Each Group']
            l2_list = ast.literal_eval(l2_list_str) if isinstance(l2_list_str, str) else []
        except:
            l2_list = []
            
        for l2 in l2_list:
            mapping[l2.upper()] = {"group_name": group_name, "historical": hist_group}
            
    # 2. Get L2 values from current file
    df = load_data(file_id)
    l2_col = None
    for c in df.columns:
        if c.upper() == "L2":
            l2_col = c
            break
            
    current_l2s = df[l2_col].unique().tolist() if l2_col else []
    
    # 3. Perform Mapping
    grouped = {} # { group_name: [l2, ...] }
    historical = {} # { hist_group: [l2, ...] }
    unassigned = []
    
    for l2 in current_l2s:
        l2_str = str(l2).strip()
        match = mapping.get(l2_str.upper())
        if match:
            gn = match["group_name"]
            hn = match["historical"]
            grouped.setdefault(gn, []).append(l2_str)
            historical.setdefault(hn, []).append(l2_str)
        else:
            unassigned.append(l2_str)
            
    # 4. Format to schemas
    groups_out = [{"group_name": k, "l2_values": v} for k, v in grouped.items()]
    hist_out = [{"group_name": k, "l2_values": v} for k, v in historical.items()]
    
    return {
        "file_id": str(file_id),
        "groups": groups_out,
        "historical_groups": hist_out,
        "unassigned_l2": unassigned,
        "warnings": [] if not unassigned else [f"{len(unassigned)} subcategories could not be auto-mapped."]
    }

def apply_auto_model_groups_data(db: Session, file_id: str, reference_path: str, persist: bool = True):
    preview = preview_auto_model_groups_data(db, file_id, reference_path)
    
    if persist:
        save_model_groups_data(file_id, preview["groups"], db)
        
    return preview

def delete_file_record(db: Session, file_id: int):
    from app.modules.governance.models import ModelFile
    db_file = db.query(ModelFile).filter(ModelFile.file_id == file_id).first()
    if not db_file:
        return False
    
    # Delete physical file if possible
    if db_file.file_path and os.path.exists(db_file.file_path):
        try:
            os.remove(db_file.file_path)
        except Exception as e:
            print(f"[WARNING] Failed to delete physical file: {e}")
            
    db.delete(db_file)
    db.commit()
    return True

# ==========================================================
# SERVICE INTERFACES
# ==========================================================

def get_subcategory_summary_data(file_id: str, start_date=None, end_date=None, group_by="l2", auto_bucket=False):
    df = load_data(file_id)
    
    # Flexible Date Resolution
    date_col = None
    for cand in ["Date", "week_start_date", "week"]:
        if cand.lower() in [c.lower() for c in df.columns]:
            date_col = [c for c in df.columns if c.lower() == cand.lower()][0]
            break

    date_bounds = {"start_date": "N/A", "end_date": "N/A"}
    if date_col:
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        df = df.dropna(subset=[date_col])
        if not df.empty:
            date_bounds = {
                "start_date": df[date_col].min().strftime("%Y-%m-%d"),
                "end_date": df[date_col].max().strftime("%Y-%m-%d")
            }
            if start_date:
                df = df[df[date_col] >= pd.to_datetime(start_date)]
            if end_date:
                df = df[df[date_col] <= pd.to_datetime(end_date)]

    summary_df = calculate_summary(df, group_by)
    
    # Calculate Totals
    totals = {
        "sales": float(summary_df["sales"].sum()) if not summary_df.empty else 0.0,
        "units": float(summary_df["units"].sum()) if not summary_df.empty else 0.0,
        "total_spends": float(summary_df["total_spends"].sum()) if not summary_df.empty else 0.0
    }

    # Align date bounds for frontend
    frontend_date_bounds = {
        "min": date_bounds.get("start_date", "N/A"),
        "max": date_bounds.get("end_date", "N/A")
    }

    rows = summary_df.to_dict(orient="records")
    return {
        "file_id": str(file_id),
        "rows": rows,
        "date_bounds": frontend_date_bounds,
        "meta": {
            "unique_l2": summary_df["subcategory"].nunique() if not summary_df.empty else 0,
            "row_count": len(summary_df)
        },
        "totals": totals
    }

def get_l2_values_data(file_id: str):
    df = load_data(file_id)
    col = "L2" if "L2" in df.columns else df.columns[0]
    l2_list = sorted(df[col].dropna().unique().tolist())
    return {"file_id": file_id, "l2_values": l2_list}

def get_l3_analysis_data(file_id: str, limit_l2=None, rows=100, start_date=None, end_date=None):
    df = load_data(file_id)
    
    # Flexible column mapping for L3
    cols_upper = {c.upper(): c for c in df.columns}
    l2_col = cols_upper.get("L2", df.columns[0])
    l3_col = cols_upper.get("L3", df.columns[1] if len(df.columns) > 1 else df.columns[0])
    
    if limit_l2:
        df = df[df[l2_col] == limit_l2]
    
    # Map L3 fields locally
    # Class L3AnalysisRow: l2, l3, sales, units, onsite_display_spends, total
    # Use calculate_summary technique for consistency
    mapping = {
        "sales": ["Sales", "O_SALE"],
        "units": ["Units", "O_UNIT"],
        "onsite_display_spends": ["ONDisplay_Spend", "M_ON_DIS_TOTAL_SPEND"],
        "total": ["Total_Spend", "Total"]
    }
    
    for logical, alternatives in mapping.items():
        for alt in alternatives:
            if alt.upper() in cols_upper:
                df[logical] = _coerce_numeric(df[cols_upper[alt.upper()]])
                break
        if logical not in df.columns:
            df[logical] = 0.0

    df["l2"] = df[l2_col]
    df["l3"] = df[l3_col]
    
    data = df.head(rows).fillna(0).to_dict(orient="records")
    return {
        "file_id": str(file_id),
        "rows": data,
        "date_bounds": {"start_date": "N/A", "end_date": "N/A"},
        "meta": {
            "unique_l2": df["l2"].nunique(),
            "unique_l3": df["l3"].nunique(),
            "row_count": len(df.head(rows))
        }
    }

def get_correlation_data(file_id: str):
    df = load_data(file_id)
    
    # Pearson correlation of O_SALE across L2 values
    l2_col = next((c for c in df.columns if c.upper() == 'L2'), None)
    sale_col = next((c for c in df.columns if c.upper() in ['O_SALE', 'SALES']), None)
    date_col = next((c for c in df.columns if c.lower() in ['week_start_date', 'date', 'week']), None)

    if not l2_col or not sale_col or not date_col:
        return {"file_id": str(file_id), "l2_values": [], "matrix": []}
    
    # Pivot: Index=Date, Columns=L2, Values=Sales
    try:
        pivoted = df.pivot_table(index=date_col, columns=l2_col, values=sale_col, aggfunc='sum').fillna(0)
        # Calculate correlation
        corr = pivoted.corr().fillna(0) # Extra safety for JSON serialization
        l2_values = corr.columns.tolist()
        # Ensure all values are JSON serializable (no NaN/Inf)
        matrix = corr.replace([np.inf, -np.inf], 0).fillna(0).values.tolist()
        
        return {
            "file_id": str(file_id),
            "l2_values": l2_values,
            "matrix": matrix
        }
    except Exception as e:
        print(f"Correlation error: {e}")
        return {"file_id": str(file_id), "l2_values": [], "matrix": []}

def get_weekly_sales_data(file_id: str, metric="sales"):
    df = load_data(file_id)
    
    # Resolve metric column
    metric_map = {
        "sales": ["Sales", "O_SALE", "Sale", "Total_Sales"],
        "units": ["Units", "O_UNIT", "Unit", "Total_Units"],
        "search_spends": ["M_SEARCH_SPEND", "Search_Spend", "SEARCH_SPEND"],
        "onsite_spends": ["M_ON_DIS_TOTAL_SPEND", "ONDisplay_Spend", "ON_DIS_SPEND"],
        "offsite_spends": ["M_OFF_DIS_TOTAL_SPEND", "OFFDisplay_Spend", "OFF_DIS_SPEND"],
    }
    
    actual_metric = None
    target_metric = metric.lower()
    cands = metric_map.get(target_metric, [target_metric])
    for cand in cands:
        if cand.upper() in [c.upper() for c in df.columns]:
            actual_metric = [c for c in df.columns if c.upper() == cand.upper()][0]
            break
            
    if not actual_metric:
        actual_metric = df.columns[-1]

    # Resolve date column
    date_col = next((c for c in df.columns if c.lower() in ["week_start_date", "date", "week"]), None)
    # Resolve L2 column
    l2_col = next((c for c in df.columns if c.upper() == "L2"), None)
    
    if not date_col or not l2_col:
        return {"file_id": str(file_id), "series": [], "l2_values": []}

    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df = df.dropna(subset=[date_col])
    # The frontend expects 'week_start_date' in the series objects
    df['week_start_date'] = df[date_col].dt.strftime('%Y-%m-%d')
    df[actual_metric] = _coerce_numeric(df[actual_metric])
    
    # Pivot: Index=week_start_date, Columns=L2, Values=metric
    try:
        pivot = df.pivot_table(index='week_start_date', columns=l2_col, values=actual_metric, aggfunc='sum').fillna(0)
        
        l2_values = pivot.columns.tolist()
        # Convert index back to column for series list
        series = pivot.reset_index().to_dict(orient='records')
        
        return {
            "file_id": str(file_id),
            "l2_values": l2_values,
            "series": series
        }
    except Exception as e:
        print(f"Weekly sales pivot error: {e}")
        return {"file_id": str(file_id), "series": [], "l2_values": []}

def get_model_group_weekly_sales_data(file_id: str):
    # This is a legacy/simple version by group names
    return {"file_id": str(file_id), "group_names": [], "series": []}

def get_model_group_weekly_metrics_data(file_id: str, payload: schemas.ModelGroupWeeklyMetricsRequest):
    df = load_data(file_id)
    
    # Column mapping
    l2_col = next((c for c in df.columns if c.upper() == 'L2'), None)
    date_col = next((c for c in df.columns if c.lower() in ['week_start_date', 'date', 'week']), None)
    
    metric_map = {"sales": ["O_SALE", "SALES"], "units": ["O_UNIT", "UNITS"]}
    target_metric_cands = metric_map.get(payload.metric.lower(), ["O_SALE"])
    sale_col = next((c for c in df.columns if c.upper() in [x.upper() for x in target_metric_cands]), None)
    
    search_col = next((c for c in df.columns if 'SEARCH' in c.upper() and 'SPEND' in c.upper()), None)
    onsite_col = next((c for c in df.columns if 'ON' in c.upper() and 'DIS' in c.upper() and 'SPEND' in c.upper()), None)
    offsite_col = next((c for c in df.columns if 'OFF' in c.upper() and 'DIS' in c.upper() and 'SPEND' in c.upper()), None)

    if not date_col or not sale_col:
        return {"file_id": str(file_id), "series": [], "yoy": None}

    # Filter by L2 if requested
    if payload.l2_values:
        df = df[df[l2_col].isin(payload.l2_values)]
        
    # Convert dates
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df = df.dropna(subset=[date_col])
    
    # Aggregation
    agg_dict = {sale_col: "sum"}
    if payload.include_spends:
        if search_col: agg_dict[search_col] = "sum"
        if onsite_col: agg_dict[onsite_col] = "sum"
        if offsite_col: agg_dict[offsite_col] = "sum"
        
    weekly = df.groupby(date_col).agg(agg_dict).reset_index()
    
    # Rename for frontend response
    rename_map = {
        sale_col: "metric_value"
    }
    if search_col: rename_map[search_col] = "search_spend"
    if onsite_col: rename_map[onsite_col] = "onsite_spend"
    if offsite_col: rename_map[offsite_col] = "offsite_spend"
    
    weekly = weekly.rename(columns=rename_map)
    
    # Fill missing spend columns if not present
    for c in ["search_spend", "onsite_spend", "offsite_spend"]:
        if c not in weekly.columns:
            weekly[c] = 0.0
            
    # Sort and format
    weekly = weekly.sort_values(date_col, ascending=False)
    
    # Calculate YoY
    yoy_out = {"sales_yoy_pct": 0.0, "units_yoy_pct": 0.0, "spends_yoy_pct": 0.0}
    if len(weekly) >= 52:
        current_52 = weekly.head(52)
        # For previous 52, we need to skip the first 52
        previous_52 = weekly.iloc[52:104] if len(weekly) >= 104 else weekly.iloc[52:]
        
        if not previous_52.empty:
            # Sales column
            c_sales = current_52["metric_value"].sum() if payload.metric.lower() == "sales" else 0
            p_sales = previous_52["metric_value"].sum() if payload.metric.lower() == "sales" else 0
            
            # Units (if we had them in the same request, but here we only have one set of values in 'metric_value')
            # Assuming the frontend requests sales then units separately for the cards? 
            # No, the frontend expects all three YoY in one response. I need to aggregate units and sales regardless of target metric.
            
            # Let's do a more robust aggregation for YoY
            agg_all = {sale_col: "sum"}
            # Need to find units/sales columns again if they aren't the primary sale_col
            unit_col = next((c for c in df.columns if c.upper() in ["O_UNIT", "UNITS"]), None)
            sales_col_real = next((c for c in df.columns if c.upper() in ["O_SALE", "SALES"]), None)
            
            yoy_df = df.copy()
            yoy_agg = {sales_col_real: "sum"}
            if unit_col: yoy_agg[unit_col] = "sum"
            if search_col: yoy_agg[search_col] = "sum"
            if onsite_col: yoy_agg[onsite_col] = "sum"
            if offsite_col: yoy_agg[offsite_col] = "sum"
            
            yoy_weekly = yoy_df.groupby(date_col).agg(yoy_agg).sort_index(ascending=False)
            
            curr = yoy_weekly.head(52)
            prev = yoy_weekly.iloc[52:104]
            
            def calc_pct(c_val, p_val):
                if p_val == 0: return 0.0
                return ((c_val - p_val) / p_val) * 100
                
            yoy_out["sales_yoy_pct"] = calc_pct(curr[sales_col_real].sum(), prev[sales_col_real].sum())
            if unit_col:
                yoy_out["units_yoy_pct"] = calc_pct(curr[unit_col].sum(), prev[unit_col].sum())
            
            total_curr_spend = (curr[search_col].sum() if search_col else 0) + \
                               (curr[onsite_col].sum() if onsite_col else 0) + \
                               (curr[offsite_col].sum() if offsite_col else 0)
            total_prev_spend = (prev[search_col].sum() if search_col else 0) + \
                               (prev[onsite_col].sum() if onsite_col else 0) + \
                               (prev[offsite_col].sum() if offsite_col else 0)
            yoy_out["spends_yoy_pct"] = calc_pct(total_curr_spend, total_prev_spend)

    if payload.window_weeks:
        weekly = weekly.head(payload.window_weeks)
        
    series = weekly.to_dict(orient="records")
    for s in series:
        s["week_start_date"] = s[date_col].strftime("%Y-%m-%d")
        
    return {
        "file_id": str(file_id),
        "series": series,
        "yoy": yoy_out
    }

def get_chart_selection_data(db: Session, file_id: str):
    selection = db.query(models.ChartSelection).filter(models.ChartSelection.file_id == file_id).first()
    if not selection:
        return {"file_id": file_id, "l2_values": [], "updated_at": datetime.utcnow()}
    
    l2_list = selection.l2_values.split(",") if selection.l2_values else []
    return {
        "file_id": file_id,
        "l2_values": l2_list,
        "updated_at": selection.updated_at
    }

def save_chart_selection_data(db: Session, file_id: str, l2_values: List[str]):
    selection = db.query(models.ChartSelection).filter(models.ChartSelection.file_id == file_id).first()
    l2_str = ",".join(l2_values)
    
    if selection:
        selection.l2_values = l2_str
    else:
        selection = models.ChartSelection(file_id=file_id, l2_values=l2_str)
        db.add(selection)
    
    db.commit()
    db.refresh(selection)
    
    return {
        "file_id": file_id,
        "l2_values": l2_values,
        "updated_at": selection.updated_at
    }

def update_report_status_data(db: Session, file_id: str, status: str):
    from app.modules.governance.models import ModelFile
    file = db.query(ModelFile).filter(ModelFile.file_id == file_id).first()
    if not file:
        raise ValueError("File not found")
    
    file.status = status
    db.commit()
    db.refresh(file)
    return {"file_id": str(file_id), "status": file.status}

def add_report_comment_data(db: Session, file_id: str, user_id: int, comment_text: str):
    from app.modules.governance.models import ReportComment
    from app.modules.governance.models import User
    
    comment = ReportComment(
        file_id=int(file_id),
        user_id=user_id,
        comment_text=comment_text
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    user = db.query(User).filter(User.user_id == user_id).first()
    return {
        "comment_id": comment.comment_id,
        "user_id": comment.user_id,
        "user_name": user.user_name if user else "Unknown",
        "comment_text": comment.comment_text,
        "created_at": comment.created_at
    }

def get_report_comments_data(db: Session, file_id: str):
    from app.modules.governance.models import ReportComment
    from app.modules.governance.models import User
    
    comments = db.query(ReportComment).filter(ReportComment.file_id == file_id).order_by(ReportComment.created_at.desc()).all()
    
    result = []
    for c in comments:
        user = db.query(User).filter(User.user_id == c.user_id).first()
        result.append({
            "comment_id": c.comment_id,
            "user_id": c.user_id,
            "user_name": user.user_name if user else "Unknown",
            "comment_text": c.comment_text,
            "created_at": c.created_at
        })
    return result

def get_file_preview_data(file_id: str, rows: int = 5):
    df = load_data(file_id).head(rows).fillna("")
    return {
        "columns": list(df.columns),
        "rows": df.to_dict(orient="records"),
        "row_count_returned": len(df),
    }

# ==========================================================
# EDA PRODUCE CATEGORY
# ==========================================================
async def get_exclude_analysis_data():
    if not os.path.exists(EDA_DATA_PATH):
        return {"data": []}
    df = pd.read_csv(EDA_DATA_PATH)
    # Mapping keys for Pydantic
    df = df.rename(columns={
        'OFFDisplay_Spend_Share%': 'OFFDisplay_Spend_Share_Percentage',
        'ONDisplay_Spend_Share%': 'ONDisplay_Spend_Share_Percentage',
        'Search_Spend_Share%': 'Search_Spend_Share_Percentage',
        'Sales_Share%': 'Sales_Share_Percentage',
        'Unit_Share%': 'Unit_Share_Percentage'
    })
    return {"data": df.fillna(0).to_dict(orient="records")}

def update_produce_relevance(category: str, relevant: bool):
    return {"category": category, "relevant": relevant, "status": "updated"}

# Mapping delegation
def get_model_groups_data(file_id: str, db: Session):
    from .models import ModelGroup, ModelGroupL2
    model_id = _get_model_id_from_file_id(db, int(file_id))
    if not model_id:
        return {"file_id": file_id, "groups": []}
        
    db_groups = db.query(ModelGroup).filter(ModelGroup.model_id == model_id).all()
    
    result_groups = []
    for g in db_groups:
        result_groups.append({
            "group_name": g.group_name,
            "l2_values": [m.l2_value for m in g.l2_mappings]
        })
        
    return {"file_id": file_id, "groups": result_groups}

def save_model_groups_data(file_id: str, groups: List[Any], db: Session):
    from .models import ModelGroup, ModelGroupL2
    model_id = _get_model_id_from_file_id(db, int(file_id))
    if not model_id:
        raise ValueError(f"Model ID not found for file ID: {file_id}")
        
    # 1. Clear existing for this model
    existing_groups = db.query(ModelGroup).filter(ModelGroup.model_id == model_id).all()
    for g in existing_groups:
        db.delete(g)
    db.commit()
    
    # 2. Save new
    for group_item in groups:
        # Convert Pydantic model to dict if needed
        group_data = group_item.dict() if hasattr(group_item, "dict") else group_item
        
        db_group = ModelGroup(
            model_id=model_id,
            group_name=group_data["group_name"]
        )
        db.add(db_group)
        db.flush() # Get group_id
        
        for l2 in group_data.get("l2_values", []):
            db_mapping = ModelGroupL2(
                group_id=db_group.group_id,
                l2_value=l2
            )
            db.add(db_mapping)
            
    db.commit()
    return {"status": "success", "file_id": file_id, "groups": groups}
