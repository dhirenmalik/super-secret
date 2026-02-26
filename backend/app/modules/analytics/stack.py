import os
import json
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from .models import SubcategoryRelevanceMapping, DiscoveryStack, DiscoveryStackData

# Configuration paths from script
PROJECT_RAW_DATA = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "RAW_DATA"))

def build_brand_mappings(flag_df):
    brand_name_mappings = {}
    comb_flag_mappings = {}
    incorrect_mapping_list = ['NONE','ONLINE','UNBRANDED','0','GENERIC','NAN','NA','INCORRECT']

    if 'TOTAL_SPENDS' not in flag_df.columns:
        flag_df['TOTAL_SPENDS'] = flag_df.get('M_SEARCH_SPEND', 0).fillna(0) + flag_df.get('M_ON_DIS_TOTAL_SUM_SPEND', 0).fillna(0) + flag_df.get('M_OFF_DIS_TOTAL_SUM_SPEND', 0).fillna(0)

    comb_flags = flag_df[(flag_df['EXCLUDE_FLAG']==0)&(flag_df['COMBINE_FLAG'].notna())]['COMBINE_FLAG'].unique().tolist()
    comb_flags.sort()

    for i in comb_flags:
        comb_flag_df = flag_df[(flag_df['COMBINE_FLAG']==i)&(~flag_df['UNIQUE_BRAND_NAME'].isin(incorrect_mapping_list))][['UNIQUE_BRAND_NAME','O_SALE','TOTAL_SPENDS']].groupby('UNIQUE_BRAND_NAME',as_index=False).sum()
        comb_flag_unique_brands = comb_flag_df['UNIQUE_BRAND_NAME'].unique().tolist()
        comb_max_sale = comb_flag_df['O_SALE'].max() if 'O_SALE' in comb_flag_df.columns else 0
        comb_max_spends = comb_flag_df['TOTAL_SPENDS'].max() if 'TOTAL_SPENDS' in comb_flag_df.columns else 0

        if comb_max_sale > 1:
            top_brand = comb_flag_df[comb_flag_df['O_SALE']==comb_max_sale]['UNIQUE_BRAND_NAME'].values[0]
            comb_flag_mappings[i] = top_brand
        elif comb_max_spends > 1:
            top_brand = comb_flag_df[comb_flag_df['TOTAL_SPENDS']==comb_max_spends]['UNIQUE_BRAND_NAME'].values[0]
            comb_flag_mappings[i] = top_brand
        else:
            if len(comb_flag_df['UNIQUE_BRAND_NAME'].unique()) > 0:
                top_brand = comb_flag_df['UNIQUE_BRAND_NAME'].unique()[0]
            else:
                top_brand = "UNKNOWN"
            comb_flag_mappings[i] = top_brand

        for j in comb_flag_unique_brands:
            brand_name_mappings[j] = top_brand

    return brand_name_mappings, comb_flag_mappings

def get_brand_list(flag_df_include):
    # Fix: Get unique brands directly instead of grouping by O_SALE which might be missing/zero
    return flag_df_include['UNIQUE_BRAND_NAME'].unique().tolist()

def run_setup(flag_df):
    if 'TOTAL_SPENDS' not in flag_df.columns:
        flag_df['TOTAL_SPENDS'] = flag_df.get("M_SEARCH_SPEND", 0).fillna(0) + flag_df.get("M_ON_DIS_TOTAL_SUM_SPEND", 0).fillna(0) + flag_df.get("M_OFF_DIS_TOTAL_SUM_SPEND", 0).fillna(0)
    
    flag_df.columns = [x.upper() for x in flag_df.columns]
    brand_name_mappings, comb_flag_mappings = build_brand_mappings(flag_df)

    flag_df['UNIQUE_BRAND_NAME'] = flag_df['UNIQUE_BRAND_NAME'].replace(brand_name_mappings.keys(), brand_name_mappings.values())
    flag_df_include = flag_df.loc[flag_df['EXCLUDE_FLAG']==0].copy()
    
    # Ensure L1, L2, L3 exist before trying to create COMB
    for col in ['L1', 'L2', 'L3']:
        if col not in flag_df_include.columns:
            flag_df_include[col] = ''
    
    flag_df_include['COMB'] = flag_df_include['L1'].astype(str) + flag_df_include['L2'].astype(str) + flag_df_include['L3'].astype(str) + flag_df_include['UNIQUE_BRAND_NAME'].astype(str)

    brand_list = get_brand_list(flag_df_include)

    return {
        'brand_list': brand_list,
        'brand_name_mappings': brand_name_mappings,
        'comb_flag_mappings': comb_flag_mappings,
        'flag_df_include': flag_df_include,
        'flag_df_original': flag_df
    }

