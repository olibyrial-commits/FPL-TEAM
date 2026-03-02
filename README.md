# FPL Optimizer - Complete Implementation

This is a production-ready Fantasy Premier League optimization tool built with:

## Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js 14 with React and Tailwind CSS
- **ML**: XGBoost/Gradient Boosting for point predictions
- **Optimization**: PuLP (Linear Programming)

## Project Structure
```
FPL-TEAM/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── api/routes.py        # API endpoints
│   │   ├── models/schemas.py    # Pydantic models
│   │   └── services/
│   │       ├── fpl_client.py    # FPL API client
│   │       ├── predictor.py     # ML point predictions
│   │       └── optimizer.py     # PuLP solver
│   └── requirements.txt
│
└── frontend/
    ├── src/app/
    │   ├── page.tsx             # Main UI
    │   ├── layout.tsx
    │   └── globals.css
    └── package.json
```

## Installation & Running

### Quick Start (Single Command)
```bash
cd FPL-TEAM
npm run dev
```

This starts both:
- Backend on http://localhost:8000
- Frontend on http://localhost:3000

### Manual Start

#### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features
1. **Team Import**: Paste FPL URL to import your team
2. **Point Predictions**: XGBoost model predicting points for next 1-4 GWs
3. **Transfer Optimization**: Linear programming solver finding optimal transfers
4. **Formation Constraints**: Proper 4-4-2/4-3-3 with 1 GKP, min 3 DEF, 1 FWD
5. **Budget Management**: Respects team value + bank
6. **Transfer Penalty Logic**: Evaluates if point hits are worthwhile
