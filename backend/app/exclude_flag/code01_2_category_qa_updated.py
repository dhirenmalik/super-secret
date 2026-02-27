"""Converted logic from code01_2_Category_QAandSubcat_Updated.ipynb."""

from __future__ import annotations

from typing import Dict, Iterable, List

import numpy as np
import pandas as pd

ADV_EXCLUSION_LIST = [
    "N A",
    "NA",
    "(blank)",
    "NULL",
    "0",
    "NULLVALUE",
    "WALMART",
    "WALMART COM",
    "JET",
    "JET COM",
    "JET.COM",
    "UNKNOWN",
    "PRODUCE UNBRANDED",
    "UNBRAND",
    "JETCOM INC",
    0,
    "ONLINE",
]


def _safe_numeric(df: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    for col in columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


def normalize_aggregate_df(raw_df: pd.DataFrame) -> pd.DataFrame:
    df_agg = raw_df.fillna(0).copy()
    df_agg.columns = [str(c).upper() for c in df_agg.columns]

    for col in ["UNIQUE_BRAND_NAME", "UNIQUE_ADV_NAME", "L2", "L3"]:
        df_agg[col] = df_agg[col].astype(str).str.upper()

    numeric_cols = [
        "M_ON_DIS_TOTAL_SUM_SPEND",
        "M_OFF_DIS_TOTAL_SUM_SPEND",
        "M_SEARCH_SPEND",
        "M_TOTAL_DISPLAY_SUM_SPEND",
        "O_SALE",
        "O_UNIT",
    ]
    df_agg = _safe_numeric(df_agg, numeric_cols)

    br_adv_ls: Dict[str, str] = {}
    for i in range(len(df_agg)):
        brand = df_agg.iloc[i]["UNIQUE_BRAND_NAME"]
        adv = df_agg.iloc[i]["UNIQUE_ADV_NAME"]
        if brand not in br_adv_ls and adv not in {"N/A", "0"}:
            br_adv_ls[brand] = adv

    for i in range(len(df_agg)):
        brand = df_agg.iloc[i]["UNIQUE_BRAND_NAME"]
        adv = df_agg.iloc[i]["UNIQUE_ADV_NAME"]
        if brand not in br_adv_ls and adv != "N/A":
            br_adv_ls[brand] = adv

    for i in range(len(df_agg)):
        brand = df_agg.iloc[i]["UNIQUE_BRAND_NAME"]
        adv = df_agg.iloc[i]["UNIQUE_ADV_NAME"]
        if brand not in br_adv_ls:
            br_adv_ls[brand] = adv

    br_adv_df = pd.DataFrame(br_adv_ls.items(), columns=["UNIQUE_BRAND_NAME", "UNIQUE_ADV_NAME"])
    df_agg = df_agg.drop("UNIQUE_ADV_NAME", axis=1).merge(br_adv_df, how="left", on="UNIQUE_BRAND_NAME")

    group_cols = ["UNIQUE_ADV_NAME", "L0", "L1", "L2", "L3", "UNIQUE_BRAND_NAME"]
    df_agg = df_agg.groupby(group_cols).sum(numeric_only=True).reset_index()
    df_agg["TOTAL_SPEND"] = (
        df_agg["M_ON_DIS_TOTAL_SUM_SPEND"]
        + df_agg["M_OFF_DIS_TOTAL_SUM_SPEND"]
        + df_agg["M_SEARCH_SPEND"]
    )

    return df_agg[
        (df_agg["O_SALE"] != 0) | (df_agg["TOTAL_SPEND"] != 0) | (df_agg["O_UNIT"] != 0)
    ].reset_index(drop=True)


def build_sub_dis_candidates(df_agg: pd.DataFrame) -> pd.DataFrame:
    sub_sum = (
        df_agg.pivot_table(
            index="L2",
            values=[
                "M_ON_DIS_TOTAL_SUM_SPEND",
                "M_OFF_DIS_TOTAL_SUM_SPEND",
                "M_SEARCH_SPEND",
                "O_SALE",
                "O_UNIT",
            ],
            aggfunc="sum",
            dropna=False,
        )
        .sort_values("O_SALE", ascending=False)
        .reset_index()
    )
    sub_sum["AVG_PRICE"] = (sub_sum["O_SALE"] / sub_sum["O_UNIT"].replace(0, np.nan)).fillna(0).round(2)

    sub_percent = (
        df_agg.pivot_table(
            index="L2",
            values=[
                "M_ON_DIS_TOTAL_SUM_SPEND",
                "M_OFF_DIS_TOTAL_SUM_SPEND",
                "M_SEARCH_SPEND",
                "O_SALE",
                "O_UNIT",
            ],
            aggfunc="sum",
            dropna=False,
        )
        .apply(lambda x: (x / x.sum()) * 100 if x.sum() else 0)
        .sort_values("O_SALE", ascending=False)
        .reset_index()
    )
    sub_percent = sub_percent.rename(columns={c: f"{c}_PCT" for c in sub_percent.columns if c != "L2"})

    sub_dis = pd.merge(sub_sum, sub_percent, how="outer", on="L2")
    sub_dis["Relevant"] = "NO"
    sub_dis.loc[sub_dis["O_SALE_PCT"] >= 1, "Relevant"] = "YES"
    sub_dis.loc[sub_dis["M_ON_DIS_TOTAL_SUM_SPEND_PCT"] >= 1, "Relevant"] = "YES"
    sub_dis.loc[sub_dis["M_OFF_DIS_TOTAL_SUM_SPEND_PCT"] >= 1, "Relevant"] = "YES"
    sub_dis.loc[sub_dis["M_SEARCH_SPEND_PCT"] >= 1, "Relevant"] = "YES"

    sub_dis = sub_dis.rename(
        columns={
            "M_SEARCH_SPEND_PCT": "Search_Spend_Share%",
            "M_ON_DIS_TOTAL_SUM_SPEND_PCT": "ONDisplay_Spend_Share%",
            "M_OFF_DIS_TOTAL_SUM_SPEND_PCT": "OFFDisplay_Spend_Share%",
            "O_SALE_PCT": "Sales_Share%",
            "O_UNIT_PCT": "Unit_Share%",
            "M_OFF_DIS_TOTAL_SUM_SPEND": "Total_OFFDisplay_Spend",
            "M_ON_DIS_TOTAL_SUM_SPEND": "Total_ONDisplay_Spend",
            "M_SEARCH_SPEND": "Total_Search_Spend",
            "O_SALE": "Total_Sales",
            "O_UNIT": "Total_Units",
        }
    )
    return sub_dis.fillna(0)


def exclude_combine_flags(
    aggregate_data: pd.DataFrame,
    private_brand_list: List[str],
    adv_exclusion_list: List[str] | None = None,
) -> pd.DataFrame:
    if adv_exclusion_list is None:
        adv_exclusion_list = ADV_EXCLUSION_LIST

    df_brand_adv_agg = aggregate_data.groupby(["UNIQUE_ADV_NAME", "UNIQUE_BRAND_NAME"], as_index=False).sum(
        numeric_only=True
    )
    df_brand_agg_sum = df_brand_adv_agg.groupby("UNIQUE_BRAND_NAME", as_index=False).sum(numeric_only=True)
    df_brand_agg_count = (
        df_brand_adv_agg[["UNIQUE_ADV_NAME", "UNIQUE_BRAND_NAME"]]
        .groupby("UNIQUE_BRAND_NAME", as_index=False)
        .count()
        .rename(columns={"UNIQUE_ADV_NAME": "UNIQUE_ADV_COUNT"})
    )
    df_brand_agg = pd.merge(
        df_brand_agg_sum,
        df_brand_agg_count,
        how="left",
        on="UNIQUE_BRAND_NAME",
        sort=False,
    )

    df_brand_agg["Total_Spend"] = df_brand_agg["M_SEARCH_SPEND"] + df_brand_agg["M_TOTAL_DISPLAY_SUM_SPEND"]
    df_brand_agg["Spends_Sales_Ratio"] = df_brand_agg["Total_Spend"] / df_brand_agg["O_SALE"].replace(0, np.nan)
    df_brand_agg["Spends_Sales_Ratio"] = (
        df_brand_agg["Spends_Sales_Ratio"].replace([np.inf, -np.inf], np.inf).fillna(np.inf)
    )
    df_brand_agg["Exclude_Flag"] = 0
    df_brand_agg.loc[df_brand_agg["UNIQUE_ADV_COUNT"] > 1, "Exclude_Flag"] = 1
    df_brand_agg.loc[(df_brand_agg["O_SALE"] == 0) & (df_brand_agg["Total_Spend"] == 0), "Exclude_Flag"] = 1
    df_brand_agg.loc[
        (df_brand_agg["Spends_Sales_Ratio"] == 0) | (df_brand_agg["Spends_Sales_Ratio"] == np.inf),
        "Exclude_Flag",
    ] = 1
    df_brand_agg.loc[df_brand_agg["Spends_Sales_Ratio"] > 15, "Exclude_Flag"] = 1

    # Combine_Flag is generated by notebook 2 / pivot automation.
    df_brand_agg["Combine_Flag"] = np.nan
    normalized_private = {str(name).upper() for name in private_brand_list}
    df_brand_agg.loc[df_brand_agg["UNIQUE_BRAND_NAME"].astype(str).str.upper().isin(normalized_private), "Exclude_Flag"] = 1

    df_brand_adv_agg = pd.merge(
        df_brand_adv_agg,
        df_brand_agg[["UNIQUE_BRAND_NAME", "Spends_Sales_Ratio", "Exclude_Flag", "Combine_Flag"]],
        how="left",
        on="UNIQUE_BRAND_NAME",
        sort=False,
    )
    df_brand_adv_agg.loc[df_brand_adv_agg["UNIQUE_ADV_NAME"].isin(adv_exclusion_list), "Exclude_Flag"] = 1
    df_brand_adv_agg["Spend_Brand"] = df_brand_adv_agg["M_SEARCH_SPEND"] + df_brand_adv_agg["M_TOTAL_DISPLAY_SUM_SPEND"]
    return df_brand_adv_agg


def build_final_flag_df(
    aggregate_df: pd.DataFrame,
    relevant_subcats: List[str],
    private_brand_list: List[str],
    adv_exclusion_list: List[str] | None = None,
) -> pd.DataFrame:
    relevant_subcats_upper = {str(value).upper() for value in relevant_subcats}
    relevantsub = aggregate_df.loc[aggregate_df["L2"].isin(relevant_subcats_upper), :].copy()
    irrelevantsub = aggregate_df.loc[~aggregate_df["L2"].isin(relevant_subcats_upper), :].copy()

    if not relevantsub.empty:
        relevant_flag = exclude_combine_flags(relevantsub, private_brand_list, adv_exclusion_list)
        relevantsub = pd.merge(
            relevantsub,
            relevant_flag[
                [
                    "UNIQUE_ADV_NAME",
                    "UNIQUE_BRAND_NAME",
                    "Spend_Brand",
                    "Spends_Sales_Ratio",
                    "Exclude_Flag",
                    "Combine_Flag",
                ]
            ],
            how="left",
            on=["UNIQUE_ADV_NAME", "UNIQUE_BRAND_NAME"],
            sort=False,
        )
    else:
        relevantsub["Spend_Brand"] = 0
        relevantsub["Spends_Sales_Ratio"] = np.inf
        relevantsub["Exclude_Flag"] = 1
        relevantsub["Combine_Flag"] = np.nan

    irrelevantsub["Exclude_Flag"] = 1
    irrelevantsub["Spend_Brand"] = irrelevantsub["M_SEARCH_SPEND"] + irrelevantsub["M_TOTAL_DISPLAY_SUM_SPEND"]
    irrelevantsub["Spends_Sales_Ratio"] = np.where(
        irrelevantsub["O_SALE"] == 0,
        np.inf,
        irrelevantsub["Spend_Brand"] / irrelevantsub["O_SALE"],
    )
    irrelevantsub["Combine_Flag"] = np.nan

    flag_df = pd.concat([relevantsub, irrelevantsub], axis=0)
    flag_df["Total_Spends"] = flag_df["M_SEARCH_SPEND"] + flag_df["M_TOTAL_DISPLAY_SUM_SPEND"]
    return flag_df.reset_index(drop=True)


def build_inclusion_summary(
    df_agg: pd.DataFrame,
    df_agg_flag: pd.DataFrame,
    relevant_subcats: List[str],
) -> Dict[str, float | int | List[str]]:
    relevant_subcats_upper = {str(value).upper() for value in relevant_subcats}
    df_agg_revsub = df_agg.loc[df_agg["L2"].isin(relevant_subcats_upper), :].copy()
    total_sales_rel = float(df_agg_revsub["O_SALE"].sum())
    total_spend_rel = float((df_agg_revsub["M_SEARCH_SPEND"] + df_agg_revsub["M_TOTAL_DISPLAY_SUM_SPEND"]).sum())

    included = df_agg_flag.loc[df_agg_flag["Exclude_Flag"] == 0]
    included_sales = float(included["O_SALE"].sum())
    included_spend = float((included["M_SEARCH_SPEND"] + included["M_TOTAL_DISPLAY_SUM_SPEND"]).sum())

    return {
        "Included_subcategory": sorted(df_agg_revsub["L2"].astype(str).str.upper().unique().tolist()),
        "Total_sales_relevantsub": total_sales_rel,
        "Total_unit_relevantsub": float(df_agg_revsub["O_UNIT"].sum()),
        "Total_spend_relevantsub": total_spend_rel,
        "Total_Sales_included": included_sales,
        "Total_Units_included": float(included["O_UNIT"].sum()),
        "Total_Spend_included": included_spend,
        "Sales_Coverage": (included_sales / total_sales_rel) if total_sales_rel else 0,
        "Spend_Coverage": (included_spend / total_spend_rel) if total_spend_rel else 0,
        "Included_Spend_Sales_Ratio": (included_spend / included_sales) if included_sales else 0,
        "Num_UniqueBrand_included": int(included["UNIQUE_BRAND_NAME"].nunique()),
    }

