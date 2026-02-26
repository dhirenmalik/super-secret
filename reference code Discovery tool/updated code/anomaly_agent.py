import pandas as pd
import numpy as np
import holidays
from datetime import datetime
from langchain_openai import ChatOpenAI
from langchain_experimental.agents import create_pandas_dataframe_agent
import os

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
    
    # Generate Holidays flags
    years_to_check = df['INDEX'].dt.year.unique()
    us_holidays = holidays.CountryHoliday('US', years=years_to_check)
    
    # Exclude holidays, pre-holidays, and post-holidays
    def is_holiday_range(date_val):
        d_str = date_val.strftime('%Y-%m-%d')
        pre_d_str = (date_val + pd.Timedelta(days=1)).strftime('%Y-%m-%d')
        post_d_str = (date_val - pd.Timedelta(days=1)).strftime('%Y-%m-%d')
        return d_str in us_holidays or pre_d_str in us_holidays or post_d_str in us_holidays

    df['is_holiday'] = df['INDEX'].apply(is_holiday_range)
    df = df[~df['is_holiday']]
    
    # Cleaning up columns based on prompt
    cols_to_drop = ["M_SP_AB_IMP", "M_SP_KWB_IMP", "M_SBA_IMP", "M_SV_IMP"]
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])
    
    return df

