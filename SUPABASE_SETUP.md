# YAM Supabase setup

The website is ready for Supabase Auth and shared admin data. No secret credentials are committed.

## 1. Create the project and database

1. Create a Supabase project.
2. Open **SQL Editor** and run the files in `supabase/migrations/` in filename order. If the admin setup already exists, run only `202608160001_yam_minstrels.sql` to add song publishing.
3. In **Authentication → Users**, create the first administrator with an email and strong password.
4. Copy that user's UUID and run:

```sql
insert into public.admin_users (user_id)
values ('PASTE-AUTH-USER-UUID-HERE');
```

Only users listed in `admin_users` can change settings or access SMS drafts.
The `minstrel_songs` table is publicly readable only for published songs; drafts and all editing remain administrator-only.

## 2. Connect the browser

Open **Project Settings → API** and copy the project URL and publishable key. Copy `.env.example` to `.env`, add the two public values, then run:

```bash
node scripts/configure.mjs
```

This generates `config.js` in the following browser-safe format:

```js
window.YAM_CONFIG = Object.freeze({
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabasePublishableKey: 'YOUR-PUBLISHABLE-KEY',
  smsFunctionName: 'send-sms'
});
```

For a local username/password gate without Supabase, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the ignored `.env` file and run the same configure command. The generated browser configuration contains a salted PBKDF2 hash, never the plaintext password. Because browser-only authentication can be inspected or bypassed by a determined visitor, use Supabase authentication for a public production admin panel.

The publishable/anon key is intended for browser use. Authorization is enforced by Row Level Security. Never place a service-role key or SMS secret in `config.js`.

## 3. Configure SMS later

When the provider details are available, store them as Edge Function secrets:

```bash
npx supabase secrets set SMS_API_URL="..." SMS_API_KEY="..." SMS_SENDER_ID="YAM" --project-ref YOUR_PROJECT_REF
npx supabase functions deploy send-sms --project-ref YOUR_PROJECT_REF
```

The current `send-sms` function authenticates and authorizes administrators but intentionally returns `501` until the provider-specific request format is implemented.
