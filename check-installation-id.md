# How to Find and Verify Your GitHub App Installation ID

## Step-by-Step Guide

### Method 1: Using GitHub Web Interface (Easiest)

1. **Go to your GitHub App settings:**
   - Visit: https://github.com/settings/apps
   - Or: GitHub → Your Profile → Settings → Developer settings → GitHub Apps

2. **Find your app:**
   - Look for the app with ID `2245869` (or search by name)
   - Click on the app name

3. **Check existing installations:**
   - Scroll down to the "Install App" section
   - You'll see a list of installations (organizations/accounts where the app is installed)
   - Each installation shows which repositories it has access to

4. **Find the Installation ID:**
   - Click on the installation (the account/org name)
   - Look at the URL in your browser
   - The URL will be: `https://github.com/settings/installations/[INSTALLATION_ID]`
   - The number at the end is your Installation ID

5. **Verify it's for the correct repo:**
   - On the installation page, scroll down to "Repository access"
   - Make sure the demo medivora repo is listed (or "All repositories" is selected)
   - If the repo isn't there, you need to either:
     - Install the app on that repo, OR
     - Change the installation settings to include that repo

### Method 2: Using GitHub API (More Technical)

You can use a script or API call to list all installations.

### Method 3: Install the App (If Not Already Installed)

If the app isn't installed on the demo medivora repo:

1. Go to: https://github.com/settings/apps
2. Click on your app
3. Click "Install App" button
4. Select the account/org that owns the demo medivora repo
5. Choose repository access:
   - "Only select repositories" → Select "demo-medivora"
   - OR "All repositories" (if you want broader access)
6. Click "Install"
7. The Installation ID will be in the URL after installation



