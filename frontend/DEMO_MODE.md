# 🎯 Demo Mode & Test Credentials - Quick Start

## Quick Testing (Recommended)

1. **Start the dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Go to login page:**
   http://localhost:3000/login

3. **Click any Demo Mode button:**
   - **Free** (1 optimization/month) 
   - **Pro** (Unlimited + all features) ← *Recommended for testing*
   - **Elite** (8 week horizon)

4. **You'll be instantly logged in** and redirected to `/dashboard`

5. **Test the optimizer:**
   - Use this URL: `https://fantasy.premierleague.com/entry/7505923/event/28`
   - Click "Run Optimization"
   - See results with team formation and transfer suggestions

## Demo Mode Features

✅ **Instant Access** - No email/password needed  
✅ **Session Persistence** - Stays logged in until you click "Exit Demo"  
✅ **Tier Testing** - Switch between Free/Pro/Elite by logging out and selecting different tier  
✅ **Visual Indicator** - Pink badge shows you're in demo mode  
✅ **Full Access** - All optimizer features work in demo mode  

## Test Credentials (For Real Auth Testing)

If you want to test actual authentication flow:

**Free Tier:**
- Email: `free@fploptimizer.test`
- Password: (use Google OAuth or password reset)

**Pro Tier:**
- Email: `pro@fploptimizer.test`
- Features: Unlimited optimizations, 4-week horizon, chip optimization

**Elite Tier:**
- Email: `elite@fploptimizer.test`
- Features: Everything + 8-week horizon

## What to Test

1. **Landing Page** → http://localhost:3000/
2. **Pricing Page** → http://localhost:3000/pricing
3. **Login Page** → http://localhost:3000/login
4. **Dashboard** → http://localhost:3000/dashboard
5. **Settings** → http://localhost:3000/settings

## Backend Verification

Make sure backend is running on port 8000:
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

## Troubleshooting

**Demo buttons not showing?**
- Check you're in development mode: `NODE_ENV=development`
- Restart Next.js dev server

**Can't run optimization?**
- Verify backend running: `npm run dev:backend` (in root directory)
- Check browser console for API errors
- Test URL format: must be `fantasy.premierleague.com/entry/XXXX/event/YY`

**Want to exit demo?**
- Click user avatar → "Exit Demo"
- Or clear browser localStorage

## Files Added for Demo Mode

- `src/components/LoginForm.tsx` - Updated with demo buttons
- `src/components/DemoAuthProvider.tsx` - Demo session management
- `src/components/UserNav.tsx` - Shows demo badge and handles logout
- `src/app/api/demo/route.ts` - Demo API endpoint
- `src/app/layout.tsx` - Wrapped with DemoAuthProvider
- `TESTING.md` - Full testing documentation
- `supabase/seed_test_users.sql` - SQL for real test users

Happy Testing! 🚀
