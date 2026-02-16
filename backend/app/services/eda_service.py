import pandas as pd
import os
import json
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "RAW_DATA" / "data_stack_aggregate_6jnTAdQteC.csv"
RELEVANCE_MAP_PATH = DATA_DIR / "Exclude Output" / "relevance_map.json"

# Ensure directory exists
RELEVANCE_MAP_PATH.parent.mkdir(parents=True, exist_ok=True)

def load_relevance_map():
    if RELEVANCE_MAP_PATH.exists():
        with open(RELEVANCE_MAP_PATH, "r") as f:
            return json.load(f)
    return {}

def save_relevance_map(data):
    with open(RELEVANCE_MAP_PATH, "w") as f:
        json.dump(data, f, indent=4)

def get_produce_category_data(group_by: str = "L2"):
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(f"Source file not found at {RAW_DATA_PATH}")

    df = pd.read_csv(RAW_DATA_PATH)
    
    # Validation
    valid_groups = ["L1", "L2", "L3"]
    if group_by not in valid_groups:
        raise ValueError(f"Invalid group_by parameter. Must be one of {valid_groups}")

    # Aggregation
    agg_dict = {
        'M_OFF_DIS_TOTAL_SUM_SPEND': 'sum',
        'M_ON_DIS_TOTAL_SUM_SPEND': 'sum',
        'M_SEARCH_SPEND': 'sum',
        'O_SALE': 'sum',
        'O_UNIT': 'sum'
    }
    
    # Group by selected column
    df_grouped = df.groupby(group_by).agg(agg_dict).reset_index()
    
    # Calculate Totals for Shares
    total_off_spend = df_grouped['M_OFF_DIS_TOTAL_SUM_SPEND'].sum()
    total_on_spend = df_grouped['M_ON_DIS_TOTAL_SUM_SPEND'].sum()
    total_search_spend = df_grouped['M_SEARCH_SPEND'].sum()
    total_sales = df_grouped['O_SALE'].sum()
    total_units = df_grouped['O_UNIT'].sum()

    # Derived Metrics
    df_grouped['AVG_PRICE'] = df_grouped['O_SALE'] / df_grouped['O_UNIT']
    df_grouped['AVG_PRICE'] = df_grouped['AVG_PRICE'].fillna(0) # Handle divide by zero

    # Calculate Shares %
    df_grouped['OFFDisplay_Spend_Share%'] = (df_grouped['M_OFF_DIS_TOTAL_SUM_SPEND'] / total_off_spend) * 100
    df_grouped['ONDisplay_Spend_Share%'] = (df_grouped['M_ON_DIS_TOTAL_SUM_SPEND'] / total_on_spend) * 100
    df_grouped['Search_Spend_Share%'] = (df_grouped['M_SEARCH_SPEND'] / total_search_spend) * 100
    df_grouped['Sales_Share%'] = (df_grouped['O_SALE'] / total_sales) * 100
    df_grouped['Unit_Share%'] = (df_grouped['O_UNIT'] / total_units) * 100

    # Relevance Logic
    relevance_map = load_relevance_map()
    
    def get_relevance(category_name):
        return relevance_map.get(str(category_name), "YES") # Default to YES

    df_grouped['Relevant'] = df_grouped[group_by].apply(get_relevance)

    # Rename columns to match target requirements closer (optional, but good for frontend mapping)
    df_grouped = df_grouped.rename(columns={
        group_by: 'Category',
        'M_OFF_DIS_TOTAL_SUM_SPEND': 'Total_OFFDisplay_Spend',
        'M_ON_DIS_TOTAL_SUM_SPEND': 'Total_ONDisplay_Spend',
        'M_SEARCH_SPEND': 'Total_Search_Spend',
        'O_SALE': 'Total_Sales',
        'O_UNIT': 'Total_Units'
    })

    # Convert to dictionary
    result = df_grouped.to_dict(orient='records')
    return result

def update_relevance(category: str, relevant: bool):
    relevance_map = load_relevance_map()
    relevance_map[category] = "YES" if relevant else "NO"
    save_relevance_map(relevance_map)
    return {"status": "success", "category": category, "relevant": "YES" if relevant else "NO"}
