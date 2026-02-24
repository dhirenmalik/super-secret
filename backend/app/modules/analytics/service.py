import os
import json
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import uuid4
from fastapi import UploadFile
from sqlalchemy.orm import Session
import re
from difflib import SequenceMatcher

from app.core.database import SessionLocal
from app.core import storage as file_storage
from . import schemas, models
from app.exclude_flag_automation.Exclude_Flag_function import exclude_flag_automation_function

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
        "sales": ["O_SALE", "O_Sales", "Sales", "Sale", "Total_Sales", "SALES"],
        "units": ["O_UNIT", "O_Units", "Units", "Unit", "Total_Units", "UNITS"],
        "search_spends": ["M_SEARCH_SPEND", "Search_Spend", "SEARCH_SPEND", "M_SEARCH_SPEND"],
        "onsite_display_spends": [
            "M_ON_DIS_TOTAL_SPEND", "ONDisplay_Spend", "ON_DIS_SPEND",
            "M_ON_DIS_TOTAL_SUM_SPEND", "M_TOTAL_DISPLAY_SUM_SPEND"
        ],
        "offsite_display_spends": [
            "M_OFF_DIS_TOTAL_SPEND", "OFFDisplay_Spend", "OFF_DIS_SPEND",
            "M_OFF_DIS_TOTAL_SUM_SPEND"
        ],
        "total_spends": [
            "Total", "Total_Spend", "TOTAL_SPEND", "SPEND_TOTAL",
            "TOTAL_SPEND", "M_TOTAL_DISPLAY_SUM_SPEND"
        ]
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

    print(f"[DEBUG] Grouping by: {group_col}, resolved_mapping: {list(resolved_mapping.keys())}")

    # Guard: if nothing resolved, we cannot aggregate — return empty summary
    if not resolved_mapping:
        print("[WARNING] No numeric columns resolved. Returning empty summary.")
        return pd.DataFrame(columns=["subcategory", "sales", "units", "search_spends",
                                     "onsite_display_spends", "offsite_display_spends", "total_spends"])

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

    # Derive total_spends from components if it was not resolved directly
    if "total_spends" not in resolved_mapping:
        summary["total_spends"] = (
            summary.get("search_spends", pd.Series(0, index=summary.index))
            + summary.get("onsite_display_spends", pd.Series(0, index=summary.index))
            + summary.get("offsite_display_spends", pd.Series(0, index=summary.index))
        )

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

def get_persisted_result(db: Session, file_id: int, result_type: str) -> Optional[Dict[str, Any]]:
    """Retrieves a persisted analytical result from the database."""
    from .models import AnalyticalResult
    db_result = db.query(AnalyticalResult).filter(
        AnalyticalResult.file_id == file_id,
        AnalyticalResult.result_type == result_type
    ).first()
    
    if db_result and db_result.result_data:
        return json.loads(db_result.result_data)
    return None