def assign_brands_to_anomalies(clean_indexed: pd.DataFrame, anomalies_df: pd.DataFrame, brand_threshold: float = 15.0) -> pd.DataFrame:
    """Deterministic brand assignment. Expects clean_indexed to already be date-indexed and sorted.
    Returns anomalies_df with Brands_list and Contribution columns added."""
    a = anomalies_df.copy()
    if a.empty or clean_indexed.empty:
        a['Brands_list'] = ''
        a['Contribution'] = ''
        return a

    a['Anomaly Date'] = pd.to_datetime(a['Anomaly Date'], errors='coerce')
    
    clean_cols = set(clean_indexed.columns)
    brands_list = []
    contributions_list = []
    
    for _, row in a.iterrows():
        tactic = row.get('Tactic_Prefix', '')
        date = row['Anomaly Date']
        if pd.isna(date):
            brands_list.append('')
            contributions_list.append('')
            continue

        # determine candidate columns
        possible_imp = [f"{tactic}_IMP", f"{tactic}_CLK"]
        imp_col = next((c for c in possible_imp if c in clean_cols), None)
        spend_col = f"{tactic}_SPEND" if f"{tactic}_SPEND" in clean_cols else None
        
        reason_lower = str(row.get('Reason', '')).lower()
        if reason_lower.startswith('high spend') and spend_col:
            metric_col = spend_col
        elif imp_col:
            metric_col = imp_col
        elif spend_col:
            metric_col = spend_col
        else:
            brands_list.append('')
            contributions_list.append('')
            continue

        # O(1) index lookup
        ts = pd.Timestamp(date.date())
        try:
            day_df = clean_indexed.loc[[ts]]
        except KeyError:
            brands_list.append('')
            contributions_list.append('')
            continue

        if day_df.empty or metric_col not in day_df.columns:
            brands_list.append('')
            contributions_list.append('')
            continue

        brand_sums = day_df.groupby('UNIQUE_BRAND_NAME')[metric_col].sum()
        total = brand_sums.sum()
        if total <= 0:
            brands_list.append('')
            contributions_list.append('')
            continue

        contrib = (brand_sums / total * 100).sort_values(ascending=False)
        selected = contrib[contrib >= brand_threshold]
        if selected.empty:
            selected = contrib.head(3)

        brands_list.append(', '.join(selected.index.astype(str)))
        contributions_list.append(', '.join([f"{v:.1f}%" for v in selected.values]))

    a['Brands_list'] = brands_list
    a['Contribution'] = contributions_list
    return a

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

        # -----------------------------
        # Z Above Threshold (Extreme Only)
        # -----------------------------
        # Ensure threshold is meaningfully large (at least the 95th Percentile) to prevent 
        # micro-variance spam on sparsely active dates.
        spend_threshold = max(s_median + (4 * s_std), s_95)
        imp_threshold = max(i_median + (4 * i_std), i_95)
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

        # Standard median-centered Z-scores for co-spike detection
        sub_df['Z_Spend'] = (sub_df['Spend'] - s_median) / s_std
        sub_df['Z_Imp'] = (sub_df['Impressions'] - i_median) / i_std

        tactic_z_sum = 0
        anomaly_count = 0

        # =====================================================
        # OUTPUTFILE 1 – Single Metric Anomalies
        # =====================================================
        for _, row in sub_df.iterrows():

            reason = None
            z_val = row['Row_Severity']

            if row['Spend'] > spend_threshold and row['Impressions'] <= i_5:
                reason = "Spend spike only"

            elif row['Impressions'] > imp_threshold and row['Spend'] <= s_5:
                reason = "Impression spike only"

            elif row['Spend'] > spend_threshold:
                reason = "High Spend spike"

            elif row['Impressions'] > imp_threshold:
                reason = "High Impression spike"

            if reason:
                anomaly_count = anomaly_count + 1
                tactic_z_sum = tactic_z_sum + float(z_val)

                anomaly_records.append({
                    'Tactic_Prefix': tactic_prefix,
                    'Anomaly Date': row['INDEX'].strftime('%Y-%m-%d'),
                    'Reason': reason,
                    'Priority': z_val,
                    'Impressions': round(row['Impressions'], 1),
                    'Spend': round(row['Spend'], 1),
                    'CPM': round(row['Spend'] / row['Impressions'], 1)
                           if row['Impressions'] > 0 else 0,
                    'Z': round(z_val, 2),
                    'SourceFile': 'SingleMetrics'
                })

        # =====================================================
        # OUTPUTFILE 2 – No Spend (only if impressions are extreme)
        # =====================================================
        no_spend_df = sub_df[
            (sub_df['Spend'] == 0) &
            (sub_df['Impressions'] > i_95)  # Only flag if impressions are above the 95th percentile
        ]

        for _, row in no_spend_df.iterrows():

            anomaly_count = anomaly_count + 1
            no_spend_severity = np.log1p(row['Impressions'])
            tactic_z_sum = tactic_z_sum + float(no_spend_severity)

            anomaly_records.append({
                'Tactic_Prefix': tactic_prefix,
                'Anomaly Date': row['INDEX'].strftime('%Y-%m-%d'),
                'Reason': "No Spend with added value Impressions",
                'Priority': row['Impressions'],
                'Impressions': round(row['Impressions'], 1),
                'Spend': 0,
                'CPM': 0,
                'Z': 0,
                'SourceFile': 'NoSpend'
            })

        # =====================================================
        # OUTPUTFILE 3 – CPM Anomalies
        # =====================================================
        valid_df = sub_df[
            (sub_df['Spend'] > 0) &
            (sub_df['Impressions'] > 0)
        ].copy()

        if not valid_df.empty:

            valid_df['CPM'] = valid_df['Spend'] / valid_df['Impressions']
            cpm_med = valid_df['CPM'].median()
            cpm_std = valid_df['CPM'].std() or 1
            valid_df['Z_CPM'] = (valid_df['CPM'] - cpm_med) / cpm_std

            for _, row in valid_df.iterrows():

                reason = None

                if row['Z_CPM'] >= 4:
                    reason = "High Spend, Low IMP"

                elif row['Z_CPM'] <= -4:
                    reason = "High IMP, Low Spend"

                if reason:
                    anomaly_count = anomaly_count + 1
                    cpm_severity = abs(row['Z_CPM'])
                    tactic_z_sum = tactic_z_sum + float(cpm_severity)

                    anomaly_records.append({
                        'Tactic_Prefix': tactic_prefix,
                        'Anomaly Date': row['INDEX'].strftime('%Y-%m-%d'),
                        'Reason': reason,
                        'Priority': abs(row['Z_CPM']),
                        'Impressions': round(row['Impressions'], 1),
                        'Spend': round(row['Spend'], 1),
                        'CPM': round(row['CPM'], 1),
                        'Z': round(row['Z_CPM'], 2),
                        'SourceFile': 'CPM_anomalies'
                    })

        # =====================================================
        # OUTPUTFILE 4 – Co-Spikes
        # =====================================================
        if not valid_df.empty:

            for _, row in valid_df.iterrows():

                reason = None
                z_avg = (row['Z_Spend'] + row['Z_Imp']) / 2

                if row['Z_Spend'] >= 4 and row['Z_Imp'] >= 4:
                    reason = "Spike in Spend & IMP"

                elif row['Z_Spend'] <= -4 and row['Z_Imp'] <= -4:
                    reason = "Drop in IMP & Spend"

                if reason:
                    anomaly_count = anomaly_count + 1
                    co_spike_severity = abs(z_avg)
                    tactic_z_sum = tactic_z_sum + float(co_spike_severity)

                    anomaly_records.append({
                        'Tactic_Prefix': tactic_prefix,
                        'Anomaly Date': row['INDEX'].strftime('%Y-%m-%d'),
                        'Reason': reason,
                        'Priority': abs(z_avg),
                        'Impressions': round(row['Impressions'], 1),
                        'Spend': round(row['Spend'], 1),
                        'CPM': round(row['CPM'], 1),
                        'Z': round(z_avg, 2),
                        'Anomaly_Type': 'Co-Spike'
                    })

        # =====================================================
        # FINAL TACTIC-LEVEL SEVERITY
        # =====================================================
        if anomaly_count > 0:

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

    # Deduplicate: keep only the highest-priority anomaly per (Tactic, Date)
    results_df['Priority'] = pd.to_numeric(results_df['Priority'], errors='coerce').fillna(0)
    results_df = (
        results_df
        .sort_values('Priority', ascending=False)
        .drop_duplicates(subset=['Tactic_Prefix', 'Anomaly Date'], keep='first')
        .reset_index(drop=True)
    )

    severity_df = pd.DataFrame(tactic_severity_tracker)

    if not severity_df.empty:

        severity_df = severity_df.sort_values(
            'Severity_Score',
            ascending=False
        )

        severity_df['Tactic_Rank'] = (
            severity_df['Severity_Score']
            .rank(method='dense', ascending=False)
            .astype(int)
        )
        # -------------------------------------------------
        # Severity Banding (Percentile-Based)
        # -------------------------------------------------

        p40 = severity_df['Severity_Score'].quantile(0.40)
        p70 = severity_df['Severity_Score'].quantile(0.70)
        p90 = severity_df['Severity_Score'].quantile(0.90)

        def assign_band(score):
            if score >= p90:
                return "Critical"
            elif score >= p70:
                return "High"
            elif score >= p40:
                return "Medium"
            else:
                return "Low"

        # Changed to map properly to frontend
        severity_df['Severity_Band'] = severity_df['Severity_Score'].apply(assign_band)
        results_df = results_df.merge(
                    severity_df[['Tactic_Prefix', 'Tactic_Rank', 'Severity_Score', 'Severity_Band']],
                    on='Tactic_Prefix',
                    how='left')
                    
        # Add Individual Rank to results_df inside tactics
        results_df['Anomaly_Rank'] = results_df.groupby('Tactic_Prefix')['Priority'].rank(ascending=False, method='min').astype(int)

    return results_df