def generate_filtered_agg_brand_and_avg_brand_else(df_daily, setup):
    df_daily.columns = [x.upper() for x in df_daily.columns]
    df_daily = df_daily.drop(df_daily[df_daily['INDEX'] == 'INDEX'].index)
    numeric_cols = df_daily.select_dtypes(include=['number']).columns

    for var in numeric_cols:
        df_daily[var] = df_daily[var].astype(float)

    df_daily[df_daily.select_dtypes(include=['number']).columns] = df_daily.select_dtypes(include=['number']).fillna(0)

    df_daily['INDEX']= pd.to_datetime(df_daily['INDEX']).dt.strftime('%Y-%m-%d')
    df_daily['INDEX']= pd.to_datetime(df_daily['INDEX'])
    

    # FILTER BY RELEVANT SUBCATEGORIES (Phase 1)
    relevant_levels = setup.get('relevant_levels', [])
    if relevant_levels:
        if 'L2' in df_daily.columns and 'L3' in df_daily.columns:
            df_daily['_temp_l2'] = df_daily['L2'].astype(str).str.upper().str.strip()
            df_daily['_temp_l3'] = df_daily['L3'].astype(str).str.upper().str.strip()
            df_daily = df_daily[df_daily['_temp_l2'].isin(relevant_levels) | df_daily['_temp_l3'].isin(relevant_levels)]
            df_daily.drop(columns=['_temp_l2', '_temp_l3'], inplace=True)
        elif 'L2' in df_daily.columns:
            df_daily['_temp_l2'] = df_daily['L2'].astype(str).str.upper().str.strip()
            df_daily = df_daily[df_daily['_temp_l2'].isin(relevant_levels)]
            df_daily.drop(columns=['_temp_l2'], inplace=True)
        elif 'L3' in df_daily.columns:
            df_daily['_temp_l3'] = df_daily['L3'].astype(str).str.upper().str.strip()
            df_daily = df_daily[df_daily['_temp_l3'].isin(relevant_levels)]
            df_daily.drop(columns=['_temp_l3'], inplace=True)

    df_daily["UNIQUE_BRAND_NAME"] = df_daily["UNIQUE_BRAND_NAME"].astype(str)
    df_daily["UNIQUE_BRAND_NAME"] = df_daily["UNIQUE_BRAND_NAME"].str.upper()

    if "M_ON_DIS_HPLO_SUM_IMP" in df_daily.columns and "M_ON_DIS_APP_HPLO_SUM_IMP" in df_daily.columns:
        df_daily["M_ON_DIS_TOTAL_HPLO_SUM_IMP"]=df_daily["M_ON_DIS_HPLO_SUM_IMP"]+df_daily["M_ON_DIS_APP_HPLO_SUM_IMP"]
        df_daily["M_ON_DIS_TOTAL_HPLO_SUM_SPEND"]=df_daily["M_ON_DIS_HPLO_SUM_SPEND"]+df_daily["M_ON_DIS_APP_HPLO_SUM_SPEND"]

    brand_list = setup['brand_list']
    brand_name_mappings = setup['brand_name_mappings']
    flag_df_filtered = setup['flag_df_include']

    df_daily['UNIQUE_BRAND_NAME'] = df_daily['UNIQUE_BRAND_NAME'].replace(brand_name_mappings)
    
    # Safely cast to str to avoid errors on .isin matching
    df_daily['L1'] = df_daily.get('L1', '').astype(str)
    df_daily['L2'] = df_daily.get('L2', '').astype(str)
    df_daily['L3'] = df_daily.get('L3', '').astype(str)
    df_daily['UNIQUE_BRAND_NAME'] = df_daily['UNIQUE_BRAND_NAME'].astype(str)

    df_daily['COMB'] = df_daily['L1'] + df_daily['L2'] + df_daily['L3'] + df_daily['UNIQUE_BRAND_NAME']

    # Strictly filter by Included Brands & Categories (Phase 2 output)
    # The flag_df_filtered already contains the EXCLUDE_FLAG == 0 constraint
    brand_list = [str(b).upper() for b in brand_list]
    valid_combs = set(flag_df_filtered['COMB'].dropna().tolist())
    
    # Try filtering by COMB first for exact category+brand match
    df_daily_filtered = df_daily[df_daily['COMB'].isin(valid_combs)].copy()
    
    # Fallback to brand-only filtering if COMB matching dropped everything 
    # (e.g., if L1/L2/L3 naming conventions changed slightly between files)
    if df_daily_filtered.empty and not df_daily.empty:
        print("[WARNING] COMB matching yielded 0 rows, falling back to UNIQUE_BRAND_NAME matching.")
        df_daily_filtered = df_daily[df_daily['UNIQUE_BRAND_NAME'].isin(brand_list)].copy()

    del df_daily_filtered['COMB']

    df_sum = df_daily_filtered.groupby(['INDEX','UNIQUE_BRAND_NAME']).sum(numeric_only=True).reset_index()

    cleanbrand_agg = df_sum.copy()
    renamed=[i.replace("SUM_","") for i in cleanbrand_agg.columns if "SUM_" in i and  i.startswith('M_')]
    original=[i for i in cleanbrand_agg.columns if "SUM_" in i]
    rename_dict = {k: v for k, v in zip(original, renamed)}

    cleanbrand_agg.rename(columns=rename_dict,inplace=True)
    return cleanbrand_agg

