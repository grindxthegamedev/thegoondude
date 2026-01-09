# Crawler OAuth Setup Guide

Instructions for enabling authenticated crawling with Google OAuth.

## Prerequisites

- GCP project: `lustlist411`
- Email: `cursorestablisher@gmail.com`

## Step 1: Create the Secret

```bash
gcloud secrets create CRAWLER_GOOGLE_OAUTH \
  --project=lustlist411 \
  --replication-policy="automatic"
```

## Step 2: Get OAuth Refresh Token

Run this locally to get your refresh token:

```javascript
// save as get-token.js and run: node get-token.js
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID.apps.googleusercontent.com',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000/callback'
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/userinfo.email'],
});

console.log('Open this URL:', authUrl);
// After auth, exchange the code for tokens and save refresh_token
```

## Step 3: Store the Token

```bash
echo '{"refreshToken":"YOUR_REFRESH_TOKEN","accessToken":""}' | \
  gcloud secrets versions add CRAWLER_GOOGLE_OAUTH --data-file=-
```

## Step 4: Grant Function Access

```bash
gcloud secrets add-iam-policy-binding CRAWLER_GOOGLE_OAUTH \
  --member="serviceAccount:lustlist411@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 5: Deploy Functions

```bash
cd functions
firebase deploy --only functions
```

## Usage

The crawler will automatically use auth when `useAuth: true` is passed:

```typescript
const result = await crawlSite(url, { useAuth: true });
console.log(result.authenticated); // true if auth succeeded
```

## Security Notes

- Tokens are stored in GCP Secret Manager (encrypted at rest)
- Only the Cloud Function service account can access them
- Consider using a dedicated test account for crawling
