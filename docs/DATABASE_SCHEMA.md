# GULA Database Schema

## Overview

GULA uses PostgreSQL for data storage. The schema supports:
- User management
- Exam storage and processing
- Time-series biomarker tracking
- Versioned scoring history

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  sex CHAR(1) NOT NULL CHECK (sex IN ('M', 'F')),
  weight DECIMAL(5,2),
  goals TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### exams

Stores exam metadata and processing status.

```sql
CREATE TABLE exams (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_url VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  health_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exams_uploaded_at ON exams(uploaded_at);
```

### biomarker_values

Stores time-series biomarker data for each exam.

```sql
CREATE TABLE biomarker_values (
  id VARCHAR(255) PRIMARY KEY,
  exam_id VARCHAR(255) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  biomarker VARCHAR(50) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('OPTIMAL', 'GOOD', 'OUT_OF_RANGE', 'CRITICAL')),
  traffic_light VARCHAR(10) NOT NULL CHECK (traffic_light IN ('GREEN', 'YELLOW', 'ORANGE', 'RED')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_biomarker_values_exam_id ON biomarker_values(exam_id);
CREATE INDEX idx_biomarker_values_biomarker ON biomarker_values(biomarker);
```

### scores

Stores versioned scoring calculations.

```sql
CREATE TABLE scores (
  id VARCHAR(255) PRIMARY KEY,
  exam_id VARCHAR(255) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  version VARCHAR(50) NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  biomarker_scores JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scores_exam_id ON scores(exam_id);
```

## Relationships

```
users (1) ──< (many) exams
exams (1) ──< (many) biomarker_values
exams (1) ──< (many) scores
```

## Notes

- All IDs are UUIDs or timestamp-based strings
- `biomarker_scores` in scores table stores JSON array of biomarker contributions
- Timestamps use UTC
- Foreign keys use CASCADE delete to maintain referential integrity
- Indexes are created on foreign keys and frequently queried columns

## Example Queries

### Get user's latest exam with all biomarkers
```sql
SELECT 
  e.*,
  json_agg(bv.*) as biomarkers,
  s.total_score
FROM exams e
LEFT JOIN biomarker_values bv ON e.id = bv.exam_id
LEFT JOIN scores s ON e.id = s.exam_id
WHERE e.user_id = $1
ORDER BY e.uploaded_at DESC
LIMIT 1;
```

### Get biomarker trend over time
```sql
SELECT 
  e.uploaded_at,
  bv.value,
  bv.status
FROM biomarker_values bv
JOIN exams e ON bv.exam_id = e.id
WHERE e.user_id = $1
  AND bv.biomarker = $2
ORDER BY e.uploaded_at ASC;
```

