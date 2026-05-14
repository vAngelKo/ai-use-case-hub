# Deploy AI Use Case Hub to Vercel

Deploying moves **API routes** (chat, generate, submit, ideas updates) to Vercel’s servers. Those servers reach **Supabase and Slack over normal HTTPS**, which avoids corporate **SSL inspection** on your laptop.

## 1. Put the project on Git

From the app folder (`ai-use-case-hub`):

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a repository on GitHub (or GitLab/Bitbucket), add it as `origin`, and push:

```bash
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If this repo already lives inside a larger monorepo, import **only** the `ai-use-case-hub` directory as its own Vercel project (see step 2 → Root Directory).

## 2. Create a Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in.
2. **Add New… → Project** → import your Git repo.
3. Framework: **Next.js** (auto-detected).
4. **Root Directory**: if the repo root is not the Next app, set it to **`ai-use-case-hub`** (or the folder that contains `package.json`).
5. **Build & Output Settings**: defaults are fine (`npm run build`, output `.next`).
6. Click **Deploy** only after adding env vars (step 3), or deploy once and add env vars under **Settings → Environment Variables**, then **Redeploy**.

## 3. Environment variables (Production)

In **Project → Settings → Environment Variables**, add at least:

| Name | Notes |
|------|--------|
| `OPENAI_API_KEY` | Required for `/api/chat` and `/api/generate`. |
| `SUPABASE_URL` | Project URL: `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Server-only. Same key as local `.env.local`. |

Optional:

| Name | Notes |
|------|--------|
| `SLACK_WEBHOOK_URL` | If unset or invalid, submit still saves to DB; Slack step may warn (see app behavior). |
| `SUBMITTER_FALLBACK_EMAIL` | Used when no `submitterEmail` in POST body (auth is off). |
| `SUBMITTER_FALLBACK_NAME` | Same for name. |

**Do not set** `USE_LOCAL_IDEAS_STORE` on Vercel unless you accept ephemeral/non-shared storage (serverless filesystem is not persistent for `.local-data`).

**Do not** expose `SUPABASE_SERVICE_ROLE_KEY` as `NEXT_PUBLIC_*`.

Apply vars to **Production** (and **Preview** if you want previews to hit real Supabase).

## 4. Redeploy

After saving variables: **Deployments → … → Redeploy** (or push a new commit).

## 5. Smoke test

1. Open your **`*.vercel.app`** URL.
2. **`/intake`** → complete flow → **Submit**.
3. **`/ideas`** → row appears.
4. Supabase **Table Editor** → confirm row in **`ideas`**.

## Alternative: Vercel CLI

```bash
npm i -g vercel
cd path/to/ai-use-case-hub
vercel login
vercel link
vercel env pull   # optional: sync vars locally
vercel --prod
```

Add secrets with `vercel env add OPENAI_API_KEY production`, etc.

## Supabase network restrictions

If you enabled **Database Network Restrictions** or strict firewall rules for the Supabase project, ensure hosted deployments can reach the Supabase **API** (`*.supabase.co`). Most teams leave REST/API open and rely on the **service role** staying secret on the server.

## Why this fixes corp TLS

Your browser talks to **`https://your-app.vercel.app`**. Vercel’s Node runtime calls **`https://xyz.supabase.co`** from a datacenter, not through your company’s TLS-inspecting proxy—so the **`SELF_SIGNED_CERT_IN_CHAIN`** issue from your laptop typically disappears for production traffic.

Local `npm run dev` may still need **`NODE_EXTRA_CA_CERTS`** or **`USE_LOCAL_IDEAS_STORE=true`** until your machine trusts the proxy CA.
