# Results America Database Schema (Normalized)

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Entities
    states {
        integer id PK
        text name UK
        text abbreviation UK
        integer is_active
    }
    
    categories {
        integer id PK
        text name UK
        text description
        text icon
        integer sort_order
        integer is_active
    }
    
    dataSources {
        integer id PK
        text name UK
        text description
        text url
        integer is_active
    }
    
    statistics {
        integer id PK
        text ra_number
        integer category_id FK
        integer data_source_id FK
        text name
        text description
        text sub_measure
        text calculation
        text unit
        text available_since
        integer is_active
    }
    
    importSessions {
        integer id PK
        text name
        text description
        integer data_source_id FK
        text import_date
        integer data_year
        integer record_count
        integer is_active
    }
    
    dataPoints {
        integer id PK
        integer import_session_id FK
        integer year
        integer state_id FK
        integer statistic_id FK
        real value
    }
    
    %% Relationships
    categories ||--o{ statistics : "has"
    dataSources ||--o{ statistics : "provides"
    dataSources ||--o{ importSessions : "imported_from"
    importSessions ||--o{ dataPoints : "contains"
    states ||--o{ dataPoints : "measured_in"
    statistics ||--o{ dataPoints : "measured_by"
    
    %% Notes
    %% dataPoints no longer has denormalized source or lastUpdated
    %% All source info comes via statistics → dataSources
    %% All timing info comes via importSessions
```

## Schema Benefits

### ✅ **Eliminated Denormalizations:**
- **`dataPoints.source`** → Now via `statistics → dataSources`
- **`dataPoints.lastUpdated`** → Now via `importSessions.importDate`

### ✅ **Added Data Integrity:**
- **Source Consistency** - Source changes don't break historical data
- **Import Tracking** - Complete audit trail of data imports
- **Provenance** - Know exactly when/where data came from

### ✅ **Future-Proof for Roadmap:**
- **Phase 2** - Data quality tracking via `importSessions`
- **Phase 3** - Provenance transparency via `dataSources.url`
- **Phase 4+** - All trust-building features supported

## Data Flow

```mermaid
flowchart TD
    A[External Data Source] --> B[Import Session]
    B --> C[Data Points]
    C --> D[Statistics]
    D --> E[Categories]
    D --> F[Data Sources]
    
    G[States] --> C
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#f1f8e9
    style G fill:#e0f2f1
```

## Sample Queries

### Get Data with Source Information
```sql
SELECT 
    dp.value,
    s.name as statistic_name,
    ds.name as source_name,
    ds.url as source_url,
    is.import_date,
    st.name as state_name
FROM data_points dp
JOIN statistics s ON dp.statistic_id = s.id
JOIN data_sources ds ON s.data_source_id = ds.id
JOIN import_sessions is ON dp.import_session_id = is.id
JOIN states st ON dp.state_id = st.id
WHERE dp.year = 2023;
```

### Get Import History
```sql
SELECT 
    is.name,
    is.import_date,
    is.record_count,
    ds.name as source_name
FROM import_sessions is
JOIN data_sources ds ON is.data_source_id = ds.id
ORDER BY is.import_date DESC;
``` 