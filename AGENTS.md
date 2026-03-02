# FPL Optimizer - Agent Guidelines

This document provides guidelines for agents working on the FPL Optimizer project.

## Project Structure

```
FPL-TEAM/
├── package.json              # Root with concurrently for dev
├── backend/                  # FastAPI Python backend
│   ├── requirements.txt      # Python dependencies
│   └── app/
│       ├── main.py          # FastAPI app entry point
│       ├── api/routes.py    # API endpoints
│       ├── models/schemas.py # Pydantic models
│       └── services/
│           ├── fpl_client.py   # FPL API client
│           ├── predictor.py    # XGBoost ML model
│           └── optimizer.py    # PuLP LP solver
└── frontend/                # Next.js TypeScript frontend
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── page.tsx     # Main UI
        │   └── layout.tsx
        └── lib/types.ts    # TypeScript interfaces
```

## Commands

### Development
```bash
# Start both backend and frontend (recommended)
npm run dev

# Start individually
npm run dev:backend  # FastAPI on port 8000
npm run dev:frontend # Next.js on port 3000
npm run build        # Build frontend production
```

### Python Backend
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run (with auto-reload)
python -m uvicorn app.main:app --reload --port 8000

# Run single test
python -m pytest tests/test_file.py::test_name -v

# Run all tests
python -m pytest

# Type checking (optional)
mypy app/
```

### TypeScript Frontend
```bash
cd frontend

# Install dependencies
npm install

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Run single test
npx vitest run tests/file.test.ts
```

## Code Style

### Python (FastAPI)

**Imports**: Standard library first, then third-party, then local
```python
# stdlib
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

# third-party
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pulp import LpProblem, LpMaximize, LpVariable

# local
from app.api.routes import router
from app.models.schemas import SquadPlayer
from app.services.predictor import PointPredictor
```

**Naming**:
- Classes: `PascalCase` (e.g., `TransferOptimizer`)
- Functions/methods: `snake_case` (e.g., `predict_player_gw_points`)
- Variables: `snake_case` (e.g., `team_value`, `player_predictions`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `POSITION_COUNTS`)

**Type Annotations**: Always use type hints for function parameters and return values
```python
def optimize(self) -> Dict[str, Any]:
    # ...

def _get_player_value(self, player_id: int, gw: int = 1) -> float:
```

**Error Handling**: Use try/except with logging, re-raise HTTPException for API errors
```python
try:
    data = await fpl_client.get_bootstrap_static()
except Exception as e:
    logger.error(f"Error fetching bootstrap data: {e}")
    raise HTTPException(status_code=500, detail=str(e))
```

**Data Conversion**: FPL API returns mixed types - use safe conversion functions
```python
def safe_float(val, default=0.0):
    """Convert FPL API value to float, handling string/int mixed types."""
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default
```

### TypeScript/React

**Imports**: External first, then internal/path aliases
```typescript
// external
import { useState, useEffect } from 'react';
import axios from 'axios';

// internal (path aliases)
import { OptimizeResponse, SquadPlayer } from '@/lib/types';
import Pitch from '@/components/Pitch';
```

**Naming**:
- Components: `PascalCase` (e.g., `Home`, `Pitch`)
- Functions/Variables: `camelCase` (e.g., `handleOptimize`, `teamUrl`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE`, `POSITION_LABELS`)
- File names: `kebab-case.ts` or `PascalCase.tsx`

**Types**: Always define interfaces for API responses and props
```typescript
export interface SquadPlayer {
  id: number;
  web_name: string;
  element_type: number;
  team: number;
  price: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  bench_order: number;
}
```

**Component Structure**: Use 'use client' for client-side components, organize hooks at top
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  // hooks first, then handlers, then render
}
```

**Error Handling**: Display errors to users, log to console
```typescript
try {
  const response = await api.post('/optimize', request);
  setResult(response.data);
} catch (err: any) {
  console.error('[Optimize] Error:', err);
  const errorMessage = err.response?.data?.detail || err.message;
  setError(errorMessage);
}
```

## Known Issues

1. **FPL API Type Errors**: Numeric fields may return as strings. Always use `safe_float()` when processing API data.
2. **PuLP Complexity**: Avoid non-linear constraints (e.g., `max(0, x - y)`). Keep LP model simple.
3. **Rate Limiting**: FPL API limits requests to ~1/second. Use caching and semaphores.
4. **Bench Empty**: The optimizer returns 11 starters but bench array may be empty. Check position assignment logic.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/bootstrap` | All player/team data |
| GET | `/api/fixtures` | Fixture data with FDR |
| GET | `/api/team/{id}` | Manager team info |
| GET | `/api/team/{id}/picks` | Squad picks |
| POST | `/api/optimize` | Run optimization |
| GET | `/api/current-gw` | Current gameweek |

## Debugging Tips

1. **Backend logs**: Check terminal running `npm run dev:backend`
2. **Frontend console**: Open browser DevTools (F12)
3. **API proxy**: Next.js config in `frontend/next.config.js`
4. **FPL API**: Use browser network tab to inspect requests
