from app.core.database import SessionLocal
from app.modules.governance.models import Model
from app.modules.analytics.models import SubcategoryRelevanceMapping

db = SessionLocal()
model = db.query(Model).filter(Model.model_name.ilike('%vg software%')).first()
if model:
    print(f"Testing model_id: {model.model_id}, model_name: {model.model_name}")
    mappings = db.query(SubcategoryRelevanceMapping).filter(
        SubcategoryRelevanceMapping.model_id == model.model_id,
    ).all()
    print(f"Mappings found: {len(mappings)}")
    for m in mappings:
        print(f" - {m.subcategory} (relevant: {m.is_relevant})")
else:
    print("No models found")
