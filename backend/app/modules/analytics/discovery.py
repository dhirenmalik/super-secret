from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import holidays
from datetime import datetime
import json
import os

from app.core.database import get_db
from app.core.rbac import get_current_user
from app.modules.governance.models import ModelFile
from app.modules.analytics import schemas, service
from .models import DiscoveryStack, DiscoveryStackData, DiscoveryAnalysisCache

# Define Tactics Columns
SPEND_COLS = [
    "M_SP_AB_SPEND", "M_SP_KWB_SPEND", "M_SBA_SPEND", "M_SV_SPEND",
    "M_ON_DIS_AT_SPEND", "M_ON_DIS_CT_SPEND", "M_ON_DIS_CATTO_SPEND",
    "M_ON_DIS_KW_SPEND", "M_ON_DIS_ROS_SPEND", "M_ON_DIS_HPLO_SPEND",
    "M_ON_DIS_APP_HPLO_SPEND", "M_ON_DIS_HP_SPEND", "M_ON_DIS_HPTO_SPEND",
    "M_ON_DIS_HPGTO_SPEND", "M_OFF_DIS_FB_SPEND", "M_OFF_DIS_PIN_SPEND",
    "M_OFF_DIS_WN_WITHOUTCTV_SPEND", "M_OFF_DIS_DSP_CTV_SPEND"
]

