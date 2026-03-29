# SDM 5.0 Platform - Testing Guide

This document provides step-by-step instructions to fully test the application end-to-end.

## Prerequisites Checklist

Before testing, verify:
- [ ] MongoDB Atlas cluster created and running
- [ ] Connection string in `MONGODB_URI` uses `mongodb+srv://` (no port)
- [ ] Network access allows `0.0.0.0/0`
- [ ] All 3 env vars set: `MONGODB_URI`, `JWT_SECRET`, `XAI_API_KEY`
- [ ] App is deployed and running at a URL

## Full Testing Workflow

### Phase 1: Database Initialization

**Test Goal**: Verify database connection and seed data

1. **Navigate to `/init` page**
   - You should see initialization form
   - Open browser DevTools (F12) and go to Console tab
   - You'll see `[v0]` prefixed log messages

2. **Click "Initialize Database"**
   - Watch the logs in console
   - You should see:
     ```
     [v0] Seed API called, starting database initialization
     [v0] Connecting to database...
     [v0] Creating pillars...
     [v0] Creating dimensions...
     [v0] Creating questions...
     [v0] Creating maturity levels...
     [v0] Creating formulas...
     [v0] Seed completed successfully
     ```

3. **Verify Success**
   - Page should show "Database seeded successfully!"
   - Redirect should happen automatically to admin dashboard
   - Check MongoDB Atlas:
     - Go to Collections
     - You should see collections: `users`, `companies`, `indexversions`, `pillars`, `dimensions`, `questions`, `maturitylevels`, `formulas`
     - Count documents - should have: 2 pillars, 10 dimensions, ~50 questions, 6 maturity levels

**If It Fails:**
- Check console logs for error messages
- Verify `MONGODB_URI` starts with `mongodb+srv://`
- Ensure database name is in URI: `.mongodb.net/sdm5?`
- Check Network Access in MongoDB Atlas allows `0.0.0.0/0`

---

### Phase 2: User Registration

**Test Goal**: Verify user account creation and auth system

#### Test 2A: Company User Registration

1. **Navigate to `/register`**
   - See registration form with fields:
     - Your Name
     - Email
     - Password
     - Company Name
     - Industry
     - Company Size (dropdown)
     - Region

2. **Fill Form with Test Data**:
   ```
   Name: Test User
   Email: test@company.local
   Password: password123
   Company Name: Test Company Inc
   Industry: Manufacturing
   Company Size: Small (10-49 employees)
   Region: Canada, Ontario
   ```

3. **Open DevTools Console (F12)**
   - Watch for registration logs:
     ```
     [v0] Register function called with email: test@company.local
     [v0] Register response status: 201
     [v0] Registration successful: test@company.local
     ```

4. **Click "Create Account"**
   - Loading spinner should appear
   - After ~2-3 seconds, should redirect to `/dashboard`
   - If redirect didn't work, manually navigate to `/dashboard`

5. **Verify Redirect Works**
   - Dashboard should load
   - You should see greeting: "Welcome, Test User"
   - Company name shown: "Test Company Inc"
   - Role indicator shows: "Company Assessment"

**Expected Result**: User registered successfully and logged in

**If Registration Fails:**
- Check console for detailed error
- Verify all form fields are filled
- Check email is valid format
- Try different email (may be duplicate if testing multiple times)
- Check MONGODB_URI connection

#### Test 2B: Admin User Setup (Manual)

To create an admin user:

1. Register another company user:
   ```
   Email: admin@sdm5.local
   Name: Admin User
   Password: admin123
   Company Name: Admin Org
   (other fields: any values)
   ```

2. Go to MongoDB Atlas Collections
3. Find `users` collection
4. Find your admin@sdm5.local user
5. Edit the document:
   - Change `role` from `"company"` to `"admin"`
6. Save document
7. Log out and log back in
8. You should now have access to `/admin` panel

---

### Phase 3: Company Assessment (Survey)

**Test Goal**: Verify survey submission and scoring

#### Test 3A: Start New Assessment

1. **On dashboard (`/dashboard`), click "New Assessment"**
   - Navigate to `/survey`
   - Should see survey form with first question
   - Check DevTools console for:
     ```
     [v0] Survey page mounted
     [v0] Fetching active index version
     [v0] Active index loaded
     ```

