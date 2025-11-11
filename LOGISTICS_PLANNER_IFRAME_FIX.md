# 🚛 Logistics Planner - Allow Iframe Embedding

Your Logistics Planner is being blocked from loading in the dashboard due to `X-Frame-Options: sameorigin`.

## 🔧 How to Fix

### Option 1: Add _headers file (Recommended)

In your **dailychessmap** repository, create a file named `_headers` in the root:

```
/*
  X-Frame-Options: ALLOW-FROM https://clippingdrl.netlify.app
  Content-Security-Policy: frame-ancestors 'self' https://clippingdrl.netlify.app
```

### Option 2: Add netlify.toml

Or add/update `netlify.toml` in your **dailychessmap** repository:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "ALLOW-FROM https://clippingdrl.netlify.app"
    Content-Security-Policy = "frame-ancestors 'self' https://clippingdrl.netlify.app"
```

### Option 3: Remove X-Frame-Options (Less Secure)

If you want it to be embeddable anywhere:

```
/*
  X-Frame-Options: ALLOWALL
```

Or remove the header entirely and just use:

```
/*
  Content-Security-Policy: frame-ancestors 'self' https://clippingdrl.netlify.app
```

## 📝 Steps

1. Go to your **dailychessmap** repository
2. Create `_headers` file in the root with the content above
3. Commit and push to trigger Netlify deployment
4. Wait 1-2 minutes for deployment
5. Hard refresh your dashboard (Ctrl+Shift+R)
6. Click the Logistics Planner button - should work! ✅

## 🧪 Test

After deploying, you can test if it's working:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click Logistics Planner button
4. Should see no "Refused to display" errors

## ⚠️ Why This Happens

By default, Netlify sets `X-Frame-Options: SAMEORIGIN` for security, which prevents your site from being embedded in iframes on other domains. Since your dashboard is on `clippingdrl.netlify.app` and the logistics planner is on `dailychessmap.netlify.app`, they're different domains.

The fix above tells Netlify to allow your dashboard to embed the logistics planner.
