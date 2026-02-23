import pandas as pd
import numpy as np
import re
import os
import json
import nltk
from nltk.corpus import stopwords
from rapidfuzz import process, fuzz
from sklearn.metrics.pairwise import cosine_similarity
from .matcher import BrandMatcher

# Ensure stopwords are available
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

stop_words = set(stopwords.words('english'))

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    words = text.split()
    words = [word for word in words if word not in stop_words]
    return ''.join(words)

def fuzzy_match(brand, choices, threshold=90):
    if not brand or not choices:
        return False
    result = process.extractOne(brand, choices, scorer=fuzz.ratio)
    if result is None:
        return False
    # rapidfuzz returns (match, score, index) or (match, score)
    score = result[1]
    return score >= threshold

def normalize_brand(text):
    return clean_text(text)

def match_brands_clean(matcher, new_df, brand_col='UNIQUE_BRAND_NAME'):
    """
    Injected method for BrandMatcher to use embeddings for historic matching.
    """
    if not matcher.loaded or matcher.historical_embeddings is None:
        return new_df

    new_embeddings = matcher.model.encode(new_df[brand_col].tolist(), show_progress_bar=False)
    sim_matrix = cosine_similarity(new_embeddings, matcher.historical_embeddings)

    if 'Combine_flag' not in new_df.columns:
        new_df['Combine_flag'] = None
    if 'comment' not in new_df.columns:
        new_df['comment'] = None

    for i, (idx, row) in enumerate(new_df.iterrows()):
        brand = row[brand_col]
        best_match_idx = sim_matrix[i].argmax()
        best_score = sim_matrix[i][best_match_idx]
        matched_brand = matcher.historical_brands[best_match_idx]
        matched_flag = matcher.historical_map.get(matched_brand, None)
        
        if best_score >= matcher.embedding_match_threshold and pd.notna(matched_flag):
            new_df.at[idx, 'Combine_flag'] = matched_flag
            new_df.at[idx, 'comment'] = f'historic match with "{matched_brand}" (score: {best_score:.2f})'
            
    return new_df

