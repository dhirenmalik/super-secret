import os
import sqlite3
from pathlib import Path

# Resolve paths
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "sql_app.db"
DATA_DIR = BASE_DIR.parent / "data"
UPLOADS_DIR = BASE_DIR.parent / "uploads"

TABLES_TO_CLEAR = [
    "discovery_stacks",
    "discovery_stack_data",
    "discovery_analysis_cache",
    "analytical_results",
    "stacks",
    "eda_results",
    "subcategory_analysis",
    "model_groups",
    "model_group_l2_mappings",
    "subcategory_relevance_mappings",
    "model_files",
    "report_comments",
    "model_stage_approvals",
    "model_assignments",
    "models",
    "notifications",
    "raw_data_files",
    "chart_selections"
]

def reset_db():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        return

    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for table in TABLES_TO_CLEAR:
        try:
            print(f"Clearing table: {table}")
            cursor.execute(f"DELETE FROM {table}")
        except sqlite3.OperationalError as e:
            print(f"Warning: Could not clear table {table}: {e}")

    conn.commit()
    print("Deletions committed. Vacuuming database to reclaim space...")
    cursor.execute("VACUUM")
    print("Database vacuumed.")
    
    conn.close()
    print("Database reset complete.")

def clear_directories():
    for target_dir in [DATA_DIR, UPLOADS_DIR]:
        if target_dir.exists() and target_dir.is_dir():
            print(f"Clearing directory: {target_dir}")
            for item in target_dir.iterdir():
                if item.name == ".gitkeep" or item.name == ".DS_Store":
                    continue
                try:
                    if item.is_file():
                        item.unlink()
                        print(f"  Deleted file: {item.name}")
                    elif item.is_dir():
                        import shutil
                        shutil.rmtree(item)
                        print(f"  Deleted directory: {item.name}")
                except Exception as e:
                    print(f"  Error deleting {item.name}: {e}")
        else:
            print(f"Directory not found: {target_dir}")

if __name__ == "__main__":
    confirm = input("Are you sure you want to delete ALL modeling data? (y/N): ")
    if confirm.lower() == 'y':
        reset_db()
        clear_directories()
        print("\nSystem successfully reset to zero stage.")
    else:
        print("Reset aborted.")
