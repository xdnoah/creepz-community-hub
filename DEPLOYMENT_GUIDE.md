# 🚀 Deployment Guide - Creepz Community Hub

This guide explains how to deploy your app to the internet and continue making changes with Claude Code.

---

## 📋 Overview

**Tech Stack:**
- Frontend: React + Vite + TypeScript
- Backend: Supabase (Database + Auth + Realtime)
- Hosting: Vercel (recommended) or Netlify

**Workflow:**
1. Make changes in Claude Code
2. Commit changes to Git
3. Push to GitHub
4. Vercel automatically deploys
5. Your site updates live!

---

## 🔧 Prerequisites

Before deploying, you need:

1. ✅ **GitHub Account** - [Sign up here](https://github.com/join)
2. ✅ **Vercel Account** - [Sign up here](https://vercel.com/signup) (use GitHub login)
3. ✅ **Supabase Project** - You already have this!

---

## 📝 Step-by-Step Deployment

### **1. Create Environment Variables File**

Create a `.env.production` file with your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

⚠️ **Important:** Never commit `.env` files to git! They're already in `.gitignore`.

### **2. Initialize Git & Make First Commit**

```bash
# If not already done
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Creepz Community Hub"
```

### **3. Create GitHub Repository**

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `creepz-community-hub`
3. Don't initialize with README (you already have one)
4. Copy the repository URL

### **4. Connect Local Repo to GitHub**

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/creepz-community-hub.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

### **5. Deploy to Vercel**

#### Option A: Via Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your `creepz-community-hub` repository
5. Configure the project:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. Add **Environment Variables**:
   - Click "Environment Variables"
   - Add: `VITE_SUPABASE_URL` = `your_supabase_url`
   - Add: `VITE_SUPABASE_ANON_KEY` = `your_anon_key`
7. Click **"Deploy"**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name? creepz-community-hub
# - Directory? ./
# - Override settings? No

# Add environment variables in Vercel dashboard
# Then redeploy
vercel --prod
```

### **6. Configure Supabase for Production**

In your Supabase dashboard:

1. Go to **Settings** → **API**
2. Add your Vercel domain to **Site URL**:
   ```
   https://creepz-community-hub.vercel.app
   ```
3. Go to **Authentication** → **URL Configuration**
4. Add to **Redirect URLs**:
   ```
   https://creepz-community-hub.vercel.app
   https://creepz-community-hub.vercel.app/**
   ```

---

## 🔄 Continuous Deployment Workflow

Once set up, your workflow is simple:

### **In Claude Code:**

1. Make changes to your code
2. Test locally with `npm run dev`

### **Deploy Changes:**

```bash
# Stage your changes
git add .

# Commit with a message
git commit -m "Add new feature: Profile avatars"

# Push to GitHub
git push
```

**That's it!** Vercel automatically detects the push and deploys your changes. Usually takes 1-2 minutes.

---

## 🌐 Your Live URLs

After deployment, you'll have:

- **Production URL:** `https://creepz-community-hub.vercel.app`
- **Preview URLs:** Every branch/PR gets its own URL
- **Custom Domain:** Can add your own domain in Vercel settings

---

## 📦 Alternative: Netlify Deployment

If you prefer Netlify:

1. Go to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select your repo
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add environment variables
6. Click **"Deploy site"**

---

## 🔍 Monitoring Your Deployment

### **Vercel Dashboard:**
- View build logs
- Check deployment status
- See performance analytics
- Configure custom domains

### **GitHub Actions (Optional):**
You can add automated testing before deployment by creating `.github/workflows/test.yml`

---

## 🐛 Troubleshooting

### **Build Fails:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Test build locally: `npm run build`

### **Environment Variables Not Working:**
1. Make sure variables start with `VITE_`
2. Redeploy after adding variables
3. Check variable names match exactly

### **Supabase Connection Fails:**
1. Verify Supabase URL in Vercel environment variables
2. Check Supabase allowed domains include your Vercel URL
3. Ensure RLS policies are configured correctly

### **Page Not Found (404):**
1. Add `vercel.json` with rewrites for SPA routing:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🎯 Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use meaningful commit messages** - Helps track changes
3. **Test locally first** - Run `npm run build` before pushing
4. **Use branches** - Create feature branches for big changes
5. **Monitor performance** - Check Vercel analytics regularly

---

## 🚀 Advanced Features

### **Custom Domain:**
1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Vercel: Settings → Domains → Add domain
3. Update DNS records as instructed

### **Preview Deployments:**
Every pull request gets a unique preview URL for testing before merging.

### **Automatic DB Migrations:**
Run SQL scripts manually in Supabase dashboard when needed:
- `RAID_SETUP.sql`
- `DM_PRESENCE_SETUP.sql`
- `PRESENCE_SETUP.sql`
- `USER_SETTINGS_SETUP.sql`

---

## 📞 Support

If you run into issues:
1. Check [Vercel Documentation](https://vercel.com/docs)
2. Check [Vite Documentation](https://vitejs.dev)
3. Review build logs in Vercel dashboard
4. Ask Claude Code for help!

---

## ✅ Checklist

Before first deployment:
- [ ] GitHub account created
- [ ] Vercel account created
- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub
- [ ] Environment variables added to Vercel
- [ ] Supabase URLs configured
- [ ] SQL setup scripts run in Supabase
- [ ] First deployment successful
- [ ] Custom domain configured (optional)

---

**You're all set!** Your Creepz Community Hub is now live on the internet! 🎉