def save_analytical_result(db: Session, file_id: int, result_type: str, data: Any):
    """Persists an analytical result to the database."""
    from .models import AnalyticalResult
    
    # Handle non-JSON compliant floats (NaN, Inf)
    def clean_data(obj):
        if isinstance(obj, float):
            if np.isnan(obj) or np.isinf(obj):
                return 0.0
            return obj
        if isinstance(obj, dict):
            return {k: clean_data(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [clean_data(v) for v in obj]
        return obj

    data = clean_data(data)
    serialized_data = json.dumps(data)
    
    # Avoid saving if file_id is 0 and no such file exists
    if file_id == 0:
        print(f"[WARNING] Skipping save for result {result_type} as file_id is 0")
        return

    db_result = db.query(AnalyticalResult).filter(
        AnalyticalResult.file_id == file_id,
        AnalyticalResult.result_type == result_type
    ).first()
    
    if db_result:
        db_result.result_data = serialized_data
        db_result.created_at = datetime.utcnow()
    else:
        db_result = AnalyticalResult(
            file_id=file_id,
            result_type=result_type,
            result_data=serialized_data
        )
        db.add(db_result)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to save analytical result {result_type} for file {file_id}: {e}")

async def handle_file_upload(db: Session, file: UploadFile, user_id: int, category: Optional[str] = None, model_id: Optional[int] = None, is_analysis: bool = False):
    from app.modules.governance import service as gov_service
    from app.modules.governance import models as gov_models
    from app.modules.governance.schemas import ModelCreate

    # Resolve or create model FIRST to get model_name for storage
    active_model_id = model_id
    model_name = "unknown_model"
    
    if active_model_id:
        db_model = db.query(gov_models.Model).filter(gov_models.Model.model_id == active_model_id).first()
        if db_model:
            model_name = db_model.model_name
    else:
        model_name = category if category else f"Analysis_{file.filename.split('.')[0]}"
        model_in = ModelCreate(model_name=model_name, model_type="analytics")
        db_model = gov_service.create_model(db, model_in, user_id)
        active_model_id = db_model.model_id

    file_storage.ensure_upload_root()
    # Pass model_name and is_analysis to storage
    metadata = await file_storage.save_file(file, model_name, is_analysis)
    
    # Calculate row count for CSV files
    row_count = 0
    if metadata["file_name"].lower().endswith(".csv"):
        try:
            df = pd.read_csv(metadata["file_path"])
            row_count = len(df)
        except Exception as e:
            print(f"[WARNING] Failed to calculate row count: {e}")

    # Create RawDataFile record
    raw_file = gov_models.RawDataFile(
        file_name=metadata["file_name"],
        storage_type=metadata["storage_type"],
        file_path=metadata["file_path"],
        bucket_name=metadata["bucket_name"],
        file_type=metadata["file_type"],
        file_size=metadata["file_size"],
        checksum=metadata["checksum"],
        uploaded_by=user_id,
        uploaded_at=metadata["uploaded_at"],
        status=metadata["status"],
        row_count=row_count,
        remarks=f"Category: {category}" if category else None
    )
    db.add(raw_file)
    db.commit()
    db.refresh(raw_file)

    # Maintain ModelFile for backward compatibility and UI tracking
    db_file = gov_service.register_file(
        db, 
        file.filename, 
        metadata["file_path"], 
        model_id=active_model_id, 
        uploaded_by=user_id, 
        category=category,
        is_analysis=is_analysis
    )
    
    # Pre-calculate common analytical results to ensure they are persisted immediately
    try:
        # These are synchronous calls if they use the newly created df
        # For simplicity, we just call them, and they will load the file and save the results
        get_subcategory_summary_data(db, db_file.file_id)
        get_l2_values_data(db, db_file.file_id)
        get_correlation_data(db, db_file.file_id)
    except Exception as e:
        print(f"[WARNING] Failed to pre-calculate results during upload: {e}")

    return {
        "file_id": db_file.file_id, 
        "raw_file_id": raw_file.raw_file_id,
        "filename": file.filename, 
        "category": category, 
        "model_id": active_model_id,
        "row_count": row_count
    }

def get_latest_file_record(db: Session, category: Optional[str] = None, model_id: Optional[int] = None, is_analysis: Optional[bool] = None):
    from app.modules.governance.models import ModelFile
    query = db.query(ModelFile)
    if category:
        query = query.filter(ModelFile.file_category == category)
    if model_id:
        query = query.filter(ModelFile.model_id == model_id)
    if is_analysis is not None:
        query = query.filter(ModelFile.is_analysis == is_analysis)
    return query.order_by(ModelFile.uploaded_at.desc()).first()

def get_all_files_records(db: Session, is_analysis: Optional[bool] = None):
    from app.modules.governance.models import ModelFile
    query = db.query(ModelFile)
    if is_analysis is not None:
        query = query.filter(ModelFile.is_analysis == is_analysis)
    return query.order_by(ModelFile.uploaded_at.desc()).all()

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

def get_subcategory_summary_data(db: Session, file_id: str, start_date=None, end_date=None, group_by="l2", auto_bucket=False):
    # Try to load from persistence
    result_type = f"subcategory_summary_{group_by}_{start_date}_{end_date}"
    persisted = get_persisted_result(db, int(file_id), result_type)
    if persisted:
        return persisted

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
    result = {
        "file_id": str(file_id),
        "rows": rows,
        "date_bounds": frontend_date_bounds,
        "meta": {
            "unique_l2": summary_df["subcategory"].nunique() if not summary_df.empty else 0,
            "row_count": len(summary_df)
        },
        "totals": totals
    }
    
    # Persist the result
    save_analytical_result(db, int(file_id), result_type, result)
    
    return result

def get_l2_values_data(db: Session, file_id: str):
    result_type = "l2_values"
    persisted = get_persisted_result(db, int(file_id), result_type)
    if persisted:
        return persisted

    df = load_data(file_id)
    col = "L2" if "L2" in df.columns else df.columns[0]
    l2_list = sorted(df[col].dropna().unique().tolist())
    result = {"file_id": file_id, "l2_values": l2_list}
    
    save_analytical_result(db, int(file_id), result_type, result)
    return result

def get_l3_analysis_data(db: Session, file_id: str, limit_l2=None, rows=100, start_date=None, end_date=None):
    result_type = f"l3_analysis_{limit_l2}_{rows}_{start_date}_{end_date}"
    persisted = get_persisted_result(db, int(file_id), result_type)
    if persisted:
        return persisted

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
        "sales": ["O_SALE", "O_Sales", "Sales", "SALES"],
        "units": ["O_UNIT", "O_Units", "Units", "UNITS"],
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
    result = {
        "file_id": str(file_id),
        "rows": data,
        "date_bounds": {"start_date": "N/A", "end_date": "N/A"},
        "meta": {
            "unique_l2": df["l2"].nunique(),
            "unique_l3": df["l3"].nunique(),
            "row_count": len(df.head(rows))
        }
    }
    
    save_analytical_result(db, int(file_id), result_type, result)
    return result

def get_correlation_data(db: Session, file_id: str):
    result_type = "correlation"
    persisted = get_persisted_result(db, int(file_id), result_type)
    if persisted:
        return persisted

    df = load_data(file_id)
    
    # Pearson correlation of O_SALE across L2 values
    l2_col = next((c for c in df.columns if c.upper() == 'L2'), None)
    date_col = next((c for c in df.columns if c.lower() in ['week_start_date', 'date', 'week']), None)
    
    sale_cands = ['O_SALE', 'O_Sales', 'SALES', 'Sales']
    sale_col = None
    for cand in sale_cands:
        if cand.upper() in [c.upper() for c in df.columns]:
            sale_col = [c for c in df.columns if c.upper() == cand.upper()][0]
            break

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
        
        result = {
            "file_id": str(file_id),
            "l2_values": l2_values,
            "matrix": matrix
        }
        save_analytical_result(db, int(file_id), result_type, result)
        return result
    except Exception as e:
        print(f"Correlation error: {e}")
        return {"file_id": str(file_id), "l2_values": [], "matrix": []}

def get_weekly_sales_data(db: Session, file_id: str, metric="sales"):
    result_type = f"weekly_sales_{metric}"
    persisted = get_persisted_result(db, int(file_id), result_type)
    if persisted:
        return persisted

    df = load_data(file_id)
    
    # Resolve metric column
    metric_map = {
        "sales": ["O_SALE", "O_Sales", "Sales", "Sale", "Total_Sales", "SALES"],
        "units": ["O_UNIT", "O_Units", "Units", "Unit", "Total_Units", "UNITS"],
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
        
        result = {
            "file_id": str(file_id),
            "l2_values": l2_values,
            "series": series
        }
        save_analytical_result(db, int(file_id), result_type, result)
        return result
    except Exception as e:
        print(f"Weekly sales pivot error: {e}")
        return {"file_id": str(file_id), "series": [], "l2_values": []}

def get_model_group_weekly_sales_data(file_id: str):
    # This is a legacy/simple version by group names
    return {"file_id": str(file_id), "group_names": [], "series": []}

def get_model_group_weekly_metrics_data(db: Session, file_id: str, payload: schemas.ModelGroupWeeklyMetricsRequest):
    # Try persistence first
    # Create a unique key based on payload
    import hashlib
    payload_str = json.dumps(payload.dict(), sort_keys=True)
    payload_hash = hashlib.md5(payload_str.encode()).hexdigest()
    result_type = f"model_group_metrics_{payload_hash}"
    
    persisted = get_persisted_result(db, int(file_id), result_type)
    if persisted:
        return persisted

    df = load_data(file_id)
    
    # Column mapping
    l2_col = next((c for c in df.columns if c.upper() == 'L2'), None)
    date_col = next((c for c in df.columns if c.lower() in ['week_start_date', 'date', 'week']), None)
    
    metric_map = {"sales": ["O_SALE", "O_Sales", "SALES", "Sales"], "units": ["O_UNIT", "O_Units", "UNITS", "Units"]}
    target_metric_cands = metric_map.get(payload.metric.lower(), ["O_SALE"])
    
    sale_col = None
    for cand in target_metric_cands:
        if cand.upper() in [c.upper() for c in df.columns]:
            sale_col = [c for c in df.columns if c.upper() == cand.upper()][0]
            break
            
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
            unit_col = None
            for cand in ["O_UNIT", "O_Units", "UNITS", "Units"]:
                if cand.upper() in [c.upper() for c in df.columns]:
                    unit_col = [c for c in df.columns if c.upper() == cand.upper()][0]
                    break
                    
            sales_col_real = None
            for cand in ["O_SALE", "O_Sales", "SALES", "Sales"]:
                if cand.upper() in [c.upper() for c in df.columns]:
                    sales_col_real = [c for c in df.columns if c.upper() == cand.upper()][0]
                    break
            
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
        
    result = {
        "file_id": str(file_id),
        "series": series,
        "yoy": yoy_out
    }
    
    save_analytical_result(db, int(file_id), result_type, result)
    return result

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
async def get_exclude_analysis_data(db: Session, model_id: Optional[int] = None, group_by: str = "L3"):
    print(f"[DEBUG] Fetching exclude analysis for model_id={model_id}, group_by={group_by}")
    # Try persistence first
    result_type = f"exclude_analysis_{model_id}_{group_by}"
    
    # We need a file_id to link the result to. 
    # Use the latest file's ID if available, otherwise use 0 or a constant for global/default
    latest = get_latest_file_record(db, category="exclude_flags_raw", model_id=model_id)
    file_id = latest.file_id if latest else 0
    print(f"[DEBUG] Latest file: {latest.file_id if latest else 'None'}, file_id used: {file_id}")
    
    persisted = get_persisted_result(db, file_id, result_type)
    if persisted:
        print(f"[DEBUG] Returning persisted result for model_id={model_id}")
        return persisted

    print(f"[DEBUG] No persisted result found. Loading from file...")
    try:
        if not latest or not os.path.exists(latest.file_path):
            print(f"[DEBUG] No latest file or file missing. Checking EDA_DATA_PATH: {EDA_DATA_PATH}")
            if os.path.exists(EDA_DATA_PATH):
                df = pd.read_csv(EDA_DATA_PATH)
            else:
                print(f"[DEBUG] EDA_DATA_PATH missing. Returning empty data.")
                return {"data": []}
        else:
            print(f"[DEBUG] Reading from latest file: {latest.file_path}")
            df = pd.read_csv(latest.file_path)
    except Exception as e:
        print(f"[ERROR] Failed to load data for exclude analysis: {e}")
        return {"data": []}
    finally:
        pass # db is managed by FastAPI

    if df.empty:
        print("[DEBUG] Dataframe is empty.")
        return {"data": []}

    # Grouping logic if raw file
    target_group_col = group_by.upper() if group_by else 'L3'
    if target_group_col in df.columns or 'L3' in df.columns:
        # If target group_by column is missing, fallback to L3, then L2
        if target_group_col not in df.columns:
             target_group_col = 'L3' if 'L3' in df.columns else ('L2' if 'L2' in df.columns else df.columns[0])
             
        # Standardize column names to match calculate_summary logic
        sales_col = None
        for cand in ['O_SALE', 'O_Sales', 'SALES', 'Sales']:
            if cand.upper() in [c.upper() for c in df.columns]:
                sales_col = [c for c in df.columns if c.upper() == cand.upper()][0]
                break
                
        units_col = None
        for cand in ['O_UNIT', 'O_Units', 'UNITS', 'Units']:
            if cand.upper() in [c.upper() for c in df.columns]:
                units_col = [c for c in df.columns if c.upper() == cand.upper()][0]
                break
        
        agg_dict = {}
        if sales_col: agg_dict[sales_col] = 'sum'
        if units_col: agg_dict[units_col] = 'sum'
        
        spend_cols = ['M_ON_DIS_TOTAL_SPEND', 'M_OFF_DIS_TOTAL_SPEND', 'M_SEARCH_SPEND']
        available_spend_cols = [c for c in spend_cols if c in df.columns]
        for c in available_spend_cols:
            agg_dict[c] = 'sum'
        
        if not agg_dict:
            return {"data": []}
            
        summary_df = df.groupby(target_group_col).agg(agg_dict).reset_index()
        
        total_sales = summary_df[sales_col].sum() if sales_col else 1
        total_units = summary_df[units_col].sum() if units_col else 1
        total_all_spend = summary_df[available_spend_cols].sum().sum() if available_spend_cols else 1
        
        # Consistently use 'Category' for the frontend
        if 'Category' not in summary_df.columns:
            if target_group_col in summary_df.columns:
                summary_df = summary_df.rename(columns={target_group_col: 'Category'})
            elif 'category' in summary_df.columns:
                summary_df = summary_df.rename(columns={'category': 'Category'})
                
        summary_df = summary_df.rename(columns={
            sales_col: 'Total_Sales',
            units_col: 'Total_Units'
        })
        
        summary_df['Sales_Share_Percentage'] = (summary_df['Total_Sales'] / total_sales * 100).fillna(0) if total_sales > 0 else 0
        summary_df['Unit_Share_Percentage'] = (summary_df['Total_Units'] / total_units * 100).fillna(0) if total_units > 0 else 0
        
        # Safe division for AVG_PRICE
        summary_df['AVG_PRICE'] = summary_df.apply(
            lambda x: x['Total_Sales'] / x['Total_Units'] if x['Total_Units'] > 0 else 0, 
            axis=1
        )
        
        if 'M_SEARCH_SPEND' in summary_df.columns:
            summary_df['Search_Spend_Share_Percentage'] = (summary_df['M_SEARCH_SPEND'] / total_all_spend * 100) if total_all_spend > 0 else 0
        if 'M_OFF_DIS_TOTAL_SPEND' in summary_df.columns:
            summary_df['OFFDisplay_Spend_Share_Percentage'] = (summary_df['M_OFF_DIS_TOTAL_SPEND'] / total_all_spend * 100) if total_all_spend > 0 else 0
        if 'M_ON_DIS_TOTAL_SPEND' in summary_df.columns:
            summary_df['ONDisplay_Spend_Share_Percentage'] = (summary_df['M_ON_DIS_TOTAL_SPEND'] / total_all_spend * 100) if total_all_spend > 0 else 0
            
        # Fetch relevance mappings from DB scoped to this model
        relevance_mappings = {}
        db_relevance = db.query(models.SubcategoryRelevanceMapping).filter(
            models.SubcategoryRelevanceMapping.model_id == model_id
        ).all()
        for r in db_relevance:
            relevance_mappings[r.subcategory] = 'YES' if r.is_relevant == 1 else 'NO'
            
        summary_df['Relevant'] = summary_df['Category'].map(relevance_mappings).fillna('YES')
        df = summary_df
    else:
        # Fallback mapping for existing processed files
        rename_map = {
            'OFFDisplay_Spend_Share%': 'OFFDisplay_Spend_Share_Percentage',
            'ONDisplay_Spend_Share%': 'ONDisplay_Spend_Share_Percentage',
            'Search_Spend_Share%': 'Search_Spend_Share_Percentage',
            'Sales_Share%': 'Sales_Share_Percentage',
            'Unit_Share%': 'Unit_Share_Percentage',
            'L3': 'Category',
            'category': 'Category'
        }
        df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
        
        if 'Category' in df.columns and 'Relevant' not in df.columns:
            relevance_mappings = {}
            db_relevance = db.query(models.SubcategoryRelevanceMapping).filter(
                models.SubcategoryRelevanceMapping.model_id == model_id
            ).all()
            for r in db_relevance:
                relevance_mappings[r.subcategory] = 'YES' if r.is_relevant == 1 else 'NO'
            df['Relevant'] = df['Category'].map(relevance_mappings).fillna('YES')
        elif 'Relevant' not in df.columns:
            df['Relevant'] = 'YES'

    result = {"data": df.fillna(0).to_dict(orient="records")}
    save_analytical_result(db, file_id, result_type, result)
    return result

def update_produce_relevance(db: Session, category: str, relevant: bool, model_id: Optional[int] = None):
    from .models import SubcategoryRelevanceMapping, AnalyticalResult
    
    mapping = db.query(SubcategoryRelevanceMapping).filter(
        SubcategoryRelevanceMapping.subcategory == category,
        SubcategoryRelevanceMapping.model_id == model_id
    ).first()
    is_rel_val = 1 if relevant else 0
    
    if mapping:
        mapping.is_relevant = is_rel_val
    else:
        mapping = SubcategoryRelevanceMapping(subcategory=category, is_relevant=is_rel_val, model_id=model_id)
        db.add(mapping)
    
    # Invalidate caches that depend on relevance mappings
    # We clear both exclude_analysis and brand_exclusion for this model
    # Clear both L2 and L3 caches
    cache_types = [f"exclude_analysis_{model_id}_L2", f"exclude_analysis_{model_id}_L3", f"exclude_analysis_{model_id}_L1", f"brand_exclusion_{model_id}"]
    # Legacy caches
    cache_types.extend([f"exclude_analysis_{model_id}", f"exclude_analysis_{model_id}_l2", f"exclude_analysis_{model_id}_l3"])
    
    db.query(AnalyticalResult).filter(
        AnalyticalResult.result_type.in_(cache_types)
    ).delete(synchronize_session=False)

    from app.modules.governance.models import ModelFile
    file_obj = db.query(ModelFile).filter(
        ModelFile.file_category == "exclude_flags_raw",
        ModelFile.model_id == model_id
    ).order_by(ModelFile.file_id.desc()).first()

    file_status = "error"
    if file_obj:
        if file_obj.status in ["approved", "rejected", "in_review", "uploaded"]:
            file_obj.status = "uploaded"
        file_status = file_obj.status

    db.commit()
    return {"category": category, "relevant": relevant, "status": "updated", "cache_cleared": cache_types, "file_status": file_status}

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

# ==========================================================
# BRAND EXCLUSION ANALYSIS
# ==========================================================

STOP_WORDS = {"a", "an", "and", "the", "of", "for", "to", "in", "on", "at", "by", "with"}

def _clean_text_basic(text: Any) -> str:
    if not isinstance(text, str):
        return ""
    lowered = text.lower()
    letters_only = re.sub(r"[^a-z\s]", "", lowered)
    words = [word for word in letters_only.split() if word and word not in STOP_WORDS]
    return "".join(words)

def _best_fuzzy_score_basic(value: str, candidates: List[str]) -> float:
    best = 0.0
    for candidate in candidates:
        if not candidate:
            continue
        score = SequenceMatcher(None, value, candidate).ratio() * 100
        if score > best:
            best = score
    return best

async def get_brand_exclusion_data(file_id: str, db: Session, model_id: Optional[int] = None):
    # Try persistence first
    result_type = f"brand_exclusion_{model_id}"
    persisted = get_persisted_result(db, int(file_id), result_type)
    if persisted:
        # Check if the summary is missing the new fields (e.g. part2, total_sales)
        if "part2" not in persisted.get("summary", {}):
            persisted = calculate_brand_summary_from_rows(persisted)
            # Re-save the upgraded schema to the database
            save_analytical_result(db, int(file_id), result_type, persisted)
        return persisted

    df = load_data(file_id)
    
    # 1. Resolve Relevance (Phase 1 Selection)
    relevant_levels = []
    cat_col = None
    cols_upper = {c.upper(): c for c in df.columns}
    cat_col = cols_upper.get("CATEGORY") or cols_upper.get("L3") or cols_upper.get("L2")
    
    if db and model_id and cat_col:
        from .models import SubcategoryRelevanceMapping
        db_relevance = db.query(SubcategoryRelevanceMapping).filter(
            SubcategoryRelevanceMapping.model_id == model_id,
            SubcategoryRelevanceMapping.is_relevant == 1
        ).all()
        relevant_levels = [r.subcategory for r in db_relevance]
    
    # If no relevance mappings found and we have model_id, 
    # it means Phase 1 hasn't been completed or all are de-selected.
    # For now, if no mapping, we might want a fallback or just empty.
    # The requirement is Phase 1 then Phase 2.
    if not relevant_levels:
        # Fallback: if no relevance is set, maybe they haven't run Phase 1.
        # We'll return an empty result or a warning.
        return {
            "file_id": str(file_id),
            "rows": [],
            "summary": {
                "combine_flag_count": 0, 
                "exclude_flag_count": 0, 
                "issue_counts": {"private_brand": 0, "mapping_issue": 0, "low_share": 0},
                "total_sales": 0.0,
                "total_spends": 0.0,
                "total_units": 0.0,
                "part2": [],
                "part3": []
            },
            "warnings": ["No relevant subcategories selected in Phase 1."]
        }

    # 2. Load Auxiliary Data
    exclude_flag_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "exclude_flag_automation"))
    pb_path = os.path.join(exclude_flag_dir, "Private Brand.xlsx")
    mi_path = os.path.join(exclude_flag_dir, "Mapping Issue Brand.xlsx")
    hist_path = os.path.join(exclude_flag_dir, "combined_output.json")
    
    private_brand_df = pd.read_excel(pb_path) if os.path.exists(pb_path) else None
    mapping_issue_df = pd.read_excel(mi_path) if os.path.exists(mi_path) else None

    # 3. Running Specialized Phase 2 Analysis
    # We identify the level (L2 or L3) based on Cat Col
    level_type = "L3" if "L3" in cat_col.upper() else "L2"
    
    try:
        pivot_result = exclude_flag_automation_function(
            df, 
            relevant_levels, 
            private_brand_df, 
            mapping_issue_df, 
            hist_path, 
            level=level_type
        )
    except Exception as e:
        print(f"[ERROR] Specialized Phase 2 analysis failed: {e}")
        # Fallback to empty but schema-compliant response
        return {
            "file_id": str(file_id), 
            "rows": [], 
            "summary": {
                "combine_flag_count": 0, 
                "exclude_flag_count": 0, 
                "issue_counts": {"private_brand": 0, "mapping_issue": 0, "low_share": 0},
                "total_sales": 0.0,
                "total_spends": 0.0,
                "total_units": 0.0,
                "part2": [],
                "part3": []
            },
            "warnings": [f"Analysis Error: {str(e)}"]
        }

    if pivot_result.empty:
        return {
            "file_id": str(file_id),
            "rows": [],
            "summary": {
                "combine_flag_count": 0, 
                "exclude_flag_count": 0, 
                "issue_counts": {"private_brand": 0, "mapping_issue": 0, "low_share": 0},
                "total_sales": 0.0,
                "total_spends": 0.0,
                "total_units": 0.0,
                "part2": [],
                "part3": []
            },
            "warnings": ["No brands found for selected subcategories."]
        }

    # 4. Format rows for frontend
    rows = []
    # Map column names from specialized pivot to frontend expected names
    col_map = {
        'UNIQUE_BRAND_NAME': 'brand',
        'Sum of O_SALE': 'sum_sales',
        'Sum of TOTAL_SPEND': 'sum_spend',
        'Sum of O_UNIT': 'sum_units',
        'Sales Share': 'sales_share',
        'Spend Share': 'spend_share',
        'Unit Share': 'unit_share',
        'Private Brand': 'private_brand',
        'Mapping Issue': 'mapping_issue',
        'Combine Flag': 'combine_flag',
        'Exclude Flag': 'exclude_flag',
        'Max of Exclude_Flag': 'original_exclude_flag',
        'comment': 'reason_issue_type' # Mapping comment to reason_issue_type for simplicity or keep both
    }
    
    for _, row in pivot_result.iterrows():
        r_dict = {}
        for k, v in col_map.items():
            if k in row:
                val = row[k]
                if pd.isna(val) or val == "":
                    if v == 'combine_flag':
                        r_dict[v] = None
                    elif v in ['brand', 'reason_issue_type']:
                        r_dict[v] = ""
                    else:
                        r_dict[v] = 0
                else:
                    try:
                        if v == 'combine_flag':
                            r_dict[v] = int(float(val))
                        elif v in ['sum_sales', 'sum_spend', 'sum_units', 'sales_share', 'spend_share', 'unit_share']:
                            r_dict[v] = float(val)
                        elif v in ['private_brand', 'mapping_issue', 'exclude_flag']:
                            r_dict[v] = int(float(val))
                        else:
                            r_dict[v] = str(val)
                    except (ValueError, TypeError):
                        r_dict[v] = 0 if v != 'combine_flag' else None
            else:
                r_dict[v] = 0
        rows.append(r_dict)

    # 5. Detailed Summary (Part 1, 2, 3)
    res_df = pivot_result
    total_sales = float(res_df['Sum of O_SALE'].sum())
    total_spends = float(res_df['Sum of TOTAL_SPEND'].sum())
    total_units = float(res_df['Sum of O_UNIT'].sum())

    def get_bucket(df, label):
        s = float(df['Sum of O_SALE'].sum()) if not df.empty else 0.0
        sp = float(df['Sum of TOTAL_SPEND'].sum()) if not df.empty else 0.0
        u = float(df['Sum of O_UNIT'].sum()) if not df.empty else 0.0
        return {
            "type": label,
            "sales": s,
            "spends": sp,
            "units": u,
            "sales_pct": (s / total_sales * 100) if total_sales > 0 else 0,
            "spends_pct": (sp / total_spends * 100) if total_spends > 0 else 0,
            "units_pct": (u / total_units * 100) if total_units > 0 else 0
        }

    # Part 2: Before Analysis (based on original Max of Exclude_Flag)
    part2 = [
        get_bucket(res_df[res_df['Max of Exclude_Flag'] == 0], "Included"),
        get_bucket(res_df[res_df['Max of Exclude_Flag'] == 1], "Excluded")
    ]

    # Part 3: After Exclude Flag Analysis
    # We follow the buckets from the user's screenshot + refined requests
    part3 = [
        get_bucket(res_df[res_df['Exclude Flag'] == 0], "Included"),
        get_bucket(res_df[res_df['Exclude Flag'] == 1], "Excluded"),
        get_bucket(res_df[res_df['Private Brand'] == 1], "Private Brand"),
        get_bucket(res_df[res_df['Mapping Issue'] == 1], "Mapping Issue"),
        get_bucket(res_df[(res_df['Exclude Flag'] == 1) & (res_df['Sum of TOTAL_SPEND'] == 0) & (res_df['Sum of O_SALE'] > 0)], "Excluded - Zero Spend With Sales"),
        get_bucket(res_df[(res_df['Exclude Flag'] == 1) & (res_df['Sum of O_SALE'] == 0) & (res_df['Sum of TOTAL_SPEND'] > 0)], "Excluded - Zero Sales With Spend"),
        get_bucket(res_df[(res_df['Exclude Flag'] == 1) & (res_df['Private Brand'] == 0) & (res_df['Mapping Issue'] == 0) & (res_df['Sum of TOTAL_SPEND'] != 0) & (res_df['Sum of O_SALE'] != 0)], "Other Issue")
    ]

    summary = {
        "total_sales": total_sales,
        "total_spends": total_spends,
        "total_units": total_units,
        "part2": part2,
        "part3": part3,
        "combine_flag_count": int(res_df['Combine Flag'].dropna().nunique()),
        "exclude_flag_count": int((res_df['Exclude Flag'] == 1).sum()),
        "issue_counts": {
            "private_brand": int((res_df['Private Brand'] == 1).sum()),
            "mapping_issue": int((res_df['Mapping Issue'] == 1).sum()),
            "low_share": int((res_df['Exclude Flag'] == 1).sum()) - int((res_df['Private Brand'] == 1).sum()) - int((res_df['Mapping Issue'] == 1).sum())
        }
    }
    summary["issue_counts"]["low_share"] = max(0, summary["issue_counts"]["low_share"])

    result = {
        "file_id": str(file_id),
        "rows": rows,
        "summary": summary,
        "warnings": []
    }
    
    save_analytical_result(db, int(file_id), result_type, result)
    return result

def update_brand_exclusion_result(db: Session, payload: schemas.BrandExclusionUpdateRequest):
    """
    Manually update a brand's grouping or exclusion status in the analytical results.
    """
    result_type = f"brand_exclusion_{payload.model_id}"
    existing = db.query(models.AnalyticalResult).filter(
        models.AnalyticalResult.file_id == payload.file_id,
        models.AnalyticalResult.result_type == result_type
    ).first()

    if not existing:
        return {"status": "error", "message": "Result not found"}

    import json
    data = json.loads(existing.result_data)
    rows = data.get("rows", [])
    
    target_brand = payload.brand.strip().lower()
    updated = False
    for row in rows:
        row_brand = str(row.get("brand", "")).strip().lower()
        if row_brand == target_brand:
            if payload.combine_flag is not None:
                row["combine_flag"] = int(payload.combine_flag) if payload.combine_flag > 0 else None
            if payload.exclude_flag is not None:
                row["exclude_flag"] = int(payload.exclude_flag)
            if payload.private_brand is not None:
                row["private_brand"] = int(payload.private_brand)
            if payload.mapping_issue is not None:
                row["mapping_issue"] = int(payload.mapping_issue)
            # If PB or MI changed, auto-set exclude_flag to match (PB=1 or MI=1 → exclude)
            # Only auto-derive if the caller didn't explicitly set exclude_flag
            if payload.exclude_flag is None and (payload.private_brand is not None or payload.mapping_issue is not None):
                pb = row.get("private_brand", 0)
                mi = row.get("mapping_issue", 0)
                row["exclude_flag"] = 1 if (pb == 1 or mi == 1) else row.get("exclude_flag", 0)
            updated = True
            break
    
    if updated:
        # Re-save the result
        # Note: Summary percentages are relative to total sales/spends which don't change.
        # However, mapping issue/private brand counts MIGHT change if we implement that.
        # For now, we manually refresh the FULL summary on save to be safe.
        processed_data = calculate_brand_summary_from_rows(data)
        existing.result_data = json.dumps(processed_data)

        # Revert file status to 'uploaded' if currently reviewed
        from app.modules.governance.models import ModelFile
        file_obj = db.query(ModelFile).filter(ModelFile.file_id == payload.file_id).first()
        file_status = "error"
        if file_obj:
            if file_obj.status in ["approved", "rejected", "in_review", "uploaded"]:
                file_obj.status = "uploaded"
            file_status = file_obj.status

        db.commit()
        return {"status": "success", "message": "Brand updated", "data": processed_data, "file_status": file_status}
    
    return {"status": "error", "message": "Brand not found in result"}

def calculate_brand_summary_from_rows(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper to re-calculate Part 1, 2, 3 summary from raw rows blob.
    """
    rows = data.get("rows", [])
    import pandas as pd
    df = pd.DataFrame(rows)
    if df.empty: return data

    total_sales = float(df['sum_sales'].sum())
    total_spends = float(df['sum_spend'].sum())
    total_units = float(df['sum_units'].sum())

    def get_bucket(label, filter_mask):
        b_df = df[filter_mask]
        s = float(b_df['sum_sales'].sum())
        sp = float(b_df['sum_spend'].sum())
        u = float(b_df['sum_units'].sum())
        return {
            "type": label,
            "sales": s,
            "spends": sp,
            "units": u,
            "sales_pct": (s / total_sales * 100) if total_sales > 0 else 0,
            "spends_pct": (sp / total_spends * 100) if total_spends > 0 else 0,
            "units_pct": (u / total_units * 100) if total_units > 0 else 0
        }

    data["summary"] = {
        "total_sales": total_sales,
        "total_spends": total_spends,
        "total_units": total_units,
        "part2": [
            get_bucket("Included", df['original_exclude_flag'] == 0),
            get_bucket("Excluded", df['original_exclude_flag'] == 1)
        ],
        "part3": [
            get_bucket("Included", df['exclude_flag'] == 0),
            get_bucket("Excluded", df['exclude_flag'] == 1),
            get_bucket("Private Brand", df['private_brand'] == 1),
            get_bucket("Mapping Issue", df['mapping_issue'] == 1),
            get_bucket("Excluded - Zero Spend With Sales", (df['exclude_flag'] == 1) & (df['sum_spend'] == 0) & (df['sum_sales'] > 0)),
            get_bucket("Excluded - Zero Sales With Spend", (df['exclude_flag'] == 1) & (df['sum_sales'] == 0) & (df['sum_spend'] > 0)),
            get_bucket("Other Issue", (df['exclude_flag'] == 1) & (df['private_brand'] == 0) & (df['mapping_issue'] == 0) & (df['sum_spend'] != 0) & (df['sum_sales'] != 0))
        ],
        "combine_flag_count": int(df['combine_flag'].dropna().nunique()),
        "exclude_flag_count": int((df['exclude_flag'] == 1).sum()),
        "issue_counts": {
            "private_brand": int((df['private_brand'] == 1).sum()),
            "mapping_issue": int((df['mapping_issue'] == 1).sum()),
            "low_share": int((df['exclude_flag'] == 1).sum()) - int((df['private_brand'] == 1).sum()) - int((df['mapping_issue'] == 1).sum())
        }
    }
    data["summary"]["issue_counts"]["low_share"] = max(0, data["summary"]["issue_counts"]["low_share"])
    return data