def get_key_list():
    return [
        "INDEX", "L0", "L1", "L2", "L3", "UNIQUE_BRAND_NAME", 
        "O_SALE", "O_UNIT", "O_SALE_STORE", "O_SALE_OG", "O_SALE_DOTCOM", "O_SALE_ONLINE",
        "O_UNIT_STORE", "O_UNIT_OG", "O_UNIT_DOTCOM", "O_UNIT_ONLINE",
        "M_ON_DIS_HPLO_SUM_IMP", "M_ON_DIS_HPLO_SUM_SPEND",
        "M_ON_DIS_APP_HPLO_SUM_IMP", "M_ON_DIS_APP_HPLO_SUM_SPEND",
        "M_ON_DIS_HP_SUM_IMP", "M_ON_DIS_HP_SUM_SPEND",
        "M_ON_DIS_ROS_SUM_IMP", "M_ON_DIS_ROS_SUM_SPEND",
        "M_ON_DIS_CATTO_SUM_IMP", "M_ON_DIS_CATTO_SUM_SPEND",
        "M_ON_DIS_HPTO_SUM_IMP", "M_ON_DIS_HPTO_SUM_SPEND",
        "M_ON_DIS_HPGTO_SUM_IMP", "M_ON_DIS_HPGTO_SUM_SPEND",
        "M_ON_DIS_AT_SUM_IMP", "M_ON_DIS_AT_SUM_SPEND",
        "M_ON_DIS_KW_SUM_IMP", "M_ON_DIS_KW_SUM_SPEND",
        "M_ON_DIS_CT_SUM_IMP", "M_ON_DIS_CT_SUM_SPEND",
        "M_SP_AB_IMP", "M_SP_AB_CLK", "M_SP_AB_SPEND",
        "M_SP_KWB_IMP", "M_SP_KWB_CLK", "M_SP_KWB_SPEND",
        "M_SV_IMP", "M_SV_CLK", "M_SV_SPEND",
        "M_SBA_IMP", "M_SBA_CLK", "M_SBA_SPEND",
        "M_SEARCH_IMP", "M_SEARCH_CLK", "M_SEARCH_SPEND",
        "M_OFF_DIS_FB_SUM_IMP", "M_OFF_DIS_FB_SUM_SPEND",
        "M_OFF_DIS_WN_WITHOUTCTV_SUM_IMP", "M_OFF_DIS_WN_WITHOUTCTV_SUM_SPEND",
        "M_OFF_DIS_DSP_CTV_SUM_IMP", "M_OFF_DIS_DSP_CTV_SUM_SPEND",
        "M_OFF_DIS_PIN_SUM_IMP", "M_OFF_DIS_PIN_SUM_SPEND",
        "M_ON_DIS_TOTAL_SUM_IMP", "M_ON_DIS_TOTAL_SUM_SPEND",
        "M_OFF_DIS_TOTAL_SUM_IMP", "M_OFF_DIS_TOTAL_SUM_SPEND"
    ]

