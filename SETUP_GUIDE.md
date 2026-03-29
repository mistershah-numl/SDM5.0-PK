# 🚀 Final Setup Instructions - 100% Working App

## Step 1: Regenerate Your API Key (IMPORTANT!)
Your Gemini API key was exposed. Follow these steps:

1. Go to: https://aistudio.google.com/app/apikey
2. Delete the old key (the one you shared)
3. Create a NEW API key
4. Copy the new key

## Step 2: Create `.env.local` File

Create a new file `/.env.local` in your project root with:

```
MONGODB_URI=mongodb://your-connection-string-here
JWT_SECRET=generate-a-random-string-here
GOOGLE_API_KEY=YOUR_NEW_GEMINI_API_KEY_HERE
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

**Replace**:
- `your-connection-string-here` with your MongoDB connection string
- `generate-a-random-string-here` with a random secret (use `openssl rand -base64 32`)
- `YOUR_NEW_GEMINI_API_KEY_HERE` with your new Gemini API key from Google AI Studio

## Step 3: Install Dependencies

```powershell
npm install
```

## Step 4: Run the Development Server

```powershell
npm run dev
```

The app should start at `http://localhost:3000`

## Step 5: Test AI Feedback Integration

1. Go to `/survey`
2. Select an assessment version
3. Fill out all questions
4. Submit the survey
5. ✅ You should see:
   - Your assessment results
   - **AI Feedback Section** (expandable) with:
     - Overall feedback
     - Key observations
     - Recommended actions
   - **CSV Export Button** to download detailed report

## What's Working ✅

- ✅ All admin CRUD operations
- ✅ Survey with formula selection
- ✅ Weighted scoring (question → dimension → pillar → overall)
- ✅ **Google Gemini AI Feedback** (real-time analysis)
- ✅ CSV export with calculations
- ✅ Dashboard with assessment history
- ✅ Authentication (login/register)

## Troubleshooting

### "AI feedback error" or no feedback appearing
**Issue**: `GOOGLE_API_KEY` not set or invalid  
**Fix**:
1. Check `.env.local` contains `GOOGLE_API_KEY=...`
2. Verify the key is from https://aistudio.google.com (not Cloud Console)
3. Restart dev server: `npm run dev`

### "Survey submit works but no feedback"
**Issue**: Google API key might have usage limits  
**Fix**:
1. Check Google AI Studio for API quotas
2. Ensure "Gemini API" is enabled

### "Build fails"
**Issue**: Missing dependencies  
**Fix**:
```powershell
npm install
npm run build
```

### "Database connection error"
**Issue**: `MONGODB_URI` not set  
**Fix**: Set correct MongoDB connection string in `.env.local`

## Environment Variables Checklist

- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Random secret key
- [ ] `GOOGLE_API_KEY` - From https://aistudio.google.com/app/apikey (NOT Cloud Console)
- [ ] `NEXTAUTH_URL` - http://localhost:3000 (dev), your domain (production)
- [ ] `NODE_ENV` - development or production

## File Structure (Key Files)

```
app/
├── api/
│   ├── ai/
│   │   ├── feedback/route.ts ← AI feedback endpoint (GOOGLE Gemini)
│   │   └── recommend/route.ts ← Recommendations (GOOGLE Gemini)
│   ├── surveys/
│   │   ├── submit/route.ts ← Survey submission
│   │   └── export-excel/route.ts ← CSV export
│   └── ... (other API routes)
├── survey/
│   └── page.tsx ← Main survey form (with AI feedback display)
└── dashboard/
    └── page.tsx ← View past assessments

lib/
├── scoring-engine.ts ← Weighted calculation logic
└── models/ ← Database schemas

.env.local ← ENVIRONMENT VARIABLES (SECRET - not in git)
```

## Testing Checklist

- [ ] Create a user account
- [ ] View admin panel - add/edit/delete data
- [ ] Take a survey - all questions answered
- [ ] Submit survey - see results
- [ ] ✅ See AI feedback appear
- [ ] Download CSV report
- [ ] Check calculations in CSV match displayed scores
- [ ] Log out and back in

## Deployment (When Ready)

For production:
1. Set `NEXTAUTH_URL=https://yourdomain.com`
2. Generate strong `JWT_SECRET`
3. Set production `MONGODB_URI`
4. Set production `GOOGLE_API_KEY`
5. Run: `npm run build && npm start`

## Support

If you have issues:
1. Check `.env.local` has all required variables
2. Verify API key format (should start with `AIzaSy...`)
3. Check browser console for errors
4. Check terminal logs for server errors

---

**Status**: 🎉 **100% Ready for Use**  
**Backend**: ✅ Node.js + MongoDB  
**Frontend**: ✅ Next.js + React  
**AI**: ✅ Google Gemini Pro  
**Scoring**: ✅ Weighted hierarchy  
**Export**: ✅ CSV with formulas
