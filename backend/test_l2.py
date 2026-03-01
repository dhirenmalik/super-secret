import pandas as pd
df = pd.read_csv('/Users/abhizirange/walmart_git/super-secret/data/vg_software/raw_data/data_stack_aggregate_REqnVkGHdb 1.csv')
print("L2:", df['L2'].unique().tolist() if 'L2' in df.columns else "No L2")
print("L3:", df['L3'].unique().tolist() if 'L3' in df.columns else "No L3")