IMP_COLS = [
    "M_SP_AB_CLK", "M_SP_KWB_CLK", "M_SBA_CLK", "M_SV_CLK",
    "M_ON_DIS_AT_IMP", "M_ON_DIS_CT_IMP", "M_ON_DIS_CATTO_IMP",
    "M_ON_DIS_KW_IMP", "M_ON_DIS_ROS_IMP", "M_ON_DIS_HPLO_IMP",
    "M_ON_DIS_APP_HPLO_IMP", "M_ON_DIS_HP_IMP", "M_ON_DIS_HPTO_IMP",
    "M_ON_DIS_HPGTO_IMP", "M_OFF_DIS_FB_IMP", "M_OFF_DIS_PIN_IMP",
    "M_OFF_DIS_WN_WITHOUTCTV_IMP", "M_OFF_DIS_DSP_CTV_IMP"
]

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Preprocesses the dataframe to remove US holidays and retain the latest 32 months."""
    df = df.copy()
    if 'INDEX' not in df.columns:
        return df
        
    df['INDEX'] = pd.to_datetime(df['INDEX'], errors='coerce')
    df = df.dropna(subset=['INDEX'])
    
    # 32 Months filtering
    max_date = df['INDEX'].max()
    min_date = max_date - pd.DateOffset(months=32)
    df = df[df['INDEX'] >= min_date]
    
    # Generate Holidays flags (Vectorized)
    years_to_check = df['INDEX'].dt.year.unique()
    us_holidays = holidays.CountryHoliday('US', years=years_to_check)
    
    holiday_set = set(us_holidays.keys())
    # Expand holiday set to include +/- 1 day for buffer
    all_holiday_dates = set()
    for h_date in holiday_set:
        all_holiday_dates.add(h_date)
        all_holiday_dates.add(h_date + pd.Timedelta(days=1))
        all_holiday_dates.add(h_date - pd.Timedelta(days=1))
    
    # Compare date objects for speed
    df['is_holiday'] = df['INDEX'].dt.date.isin(all_holiday_dates)
    df = df[~df['is_holiday']]
    
    # Cleaning up columns based on prompt
    cols_to_drop = ["M_SP_AB_IMP", "M_SP_KWB_IMP", "M_SBA_IMP", "M_SV_IMP"]
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])
    
    return df

def generate_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """Full anomaly detection with unified severity scoring."""

    anomaly_records = []
    tactic_severity_tracker = []

    for spend_col, imp_col in zip(SPEND_COLS, IMP_COLS):

        if spend_col not in df.columns or imp_col not in df.columns:
            continue

        tactic_prefix = spend_col.replace('_SPEND', '')

        sub_df = df[['INDEX', spend_col, imp_col]].copy()
        sub_df = sub_df.rename(columns={
            spend_col: 'Spend',
            imp_col: 'Impressions'
        })

        # -----------------------------
        # Basic Statistics
        # -----------------------------
        active_spend = sub_df.loc[sub_df['Spend'] > 0, 'Spend']
        active_imp = sub_df.loc[sub_df['Impressions'] > 0, 'Impressions']

        # Spend stats
        if not active_spend.empty:
            s_median = active_spend.median()
            s_std = active_spend.std()
            s_95 = active_spend.quantile(0.95)
            s_5 = active_spend.quantile(0.05)
        else:
            s_median, s_std, s_95 , s_5 = 0, 1, 0, 0

        s_std = s_std if s_std > 0 else 1

        # Impression stats
        if not active_imp.empty:
            i_median = active_imp.median()
            i_std = active_imp.std()
            i_95 = active_imp.quantile(0.95)
            i_5 = active_imp.quantile(0.05)
        else:
            i_median, i_std, i_95 , i_5= 0, 1, 0, 0

        i_std = i_std if i_std > 0 else 1

        spend_threshold = s_median + 4 * s_std
        imp_threshold = i_median + 4 * i_std

        # -----------------------------
        # Z Above Threshold (Extreme Only)
        # -----------------------------
        sub_df['Z_Spend_Above'] = (
            (sub_df['Spend'] - spend_threshold) / s_std
        ).clip(lower=0)

        sub_df['Z_Imp_Above'] = (
            (sub_df['Impressions'] - imp_threshold) / i_std
        ).clip(lower=0)

        sub_df['Row_Severity'] = (
            sub_df['Z_Spend_Above'] +
            sub_df['Z_Imp_Above']
        )

        # Keep your original Z variables (unchanged logic)
        sub_df['Z_Spend'] = (sub_df['Spend'] - (s_median + 4 * s_std)) / s_std
        sub_df['Z_Imp'] = (sub_df['Impressions'] - (i_median + 4 * i_std)) / i_std

        tactic_z_sum = 0
        anomaly_count = 0

        # =====================================================
        # OUTPUTFILE 1 – Single Metric Anomalies (Vectorized)
        # =====================================================
        mask_ss = (sub_df['Spend'] > s_95) & (sub_df['Impressions'] <= i_5)
        mask_is = (sub_df['Impressions'] > i_95) & (sub_df['Spend'] <= s_5)
        mask_hs = (sub_df['Spend'] > spend_threshold)
        mask_hi = (sub_df['Impressions'] > imp_threshold)
        
        # Priority order for reason assignment
        sub_df['Reason'] = None
        sub_df.loc[mask_hi, 'Reason'] = "High Impression spike"
        sub_df.loc[mask_hs, 'Reason'] = "High Spend spike"
        sub_df.loc[mask_is, 'Reason'] = "Impression spike only"
        sub_df.loc[mask_ss, 'Reason'] = "Spend spike only"
        
        sm_df = sub_df[sub_df['Reason'].notnull()].copy()
        if not sm_df.empty:
            for _, row in sm_df.iterrows():
                anomaly_records.append({
                    'Tactic_Prefix': tactic_prefix,
                    'Anomaly Date': row['INDEX'].strftime('%Y-%m-%d'),
                    'Reason': row['Reason'],
                    'Priority': row['Row_Severity'],
                    'Impressions': round(row['Impressions'], 1),
                    'Spend': round(row['Spend'], 1),
                    'CPM': round(row['Spend'] / row['Impressions'], 1) if row['Impressions'] > 0 else 0,
                    'Z': round(row['Row_Severity'], 2),
                    'Brands_list': "Various Brands",
                    'SourceFile': 'SingleMetrics'
                })

        # =====================================================
        # OUTPUTFILE 2 – No Spend (Vectorized)
        # =====================================================
        ns_mask = (sub_df['Spend'] == 0) & (sub_df['Impressions'] > 0)
        ns_df = sub_df[ns_mask].copy()
        if not ns_df.empty:
            for _, row in ns_df.iterrows():
                anomaly_records.append({
                    'Tactic_Prefix': tactic_prefix,
                    'Anomaly Date': row['INDEX'].strftime('%Y-%m-%d'),
                    'Reason': "No Spend with added value Impressions",
                    'Priority': row['Impressions'],
                    'Impressions': round(row['Impressions'], 1),
                    'Spend': 0,
                    'CPM': 0,
                    'Z': 0,
                    'Brands_list': "Various Brands",
                    'SourceFile': 'NoSpend'
                })

        # =====================================================
        # OUTPUTFILE 3 – CPM Anomalies (Vectorized)
        # =====================================================
        valid_df = sub_df[(sub_df['Spend'] > 0) & (sub_df['Impressions'] > 0)].copy()
        if not valid_df.empty:
            valid_df['CPM'] = valid_df['Spend'] / valid_df['Impressions']
            cpm_med = valid_df['CPM'].median()
            cpm_std = valid_df['CPM'].std() or 1
            valid_df['Z_CPM'] = (valid_df['CPM'] - cpm_med) / cpm_std
            
            cpm_mask = (valid_df['Z_CPM'] >= 2) | (valid_df['Z_CPM'] <= -2)
            cpm_df = valid_df[cpm_mask].copy()
            if not cpm_df.empty:
                cpm_df['Reason'] = np.where(cpm_df['Z_CPM'] >= 2, "High Spend, Low IMP", "High IMP, Low Spend")
                for _, row in cpm_df.iterrows():
                    anomaly_records.append({
                        'Tactic_Prefix': tactic_prefix,
                        'Anomaly Date': row['INDEX'].strftime('%Y-%m-%d'),
                        'Reason': row['Reason'],
                        'Priority': abs(row['Z_CPM']),
                        'Impressions': round(row['Impressions'], 1),
                        'Spend': round(row['Spend'], 1),
                        'CPM': round(row['CPM'], 1),
                        'Z': round(row['Z_CPM'], 2),
                        'Brands_list': "Various Brands",
                        'SourceFile': 'CPM_anomalies'
                    })

        # =====================================================
        # FINAL TACTIC-LEVEL SEVERITY
        # =====================================================
        # For severity score, we still need current tactic's anomalies
        t_anomalies = [r for r in anomaly_records if r['Tactic_Prefix'] == tactic_prefix]
        anomaly_count = len(t_anomalies)
        if anomaly_count > 0:
            # Re-sum probabilities/Z values appropriately
            # Tactic severity score = (sum of priorities) * log1p(count)
            tactic_z_sum = sum(r['Priority'] for r in t_anomalies)
            severity_score = tactic_z_sum * np.log1p(anomaly_count)
            tactic_severity_tracker.append({
                'Tactic_Prefix': tactic_prefix,
                'Total_Z_Above': tactic_z_sum,
                'Anomaly_Count': anomaly_count,
                'Severity_Score': severity_score
            })

    # =====================================================
    # FINAL OUTPUT
    # =====================================================
    results_df = pd.DataFrame(anomaly_records)
    if results_df.empty:
        return results_df

    severity_df = pd.DataFrame(tactic_severity_tracker)
    if not severity_df.empty:
        severity_df = severity_df.sort_values('Severity_Score', ascending=False)
        severity_df['Priority'] = severity_df['Severity_Score'].rank(method='dense', ascending=False).astype(int)
        
        p40 = severity_df['Severity_Score'].quantile(0.40)
        p70 = severity_df['Severity_Score'].quantile(0.70)
        p90 = severity_df['Severity_Score'].quantile(0.90)

        def assign_band(score):
            if score >= p90: return "Critical"
            if score >= p70: return "High"
            if score >= p40: return "Medium"
            return "Low"

        severity_df['Severity_Band'] = severity_df['Severity_Score'].apply(assign_band)
        results_df = results_df.merge(
            severity_df[['Tactic_Prefix', 'Priority', 'Severity_Score', 'Severity_Band']],
            on='Tactic_Prefix',
            how='left'
        )
                    
        results_df['Anomaly Date'] = pd.to_datetime(results_df['Anomaly Date'])
        results_df = results_df.sort_values(['Anomaly Date', 'Severity_Score'], ascending=[False, False])
        results_df['Anomaly Date'] = results_df['Anomaly Date'].dt.strftime('%Y-%m-%d')

    return results_df

    return results_df

def summarize_observations_llm(final_anomalies_df: pd.DataFrame, model_id: int = None, project_name: str = "Stack Output") -> str:
    """Pre-aggregates the anomaly ranges natively and uses an LLM to generate conversational observations."""
    if final_anomalies_df.empty:
        return "No specific anomalies identified within the current dataset."
        return "No actionable anomaly records were generated for this criteria."
        
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import PromptTemplate
    except ImportError:
        return "LangChain packages not installed. Unable to generate AI observations."
        
    # Natively pre-group consecutive dates to avoid Context Limit and Agent Laziness
    grouped_data = []
    
    try:
        # Sort and identify consecutive runs natively
        df = final_anomalies_df.copy()
        df['Anomaly_Date_DT'] = pd.to_datetime(df['Anomaly Date'])
        df = df.sort_values(by=['Tactic_Prefix', 'Reason', 'Anomaly_Date_DT'])
        
        for (tactic, reason), group in df.groupby(['Tactic_Prefix', 'Reason']):
            group['date_diff'] = group['Anomaly_Date_DT'].diff().dt.days
            
            # Start a new block if gap is > 45 days
            group['block'] = (group['date_diff'] > 45).cumsum()
            
            for block_id, block_df in group.groupby('block'):
                start_dt = block_df['Anomaly Date'].min()
                end_dt = block_df['Anomaly Date'].max()
                date_range = start_dt if start_dt == end_dt else f"{start_dt} to {end_dt}"
                grouped_data.append({
                    'Tactic': tactic,
                    'Reason': reason,
                    'Date_Range': date_range,
                    'Duration_Days': (block_df['Anomaly_Date_DT'].max() - block_df['Anomaly_Date_DT'].min()).days + 1
                })
                
        # Take the top 3 longest duration blocks per tactic
        summary_df = pd.DataFrame(grouped_data)
        if not summary_df.empty:
            summary_df = summary_df.sort_values(by=['Tactic', 'Duration_Days'], ascending=[True, False])
            summary_df = summary_df.groupby('Tactic').head(3)
            condensed_csv = summary_df.to_csv(index=False)
        else:
            condensed_csv = final_anomalies_df.head(50).to_csv(index=False)
        
    except Exception as parse_ex:
        print(f"Native grouping failed: {parse_ex}")
        condensed_csv = final_anomalies_df.head(50).to_csv(index=False)
        
    # Standard check for API key
    if not os.environ.get("OPENAI_API_KEY"):
        return "No OPENAI_API_KEY found in environment. Please set it to enable AI anomaly summaries."
        
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0) # updated to latest efficient model
    
    prompt_template = PromptTemplate.from_template("""
