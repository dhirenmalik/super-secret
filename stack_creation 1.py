#!/usr/bin/env python
# coding: utf-8

# In[1]:


import json
import pandas as pd
import os
import numpy as np


# In[2]:


project_eda_input = "../../data/Exclude Output"
project_eda_output = "../../data/Stack Output"
project_raw_data = "../../data/RAW_DATA"
flag_path = project_eda_input + "/D94 Produce_category_QA_output.xlsx"


# In[3]:


# Helper functions to convert top-level code into callable functions

def build_brand_mappings(flag_df):
    brand_name_mappings = {}
    comb_flag_mappings = {}
    global incorrect_mapping_list
    incorrect_mapping_list = ['NONE','ONLINE','UNBRANDED','0','GENERIC','NAN','NA','INCORRECT']

    if 'TOTAL_SPENDS' not in flag_df.columns:
        print("Yes going")
        flag_df['TOTAL_SPENDS'] = flag_df.get('M_SEARCH_SPEND', 0).fillna(0)  + flag_df.get('M_ON_DIS_TOTAL_SUM_SPEND', 0).fillna(0) + flag_df.get('M_OFF_DIS_TOTAL_SUM_SPEND', 0).fillna(0)

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
            top_brand = comb_flag_df['UNIQUE_BRAND_NAME'].unique()[0]
            comb_flag_mappings[i] = top_brand

        for j in comb_flag_unique_brands:
            brand_name_mappings[j] = top_brand

    return brand_name_mappings, comb_flag_mappings

def get_brand_list(flag_df_include):
    flag_df_include = flag_df_include.groupby('UNIQUE_BRAND_NAME')['O_SALE'].sum()
    return flag_df_include.index.tolist()

def run_setup(flag_path, sheet_name="9agg_exclude_flag_v1"):
    flag_df = pd.read_excel(flag_path, sheet_name)

    flag_df['TOTAL_SPENDS'] = flag_df["M_SEARCH_SPEND"] + flag_df["M_ON_DIS_TOTAL_SUM_SPEND"]+flag_df["M_OFF_DIS_TOTAL_SUM_SPEND"]
    flag_df.columns = [x.upper() for x in flag_df.columns]

    brand_name_mappings, comb_flag_mappings = build_brand_mappings(flag_df)

    flag_df['UNIQUE_BRAND_NAME'] = flag_df['UNIQUE_BRAND_NAME'].replace(brand_name_mappings.keys(), brand_name_mappings.values())
    flag_df_include =flag_df.loc[flag_df['EXCLUDE_FLAG']==0].copy()
    flag_df_include['COMB'] = flag_df_include['L1'] + flag_df_include['L2'] + flag_df_include['L3'] + flag_df_include['UNIQUE_BRAND_NAME']

    brand_list = get_brand_list(flag_df_include)


    # return all useful objects for downstream calls
    return {
        'brand_list': brand_list,
        'brand_name_mappings': brand_name_mappings,
        'comb_flag_mappings': comb_flag_mappings,
        'flag_df_include': flag_df_include,
    }

