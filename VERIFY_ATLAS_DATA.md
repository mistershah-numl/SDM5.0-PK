# How to Verify User Data in MongoDB Atlas

Your user `muhammadshah.10226@gmail.com` was successfully created in MongoDB Atlas. Here's how to verify it:

## Method 1: Using MongoDB Atlas Web Console (Easiest)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Log in with your account
3. Select your cluster (e.g., `uqac`)
4. Click **Browse Collections** button
5. Navigate to: `sdm5` → `users` collection
6. You should see your user document with:
   - `email: "muhammadshah.10226@gmail.com"`
   - `name: "Muhammad Shah"`
   - `companyId: ObjectId("69b9fafc29ac68ff286c6a2f")`
   - `role: "company"`

## Method 2: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your Atlas URI: `mongodb+srv://shahatuqac:<password>@uqac.9xqoyy1.mongodb.net/`
3. In the left panel, expand:
   - `sdm5` (database)
   - `users` (collection)
4. You should see the user document

## Method 3: Using Atlas Data Explorer

1. In Atlas console, click **Data Services** → **Data Explorer**
2. Select database `sdm5`
3. Select collection `users`
4. Filter by: `email: "muhammadshah.10226@gmail.com"`
5. You'll see the complete user record

## The Dashboard Redirect Issue - FIX

The problem is:
1. User logs in successfully ✅
2. Auth cookie is set ✅
3. Login page redirects to `/dashboard` ✅
4. But `/api/auth/me` route fails → dashboard page redirects back to `/login` ❌

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Delete `.next` folder: `rm -rf .next`
3. Restart: `npm run dev`
4. Hard refresh browser: `Ctrl+Shift+R`
5. Try logging in again

The issue is that the dev server is serving old cached code. The `/api/auth/me` route has the old db.ts validation error on lines 19-20. A fresh build will fix this.

## Quick Verification Checklist

- [ ] User appears in `sdm5.users` collection in Atlas
- [ ] `email` field matches: `muhammadshah.10226@gmail.com`
- [ ] `role` field is: `company`
- [ ] `companyId` is populated with an ObjectId
- [ ] Stop and restart dev server with `rm -rf .next && npm run dev`
- [ ] Hard refresh browser with Ctrl+Shift+R
- [ ] Try login again