You are a senior Data Scientist analyzing Enterprise Media macro-level metrics for anomaly identification. 
Convert the following summarized CSV of anomaly date ranges into highly engaging operational insights.

Rules:
For each Tactic:
- Write 1-2 analytical sentences describing the REASON for the anomaly and specifying the Date_Range.
- Instead of using the phrasing 'due to multiple brands', phrase the insight organically like 'we observed a systemic category-level spike' or 'there was a broad deceleration across the segment'. Use varied, professional analytical language.
- If one tactic has multiple anomalous date ranges or reasons, combine them into an easy-to-read narrative.
- Replace " Impressions " and " IMP " by "Clicks" in each observation if Tactic starts with "M_S".

Formatting Example:
ON_DIS_HPLO: In Oct 2023 and Jan 2025, we saw a sudden influx of added value impressions despite minimal spend, indicating favorable systemic inventory conditions.
M_SP_AB: There was a category-wide inefficiency from Jun 2024 to Jul 2024, characterized by a substantial increase in spend that outpaced Click volume.
OFF_DIS_PIN: We identified a sustained period of high Impressions alongside lower spend from Apr 2024 to May 2024, likely driven by high top-of-funnel reach during that window.

Data:
{csv_data}
""")
    
    chain = prompt_template | llm
    
    try:
        from langchain_openai import ChatOpenAI
        response = chain.invoke({"csv_data": condensed_csv})
        insights = response.content
        
        # Save to cache if model_id provided
        if model_id is not None:
            try:
                # Sanitize project name
                safe_project_name = "".join([c if c.isalnum() or c in ("-", "_") else "_" for c in project_name])
                project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", safe_project_name, "Stack Output"))
                os.makedirs(project_dir, exist_ok=True)
                cache_path = os.path.join(project_dir, f"model_{model_id}_agent_insights.txt")
                with open(cache_path, "w", encoding="utf-8") as f:
                    f.write(insights)
            except Exception as e:
                print(f"Warning: Failed to cache insights to file: {e}")
        return insights
    except Exception as e:
        print(f"Error calling LLM Formatter: {e}")
        import traceback
        traceback.print_exc()
        return f"Insight generation failed during LLM formatting call. Error: {str(e)}"

def get_discovery_data(db: Session, model_id: int, force_refresh: bool = False) -> Dict[str, Any]:
    """
    Fetches the `aggbrand_modelingstack.csv` for the given model_id, runs anomaly detection,
    and returns chart time-series data and anomalies table.
    """
    from app.modules.governance.models import Model
    
    # 0. Check for DB-backed Cache
    if not force_refresh:
        try:
            cache_entry = db.query(DiscoveryAnalysisCache).filter(
                DiscoveryAnalysisCache.model_id == model_id
            ).first()
            
            if cache_entry:
                stack_entry = db.query(DiscoveryStack).filter(
                    DiscoveryStack.model_id == model_id, 
                    DiscoveryStack.stack_type == 'modeling_stack'
                ).order_by(DiscoveryStack.created_at.desc()).first()
                
                # If cache is newer than the stack, serve it
                if not stack_entry or cache_entry.updated_at > stack_entry.created_at:
                    print(f"[DISCOVERY] Serving from DB cache for model {model_id}")
                    return json.loads(cache_entry.analysis_data)
        except Exception as e:
            print(f"[WARNING] DB Cache load failed: {e}")

    model = db.query(Model).filter(Model.model_id == model_id).first()
    raw_project_name = model.model_name if model else f"model_{model_id}"
    project_name = "".join([c if c.isalnum() or c in ("-", "_") else "_" for c in raw_project_name])
    
    project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", project_name, "Stack Output"))
    csv_path = os.path.join(project_dir, "aggbrand_modelingstack.csv")

    df = None

    # Try to load from Database first
    db_metadata = {}
    try:
        stack_entry = db.query(DiscoveryStack).filter(
            DiscoveryStack.model_id == model_id, 
            DiscoveryStack.stack_type == 'modeling_stack'
        ).first()
        
        if stack_entry:
            print(f"[DISCOVERY] Found DB stack for model {model_id}. Loading rows...")
            data_rows = db.query(DiscoveryStackData).filter(DiscoveryStackData.stack_id == stack_entry.stack_id).all()
            if data_rows:
                rows = [json.loads(d.row_data) for d in data_rows]
                df = pd.DataFrame(rows)
                if 'INDEX' in df.columns:
                    df['INDEX'] = pd.to_datetime(df['INDEX'])
                
                # Store metadata from the DB record for later use
                db_metadata = json.loads(stack_entry.stack_metadata) if stack_entry.stack_metadata else {}
    except Exception as e:
        print(f"[WARNING] SQL stack load failed, falling back to CSV: {e}")
        db_metadata = {}

    if df is None:
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="Modeling stack not built yet for this model.")
            
        try:
            df = pd.read_csv(csv_path)
            if 'INDEX' in df.columns:
                df['INDEX'] = pd.to_datetime(df['INDEX'])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading stack CSV: {str(e)}")
        
    df = preprocess_data(df)
    
    # 1. Prepare time series for chart
    if 'INDEX' in df.columns:
        df['date'] = df['INDEX'].dt.strftime('%Y-%m-%d')
    else:
        df['date'] = df.index.astype(str)
        
    # Grab tactics for charting (excluding non-numerics)
    cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    
    time_series = df[['date'] + cols].to_dict(orient='records')
    
    # 2. Generate Anomalies
    anomalies_df = generate_anomalies(df)
    
    anomalies_list = []
    if not anomalies_df.empty:
        # Clean NaNs
        anomalies_df = anomalies_df.replace({np.nan: None})
        anomalies_list = anomalies_df.to_dict(orient='records')
        
    # 3. Extract Metadata before grouping
    subcategories = "Mixed"
    l2_list = db_metadata.get("l2_list", [])
    num_brands = db_metadata.get("num_brands", 0)
    
    if l2_list:
        subcategories = ", ".join(l2_list)

    # PRIMARY: read from stack_metadata.json (fallback for old models without DB record)
    if not l2_list:
        metadata_path = os.path.join(project_dir, "stack_metadata.json")
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r") as f:
                    meta = json.load(f)
                l2_list = meta.get("l2_list", [])
                if l2_list:
                    subcategories = ", ".join(l2_list)
            except Exception as e:
                print(f"[WARNING] Could not read stack_metadata.json: {e}")

    # FALLBACK: scan cleanbrand_agg.csv for L2 column
    if not l2_list:
        cleanbrand_path = os.path.join(project_dir, "cleanbrand_agg.csv")
        if os.path.exists(cleanbrand_path):
            try:
                cb_df = pd.read_csv(cleanbrand_path)
                l2_col = next((c for c in cb_df.columns if c.upper() == "L2"), None)
                if l2_col:
                    l2_list = sorted(cb_df[l2_col].dropna().astype(str).str.strip().unique().tolist())
                    l2_list = [x for x in l2_list if x and x.lower() not in ('nan', '', '0')]
                    subcategories = ", ".join(l2_list) if l2_list else "Mixed"
                if 'UNIQUE_BRAND_NAME' in cb_df.columns:
                    num_brands = cb_df['UNIQUE_BRAND_NAME'].nunique()
            except Exception as e:
                print(f"[WARNING] Could not extract L2 from cleanbrand_agg: {e}")

    if 'SUB_CATEGORY' in df.columns and not l2_list:
        subcat_list = df['SUB_CATEGORY'].dropna().unique().tolist()
        subcategories = ", ".join(str(x) for x in subcat_list) if subcat_list else "Mixed"
        l2_list = subcat_list
        
    if 'BRAND' in df.columns and num_brands == 0:
        num_brands = df['BRAND'].nunique()
    
    # Fallback: final_model_data.csv
    final_data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", project_name, "L3 Output", "final_model_data.csv"))
    if os.path.exists(final_data_path) and not l2_list:
        try:
            final_df = pd.read_csv(final_data_path)
            if 'SUB_CATEGORY' in final_df.columns:
                subcat_list = final_df['SUB_CATEGORY'].dropna().unique().tolist()
                l2_list = subcat_list
                subcategories = ", ".join(str(x) for x in subcat_list) if subcat_list else subcategories
            if 'BRAND' in final_df.columns:
                num_brands = final_df['BRAND'].nunique()
        except Exception:
            pass

    # 4. Check for cached insights
    cached_insights = None
    cache_insight_path = os.path.join(project_dir, f"model_{model_id}_agent_insights.txt")
    if os.path.exists(cache_insight_path):
        try:
            with open(cache_insight_path, "r", encoding="utf-8") as f:
                cached_insights = f.read()
        except:
            pass

    result = {
        "columns": cols,
        "time_series": time_series,
        "anomalies": anomalies_list,
        "metadata": {
            "subcategories": subcategories,
            "l2_list": l2_list,
            "num_brands": int(num_brands) if num_brands else 0,
            "agent_insights": cached_insights
        }
    }
    
    # 5. Save to DB-backed cache
    try:
        cache_entry = db.query(DiscoveryAnalysisCache).filter(
            DiscoveryAnalysisCache.model_id == model_id
        ).first()
        
        if not cache_entry:
            cache_entry = DiscoveryAnalysisCache(model_id=model_id)
            db.add(cache_entry)
            
        cache_entry.analysis_data = json.dumps(result, default=str)
        cache_entry.updated_at = datetime.utcnow()
        db.commit()
        print(f"[DISCOVERY] Persisted analysis to DB cache for model {model_id}")
    except Exception as e:
        db.rollback()
        print(f"[WARNING] Failed to write discovery DB cache: {e}")

    return result