2. **Complete Survey**
   - Questions are grouped by dimension
   - Each question has a scale (0-5, yes/no, or text options)
   - Answer all questions (they're required)
   - Progress bar should show completion %
   - At the end, click "Submit Assessment"

3. **Verify Submission**
   - Watch console during submission:
     ```
     [v0] Survey submit API called
     [v0] Auth check - user ID: [id] role: company
     [v0] Database connected
     [v0] Calculating scores
     [v0] Scores calculated - overall: [score]
     [v0] Survey submission successful
     ```

4. **After Submission**
   - Should redirect to `/dashboard/[id]` automatically
   - Should show "Assessment Results" page
   - Your score should be displayed as a number (0-5)

**Expected Result**: Survey submitted and scored successfully

**If Survey Fails:**
- Check console for exact error
- Ensure all questions are answered
- Verify indexVersionId is being loaded
- Check MONGODB_URI connection

---

### Phase 4: View Assessment Results

**Test Goal**: Verify results visualization and AI recommendations

1. **On Results Page (`/dashboard/[id]`)**
   - You should see:
     - Overall Score (0-5 scale)
     - Overall Maturity Level (Traditional, Initial, etc.)
     - Radar chart showing dimension scores
     - Bar chart showing pillar comparisons
     - Dimension breakdown table

2. **View Charts**
   - Radar chart should show all dimensions
   - Each point on radar = one dimension (10 total)
   - Height of point = score for that dimension
   - Bar chart should show pillars (2 bars - ICT4S and Sustainable ICT)

3. **Check AI Recommendations**
   - Scroll down to "AI-Powered Recommendations"
   - Button says "Generate Recommendations"
   - Click it
   - Watch console:
     ```
     [v0] Generating AI recommendations for assessment: [id]
     [v0] Calling Grok API...
     [v0] AI recommendations generated successfully
     ```
   - Recommendations should appear (text-based advice from Grok)
   - Should mention specific dimensions and improvements

4. **View Assessment History**
   - Go back to `/dashboard`
   - Recent assessments card should list your new assessment
   - Click on it to view details again

**Expected Result**: Results displayed with charts and AI recommendations

**If Charts Don't Show:**
- Check browser console for Recharts errors
- Verify scores were calculated
- Try refresh page

**If AI Recommendations Fail:**
- Check `XAI_API_KEY` is set in env vars
- Verify API key is valid at https://console.x.ai
- Check Grok API account has available credits

---

### Phase 5: Admin Panel

**Test Goal**: Verify admin CRUD operations and analytics

1. **Navigate to `/admin`**
   - Admin must have `role: "admin"` in database
   - Should see admin dashboard with stats cards
   - Overview shows:
     - Total Companies
     - Total Assessments
     - Average Score

2. **Test Pillars Management** (`/admin/pillars`)
   - Click "View All" or navigate directly
   - See table with 2 pillars (ICT4S, Sustainable ICT)
   - Click "Edit" on a pillar
   - Modify description
   - Click "Update"
   - Verify change appears in table
   - (Optional) Click "Add Pillar" to create new one

3. **Test Dimensions Management** (`/admin/dimensions`)
   - See table with 10 dimensions
   - Each dimension belongs to a pillar
   - Click "Edit" and modify a description
   - Click "Update"
   - Verify change saved

4. **Test Questions Management** (`/admin/questions`)
   - See all ~50 questions
   - Each shows dimension, text, and answer type
   - Click "Edit" to modify a question text
   - Update and verify
   - Note: Can't delete questions (data integrity)

5. **Test Index Versions** (`/admin/index-versions`)
   - See current active index version
   - Click "Create New Version" to create a variant
   - Give it a version name
   - Subsequent companies can use this new version

6. **Test Maturity Levels** (`/admin/maturity-levels`)
   - See 6 levels (0 = Traditional, 5 = Matured)
   - Each has a description and color
   - Edit descriptions
   - Update and verify

7. **View Analytics** (`/admin/analytics`)
   - See charts showing:
     - Average maturity scores by pillar
     - Distribution of company sizes
     - Status breakdown (responses count)
   - Download data as CSV
     - Click "Export to CSV"
     - File should download with all assessment data

**Expected Result**: All CRUD operations work, analytics displays correctly

**If Admin Pages Don't Load:**
- Ensure user role is `"admin"` in MongoDB
- Try logging out and back in
- Check `MONGODB_URI` connection

---

### Phase 6: Multi-User Workflow

**Test Goal**: Verify multiple companies can assess independently

1. **Create Second Company User**
   - Log out (click profile → Logout or navigate to home)
   - Go to `/register`
   - Register with different email:
     ```
     Email: company2@test.local
     Name: Company 2 User
     Company Name: Different Company Ltd
     (other fields: fill in)
     ```

2. **Complete Assessment for Company 2**
   - On dashboard, click "New Assessment"
   - Answer survey questions
   - Submit assessment
   - Should show different score

3. **Verify Data Isolation**
   - Log out
   - Log back in with first user (test@company.local)
   - On dashboard, should see only YOUR assessments
   - Company 2's assessments should NOT appear

4. **Verify Admin Sees All**
   - Log in with admin account
   - Go to `/admin/analytics`
   - Should see both companies' data in charts
   - CSV export should include all assessments from all companies

**Expected Result**: Each company sees only their data, admin sees everything

---

## Performance Testing

### Load Time Checks

Time these operations:
- [ ] Homepage (`/`) loads in < 2 seconds
- [ ] Login page (`/login`) loads in < 1 second
- [ ] Dashboard (`/dashboard`) loads in < 2 seconds
- [ ] Survey page (`/survey`) loads in < 3 seconds
- [ ] Results page loads in < 2 seconds
- [ ] Admin analytics loads in < 3 seconds

### Database Performance

- [ ] Can handle 10+ companies with 50+ assessments each
- [ ] Scoring calculation completes in < 5 seconds
- [ ] AI recommendations generated in < 30 seconds (depends on Grok API)

---

## Error Handling Tests

### Test Invalid Inputs

1. **Registration with invalid email**
   - Try email: `invalidemail`
   - Should show validation error

2. **Login with wrong password**
   - Enter correct email, wrong password
   - Should show "Invalid email or password"

3. **Survey with missing answers**
   - Try submitting survey without answering all questions
   - Should show validation error on required fields

4. **Direct URL access without auth**
   - Try accessing `/admin` without logging in as admin
   - Should redirect to `/login`
   - Try accessing `/survey` without logging in
   - Should redirect to `/login`

---

## Final Verification Checklist

- [ ] Registration works with all user types
- [ ] Login works with correct credentials
- [ ] Survey can be completed and submitted
- [ ] Scores are calculated and displayed
- [ ] Charts and visualizations render correctly
- [ ] AI recommendations are generated
- [ ] Admin can view and edit all data
- [ ] Multiple companies' data is isolated
- [ ] CSV export works
- [ ] All pages load without console errors
- [ ] Responsive design works on mobile
- [ ] Form validation works

---

## Debugging Tips

### Enable Full Logging
Open DevTools (F12) → Console tab
All app messages are prefixed with `[v0]`

Common log patterns:
- `[v0] Register API called` - Starting registration
- `[v0] Calculating scores` - Scoring engine running
- `[v0] Auth check` - Authentication validation
- `[v0] Database connected` - DB connection established
- `[v0] Calling Grok API` - AI recommendations being generated

### Check Network Tab
- F12 → Network tab
- Watch API calls:
  - `POST /api/auth/register` - Should return 201
  - `POST /api/auth/login` - Should return 200
  - `POST /api/survey/submit` - Should return 201
  - `GET /api/assessments` - Should return 200
  - `POST /api/ai/recommend` - Should return 200

### MongoDB Verification
1. Go to MongoDB Atlas
2. Collections tab
3. Check each collection has expected data:
   - `users`: Should have at least 2 users
   - `companies`: Should have company docs
   - `surveyresponses`: Should have response documents
   - Others: Seed data should be present

---

## Success Criteria

Your SDM 5.0 platform is working correctly when:

✓ Can register → login → take survey → see results → AI recommendations
✓ Admin can manage framework and view analytics
✓ Multiple companies can assess independently
✓ All pages load without errors
✓ Database connection works (mongodb+srv://)
✓ Charts render correctly
✓ Authentication enforces role-based access
