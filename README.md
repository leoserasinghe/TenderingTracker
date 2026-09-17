# Tendering Tracker — Live Dashboard for Netlify

This is a small static site that reads your **Tendering_Tracker** Google Sheet
live (the "Dashboard" tab) and renders it as charts, with an optional AI
"insights" button. Your Google Sheet is not modified in any way — this only
reads it.

## 1. Make sure the sheet is link-viewable (read-only is fine)

The dashboard reads data through Google's public "visualization query" endpoint,
which needs the sheet to be shared as **"Anyone with the link — Viewer"**:

1. Open the sheet → click **Share** (top right).
2. Under "General access", change to **Anyone with the link**, role **Viewer**.
3. This does *not* let anyone edit it, and does not require a Google API key.

If you'd rather not make it link-viewable, the alternative is to use the
Google Sheets API with a service account and pull the data through a Netlify
Function instead of directly from the browser — say the word and I can build
that version instead.

## 2. (Optional) Get a free AI API key for the "insights" button

The AI button uses **Groq** (https://console.groq.com), which has a free tier
and doesn't require a credit card. Sign up, create an API key, and keep it
handy for step 4. (You can swap in Google Gemini's free tier or another
provider by editing `netlify/functions/ai-insights.js` — the shape of the
request would change slightly.)

## 3. Deploy to Netlify

**Easiest path (drag-and-drop, dashboard only — no AI button):**
1. Go to https://app.netlify.com/drop
2. Drag this whole folder onto the page.
3. Done — you get a live URL immediately. (Netlify Drop doesn't run serverless
   functions, so the AI insights button won't work in this mode.)

**Full path (dashboard + AI button, auto-redeploys on changes):**
1. Push this folder to a new GitHub repository.
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick
   the repo.
3. Build settings: leave build command empty, publish directory `.` (this
   repo has a `netlify.toml` that already sets this up).
4. Deploy.
5. Go to **Site settings → Environment variables** and add:
   - `GROQ_API_KEY` = the key from step 2.
6. Redeploy (Netlify → Deploys → Trigger deploy) so the function picks up the
   new environment variable.

## 4. Using it

- The page auto-refreshes from the sheet every 5 minutes, and there's a
  manual "Refresh now" button.
- "Generate AI insights" sends the already-fetched summary numbers to the
  serverless function, which asks the AI for a short written briefing.
- Because the AI function is public once deployed, anyone with the site URL
  could trigger it and use up some of your free quota. For an internal team
  tool this is usually fine; if you want to lock it down, Netlify has a free
  "Identity"/password-protection option under Site settings → Access control
  you can turn on.

## 5. If your sheet layout changes

The dashboard reads four fixed cell ranges from the "Dashboard" tab
(`RANGES` near the top of `index.html`), matching the tables as they exist
today: Summary by QS, Pipeline, Division summary, and Executive target
summary. If you add/remove rows or columns in those specific tables later,
update the corresponding range in `index.html` to match.