def generate_filtered_agg_brand_and_avg_brand_else(df_daily):
    df_daily.columns = [x.upper() for x in df_daily.columns]
    df_daily = df_daily.drop(df_daily[df_daily['INDEX'] == 'INDEX'].index)
    numeric_cols = df_daily.select_dtypes(include=['number']).columns

    for var in numeric_cols:
        df_daily[var] = df_daily[var].astype(float)


    # Replace NaN values in numeric columns with 0
    df_daily[df_daily.select_dtypes(include=['number']).columns] = df_daily.select_dtypes(include=['number']).fillna(0)

    df_daily['INDEX']= pd.to_datetime(df_daily['INDEX']).dt.strftime('%Y-%m-%d')
    df_daily['INDEX']= pd.to_datetime(df_daily['INDEX'])
    df_daily["UNIQUE_BRAND_NAME"] = df_daily["UNIQUE_BRAND_NAME"].astype(str)
    df_daily["UNIQUE_BRAND_NAME"] = df_daily["UNIQUE_BRAND_NAME"].str.upper()

    df_daily["M_ON_DIS_TOTAL_HPLO_SUM_IMP"]=df_daily["M_ON_DIS_HPLO_SUM_IMP"]+df_daily["M_ON_DIS_APP_HPLO_SUM_IMP"]
    df_daily["M_ON_DIS_TOTAL_HPLO_SUM_SPEND"]=df_daily["M_ON_DIS_HPLO_SUM_SPEND"]+df_daily["M_ON_DIS_APP_HPLO_SUM_SPEND"]

    rate_columns = [i for i in df_daily.columns if "RATE" in i]

    # relevance_map = setup['relevance_map']
    setup = run_setup(flag_path)
    brand_list = setup['brand_list']
    global brand_name_mappings
    brand_name_mappings = setup['brand_name_mappings']
    comb_flag_mappings = setup['comb_flag_mappings']
    flag_df_filtered = setup['flag_df_include']

    # use the mapping to replace the brand names in both dailystack and and exclude_flag_df
    df_daily['UNIQUE_BRAND_NAME'] = df_daily['UNIQUE_BRAND_NAME'].replace(brand_name_mappings)

    #3  subset the final daily data, generate the aggregated brand stack and a trimmed dailystack with subset flg and exlcude flg
    df_daily['L2'] = df_daily['L2'].astype(str)
    df_daily['L3'] = df_daily['L3'].astype(str)
    df_daily['UNIQUE_BRAND_NAME'] = df_daily['UNIQUE_BRAND_NAME'].astype(str)

    #subset the final daily data 
    df_daily['COMB'] = df_daily['L1']+df_daily['L2']+df_daily['L3']+df_daily['UNIQUE_BRAND_NAME']
    df_daily_sub = df_daily[(df_daily['UNIQUE_BRAND_NAME'].isin(brand_list)) & (df_daily['COMB'].isin(flag_df_filtered['COMB']))]
    del df_daily_sub['COMB']

    #generate the filtered aggregate brand stack 
    df_sum = df_daily_sub.groupby(['INDEX','UNIQUE_BRAND_NAME']).sum().reset_index()

    cleanbrand_agg = df_sum.copy()

    # build dictionary of original and rename
    renamed=[i.replace("SUM_","") for i in cleanbrand_agg.columns if "SUM_" in i and  i.startswith('M_')]
    original=[i for i in cleanbrand_agg.columns if "SUM_" in i]
    rename_dict = {k: v for k, v in zip(original, renamed)}

    # rename all the sum variable in data frame
    cleanbrand_agg.rename(columns=rename_dict,inplace=True)
    return (cleanbrand_agg)


# In[4]:


# Define key list if required to be used while reading raw date files to create aggregated stack
key_list = [
"INDEX",
"L0",
"L1",
"L2",
"L3",
"UNIQUE_BRAND_NAME", 
"O_SALE",
"O_UNIT",
"O_SALE_STORE",
"O_SALE_OG",
"O_SALE_DOTCOM",    
"O_SALE_ONLINE",
"O_UNIT_STORE",
"O_UNIT_OG",
"O_UNIT_DOTCOM",    
"O_UNIT_ONLINE",
"M_ON_DIS_HPLO_SUM_IMP",
"M_ON_DIS_HPLO_SUM_SPEND",
"M_ON_DIS_APP_HPLO_SUM_IMP",
"M_ON_DIS_APP_HPLO_SUM_SPEND",
"M_ON_DIS_HP_SUM_IMP",
"M_ON_DIS_HP_SUM_SPEND",
"M_ON_DIS_ROS_SUM_IMP",
"M_ON_DIS_ROS_SUM_SPEND",
"M_ON_DIS_CATTO_SUM_IMP",
"M_ON_DIS_CATTO_SUM_SPEND",
"M_ON_DIS_HPTO_SUM_IMP",
"M_ON_DIS_HPTO_SUM_SPEND",
"M_ON_DIS_HPGTO_SUM_IMP",
"M_ON_DIS_HPGTO_SUM_SPEND",
"M_ON_DIS_AT_SUM_IMP",
"M_ON_DIS_AT_SUM_SPEND",
"M_ON_DIS_KW_SUM_IMP",
"M_ON_DIS_KW_SUM_SPEND",
"M_ON_DIS_CT_SUM_IMP",
"M_ON_DIS_CT_SUM_SPEND",
"M_SP_AB_IMP",
"M_SP_AB_CLK",
"M_SP_AB_SPEND",
"M_SP_KWB_IMP",
"M_SP_KWB_CLK",
"M_SP_KWB_SPEND",
"M_SV_IMP",
"M_SV_CLK",
"M_SV_SPEND",
"M_SBA_IMP",
"M_SBA_CLK",
"M_SBA_SPEND",
"M_SEARCH_IMP",
"M_SEARCH_CLK",
"M_SEARCH_SPEND",
"M_OFF_DIS_FB_SUM_IMP",
"M_OFF_DIS_FB_SUM_SPEND",
"M_OFF_DIS_WN_WITHOUTCTV_SUM_IMP",
"M_OFF_DIS_WN_WITHOUTCTV_SUM_SPEND",
"M_OFF_DIS_DSP_CTV_SUM_IMP",
"M_OFF_DIS_DSP_CTV_SUM_SPEND",
"M_OFF_DIS_PIN_SUM_IMP",
"M_OFF_DIS_PIN_SUM_SPEND",
"M_ON_DIS_TOTAL_SUM_IMP",
"M_ON_DIS_TOTAL_SUM_SPEND",
"M_OFF_DIS_TOTAL_SUM_IMP",
"M_OFF_DIS_TOTAL_SUM_SPEND",
]


