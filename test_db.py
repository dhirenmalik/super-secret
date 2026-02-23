import sys
sys.path.append('.')
from backend.app.database import engine
import pandas as pd
df = pd.read_sql("SELECT file_id, filename, category, status FROM model_files", engine)
print(df.to_string())
