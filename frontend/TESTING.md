# Test Credentials & Demo Mode

This document provides test credentials and instructions for manually testing the FPL Optimizer.

## Quick Start - Demo Mode

The easiest way to test is using the **Demo Mode** buttons on the login page:

1. Go to `http://localhost:3000/login`
2. Click one of the **Demo Mode** buttons:
   - **Free** - Test free tier limitations
   - **Pro** - Test all features (recommended for testing solver)
   - **Elite** - Test extended horizon features

## Test User Credentials

### Free Tier Test Account
- **Email:** `free@fploptimizer.test`
- **Tier:** Free
- **Features:**
  - 1 optimization per month
  - 1 week horizon
  - Basic transfer strategy
  - No chip optimization

### Pro Tier Test Account
- **Email:** `pro@fploptimizer.test`
- **Tier:** Pro
- **Features:**
  - Unlimited optimizations
  - 4 week horizon
  - Advanced transfer strategy
  - Chip optimization enabled
  - Email support

### Elite Tier Test Account
- **Email:** `elite@fploptimizer.test`
- **Tier:** Elite
- **Features:**
  - Everything in Pro
  - 8 week horizon
  - Premium strategy
  - Priority support

## Test FPL Team URL

Use this URL to test the optimizer:
```
https://fantasy.premierleague.com/entry/7505923/event/28
```

This is a real FPL team from the 2023-24 season with a complete squad.

## Backend Testing

To test the solver directly without the frontend:

### Health Check
```bash
curl http://localhost:8000/health
```

### Optimize Endpoint
```bash
curl -X POST http://localhost:8000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "team_url": "https://fantasy.premierleague.com/entry/7505923/event/28",
    "horizon": 1,
    "use_hits": true,
    "chips_available": {
      "wildcard": true,
      "free_hit": true,
      "bench_boost": true,
      "triple_captain": true
    }
  }'
```

## What to Test

### Core Features
1. **Team Analysis** - Verify player data loads correctly
2. **Point Predictions** - Check expected points are calculated
3. **Transfer Suggestions** - Verify optimal transfers are recommended
4. **Formation Display** - Check the pitch visualization works
5. **Chip Strategy** - Test wildcard, bench boost recommendations

### Subscription Limits
1. **Free Tier** - Verify only 1 optimization allowed
2. **Horizon Limits** - Test 1 week (free), 4 weeks (pro), 8 weeks (elite)
3. **Feature Gating** - Verify chip optimization is paywalled

### Error Handling
1. **Invalid URL** - Test error message for bad FPL URL
2. **Backend Down** - Test graceful error when API unavailable
3. **Rate Limiting** - Test behavior when optimization limit reached

## Demo Session Details

When using Demo Mode:
- Session is stored in browser's localStorage
- Persists until you click "Logout" or clear browser data
- No real authentication performed
- Safe for development testing

## Database Seeding (For Real Auth)

To create real test users in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Run the seed script:
   ```bash
   # File: supabase/seed_test_users.sql
   ```

3. Set passwords via Auth → Users → Select user → Send password reset

Or use Google OAuth for instant testing (no password needed).

## Troubleshooting

### Demo mode not showing?
- Ensure `NODE_ENV=development` in your `.env.local`
- Restart the Next.js dev server

### Optimizer not working?
- Check backend is running on port 8000
- Verify health endpoint: `curl http://localhost:8000/health`
- Check browser console for API errors

### Can't log in?
- Clear browser localStorage and cookies
- Try Demo Mode buttons as fallback
- Check NextAuth configuration in `src/lib/auth.ts`

## API Testing with cURL

### Get Current Gameweek
```bash
curl http://localhost:8000/api/current-gw
```

### Get Team Data
```bash
curl "http://localhost:8000/api/team/7505923"
```

### Get Fixtures
```bash
curl http://localhost:8000/api/fixtures
```

### Full Optimization (with all options)
```bash
curl -X POST http://localhost:8000/api/optimize \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "team_url": "https://fantasy.premierleague.com/entry/7505923/event/28",
    "current_gw": 28,
    "horizon": 4,
    "use_hits": true,
    "free_transfers": 1,
    "bank": 0.5,
    "team_value": 100.2,
    "chips_available": {
      "wildcard": true,
      "free_hit": false,
      "bench_boost": true,
      "triple_captain": true
    },
    "price_changes": {}
  }' | jq .
```

## Expected Results

A successful optimization returns:
```json
{
  "success": true,
  "optimized_squad": [...],
  "starting_xi": [...],
  "bench": [...],
  "current_expected_points": 45.2,
  "optimized_expected_points": 52.8,
  "points_difference": 7.6,
  "full_plan": [...]
}
```

## Support

For testing issues:
1. Check browser console for errors
2. Verify backend logs in terminal
3. Test API endpoints directly with cURL
4. Review `TESTING.md` for detailed instructions