# In[5]:


csv_file_agg_brand  = os.path.join(project_eda_output,'cleanbrand_agg.csv')
df_daily = [None, None, None]
agg_brand = [None, None, None]
for i in range(0, 3):
        df_daily[i] = pd.read_parquet(os.path.join(project_raw_data, f"{i}.parquet"),
                                    columns=key_list)
        agg_brand[i] = generate_filtered_agg_brand_and_avg_brand_else(df_daily[i])
        print(i)

        if i==0:
            agg_brand[i].to_csv(csv_file_agg_brand,index = False)
        else:
            agg_brand[i].to_csv(csv_file_agg_brand, mode='a', index=False, header=False)


# In[6]:


tactics_list = ['M_SP_AB',
               'M_SP_KWB',
               'M_SBA',
               'M_SV',

               'M_ON_DIS_AT',
               'M_ON_DIS_CT',
               'M_ON_DIS_CATTO',
               'M_ON_DIS_KW',
               'M_ON_DIS_ROS',
               'M_ON_DIS_TOTAL_HPLO',
               'M_ON_DIS_HPGTO',
               'M_ON_DIS_HPTO',
               'M_ON_DIS_HP',

               'M_OFF_DIS_WN_WITHOUTCTV',
               'M_OFF_DIS_DSP_CTV',
               'M_OFF_DIS_FB',
               'M_OFF_DIS_PIN']


# In[7]:


def create_rate_vars(data):
    for var in tactics_list:
        if (var[0:4] == 'M_SP') or (var[0:5] == 'M_SBA'):
            data['RATE_'+var] = data[var+'_SPEND']/data[var+'_CLK']
        else:
            data['RATE_'+var] = data[var+'_SPEND']/data[var+'_IMP']

    return data


# In[8]:


# p = project_raw_data+"/TV_Wall.csv"

cleanbrand_agg = pd.read_csv(os.path.join(project_eda_output, "cleanbrand_agg.csv"), parse_dates=['INDEX'])

# if os.path.isfile(p):
#     cleanbrand_agg = cleanbrand_agg.merge(
#         pd.read_csv(p),
#         how='outer',
#         on=['INDEX','UNIQUE_BRAND_NAME']
#     )

econ_wmt_holiday = pd.read_csv(os.path.join(project_raw_data, "econ_wmt_holiday_data.csv"), parse_dates=['INDEX'])
cleanbrand_agg = cleanbrand_agg.drop(columns =['L0', 'L1', 'L2', 'L3'])
cleanbrand_agg= cleanbrand_agg.replace(np.nan, 0)
cleanbrand_agg['PRICE'] = cleanbrand_agg['O_SALE']/cleanbrand_agg['O_UNIT']
cleanbrand_agg['PRICE_ONLINE'] = cleanbrand_agg['O_SALE_ONLINE']/cleanbrand_agg['O_UNIT_ONLINE']
cleanbrand_agg = create_rate_vars(cleanbrand_agg)
cleanbrand_agg.to_csv(os.path.join(project_eda_output,'cleanbrand_agg.csv'),index = False)
df_sum_stack = cleanbrand_agg.drop(columns = ['UNIQUE_BRAND_NAME']).groupby(['INDEX']).sum().reset_index()
df_sum = pd.merge(df_sum_stack, econ_wmt_holiday, how = "left",sort = False, on = ["INDEX"])
df_sum.to_csv(os.path.join(project_eda_output,'aggbrand_modelingstack.csv'),index = False)


