# 🔍 Debugging Checklist - Tools Not Loading

## Step 1: Open Browser Console

1. Open your Netlify site
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Click **Clear console** button (🚫 icon) to start fresh

## Step 2: Check Initial Load

Look for these messages when the page loads:

```
✅ Expected:
🚀 Initializing Dashboard App...
✅ API Manager initialized with endpoints: Map(4)
✅ Dashboard button listener attached
✅ Chat button listener attached
Found 4 tool buttons
  Tool button 0: inventory
  Tool button 1: grading
  Tool button 2: scheduler
  Tool button 3: tools
✅ All tool listeners attached
✅ Dashboard App initialized successfully
```

**If you DON'T see these messages:**
- ❌ Problem: JavaScript isn't loading or has errors
- ⚠️ Action: Send me ALL the console errors you see

## Step 3: Click the "Repair vs Replace" Button

After clicking, you should see:

```
✅ Expected:
Tool button clicked: grading
🔧 Opening tool: grading
✅ Tool grading configured, loading: https://script.google.com/macros/s/AKfycbz6-tC9C...
```

**If you DON'T see "Tool button clicked: grading":**
- ❌ Problem: Event listener not attached or button not found
- ⚠️ Action: Type this in console and send me the result:
  ```javascript
  document.querySelectorAll('.tool-item').length
  ```

**If you see "Tool button clicked" but nothing else:**
- ❌ Problem: openTool() is failing
- ⚠️ Action: Type this in console and send me the result:
  ```javascript
  window.app.config.services.grading
  ```

## Step 4: Check if Iframe Loads

After clicking the tool button:

1. Look at the **Network** tab in DevTools
2. Look for a request to `script.google.com/macros/s/AKfycbz6...`
3. Check if it loads (status 200) or fails

**If the request fails:**
- ❌ Problem: CORS or tool URL issue
- ⚠️ Action: Click on the failed request and send me the error details

## Step 5: Quick Console Tests

Copy and paste each of these into the console and send me the results:

```javascript
// Test 1: Check if app exists
console.log('App exists:', typeof window.app !== 'undefined')

// Test 2: Check config loaded
console.log('Config loaded:', window.app?.config?.services ? 'YES' : 'NO')

// Test 3: Check grading tool URL
console.log('Grading URL:', window.app?.config?.services?.grading?.url)

// Test 4: Check event listeners
const buttons = document.querySelectorAll('.tool-item');
console.log('Tool buttons found:', buttons.length)
buttons.forEach((btn, i) => console.log(`  Button ${i}:`, btn.dataset.tool))

// Test 5: Check if toolContainer exists
console.log('Tool container exists:', document.getElementById('toolContainer') ? 'YES' : 'NO')

// Test 6: Check if iframe exists
console.log('Tool iframe exists:', document.getElementById('toolIframe') ? 'YES' : 'NO')
```

## What to Send Me

Please copy and paste:

1. **All console output** from Step 2 (initial load)
2. **All console output** from Step 3 (after clicking button)
3. **Results from Step 5** (console tests)
4. **Your Netlify site URL**
5. **Screenshot** if possible (optional but helpful)

This will help me identify exactly where the problem is!
