# End-to-End API Data Flow Architecture

Below are the detailed data flow diagrams for the core APIs powering the EDA/Exclude Flags module. 

> **How to import these into Draw.io:**
> 1. Open Draw.io (app.diagrams.net).
> 2. Go to **Arrange -> Insert -> Advanced -> Mermaid...**
> 3. Copy the Mermaid code blocks below (excluding the ````mermaid` tags) and paste them into the box.
> 4. Click **Insert**. Draw.io will automatically generate the editable flowchart blocks!

---

## 1. Phase 1: Subcategory (L3) Analysis Flow

This flow triggers when the user loads the first screen to include or exclude major L3 categories.

```mermaid
sequenceDiagram
    autonumber
    participant UI as Frontend (React)
    participant API as FastAPI Router
    participant Svc as Analytics Service
    participant DB as SQLite DB
    participant FS as File Storage

    %% Load Subcategory Data
    rect rgb(240, 248, 255)
    Note over UI,FS: 1. Fetching Subcategory Data
    UI->>API: GET /api/v1/eda/exclude-analysis?model_id=123
    API->>Svc: get_exclude_analysis_data(model_id)
    Svc->>DB: Query `ModelFile` for latest raw file
    DB-->>Svc: file_id, file_path
    Svc->>FS: Load CSV/Parquet via Pandas
    FS-->>Svc: Raw DataFrame
    Svc->>DB: Query `SubcategoryRelevanceMapping`
    DB-->>Svc: User's prior included/excluded selections
    Note over Svc: Aggregate Sales/Spend per Subcategory<br/>& merge with DB selection flags
    Svc->>DB: Cache result in `AnalyticalResult`
    Svc-->>API: JSON (Aggregates + Relevant Status)
    API-->>UI: Renders Subcategory Table
    end

    %% Update Subcategory
    rect rgb(255, 240, 245)
    Note over UI,FS: 2. User Toggles Subcategory (Include/Exclude)
    UI->>API: POST /api/v1/eda/relevance (category, true/false)
    API->>Svc: update_produce_relevance()
    Svc->>DB: Insert/Update row in `SubcategoryRelevanceMapping`
    Note over Svc: Cache Invalidation Phase
    Svc->>DB: DELETE FROM `AnalyticalResult` where model_id = 123
    DB-->>Svc: Commit Success
    Svc-->>API: Success Response
    API-->>UI: UI Updates Badge Status
    end
```

---

## 2. Phase 2: Brand Exclusion Analysis Flow

This triggers after Phase 1, when the system runs the heavy NLP mapping rules to filter the actual brands within those selected subcategories.

```mermaid
sequenceDiagram
    autonumber
    participant UI as Frontend (React)
    participant API as FastAPI Router
    participant Svc as Core Engine / Services
    participant DB as SQLite DB
    participant FS as File Storage

    %% Generate Brand Analysis
    rect rgb(240, 255, 240)
    Note over UI,FS: 1. Running/Fetching Brand Exclusion Analysis
    UI->>API: GET /api/v1/files/{file_id}/brand-exclusion?model_id=123
    API->>Svc: get_brand_exclusion_data()
    Svc->>DB: Check `AnalyticalResult` for cached JSON blob
    
    alt Cache Hits
        DB-->>Svc: Cached JSON Result
        Svc-->>API: Return instantly
        API-->>UI: Renders Brand Table & Summary
    else Cache Misses (First Run or Cache Cleared)
        Svc->>FS: Load Raw DataFrame
        Svc->>DB: Fetch Included subcategories from `SubcategoryRelevanceMapping`
        Svc->>FS: Read auxiliary Excel files (PrivateBrands.xlsx, MappingIssue.xlsx)
        Note over Svc: Execute `exclude_flag_automation_function` <br/>(Fuzzy Match, NLP rules, Historical mappings)
        Svc->>DB: Persist output JSON to `AnalyticalResult` table
        Svc-->>API: JSON (Rows, Flags, and Metric Buckets)
        API-->>UI: Renders Brand Table & Summary
    end
    end

    %% Manual Updates
    rect rgb(255, 250, 205)
    Note over UI,FS: 2. User Edits Brand Flags (PB / MI / Exclude / Group)
    UI->>API: POST /api/v1/eda/brand-exclusion/update
    Note right of UI: Payload: {brand: "X", private_brand: 1}
    API->>Svc: update_brand_exclusion_result()
    Svc->>DB: Fetch existing JSON blob from `AnalyticalResult`
    Note over Svc: Find Brand "X" in JSON array,<br/>update flag, recalculate summary buckets
    Svc->>DB: UPDATE `AnalyticalResult` (Commit new JSON blob)
    Svc-->>API: Success + Refreshed Summary
    API-->>UI: Updates specific row & stat cards
    end
```

---

## 3. General Dashboard & Metadata Flow

This API suite manages the projects, uploading files, and generic tracking.

```mermaid
sequenceDiagram
    autonumber
    participant UI as Frontend (React)
    participant API as Gov Router
    participant DB as SQLite DB
    
    %% Dashboard
    rect rgb(245, 245, 245)
    Note over UI,DB: Dashboard & Model Listing
    UI->>API: GET /api/v1/models
    API->>DB: Query `Model` table (JOIN `User`)
    DB-->>API: List of Models
    API-->>UI: Display active projects
    end
    
    rect rgb(250, 240, 255)
    Note over UI,DB: Report / Pipeline Status Tracking
    UI->>API: GET /api/v1/files/latest?category=exclude_flags_raw
    API->>DB: Query `ModelFile` matching category & model_id
    DB-->>API: File Status (e.g. 'uploaded', 'in_review', 'approved')
    API-->>UI: Updates UI Action Badges
    end
```