def exclude_flag_automation_function(df_aggregated, relevant_levels, private_brand_df, mapping_issue_df, combined_output_path, level="L2"):
    """
    Core logic for Exclude Flag Analysis (Phase 2).
    """
    # 1. Filter by relevant levels (Phase 1 selection)
    df_filtered = df_aggregated[df_aggregated[level].isin(relevant_levels)].copy()
    if df_filtered.empty:
        return pd.DataFrame()

    # 2. Map columns & Consolidate Spend
    cols_upper = {c.upper(): c for c in df_filtered.columns}
    
    # Check for specialized spend columns and consolidate if TOTAL_SPEND is missing
    if 'TOTAL_SPEND' not in cols_upper and ('M_SEARCH_SPEND' in cols_upper or 'M_OFF_DIS_TOTAL_SUM_SPEND' in cols_upper):
        df_filtered['TOTAL_SPEND'] = (
            df_filtered[cols_upper.get('M_SEARCH_SPEND', df_filtered.columns[0])].astype(float).fillna(0) if 'M_SEARCH_SPEND' in cols_upper else 0
        ) + (
            df_filtered[cols_upper.get('M_OFF_DIS_TOTAL_SUM_SPEND', df_filtered.columns[0])].astype(float).fillna(0) if 'M_OFF_DIS_TOTAL_SUM_SPEND' in cols_upper else 0
        ) + (
            df_filtered[cols_upper.get('M_ON_DIS_TOTAL_SUM_SPEND', df_filtered.columns[0])].astype(float).fillna(0) if 'M_ON_DIS_TOTAL_SUM_SPEND' in cols_upper else 0
        )
        cols_upper['TOTAL_SPEND'] = 'TOTAL_SPEND'

    sale_col = cols_upper.get('O_SALE') or cols_upper.get('SALES') or cols_upper.get('SUM OF O_SALE') or cols_upper.get('TOTAL SALES')
    spend_col = cols_upper.get('TOTAL_SPEND') or cols_upper.get('SPEND') or cols_upper.get('SUM OF TOTAL_SPEND')
    unit_col = cols_upper.get('O_UNIT') or cols_upper.get('UNITS') or cols_upper.get('SUM OF O_UNIT') or cols_upper.get('TOTAL UNITS')
    brand_col = cols_upper.get('UNIQUE_BRAND_NAME') or cols_upper.get('BRAND') or cols_upper.get('BRAND NAME')
    ex_flag_col = cols_upper.get('EXCLUDE_FLAG') or cols_upper.get('MAX OF EXCLUDE_FLAG')
    cm_flag_col = cols_upper.get('COMBINE_FLAG') or cols_upper.get('MAX OF COMBINE_FLAG')

    # 3. Aggregate by Brand
    agg_dict = {}
    if sale_col: agg_dict[sale_col] = 'sum'
    if spend_col: agg_dict[spend_col] = 'sum'
    if unit_col: agg_dict[unit_col] = 'sum'
    if ex_flag_col: agg_dict[ex_flag_col] = 'max'
    if cm_flag_col: agg_dict[cm_flag_col] = 'max'

    pivot = df_filtered.groupby(brand_col).agg(agg_dict).reset_index()

    # Normalize internal column names
    rename_map = {}
    if brand_col: rename_map[brand_col] = 'UNIQUE_BRAND_NAME'
    if sale_col: rename_map[sale_col] = 'Sum of O_SALE'
    if spend_col: rename_map[spend_col] = 'Sum of TOTAL_SPEND'
    if unit_col: rename_map[unit_col] = 'Sum of O_UNIT'
    if ex_flag_col: rename_map[ex_flag_col] = 'Max of Exclude_Flag'
    if cm_flag_col: rename_map[cm_flag_col] = 'Max of Combine_Flag'
    
    pivot.rename(columns=rename_map, inplace=True)

    # Ensure all expected columns exist in pivot to avoid KeyErrors
    for col in ['UNIQUE_BRAND_NAME', 'Sum of O_SALE', 'Sum of TOTAL_SPEND', 'Sum of O_UNIT', 'Max of Exclude_Flag', 'Max of Combine_Flag']:
        if col not in pivot.columns:
            pivot[col] = 0 if 'Sum' in col or 'Max' in col else ""

    # Metrics
    total_sale = pivot['Sum of O_SALE'].sum() if 'Sum of O_SALE' in pivot.columns else 0
    total_spend = pivot['Sum of TOTAL_SPEND'].sum() if 'Sum of TOTAL_SPEND' in pivot.columns else 0
    total_unit = pivot['Sum of O_UNIT'].sum() if 'Sum of O_UNIT' in pivot.columns else 0

    pivot['Sales Share'] = (pivot['Sum of O_SALE'] / total_sale * 100).round(2) if total_sale > 0 else 0
    pivot['Spend Share'] = (pivot['Sum of TOTAL_SPEND'] / total_spend * 100).round(2) if total_spend > 0 else 0
    pivot['Unit Share'] = (pivot['Sum of O_UNIT'] / total_unit * 100).round(2) if total_unit > 0 else 0

    # 4. Brand Specific Flags (Private/Mapping Issue)
    pivot['brand_cleaned'] = pivot['UNIQUE_BRAND_NAME'].apply(clean_text)
    
    # Private Brand
    if private_brand_df is not None and not private_brand_df.empty:
        pb_col = next((c for c in private_brand_df.columns if 'BRAND' in c.upper()), private_brand_df.columns[0])
        pb_list = private_brand_df[pb_col].apply(clean_text).tolist()
        pivot['Private Brand'] = pivot['brand_cleaned'].apply(lambda x: 1 if fuzzy_match(x, pb_list) else 0)
    else:
        pivot['Private Brand'] = 0

    # Mapping Issue
    if mapping_issue_df is not None and not mapping_issue_df.empty:
        mi_col = next((c for c in mapping_issue_df.columns if 'BRAND' in c.upper() or 'ISSUE' in c.upper()), mapping_issue_df.columns[0])
        mi_set = set(mapping_issue_df[mi_col].apply(clean_text).tolist())
        pivot['Mapping Issue'] = pivot['brand_cleaned'].apply(lambda x: 1 if x in mi_set else 0)
    else:
        pivot['Mapping Issue'] = 0

    # 5. Historical Matching (Combine Flags)
    config = {'model_name': 'all-MiniLM-L6-v2', 'embedding_match_threshold': 0.9, 'fuzzy_match_threshold': 90}
    matcher = BrandMatcher(config)
    if os.path.exists(combined_output_path):
        matcher.load_historical_data(combined_output_path)

    pivot['Combine_flag'] = None
    pivot['comment'] = ""
    
    valid_mask = (pivot['Private Brand'] == 0) & (pivot['Mapping Issue'] == 0)
    df_valid = pivot[valid_mask].copy()
    
    if not df_valid.empty and matcher.loaded:
        # Embedding match
        df_valid = match_brands_clean(matcher, df_valid, brand_col='UNIQUE_BRAND_NAME')
        
        # Fuzzy fallback for those not matched by embeddings
        known_map = {k: v for k, v in matcher.historical_map.items() if pd.notna(v)}
        known_cleaned = {normalize_brand(k): v for k, v in known_map.items()}
        known_labels = list(known_cleaned.keys())
        
        for idx, row in df_valid[df_valid['Combine_flag'].isna()].iterrows():
            cleaned = normalize_brand(row['UNIQUE_BRAND_NAME'])
            if not cleaned: continue
            
            res = process.extractOne(cleaned, known_labels, scorer=fuzz.ratio)
            if res and res[1] >= config['fuzzy_match_threshold']:
                df_valid.at[idx, 'Combine_flag'] = known_cleaned[res[0]]
                df_valid.at[idx, 'comment'] = f'fuzzy match (score: {res[1]:.0f})'

    # Merge results back
    pivot['Combine Flag'] = pd.NA
    pivot.loc[valid_mask, 'Combine Flag'] = df_valid['Combine_flag']
    pivot.loc[valid_mask, 'comment'] = df_valid['comment']
    
    # 5b. Refine Groups: Filter zero-sales/spend, single-brand groups, and re-number by Sales
    # First: Brands with 0 sales and 0 spend should NOT be grouped
    zero_mask = (pivot['Sum of O_SALE'] == 0) & (pivot['Sum of TOTAL_SPEND'] == 0)
    pivot.loc[zero_mask, 'Combine Flag'] = pd.NA
    # Clear comment if it was a group-match comment for zero-data brands
    pivot.loc[zero_mask & pivot['comment'].str.contains('match', case=False, na=False), 'comment'] = ""

    active_flags = pivot['Combine Flag'].dropna()
    if not active_flags.empty:
        # Group metrics to determine group size and total sales
        group_stats = pivot.groupby('Combine Flag').agg({
            'UNIQUE_BRAND_NAME': 'count',
            'Sum of O_SALE': 'sum'
        })
        
        # Only keep groups with at least 2 brands
        multi_brand_flags = group_stats[group_stats['UNIQUE_BRAND_NAME'] >= 2].index
        
        # Reset single-brand groups
        invalid_mask = (pivot['Combine Flag'].notna()) & (~pivot['Combine Flag'].isin(multi_brand_flags))
        pivot.loc[invalid_mask, 'Combine Flag'] = pd.NA
        # Clear comment if it was a group-match comment
        pivot.loc[invalid_mask & pivot['comment'].str.contains('match', case=False, na=False), 'comment'] = ""

        # Re-number remaining groups by total sales (descending) 
        # We start from 1 as requested by user
        remaining_stats = group_stats.loc[multi_brand_flags].sort_values('Sum of O_SALE', ascending=False)
        rank_map = {old_flag: i+1 for i, old_flag in enumerate(remaining_stats.index)}
        pivot['Combine Flag'] = pivot['Combine Flag'].map(rank_map)

    # Robust conversion to nullable Int64
    pivot['Combine Flag'] = pd.to_numeric(pivot['Combine Flag'], errors='coerce').astype('Int64')

    # 6. Final Exclude Logic
    pivot['Exclude Flag'] = 0
    # Condition A: Mapping Issue or Private Brand
    pivot.loc[(pivot['Mapping Issue'] == 1) | (pivot['Private Brand'] == 1), 'Exclude Flag'] = 1
    # Condition B: No Combine Flag and zero metrics
    pivot.loc[
        (pivot['Combine Flag'].isna()) & 
        ((pivot['Sum of TOTAL_SPEND'] <= 0) | (pivot['Sum of O_SALE'] <= 0) | (pivot['Sum of O_UNIT'] <= 0)),
        'Exclude Flag'
    ] = 1

    # Condition C: Negative Values thresholds
    # Mask for any negative metrics
    neg_mask = (pivot['Sum of TOTAL_SPEND'] < 0) | (pivot['Sum of O_SALE'] < 0) | (pivot['Sum of O_UNIT'] < 0)
    # Mask for large negative metrics
    large_neg_mask = (pivot['Sum of TOTAL_SPEND'] <= -100) | (pivot['Sum of O_SALE'] <= -100) | (pivot['Sum of O_UNIT'] <= -100)

    # 1. Large Negative: Exclude + Mapping Issue
    pivot.loc[large_neg_mask, 'Exclude Flag'] = 1
    pivot.loc[large_neg_mask, 'Mapping Issue'] = 1
    # Add comment, preserving existing comments if any
    pivot.loc[large_neg_mask, 'comment'] = pivot.loc[large_neg_mask, 'comment'].apply(
        lambda x: x + " | Large Negative Value (MI)" if x else "Large Negative Value (MI)"
    )

    # 2. Small Negative (negative, but not large): Exclude only
    small_neg_mask = neg_mask & ~large_neg_mask
    pivot.loc[small_neg_mask, 'Exclude Flag'] = 1
    pivot.loc[small_neg_mask, 'comment'] = pivot.loc[small_neg_mask, 'comment'].apply(
        lambda x: x + " | Small Negative Value" if x else "Small Negative Value"
    )
    
    # 7. Final Cleanup
    final_cols = [
        'UNIQUE_BRAND_NAME', 'Sum of O_SALE', 'Sum of TOTAL_SPEND', 'Sum of O_UNIT',
        'Sales Share', 'Spend Share', 'Unit Share', 'Private Brand', 'Mapping Issue',
        'Max of Exclude_Flag', 'Combine Flag', 'Exclude Flag', 'comment'
    ]
    # Convert to object type before fillna("") to avoid Int64 -> int("") errors
    return pivot[final_cols].astype(object).fillna("").sort_values('Sum of O_SALE', ascending=False)
