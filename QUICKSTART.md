# SDM 5.0 Platform - Quick Start (5 Minutes)

## Super Quick Setup

### 1. MongoDB Atlas Connection String (CRITICAL!)

Get your connection string from MongoDB Atlas:
- Sign in to https://cloud.mongodb.com
- Click "Drivers" or "Connect" on your cluster
- Copy the connection string
- **Important**: Must start with `mongodb+srv://` (NOT `mongodb://`)
- **Important**: NO port number
- Format: `mongodb+srv://username:password@clustername.mongodb.net/sdm5?retryWrites=true&w=majority`

### 2. Set Environment Variables

In Vercel project settings, add:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/sdm5?retryWrites=true&w=majority
JWT_SECRET = any-random-secret-key-here
XAI_API_KEY = your-grok-api-key-from-console.x.ai
```

### 3. Deploy & Initialize

1. Deploy to Vercel (or run locally)
2. Visit `/init` page
3. Click "Initialize Database"
4. Wait for seed completion
5. Redirects to admin panel

## Test the App in 2 Minutes

### Scenario 1: Company User Assessment

1. Go to `/register`
2. Fill in form:
   - Name: Your Name
   - Email: test@company.com
   - Password: password123
   - Company: Test Company
   - Industry: Tech
   - Size: Medium
   - Region: USA
3. Click Register → Redirects to dashboard
4. Click "New Assessment"
5. Answer all survey questions
6. Submit
7. See results with AI recommendations

### Scenario 2: Admin Dashboard

1. Create user with email `admin@test.com` (steps 1-2 above)
2. In MongoDB Atlas Collections:
   - Find `users` collection
   - Edit your admin user document
   - Change `role` from `"company"` to `"admin"`
   - Save
3. Log out and back in
4. Visit `/admin` - you now have access
5. Explore:
   - `/admin/pillars` - View/edit pillars
   - `/admin/dimensions` - View/edit dimensions
   - `/admin/analytics` - See all companies' data

## Troubleshooting

### "Cannot connect to database"
- Check `MONGODB_URI` starts with `mongodb+srv://` 
- Verify NO port number (bad: `:27017`)
- Verify database name exists: `/sdm5?`
- Check Network Access in MongoDB allows `0.0.0.0/0`

### "Registration not working"
- Check browser console (F12) for errors
- Verify all form fields filled
- Try different email
- Check MONGODB_URI is correct

### "No results after survey submission"
- Check survey was submitted (should show score)
- Verify MONGODB_URI connection
- Check `/dashboard` page loaded

### "Admin panel won't load"
- Make sure user role is `"admin"` in MongoDB
- Log out and back in
- Try `/admin` URL

### "AI recommendations not working"
- Check `XAI_API_KEY` is set
- Verify API key is valid at console.x.ai
- Check account has credits

## Full Documentation

- **SETUP.md** - Detailed setup instructions
- **TESTING.md** - Complete testing guide with all workflows
- **ARCHITECTURE.md** - Technical details

## Key Features

✅ JWT Authentication
✅ MongoDB Atlas Integration  
✅ Dynamic Scoring Engine
✅ Admin CRUD Operations
✅ Multi-company Support
✅ AI Recommendations (Grok)
✅ Interactive Charts (Radar, Bar)
✅ Assessment History
✅ CSV Export
✅ Responsive Design

## Architecture at a Glance

```
Frontend (Next.js 16)
    ↓
API Routes (Auth, Survey, Admin)
    ↓
MongoDB Atlas (Database)
    ↓
Grok AI (Recommendations)
```

## File Structure

```
/app
  /api - API routes (auth, survey, admin, ai)
  /admin - Admin dashboard pages
  /auth - Login/register pages
  /dashboard - User assessment results
  /survey - Assessment questions
  /page.tsx - Landing page
  /init - Database initialization

/lib
  /models - Mongoose schemas
  db.ts - MongoDB connection
  auth.ts - JWT & auth helpers
  auth-context.tsx - React auth context
  scoring-engine.ts - Dynamic scoring
  seed.ts - Database seed data
```

## Environment Variables

| Variable | Format | Source |
|----------|--------|--------|
| MONGODB_URI | mongodb+srv://... | MongoDB Atlas Drivers page |
| JWT_SECRET | any-string | Generate randomly |
| XAI_API_KEY | xai-... | https://console.x.ai |

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Log in
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Log out

### Survey
- `GET /api/survey/active` - Get current framework
- `POST /api/survey/submit` - Submit assessment

### Assessments
- `GET /api/assessments` - List your assessments
- `GET /api/assessments/[id]` - Get detailed results

### Admin
- `GET/POST /api/admin/pillars` - Manage pillars
- `GET/POST /api/admin/dimensions` - Manage dimensions
- `GET/POST /api/admin/questions` - Manage questions
- `GET /api/admin/analytics` - View analytics

### AI
- `POST /api/ai/recommend` - Generate Grok recommendations

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Database connection fails | Check MONGODB_URI uses mongodb+srv:// |
| Signup fails | Verify all form fields filled, try different email |
| No scores calculated | Ensure MONGODB_URI working, try reinit DB |
| AI recommendations 404 | Add XAI_API_KEY to env vars |
| Admin dashboard forbidden | Change user role to "admin" in MongoDB |
| Survey questions won't load | Check index version created, try reinit |

## Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Add environment variables
3. ✅ Deploy to Vercel
4. ✅ Initialize database at `/init`
5. ✅ Register at `/register`
6. ✅ Take a survey at `/survey`
7. ✅ View results and AI recommendations
8. ✅ Set admin role for full access

You're all set! The platform is production-ready.