# In[9]:


flag_df = pd.read_excel(flag_path, sheet_name="9agg_exclude_flag_v1")
flag_df_include = flag_df.loc[flag_df['Exclude_Flag']==0]


# In[10]:


L0 = flag_df_include["L0"].unique()[0]
L1 = flag_df_include["L1"].unique()[0]
L2 = "PRODUCE"
model_level = "L2"

# if model_level == "L3":
#     L3 = main_config["L3_NAME"]

data = df_sum.copy()
data['STACK_TYPE'] = 'MODELING_STACK'
data['index'] = pd.to_datetime(data['INDEX'])

data['L0'] = L0
data['L1'] = L1
data['L2'] = L2

# if model_level == "L3":
#     data['L3'] = L3
#     data['SBU'] = L3
# else:

data['SBU'] = L2

updated_col = []

for col in data.columns:
    new_col = col

    if col[0:4] != 'M_SP' and col[0:4] != 'M_SV' and col[0:5] != 'M_SBA' and col[0:8] != 'M_SEARCH' and col[0:5] != 'M_WMT':

        if col[-10:] == 'SPEND_CALC':
            new_col = col.replace('_SPEND_CALC', '_SUM_SPEND_CALC')
        elif col[-5:] == 'SPEND':
            new_col = col.replace('_SPEND', '_SUM_SPEND')
        elif col[-3:] == 'IMP':
            new_col = col.replace('_IMP', '_SUM_IMP')

    updated_col.append(new_col)

data.columns = updated_col

# if model_level == "L3":
#     data.to_csv(project_eda_output + "/" + L3 + '.csv', index=False)
# else:
data.to_csv(project_eda_output + "/" + L2 + '.csv', index=False)


# ## QC part for Frontend

# In[14]:


# --- Compute TOTAL_SPENDS ---
for df in [df_sum, cleanbrand_agg]:
    df['TOTAL_SPENDS'] = df['M_SEARCH_SPEND'] + df['M_ON_DIS_TOTAL_SPEND'] + df['M_OFF_DIS_TOTAL_SPEND']

# --- Compute totals ---
totals = {
    'flag_O_SALE': flag_df_include['O_SALE'].sum(),
    'df_sum_O_SALE': df_sum['O_SALE'].sum(),
    'cleanbrand_agg_O_SALE': cleanbrand_agg['O_SALE'].sum(),
    'flag_TOTAL_SPENDS': flag_df_include['Total_Spends'].sum(),
    'df_sum_TOTAL_SPENDS': df_sum['TOTAL_SPENDS'].sum(),
    'cleanbrand_agg_TOTAL_SPENDS': cleanbrand_agg['TOTAL_SPENDS'].sum()
}

tolerance_pct = 0.01  # 1%


# --- Matching Function ---
def check_match(flag_value, df_value, tolerance=0.01):
    diff = df_value - flag_value

    if flag_value == df_value:
        return True, diff, "Values match perfectly."

    elif flag_value < df_value and abs(diff) / df_value < tolerance:
        return True, diff, "Values do not exactly match, but difference is less than 1%."

    else:
        return False, diff, "Values do not match. Please check the source files."


# --- Sales Check ---
sales_match, sales_diff, sales_reason = check_match(
    totals['flag_O_SALE'],
    totals['df_sum_O_SALE'],
    tolerance_pct
)

# --- Spends Check ---
spends_match, spends_diff, spends_reason = check_match(
    totals['flag_TOTAL_SPENDS'],
    totals['df_sum_TOTAL_SPENDS'],
    tolerance_pct
)


# --- Compute mismatch amounts ---
mismatch_amounts = {}
if not sales_match:
    mismatch_amounts['sales'] = sales_diff
if not spends_match:
    mismatch_amounts['spends'] = spends_diff


# --- Final JSON to send to frontend ---
output_json = {
    "totals_match_flag": {
        "sales_match": sales_match,
        "spends_match": spends_match
    },
    "actual_values": {
        "sales": {
            "flag_value": totals['flag_O_SALE'],
            "df_value": totals['df_sum_O_SALE']
        },
        "spends": {
            "flag_value": totals['flag_TOTAL_SPENDS'],
            "df_value": totals['df_sum_TOTAL_SPENDS']
        }
    },
    "reason": {
        "sales_reason": sales_reason,
        "spends_reason": spends_reason
    },
    "mismatch_amounts": mismatch_amounts
}