def summarize_observations_llm(final_anomalies_df: pd.DataFrame) -> str:
    """Pre-aggregates the anomaly ranges natively and uses an LLM to generate conversational observations."""
    if final_anomalies_df.empty:
        return "No specific anomalies identified within the current dataset."
        
    # Natively pre-group consecutive dates to avoid Context Limit and Agent Laziness
    grouped_data = []
    
    try:
        # Sort and identify consecutive runs natively
        df = final_anomalies_df.copy()
        df['Anomaly Date'] = pd.to_datetime(df['Anomaly Date'])
        df = df.sort_values(by=['Tactic_Prefix', 'Reason', 'Anomaly Date'])
        
        for (tactic, reason), group in df.groupby(['Tactic_Prefix', 'Reason']):
            group['Date_Diff'] = group['Anomaly Date'].diff().dt.days
            
            # Start a new block if gap is > 45 days
            group['Block'] = (group['Date_Diff'] > 45).cumsum()
            
            for block_id, block_df in group.groupby('Block'):
                start_dt = block_df['Anomaly Date'].min().strftime('%b %Y')
                end_dt = block_df['Anomaly Date'].max().strftime('%b %Y')
                date_range = start_dt if start_dt == end_dt else f"{start_dt} to {end_dt}"
                grouped_data.append({
                    'Tactic': tactic,
                    'Reason': reason,
                    'Date_Range': date_range,
                    'Duration_Days': (block_df['Anomaly Date'].max() - block_df['Anomaly Date'].min()).days + 1
                })
                
        # Take the top 3 longest duration blocks per tactic
        summary_df = pd.DataFrame(grouped_data)
        summary_df = summary_df.sort_values(by=['Tactic', 'Duration_Days'], ascending=[True, False])
        summary_df = summary_df.groupby('Tactic').head(3)
        condensed_csv = summary_df.to_csv(index=False)
        
    except Exception as parse_ex:
        print(f"Native grouping failed: {parse_ex}")
        condensed_csv = final_anomalies_df.head(50).to_csv(index=False)
        
    from langchain_core.prompts import PromptTemplate
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    prompt_template = PromptTemplate.from_template("""
You are a senior Data Scientist analyzing Walmart Media macro-level metrics for anomaly identification. 
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
        response = chain.invoke({"csv_data": condensed_csv})
        return response.content
    except Exception as e:
        print(f"Error calling LLM Formatter: {e}")
        import traceback
        traceback.print_exc()
        return f"Insight generation failed during LLM formatting call. Error: {str(e)}"