def get_tactics_list():
    return [
        'M_SP_AB', 'M_SP_KWB', 'M_SBA', 'M_SV', 'M_ON_DIS_AT', 'M_ON_DIS_CT', 
        'M_ON_DIS_CATTO', 'M_ON_DIS_KW', 'M_ON_DIS_ROS', 'M_ON_DIS_TOTAL_HPLO',
        'M_ON_DIS_HPGTO', 'M_ON_DIS_HPTO', 'M_ON_DIS_HP', 'M_OFF_DIS_WN_WITHOUTCTV',
        'M_OFF_DIS_DSP_CTV', 'M_OFF_DIS_FB', 'M_OFF_DIS_PIN'
    ]

def create_rate_vars(data):
    for var in get_tactics_list():
        if (var[0:4] == 'M_SP') or (var[0:5] == 'M_SBA'):
            if var+'_SPEND' in data.columns and var+'_CLK' in data.columns:
                data['RATE_'+var] = data[var+'_SPEND'] / data[var+'_CLK'].replace(0, np.nan)
        else:
            if var+'_SPEND' in data.columns and var+'_IMP' in data.columns:
                data['RATE_'+var] = data[var+'_SPEND'] / data[var+'_IMP'].replace(0, np.nan)
    return data

async def build_stack_process(db: Session, exclude_file_id: int, stack_type: str = "brand"):
    """
    Main entry point for building the brand stack. 
    1. Loads the Exclude Flag dataset from db for file_id.
    2. Runs setup mappings.
    3. Loops through raw parquet parts to build cleanbrand_agg.
    4. Summarizes into model_stack.
    5. Returns QA response JSON.
    """
    from .service import load_data, get_brand_exclusion_data
    
    print("[STACK] Loading Exclude Flag rules...")
    try:
        flag_df = load_data(exclude_file_id)
    except Exception as e:
        raise ValueError(f"Excluded flag base file {exclude_file_id} not found: {str(e)}")
        
    # Standardize column names for exclude flags
    flag_df.columns = [x.upper() for x in flag_df.columns]
    
    from app.modules.governance.models import ModelFile, Model
    from .models import SubcategoryRelevanceMapping
    
    # 1. First find the model_id from the exclude_file_id
    exclude_file = db.query(ModelFile).filter(ModelFile.file_id == exclude_file_id).first()
    if not exclude_file or not exclude_file.model_id:
        raise ValueError(f"Could not determine model_id from exclude_file_id {exclude_file_id}")
    model_id = exclude_file.model_id

    # 2. Find relevant categories to filter the raw dataset
    db_relevance = db.query(SubcategoryRelevanceMapping).filter(
        SubcategoryRelevanceMapping.model_id == model_id,
        SubcategoryRelevanceMapping.is_relevant == 1
    ).all()
    relevant_levels = [r.subcategory for r in db_relevance]

    cat_col = None
    if "CATEGORY" in flag_df.columns:
        cat_col = "CATEGORY"
    elif "L3" in flag_df.columns:
        cat_col = "L3"
    elif "L2" in flag_df.columns:
        cat_col = "L2"
        
    if relevant_levels and cat_col:
        flag_df = flag_df[flag_df[cat_col].isin(relevant_levels)].copy()
    
    # Fetch persisted flags from the DB
    flags_response = await get_brand_exclusion_data(exclude_file_id, db, model_id=model_id)

    expected_sales = 0.0
    expected_spends = 0.0
    if "summary" in flags_response and "part3" in flags_response["summary"]:
        included_bucket = next((b for b in flags_response["summary"]["part3"] if b["type"] == "Included"), None)
        if included_bucket:
            expected_sales = included_bucket.get("sales", 0.0)
            expected_spends = included_bucket.get("spends", 0.0)

    flags_rows = flags_response.get("rows", [])
    flags_df = pd.DataFrame(flags_rows)
    
    if not flags_df.empty:
        # Expected columns: brand, combine_flag, exclude_flag
        # Map them to flag_df
        flags_mapping = flags_df[['brand', 'combine_flag', 'exclude_flag']].copy()
        flags_mapping.rename(columns={
            'brand': 'UNIQUE_BRAND_NAME',
            'combine_flag': 'COMBINE_FLAG',
            'exclude_flag': 'EXCLUDE_FLAG'
        }, inplace=True)
        # Ensure brand strings match (upper vs upper)
        flags_mapping['UNIQUE_BRAND_NAME'] = flags_mapping['UNIQUE_BRAND_NAME'].astype(str).str.upper()
        
        # Merge onto flag_df
        flag_df['UNIQUE_BRAND_NAME'] = flag_df['UNIQUE_BRAND_NAME'].astype(str).str.upper()
        # Drop existing flags just in case
        flag_df.drop(columns=['EXCLUDE_FLAG', 'COMBINE_FLAG'], errors='ignore', inplace=True)
        # Merge
        flag_df = flag_df.merge(flags_mapping, on='UNIQUE_BRAND_NAME', how='left')
        
    # Set default values if merge didn't happen for some reason or left NaNs
    if 'EXCLUDE_FLAG' not in flag_df.columns:
        flag_df['EXCLUDE_FLAG'] = 0
    if 'COMBINE_FLAG' not in flag_df.columns:
        flag_df['COMBINE_FLAG'] = np.nan

    # Map string flags to 0/1 integers
    def map_exclude_flag(val):
        if pd.isna(val):
            return 0
        if isinstance(val, str):
            v = val.upper()
            if v == "EXCLUDE" or v == "1" or v == "TRUE": return 1
            if v == "INCLUDE" or v == "0" or v == "FALSE": return 0
            return 0
        if isinstance(val, bool):
            return 1 if val else 0
        return int(val)
        
    flag_df['EXCLUDE_FLAG'] = flag_df['EXCLUDE_FLAG'].apply(map_exclude_flag)

    setup = run_setup(flag_df)
    setup['relevant_levels'] = [str(r).upper().strip() for r in relevant_levels] if relevant_levels else []
    setup['cat_col'] = str(cat_col).upper() if cat_col else None
    
    print("[STACK] Fetching uploaded parquet files for Brand Stacks...")
    
    # 2. Query all 'brand_stacks_raw' files for this model
    brand_stack_files = db.query(ModelFile).filter(
        ModelFile.model_id == model_id,
        ModelFile.file_category == 'brand_stacks_raw',
        ModelFile.is_active == True
    ).order_by(ModelFile.file_id.desc()).all()
    
    if not brand_stack_files:
        raise ValueError(f"No 'brand_stacks_raw' files uploaded for model {model_id}.")
        
    # 3. Get the latest version of each distinct file_name
    latest_parquets = {}
    for f in brand_stack_files:
        if f.file_name not in latest_parquets:
            latest_parquets[f.file_name] = f.file_path
            
    print(f"[STACK] Found {len(latest_parquets)} parquet files to process.")
    
    print("[STACK] Building Clean Brand Aggregates...")
    agg_brands = []
    
    # Read all dynamically located parquet parts
    for file_name, parquet_path in latest_parquets.items():
        try:
            if os.path.exists(parquet_path):
                print(f"[STACK] Processing {file_name} from {parquet_path}")
                df_daily = pd.read_parquet(parquet_path, columns=get_key_list())
                agg = generate_filtered_agg_brand_and_avg_brand_else(df_daily, setup)
                agg_brands.append(agg)
            else:
                print(f"[WARNING] File not found on disk: {parquet_path}")
        except Exception as e:
            print(f"[WARNING] Failed to process {file_name}: {e}")

    if not agg_brands:
        raise ValueError("No valid parquet data could be processed from the uploaded files.")

    cleanbrand_agg = pd.concat(agg_brands, ignore_index=True)
    
    # Optional logic: econ wmt mapping could go here. Ignoring for demo
    cleanbrand_agg = cleanbrand_agg.replace(np.nan, 0)
    
    if 'O_SALE' in cleanbrand_agg.columns and 'O_UNIT' in cleanbrand_agg.columns:
        cleanbrand_agg['PRICE'] = cleanbrand_agg['O_SALE'] / cleanbrand_agg['O_UNIT'].replace(0, np.nan)
    if 'O_SALE_ONLINE' in cleanbrand_agg.columns and 'O_UNIT_ONLINE' in cleanbrand_agg.columns:
        cleanbrand_agg['PRICE_ONLINE'] = cleanbrand_agg['O_SALE_ONLINE'] / cleanbrand_agg['O_UNIT_ONLINE'].replace(0, np.nan)
        
    cleanbrand_agg = create_rate_vars(cleanbrand_agg)
    
    df_sum_stack = cleanbrand_agg.drop(columns=['UNIQUE_BRAND_NAME'], errors='ignore').groupby(['INDEX']).sum(numeric_only=True).reset_index()
    
    # Instead of pulling holiday data to merge, just assign df_sum
    df_sum = df_sum_stack.copy()
    
    # Fetch Model Name to use as directory
    model = db.query(Model).filter(Model.model_id == model_id).first()
    raw_project_name = model.model_name if model else f"model_{model_id}"
    project_name = "".join([c if c.isalnum() or c in ("-", "_") else "_" for c in raw_project_name])
    
    # Save output to project-specific directory
    project_eda_output = os.path.abspath(os.path.join(PROJECT_RAW_DATA, "..", project_name, "Stack Output"))
    os.makedirs(project_eda_output, exist_ok=True)
    
    # Extract L2 list before groupby drops it, and save as metadata
    l2_list = []
    num_brands = 0
    if 'L2' in cleanbrand_agg.columns:
        l2_list = sorted(cleanbrand_agg['L2'].dropna().astype(str).str.strip().unique().tolist())
        l2_list = [x for x in l2_list if x and x.lower() not in ('nan', '', '0')]
    
    if 'UNIQUE_BRAND_NAME' in cleanbrand_agg.columns:
        num_brands = int(cleanbrand_agg['UNIQUE_BRAND_NAME'].nunique())
    
    # Metadata is now stored in the DiscoveryStack record
    metadata_json = json.dumps({
        "l2_list": l2_list, 
        "num_brands": num_brands,
        "model_id": model_id, 
        "model_name": raw_project_name
    })
    
    # 4. Persist to DB for Discovery & Tool Review (New)
    print(f"[STACK] Persisting stack data to database for model {model_id}...")
    try:
        # Delete old discovery stacks for this model
        db.query(DiscoveryStack).filter(DiscoveryStack.model_id == model_id).delete()
        
        # A. Modeling Stack (Aggregated)
        stack_modeling = DiscoveryStack(
            model_id=model_id, 
            stack_type='modeling_stack',
            stack_metadata=metadata_json
        )
        db.add(stack_modeling)
        db.flush()
        
        # Batch insert row data for efficiency
        sum_rows = df_sum.to_dict(orient='records')
        batch_size = 500
        for i in range(0, len(sum_rows), batch_size):
            batch = sum_rows[i:i + batch_size]
            db.bulk_insert_mappings(DiscoveryStackData, [
                {
                    "stack_id": stack_modeling.stack_id, 
                    "row_data": json.dumps({
                        k: (v.strftime('%Y-%m-%d') if hasattr(v, 'strftime') else v) 
                        for k, v in row.items()
                    })
                } for row in batch
            ])
            
        # B. Brand Aggregation (Full Detail)
        stack_brand = DiscoveryStack(
            model_id=model_id, 
            stack_type='brand_agg',
            stack_metadata=metadata_json
        )
        db.add(stack_brand)
        db.flush()
        
        # We limit brand rows to keep DB size manageable, or just store all. 
        # User wants to remove files, so we store all.
        brand_rows = cleanbrand_agg.to_dict(orient='records')
        for i in range(0, len(brand_rows), batch_size):
            batch = brand_rows[i:i + batch_size]
            db.bulk_insert_mappings(DiscoveryStackData, [
                {
                    "stack_id": stack_brand.stack_id, 
                    "row_data": json.dumps({
                        k: (v.strftime('%Y-%m-%d') if hasattr(v, 'strftime') else v) 
                        for k, v in row.items()
                    })
                } for row in batch
            ])
            
        db.commit()
        print(f"[STACK] Successfully persisted {len(sum_rows)} summary rows and {len(brand_rows)} brand rows for model {model_id}.")
        
        # Trigger DB-backed Pre-Calculation of Discovery Analysis
        try:
            from .discovery import get_discovery_data
            print(f"[STACK] Triggering discovery pre-calculation for model {model_id}...")
            get_discovery_data(db, model_id, force_refresh=True)
            print(f"[STACK] Discovery pre-calculation complete for model {model_id}")
        except Exception as e:
            print(f"[WARNING] Failed to pre-calculate discovery analysis: {e}")
            import traceback
            traceback.print_exc()
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to persist stack data to database: {e}")
    
    # QA Metrics
    flag_df_include = setup['flag_df_include']
    
    for df in [df_sum, cleanbrand_agg]:
        if 'M_SEARCH_SPEND' in df.columns and 'M_ON_DIS_TOTAL_SPEND' in df.columns and 'M_OFF_DIS_TOTAL_SPEND' in df.columns:
            df['TOTAL_SPENDS'] = df['M_SEARCH_SPEND'] + df['M_ON_DIS_TOTAL_SPEND'] + df['M_OFF_DIS_TOTAL_SPEND']
        elif 'TOTAL_SPENDS' not in df.columns:
            df['TOTAL_SPENDS'] = 0

    # The Exclude Flag review "Expected Base" (part 3 - Included) is the sum
    # of the static exclude_flag data where Exclude Flag == 0.
    # We will use the exact values from the Exclude Flag dataset for our Expected Base,
    # specifically filtered down to the same COMB combinations that exist in the raw parquet.
    
    # Calculate what the parquet dataset *actually* yields for Included brands
    df_sum_o_sale = float(df_sum.get('O_SALE', pd.Series([0])).sum())
    df_sum_spends = float(cleanbrand_agg.get('TOTAL_SPENDS', pd.Series([0])).sum())

    # Calculate what the Exclude Flag data *said* it would yield for Included brands.
    # Note: flag_df_include already has EXCLUDE_FLAG == 0.
    # To be as accurate as possible, the Expected Base should use the exact sales/spend
    # values captured inside the database's Brand Exclusion analysis (the "Included" bucket).
    flag_o_sale = float(expected_sales)
    flag_spends = float(expected_spends)

    tolerance_pct = 0.05 # Increased tolerance to 5% because daily vs weekly parquet files can drift slightly in sums.

    def check_match(flag_value, df_value):
        flag_value = float(flag_value)
        df_value = float(df_value)
        diff = df_value - flag_value
        if flag_value == 0:
            return True, diff, "Zero Value Base"
        if flag_value == df_value:
            return True, diff, "Values match perfectly."
        elif abs(diff) / flag_value < tolerance_pct:
            return True, diff, "Values do not exactly match, but difference is less than 1%."
        else:
            return False, diff, "Values do not match."

    sales_match, sales_diff, sales_reason = check_match(flag_o_sale, df_sum_o_sale)
    spends_match, spends_diff, spends_reason = check_match(flag_spends, df_sum_spends)

    mismatch_amounts = {}
    if not sales_match:
        mismatch_amounts['sales'] = sales_diff
    if not spends_match:
        mismatch_amounts['spends'] = spends_diff

    resp_payload = {
        "totals_match_flag": {
            "sales_match": sales_match,
            "spends_match": spends_match
        },
        "actual_values": {
            "sales": {
                "flag_value": flag_o_sale,
                "df_value": df_sum_o_sale
            },
            "spends": {
                "flag_value": flag_spends,
                "df_value": df_sum_spends
            }
        },
        "reason": {
            "sales_reason": sales_reason,
            "spends_reason": spends_reason
        },
        "mismatch_amounts": mismatch_amounts
    }

    # Save to db so it can be fetched later
    from .service import save_analytical_result
    try:
        save_analytical_result(db, exclude_file_id, f"brand_stacks_build_{stack_type}", resp_payload)
    except Exception as e:
        print(f"[WARNING] Failed to save analytical result for stacks: {e}")

    return resp_payload
