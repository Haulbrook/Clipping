// =============================
// 📋 Configuration
// =============================
const CONFIG = {
  INVENTORY_SHEET_ID: "18qeP1XG9sDtknL3UKc7bb2utHvnJNpYNKkfMNsSVDRQ", // Replace with your actual sheet ID
  KNOWLEDGE_BASE_SHEET_ID: "1I8Wp0xfcQCHLeJyIPsQoM2moebZUy35zNGBLzDLpl8Q", // Replace with your knowledge base sheet ID
  TRUCK_SHEET_ID: "1AmyIFL74or_Nh0QLMu_n18YosrSP9E4EA6k5MTzlq1Y", // Replace with your truck sheet ID
  INVENTORY_SHEET_NAME: "Sheet1",
  KNOWLEDGE_SHEET_NAME: "Sheet1",
  TRUCK_SHEET_NAME: "Master",
  OPENAI_API_KEY: "", // Replace with your actual API key
  OPENAI_MODEL: "gpt-4",
  SYSTEM_PROMPT: "You are the internal operations assistant for Deep Roots Landscape, a landscaping company. " +
    "You help team members with inventory management, fleet tracking, and operational questions.\n\n" +
    "CONTEXT:\n" +
    "- You support field crews, managers, and office staff with real-time operational data\n" +
    "- Primary focus: plant/material inventory, truck fleet status, and landscaping best practices\n" +
    "- Season-aware: Understanding that spring/summer are peak planting seasons, fall for maintenance, winter for equipment prep\n\n" +
    "YOUR ROLE:\n" +
    "1. When asked about inventory: Focus on availability, location, and quantities. Flag low stock items. Suggest alternatives if something is unavailable.\n" +
    "2. When asked about trucks/fleet: Provide status, maintenance schedules, and availability for job assignments\n" +
    "3. For general landscaping questions: Give practical, experience-based advice suitable for professionals\n\n" +
    "COMMUNICATION STYLE:\n" +
    "- Talk like a knowledgeable coworker, not a customer service rep\n" +
    "- Be direct and action-oriented (\"Check Shed B\" not \"You may want to consider looking in Shed B\")\n" +
    "- Use industry terminology (flats, plugs, B&B, hardscape, etc.)\n" +
    "- Include relevant details professionals need (plant spacing, coverage rates, application rates)\n\n" +
    "RESPONSE PRIORITIES:\n" +
    "1. Safety warnings first (expired chemicals, equipment issues, weather concerns)\n" +
    "2. Availability/status information\n" +
    "3. Location and logistics\n" +
    "4. Professional tips or alternatives\n" +
    "5. Next steps or actions needed\n\n" +
    "EXAMPLES OF GOOD RESPONSES:\n" +
    "- \"We're low on Red Mulch - only 15 bags left in Shed A. Similar stock: Brown Mulch (40 bags) in Shed B.\"\n" +
    "- \"Truck 2 is due for oil change this week. Truck 1 and 3 are available for tomorrow's jobs.\"\n" +
    "- \"For that 2,000 sq ft area, you'll need about 6 yards of mulch at 3\" depth. We have 8 yards in stock.\"\n" +
    "- \"Those Emerald Greens are 5-gallon, about 3-4' tall. Space them 3' apart for privacy hedge. We have 45 in the back row.\"\n\n" +
    "WHEN YOU DON'T HAVE SPECIFIC DATA:\n" +
    "- Suggest where to check physically (\"Check the overflow area behind Shed C\")\n" +
    "- Recommend who to contact (\"Maria tracks the special orders\")\n" +
    "- Provide general industry standards if applicable\n" +
    "- Flag if something seems unusual or concerning\n\n" +
    "SEASONAL AWARENESS:\n" +
    "- Spring: Focus on planting stock, fertilizer availability, equipment readiness\n" +
    "- Summer: Water management, heat-stressed plant care, maintenance supplies\n" +
    "- Fall: Cleanup equipment, winter prep materials, late-season plantings\n" +
    "- Winter: Salt/sand inventory, equipment maintenance, spring prep orders\n\n" +
    "Remember: The team relies on you for quick, accurate operational support. Be helpful, practical, and always think about what helps get the job done safely and efficiently.",
  CACHE_DURATION: 1200 // 20 minutes in seconds
};

// =============================
// 🔧 Setup and Diagnostic Functions
// =============================
function setupSheets() {
  // This function helps you get the correct sheet ID
  try {
    // Create a new sheet if needed
    const ss = SpreadsheetApp.create("Clippings Inventory");
    const sheet = ss.getActiveSheet();
    
    // Set up headers with new Min Stock column
    sheet.getRange(1, 1, 1, 6).setValues([["Item Name", "Quantity", "Unit", "Location", "Notes", "Min Stock"]]);
    
    // Add sample data with minimum stock levels
    sheet.getRange(2, 1, 3, 6).setValues([
      ["Mulch - Red", "50", "bags", "Shed A", "Premium grade", "20"],
      ["Fertilizer - 10-10-10", "25", "bags", "Shed B", "All-purpose", "15"],
      ["Grass Seed - Sun & Shade", "10", "bags", "Office", "50lb bags", "5"]
    ]);
    
    // Format headers
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#4CAF50").setFontColor("white");
    
    const sheetId = ss.getId();
    const sheetUrl = ss.getUrl();
    
    Logger.log("✅ New inventory sheet created!");
    Logger.log("Sheet ID: " + sheetId);
    Logger.log("Sheet URL: " + sheetUrl);
    Logger.log("Copy the Sheet ID above and paste it in CONFIG.INVENTORY_SHEET_ID");
    
    return {
      id: sheetId,
      url: sheetUrl
    };
    
  } catch (error) {
    Logger.log("Error creating sheet: " + error.toString());
    return null;
  }
}

function setupTruckSheet() {
  try {
    const ss = SpreadsheetApp.create("Deep Roots Fleet Information");
    const sheet = ss.getActiveSheet();
    
    // Set up headers for truck information
    sheet.getRange(1, 1, 1, 8).setValues([[
      "Truck Name/ID", 
      "Model", 
      "Year", 
      "License Plate", 
      "Status", 
      "Last Maintenance", 
      "Next Maintenance Due",
      "Notes"
    ]]);
    
    // Add sample data
    sheet.getRange(2, 1, 2, 8).setValues([
      ["Truck 1", "Ford F-150", "2020", "ABC-1234", "Active", "10/15/2024", "01/15/2025", "Oil change due soon"],
      ["Truck 2", "Chevy Silverado", "2019", "XYZ-5678", "In Maintenance", "11/01/2024", "02/01/2025", "Brake inspection needed"]
    ]);
    
    // Format headers
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#1E88E5").setFontColor("white");
    
    const sheetId = ss.getId();
    const sheetUrl = ss.getUrl();
    
    Logger.log("✅ New truck sheet created!");
    Logger.log("Sheet ID: " + sheetId);
    Logger.log("Sheet URL: " + sheetUrl);
    Logger.log("Copy the Sheet ID above and paste it in CONFIG.TRUCK_SHEET_ID");
    
    return {
      id: sheetId,
      url: sheetUrl
    };
    
  } catch (error) {
    Logger.log("Error creating truck sheet: " + error.toString());
    return null;
  }
}

// Add Min Stock column to existing sheet
function addMinStockColumn() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    
    // Check if Min Stock column already exists
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers.includes("Min Stock")) {
      Logger.log("Min Stock column already exists");
      return;
    }
    
    // Add the header
    const newCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, newCol).setValue("Min Stock");
    sheet.getRange(1, newCol).setFontWeight("bold").setBackground("#4CAF50").setFontColor("white");
    
    // Set default minimum stock levels (10 for all items)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const defaultValues = [];
      for (let i = 2; i <= lastRow; i++) {
        defaultValues.push([10]); // Default minimum of 10
      }
      sheet.getRange(2, newCol, lastRow - 1, 1).setValues(defaultValues);
    }
    
    Logger.log("✅ Min Stock column added successfully");
    
  } catch (error) {
    Logger.log("Error adding Min Stock column: " + error.toString());
  }
}

// =============================
// 🌐 Entry Point: Web App
// =============================
function doGet(e) {
  // This is the backend API - the dashboard is deployed separately to GitHub Pages
  // If someone visits this URL directly, show them a helpful message

  var html = '<html><head><style>' +
    'body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }' +
    'h1 { color: #4CAF50; }' +
    'code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }' +
    '.status { color: #4CAF50; font-weight: bold; }' +
    '.section { background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; }' +
    '</style></head><body>' +
    '<h1>🌱 Deep Roots Inventory Backend API</h1>' +
    '<p class="status">✅ Backend is running!</p>' +
    '<div class="section">' +
    '<h2>📋 This is the backend API</h2>' +
    '<p>This Google Apps Script handles inventory data, fleet tracking, and operational queries.</p>' +
    '<p><strong>Frontend Dashboard:</strong> Deploy the dashboard files to GitHub Pages or Netlify</p>' +
    '<p><strong>Configuration:</strong> Update <code>config.json</code> with this URL:</p>' +
    '<code>' + ScriptApp.getService().getUrl() + '</code>' +
    '</div>' +
    '<div class="section">' +
    '<h2>🧪 Test the API</h2>' +
    '<p>Send a POST request to this URL with JSON body:</p>' +
    '<pre>{\n  "function": "getInventoryReport",\n  "parameters": []\n}</pre>' +
    '</div>' +
    '<div class="section">' +
    '<h2>📖 Available Functions</h2>' +
    '<ul>' +
    '<li><code>askInventory</code> - Search inventory</li>' +
    '<li><code>getInventoryReport</code> - Get full inventory report</li>' +
    '<li><code>getFleetReport</code> - Get truck fleet status</li>' +
    '<li><code>checkLowStock</code> - Check items low on stock</li>' +
    '<li><code>updateInventory</code> - Update inventory quantities</li>' +
    '</ul>' +
    '</div>' +
    '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle("Deep Roots Inventory Backend API");
}

// =============================
// 🌐 API Endpoint: Handle POST requests from dashboard
// =============================
function doPost(e) {
  try {
    // Parse incoming request
    const data = JSON.parse(e.postData.contents);
    const functionName = data.function;
    const params = data.parameters || [];

    Logger.log("API Call: " + functionName + " with params: " + JSON.stringify(params));

    // Route to the correct function
    let result;
    switch(functionName) {
      case 'askInventory':
        result = askInventory(params[0]);
        break;

      case 'updateInventory':
        result = updateInventory(params[0]);
        break;

      case 'searchTruckInfo':
        result = searchTruckInfo(params[0]);
        break;

      case 'searchKnowledgeBase':
        result = searchKnowledgeBase(params[0]);
        break;

      case 'getInventoryReport':
        result = getInventoryReport();
        break;

      case 'getFleetReport':
        result = getFleetReport();
        break;

      case 'checkLowStock':
        result = checkLowStock();
        break;

      case 'batchImportItems':
        result = batchImportItems(params[0]);
        break;

      case 'findDuplicates':
        result = findDuplicates();
        break;

      case 'mergeDuplicates':
        result = mergeDuplicates(params[0], params[1], params[2]);
        break;

      default:
        throw new Error('Unknown function: ' + functionName);
    }

    // Return successful response
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        response: result
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("API Error: " + error.toString());

    // Return error response
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: {
          message: error.toString(),
          stack: error.stack
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================
// 🔍 Master Function - Multi-tier search
// =============================
function askInventory(query) {
  if (!query || query.trim() === "") {
    return { answer: "Please provide a search query.", source: "error" };
  }
  
  try {
    // Check if query is truck-related
    const truckKeywords = ['truck', 'vehicle', 'fleet', 'license', 'maintenance', 'ford', 'chevy', 'gmc', 'silverado', 'f-150', 'f150'];
    const queryLower = query.toLowerCase();
    const isTruckQuery = truckKeywords.some(keyword => queryLower.includes(keyword));
    
    // 1. If truck-related, search trucks first
    if (isTruckQuery && CONFIG.TRUCK_SHEET_ID !== "YOUR_TRUCK_SHEET_ID_HERE") {
      const truckAnswer = searchTruckInfo(query);
      if (truckAnswer) {
        return { answer: truckAnswer, source: "trucks" };
      }
    }
    
    // 2. Check inventory with fuzzy matching
    const inventoryAnswer = searchInventory(query);
    if (inventoryAnswer) {
      return { answer: inventoryAnswer, source: "inventory" };
    }
    
    // 3. If not truck-specific, also try truck database
    if (!isTruckQuery && CONFIG.TRUCK_SHEET_ID !== "YOUR_TRUCK_SHEET_ID_HERE") {
      const truckAnswer = searchTruckInfo(query);
      if (truckAnswer) {
        return { answer: truckAnswer, source: "trucks" };
      }
    }
    
    // 4. Check knowledge base
    const knowledgeAnswer = searchKnowledgeBase(query);
    if (knowledgeAnswer) {
      return { answer: knowledgeAnswer, source: "knowledge" };
    }
    
    // 5. Fallback to OpenAI (only if API key is configured)
    if (CONFIG.OPENAI_API_KEY && CONFIG.OPENAI_API_KEY !== "YOUR_OPENAI_API_KEY_HERE") {
      const aiAnswer = askOpenAI(query);
      return { answer: aiAnswer, source: "ai" };
    } else {
      return { 
        answer: "No matching items found in inventory, trucks, or knowledge base. OpenAI integration not configured.", 
        source: "none" 
      };
    }
    
  } catch (error) {
    Logger.log("Error in askInventory: " + error.toString());
    return { 
      answer: "I apologize, but I encountered an error while searching. Please try again or contact support.", 
      source: "error" 
    };
  }
}

// =============================
// 📦 Enhanced Inventory Search with Fuzzy Matching and Quantity Detection
// =============================
function searchInventory(query) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = "inventory_" + query.toLowerCase();
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) return null; // No data beyond headers
    
    // Parse quantity request from query
    const quantityRequest = parseQuantityFromQuery(query);
    
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/);
    const results = [];
    
    // Skip header row (index 0)
    for (let i = 1; i < data.length; i++) {
      const itemRaw = String(data[i][0] || "").trim();
      const itemLower = itemRaw.toLowerCase();
      
      if (!itemRaw) continue;
      
      // Calculate match score with pluralization handling
      let matchScore = 0;
      
      // Exact match
      if (itemLower === queryLower) {
        matchScore = 100;
      } 
      // Contains full query
      else if (itemLower.includes(queryLower)) {
        matchScore = 80;
      }
      // Check with pluralization handling
      else {
        const normalizedItem = normalizePlural(itemLower);
        const normalizedQuery = normalizePlural(queryLower);
        
        if (normalizedItem === normalizedQuery) {
          matchScore = 95;
        } else if (normalizedItem.includes(normalizedQuery)) {
          matchScore = 75;
        } else {
          // Check individual words with pluralization
          const normalizedQueryWords = queryWords.map(w => normalizePlural(w));
          const itemWords = normalizedItem.split(/\s+/);
          
          if (normalizedQueryWords.every(word => 
            itemWords.some(iWord => iWord.includes(word) || word.includes(iWord))
          )) {
            matchScore = 60;
          } else {
            const matchedWords = normalizedQueryWords.filter(word => 
              itemWords.some(iWord => iWord.includes(word) || word.includes(iWord))
            );
            matchScore = (matchedWords.length / normalizedQueryWords.length) * 50;
          }
        }
      }
      
      if (matchScore > 30) { // Threshold for relevance
        const quantity = parseInt(data[i][1]) || 0;
        const unit = data[i][2] || "";
        const location = data[i][3] || "Unspecified";
        const notes = data[i][4] || "";
        const minStock = parseInt(data[i][5]) || 10;
        
        // Check if item is low on stock
        const isLowStock = quantity < minStock;
        
        // Check if requested quantity exceeds available
        let availabilityStatus = null;
        if (quantityRequest && quantityRequest.unit && 
            (unit.toLowerCase() === quantityRequest.unit.toLowerCase() || 
             normalizePlural(unit.toLowerCase()) === normalizePlural(quantityRequest.unit.toLowerCase()))) {
          if (quantity >= quantityRequest.quantity) {
            availabilityStatus = `✓ Have ${quantity} ${unit} in stock (requested ${quantityRequest.quantity})`;
          } else {
            availabilityStatus = `✗ Only ${quantity} ${unit} available (requested ${quantityRequest.quantity})`;
          }
        }
        
        results.push({
          item: itemRaw,
          quantity: quantity,
          unit: unit,
          location: location,
          notes: notes,
          minStock: minStock,
          isLowStock: isLowStock,
          availabilityStatus: availabilityStatus,
          score: matchScore
        });
      }
    }
    
    if (results.length === 0) {
      return null;
    }
    
    // Sort by match score
    results.sort((a, b) => b.score - a.score);
    
    // Format results
    let response = "";
    
    // Add summary if multiple results
    if (results.length > 1) {
      response = `Found ${results.length} matching items:\n\n`;
    }
    
    // Include ALL results
    response += results.map(r => {
      let entry = `• ${r.item}: Quantity: ${r.quantity} ${r.unit}`;
      
      // Add availability status if showing
      if (r.availabilityStatus) {
        // Add the availability status as a prefix
        return `${r.availabilityStatus}\n${entry} • Location: ${r.location}${r.notes ? ' • Notes: ' + r.notes : ''}`;
      }
      
      // Add low stock warning if applicable
      if (r.isLowStock) {
        entry = `⚠️ ${entry} [LOW STOCK - Min: ${r.minStock}]`;
      }
      
      if (r.location && r.location !== "Unspecified") {
        entry += ` • Location: ${r.location}`;
      }
      if (r.notes) {
        entry += ` • Notes: ${r.notes}`;
      }
      return entry;
    }).join("\n");
    
    // Cache the result
    cache.put(cacheKey, response, CONFIG.CACHE_DURATION);
    
    return response;
    
  } catch (error) {
    Logger.log("Error in searchInventory: " + error.toString());
    return null;
  }
}

// Parse quantity from search query
function parseQuantityFromQuery(query) {
  // Match patterns like "5 yards", "10 plants", "need 5 yards"
  const patterns = [
    /(\d+)\s*(?:yards?|yds?)/i,
    /(\d+)\s*(?:plants?|flats?|bags?|gallons?|pounds?|lbs?|each)/i,
    /need\s+(\d+)\s*(?:yards?|yds?|plants?|flats?|bags?|gallons?|pounds?|lbs?|each)?/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const quantity = parseInt(match[1]);
      // Extract unit from the match
      const unitMatch = match[0].match(/(?:yards?|yds?|plants?|flats?|bags?|gallons?|pounds?|lbs?|each)/i);
      const unit = unitMatch ? unitMatch[0].toLowerCase() : null;
      
      return {
        quantity: quantity,
        unit: normalizeUnit(unit)
      };
    }
  }
  
  return null;
}

// Normalize units to standard forms
function normalizeUnit(unit) {
  if (!unit) return null;
  
  const unitMap = {
    'yard': 'yards',
    'yards': 'yards',
    'yd': 'yards',
    'yds': 'yards',
    'plant': 'plants',
    'plants': 'plants',
    'flat': 'flats',
    'flats': 'flats',
    'bag': 'bags',
    'bags': 'bags',
    'gallon': 'gallons',
    'gallons': 'gallons',
    'pound': 'pounds',
    'pounds': 'pounds',
    'lb': 'pounds',
    'lbs': 'pounds',
    'each': 'each'
  };
  
  return unitMap[unit.toLowerCase()] || unit;
}

// Normalize plural forms for matching
function normalizePlural(text) {
  // Common landscaping plurals
  const pluralMap = {
    'plants': 'plant',
    'boxes': 'box',
    'grasses': 'grass',
    'leaves': 'leaf',
    'mulches': 'mulch',
    'soils': 'soil',
    'stones': 'stone',
    'rocks': 'rock',
    'flowers': 'flower',
    'trees': 'tree',
    'shrubs': 'shrub',
    'bushes': 'bush',
    'perennials': 'perennial',
    'annuals': 'annual',
    'bags': 'bag',
    'flats': 'flat',
    'yards': 'yard',
    'pounds': 'pound',
    'gallons': 'gallon'
  };
  
  // First, try direct mapping
  let normalized = text;
  for (const [plural, singular] of Object.entries(pluralMap)) {
    normalized = normalized.replace(new RegExp(`\\b${plural}\\b`, 'g'), singular);
  }
  
  // Then handle general 's' endings
  normalized = normalized.replace(/(\w+)s\b/g, (match, word) => {
    // Don't remove 's' from words like 'grass', 'mass', etc.
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) {
      return match;
    }
    return word;
  });
  
  return normalized;
}

// =============================
// 🚛 Truck Information Search
// =============================
function searchTruckInfo(query) {
  try {
    // Check if truck sheet is configured
    if (!CONFIG.TRUCK_SHEET_ID || CONFIG.TRUCK_SHEET_ID === "YOUR_TRUCK_SHEET_ID_HERE") {
      return null;
    }
    
    const cache = CacheService.getScriptCache();
    const cacheKey = "truck_" + query.toLowerCase();
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.TRUCK_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.TRUCK_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) return null;
    
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/);
    const results = [];
    
    // Process each truck row
    for (let i = 1; i < data.length; i++) {
      const truckName = String(data[i][0] || "").toLowerCase();
      const model = String(data[i][1] || "").toLowerCase();
      const year = String(data[i][2] || "").toLowerCase();
      const licensePlate = String(data[i][3] || "").toLowerCase();
      const status = String(data[i][4] || "").toLowerCase();
      const lastMaintenance = String(data[i][5] || "");
      const nextMaintenance = String(data[i][6] || "");
      const notes = String(data[i][7] || "").toLowerCase();
      
      // Create searchable text from all fields
      const searchableText = `${truckName} ${model} ${year} ${licensePlate} ${status} ${notes}`;
      
      // Calculate match score
      let matchScore = 0;
      
      // Check for exact matches
      if (truckName === queryLower || licensePlate === queryLower) {
        matchScore = 100;
      }
      // Check if query appears in any field
      else if (searchableText.includes(queryLower)) {
        matchScore = 80;
      }
      // Check individual words
      else if (queryWords.every(word => searchableText.includes(word))) {
        matchScore = 60;
      }
      else {
        const matchedWords = queryWords.filter(word => searchableText.includes(word));
        matchScore = (matchedWords.length / queryWords.length) * 50;
      }
      
      if (matchScore > 30) {
        results.push({
          truck: data[i][0],
          model: data[i][1],
          year: data[i][2],
          licensePlate: data[i][3],
          status: data[i][4],
          lastMaintenance: lastMaintenance,
          nextMaintenance: nextMaintenance,
          notes: data[i][7],
          score: matchScore
        });
      }
    }
    
    if (results.length === 0) {
      return null;
    }
    
    // Sort by match score
    results.sort((a, b) => b.score - a.score);
    
    // Format results
    let response = "";
    
    if (results.length > 1) {
      response = `Found ${results.length} matching trucks:\n\n`;
    }
    
    response += results.map(r => {
      let entry = `🚛 ${r.truck}`;
      entry += `\n   Model: ${r.model}`;
      entry += `\n   Year: ${r.year}`;
      entry += `\n   License: ${r.licensePlate}`;
      entry += `\n   Status: ${r.status}`;
      if (r.lastMaintenance) {
        entry += `\n   Last Maintenance: ${r.lastMaintenance}`;
      }
      if (r.nextMaintenance) {
        entry += `\n   Next Maintenance: ${r.nextMaintenance}`;
      }
      if (r.notes) {
        entry += `\n   Notes: ${r.notes}`;
      }
      return entry;
    }).join("\n\n");
    
    // Cache the result
    cache.put(cacheKey, response, CONFIG.CACHE_DURATION);
    
    return response;
    
  } catch (error) {
    Logger.log("Error in searchTruckInfo: " + error.toString());
    return null;
  }
}

// =============================
// 📚 Knowledge Base Search
// =============================
function searchKnowledgeBase(query) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = "knowledge_" + query.toLowerCase();
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const sheet = SpreadsheetApp.openById(CONFIG.KNOWLEDGE_BASE_SHEET_ID)
                               .getSheetByName(CONFIG.KNOWLEDGE_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (let i = 1; i < data.length; i++) {
      const question = String(data[i][0] || "").toLowerCase();
      const answer = data[i][1];
      
      if (!question || !answer) continue;
      
      // Calculate relevance score
      let score = 0;
      
      // Exact match
      if (question === queryLower) {
        score = 100;
      }
      // Question contains query
      else if (question.includes(queryLower)) {
        score = 80;
      }
      // All words match
      else if (queryWords.every(word => question.includes(word))) {
        score = 60;
      }
      // Partial word matches
      else {
        const matchedWords = queryWords.filter(word => question.includes(word));
        score = (matchedWords.length / queryWords.length) * 50;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = answer;
      }
    }
    
    if (bestMatch && bestScore > 40) { // Threshold for relevance
      cache.put(cacheKey, bestMatch, CONFIG.CACHE_DURATION);
      return bestMatch;
    }
    
    return null;
    
  } catch (error) {
    Logger.log("Error in searchKnowledgeBase: " + error.toString());
    return null;
  }
}

// =============================
// 🤖 OpenAI Integration
// =============================
function askOpenAI(query) {
  try {
    // Check if API key is configured
    if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
      return "OpenAI integration not configured. Please add your API key to use AI responses.";
    }
    
    const url = "https://api.openai.com/v1/chat/completions";
    
    const messages = [
      {
        role: "system",
        content: CONFIG.SYSTEM_PROMPT
      },
      {
        role: "user",
        content: query
      }
    ];
    
    const payload = {
      model: CONFIG.OPENAI_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${CONFIG.OPENAI_API_KEY}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    if (json.error) {
      Logger.log("OpenAI Error: " + JSON.stringify(json.error));
      return "I'm having trouble connecting to my AI assistant. Please check the API key or try again later.";
    }
    
    return json.choices[0].message.content.trim();
    
  } catch (error) {
    Logger.log("Error in askOpenAI: " + error.toString());
    return "I apologize, but I'm unable to process your request at the moment. Please try again later.";
  }
}

// =============================
// 📝 Inventory Update Functions
// =============================
function updateInventory(updateData) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    
    // Clear cache since we're updating
    CacheService.getScriptCache().removeAll([]);
    
    switch (updateData.action) {
      case 'add':
        return addInventory(sheet, updateData);
      case 'subtract':
        return subtractInventory(sheet, updateData);
      case 'update':
        return updateItemInfo(sheet, updateData);
      default:
        return { success: false, message: "Invalid action specified." };
    }
  } catch (error) {
    Logger.log("Error in updateInventory: " + error.toString());
    return { success: false, message: "Error updating inventory: " + error.toString() };
  }
}

// Add new inventory items or increase existing quantity
function addInventory(sheet, data) {
  const allData = sheet.getDataRange().getValues();
  const itemNameLower = data.itemName.toLowerCase();
  
  // Check if item already exists
  let itemRow = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]).toLowerCase() === itemNameLower) {
      itemRow = i;
      break;
    }
  }
  
  if (itemRow > -1) {
    // Item exists - update quantity
    const currentQty = parseInt(allData[itemRow][1]) || 0;
    const newQty = currentQty + data.quantity;
    sheet.getRange(itemRow + 1, 2).setValue(newQty);
    
    // Update location and notes if provided
    if (data.location) {
      sheet.getRange(itemRow + 1, 4).setValue(data.location);
    }
    if (data.notes) {
      sheet.getRange(itemRow + 1, 5).setValue(data.notes);
    }
    
    // Log the transaction
    logTransaction(sheet, {
      timestamp: new Date(),
      action: "ADD",
      item: data.itemName,
      quantity: data.quantity,
      unit: data.unit,
      newTotal: newQty,
      notes: `Added ${data.quantity} ${data.unit}`
    });
    
    return { 
      success: true, 
      message: `✅ Added ${data.quantity} ${data.unit} of ${data.itemName}. New total: ${newQty} ${data.unit}` 
    };
  } else {
    // New item - add row
    const newRow = [
      data.itemName,
      data.quantity,
      data.unit,
      data.location || "Unspecified",
      data.notes || "",
      data.minStock || "10" // Default minimum stock of 10
    ];
    sheet.appendRow(newRow);
    
    // Log the transaction
    logTransaction(sheet, {
      timestamp: new Date(),
      action: "NEW",
      item: data.itemName,
      quantity: data.quantity,
      unit: data.unit,
      newTotal: data.quantity,
      notes: "New item added"
    });
    
    return { 
      success: true, 
      message: `✅ Added new item: ${data.itemName} (${data.quantity} ${data.unit})` 
    };
  }
}

// Subtract inventory (sold or died)
function subtractInventory(sheet, data) {
  const allData = sheet.getDataRange().getValues();
  const itemNameLower = data.itemName.toLowerCase();
  
  // Find the item
  let itemRow = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]).toLowerCase() === itemNameLower) {
      itemRow = i;
      break;
    }
  }
  
  if (itemRow === -1) {
    return { 
      success: false, 
      message: `❌ Item "${data.itemName}" not found in inventory.` 
    };
  }
  
  const currentQty = parseInt(allData[itemRow][1]) || 0;
  const newQty = currentQty - data.quantity;
  
  if (newQty < 0) {
    return { 
      success: false, 
      message: `❌ Cannot remove ${data.quantity} ${data.unit}. Only ${currentQty} ${data.unit} available.` 
    };
  }
  
  // Update quantity
  sheet.getRange(itemRow + 1, 2).setValue(newQty);
  
  // Log the transaction
  logTransaction(sheet, {
    timestamp: new Date(),
    action: "REMOVE",
    item: data.itemName,
    quantity: data.quantity,
    unit: data.unit,
    newTotal: newQty,
    notes: `Reason: ${data.reason}`
  });
  
  return { 
    success: true, 
    message: `✅ Removed ${data.quantity} ${data.unit} of ${data.itemName}. Remaining: ${newQty} ${data.unit}` 
  };
}

// Update item information (location, notes, min stock)
function updateItemInfo(sheet, data) {
  const allData = sheet.getDataRange().getValues();
  const itemNameLower = data.itemName.toLowerCase();
  
  // Find the item
  let itemRow = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]).toLowerCase() === itemNameLower) {
      itemRow = i;
      break;
    }
  }
  
  if (itemRow === -1) {
    return { 
      success: false, 
      message: `❌ Item "${data.itemName}" not found in inventory.` 
    };
  }
  
  // Update location, notes, and min stock
  const updates = [];
  if (data.location) {
    sheet.getRange(itemRow + 1, 4).setValue(data.location);
    updates.push(`location to "${data.location}"`);
  }
  if (data.notes) {
    sheet.getRange(itemRow + 1, 5).setValue(data.notes);
    updates.push(`notes to "${data.notes}"`);
  }
  if (data.minStock !== undefined && data.minStock !== null) {
    sheet.getRange(itemRow + 1, 6).setValue(data.minStock);
    updates.push(`minimum stock to ${data.minStock}`);
  }
  
  if (updates.length === 0) {
    return { 
      success: false, 
      message: "❌ No updates provided. Please enter location, notes, or minimum stock to update." 
    };
  }
  
  // Log the transaction
  logTransaction(sheet, {
    timestamp: new Date(),
    action: "UPDATE",
    item: data.itemName,
    quantity: allData[itemRow][1],
    unit: allData[itemRow][2],
    newTotal: allData[itemRow][1],
    notes: `Updated ${updates.join(' and ')}`
  });
  
  return { 
    success: true, 
    message: `✅ Updated ${data.itemName}: ${updates.join(' and ')}` 
  };
}

// Log transactions to a separate sheet for history
function logTransaction(inventorySheet, transaction) {
  try {
    const ss = inventorySheet.getParent();
    let logSheet = ss.getSheetByName("Transaction Log");
    
    // Create log sheet if it doesn't exist
    if (!logSheet) {
      logSheet = ss.insertSheet("Transaction Log");
      // Set headers
      logSheet.getRange(1, 1, 1, 7).setValues([[
        "Timestamp", "Action", "Item", "Quantity", "Unit", "New Total", "Notes"
      ]]);
      logSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#4CAF50").setFontColor("white");
    }
    
    // Add transaction
    logSheet.appendRow([
      transaction.timestamp,
      transaction.action,
      transaction.item,
      transaction.quantity,
      transaction.unit,
      transaction.newTotal,
      transaction.notes
    ]);
    
  } catch (error) {
    Logger.log("Error logging transaction: " + error.toString());
    // Don't fail the main operation if logging fails
  }
}

// Get inventory report with custom minimum stock levels
function getInventoryReport() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return "No inventory data found.";
    }
    
    let report = "📊 INVENTORY REPORT\n";
    report += "==================\n\n";
    
    // Group by location
    const byLocation = {};
    let totalItems = 0;
    let lowStockItems = [];
    let criticalStockItems = []; // Items at 0 or negative
    
    for (let i = 1; i < data.length; i++) {
      const item = data[i][0];
      const quantity = parseInt(data[i][1]) || 0;
      const unit = data[i][2];
      const location = data[i][3] || "Unspecified";
      const minStock = parseInt(data[i][5]) || 10; // Custom minimum or default to 10
      
      if (!item) continue;
      
      totalItems++;
      
      // Check stock levels
      if (quantity <= 0) {
        criticalStockItems.push(`${item}: ${quantity} ${unit} (Min: ${minStock})`);
      } else if (quantity < minStock) {
        lowStockItems.push(`${item}: ${quantity} ${unit} (Min: ${minStock})`);
      }
      
      // Group by location
      if (!byLocation[location]) {
        byLocation[location] = [];
      }
      byLocation[location].push(`${item}: ${quantity} ${unit}`);
    }
    
    // Summary
    report += `Total Items: ${totalItems}\n`;
    report += `Locations: ${Object.keys(byLocation).length}\n\n`;
    
    // Critical stock alert (0 or negative)
    if (criticalStockItems.length > 0) {
      report += "🚨 CRITICAL - OUT OF STOCK:\n";
      criticalStockItems.forEach(item => {
        report += `  - ${item}\n`;
      });
      report += "\n";
    }
    
    // Low stock alert
    if (lowStockItems.length > 0) {
      report += "⚠️ LOW STOCK ALERT:\n";
      lowStockItems.forEach(item => {
        report += `  - ${item}\n`;
      });
      report += "\n";
    }
    
    // Items by location
    report += "📍 BY LOCATION:\n";
    for (const [location, items] of Object.entries(byLocation)) {
      report += `\n${location} (${items.length} items):\n`;
      items.forEach(item => {
        report += `  - ${item}\n`;
      });
    }
    
    return report;
    
  } catch (error) {
    Logger.log("Error generating report: " + error.toString());
    return "Error generating inventory report.";
  }
}

// Get fleet report
function getFleetReport() {
  try {
    // Check if truck sheet is configured
    if (!CONFIG.TRUCK_SHEET_ID || CONFIG.TRUCK_SHEET_ID === "YOUR_TRUCK_SHEET_ID_HERE") {
      return "Truck fleet tracking not configured. Run setupTruckSheet() to set up.";
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.TRUCK_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.TRUCK_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return "No fleet data found.";
    }
    
    let report = "🚛 FLEET REPORT\n";
    report += "================\n\n";
    
    let totalTrucks = 0;
    let activeTrucks = [];
    let maintenanceTrucks = [];
    let upcomingMaintenance = [];
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    for (let i = 1; i < data.length; i++) {
      const truckName = data[i][0];
      const model = data[i][1];
      const status = data[i][4];
      const nextMaintenance = data[i][6];
      
      if (!truckName) continue;
      
      totalTrucks++;
      
      // Group by status
      if (status && status.toLowerCase().includes("active")) {
        activeTrucks.push(`${truckName} (${model})`);
      } else if (status && status.toLowerCase().includes("maintenance")) {
        maintenanceTrucks.push(`${truckName} (${model})`);
      }
      
      // Check upcoming maintenance
      if (nextMaintenance) {
        try {
          const maintenanceDate = new Date(nextMaintenance);
          if (maintenanceDate <= thirtyDaysFromNow) {
            upcomingMaintenance.push(`${truckName}: ${nextMaintenance}`);
          }
        } catch (e) {
          // Skip if date parsing fails
        }
      }
    }
    
    // Summary
    report += `Total Fleet Size: ${totalTrucks}\n`;
    report += `Active: ${activeTrucks.length}\n`;
    report += `In Maintenance: ${maintenanceTrucks.length}\n\n`;
    
    // Active trucks
    if (activeTrucks.length > 0) {
      report += "✅ ACTIVE TRUCKS:\n";
      activeTrucks.forEach(truck => {
        report += `  - ${truck}\n`;
      });
      report += "\n";
    }
    
    // Trucks in maintenance
    if (maintenanceTrucks.length > 0) {
      report += "🔧 IN MAINTENANCE:\n";
      maintenanceTrucks.forEach(truck => {
        report += `  - ${truck}\n`;
      });
      report += "\n";
    }
    
    // Upcoming maintenance
    if (upcomingMaintenance.length > 0) {
      report += "📅 MAINTENANCE DUE (Next 30 Days):\n";
      upcomingMaintenance.forEach(item => {
        report += `  - ${item}\n`;
      });
    }
    
    return report;
    
  } catch (error) {
    Logger.log("Error generating fleet report: " + error.toString());
    return "Error generating fleet report.";
  }
}

// Check for low stock items and return alerts
function checkLowStock() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    const alerts = [];
    
    for (let i = 1; i < data.length; i++) {
      const item = data[i][0];
      const quantity = parseInt(data[i][1]) || 0;
      const unit = data[i][2];
      const minStock = parseInt(data[i][5]) || 10;
      
      if (!item) continue;
      
      if (quantity < minStock) {
        const percentOfMin = Math.round((quantity / minStock) * 100);
        alerts.push({
          item: item,
          quantity: quantity,
          unit: unit,
          minStock: minStock,
          percentOfMin: percentOfMin,
          needsOrdering: quantity < (minStock * 0.5) // Less than 50% of minimum
        });
      }
    }
    
    // Sort by percentage of minimum (lowest first)
    alerts.sort((a, b) => a.percentOfMin - b.percentOfMin);
    
    return alerts;
    
  } catch (error) {
    Logger.log("Error checking low stock: " + error.toString());
    return [];
  }
}

// =============================
// 🛠️ Utility Functions
// =============================

// Get Sheet ID from URL
function getSheetIdFromUrl() {
  // If you have the sheet open, this will get its ID
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      const id = ss.getId();
      Logger.log("Current sheet ID: " + id);
      Logger.log("Copy this ID and paste it in CONFIG.INVENTORY_SHEET_ID or CONFIG.TRUCK_SHEET_ID");
      return id;
    }
  } catch (error) {
    Logger.log("No active spreadsheet. Open your inventory or truck sheet and run this function again.");
  }
}

// Test access to inventory sheet
function testInventoryAccess() {
  try {
    // First check if the ID is set
    if (!CONFIG.INVENTORY_SHEET_ID || CONFIG.INVENTORY_SHEET_ID === "YOUR_SHEET_ID") {
      Logger.log("❌ ERROR: Please set your INVENTORY_SHEET_ID in the CONFIG object");
      Logger.log("Run setupSheets() to create a new sheet or getSheetIdFromUrl() to get an existing sheet's ID");
      return false;
    }
    
    // Try to open the sheet
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    
    if (!sheet) {
      Logger.log("❌ ERROR: Sheet named '" + CONFIG.INVENTORY_SHEET_NAME + "' not found");
      Logger.log("Available sheets: " + ss.getSheets().map(s => s.getName()).join(", "));
      return false;
    }
    
    const firstCell = sheet.getRange("A1").getValue();
    Logger.log("✅ Success! Connected to inventory sheet");
    Logger.log("First cell value: " + firstCell);
    Logger.log("Sheet name: " + sheet.getName());
    return true;
    
  } catch (error) {
    Logger.log("❌ ERROR: " + error.toString());
    Logger.log("Possible causes:");
    Logger.log("1. Invalid sheet ID - Check that CONFIG.INVENTORY_SHEET_ID is correct");
    Logger.log("2. No permission - Make sure you have access to the sheet");
    Logger.log("3. Sheet deleted - Verify the sheet still exists");
    return false;
  }
}

// Test access to truck sheet
function testTruckAccess() {
  try {
    if (!CONFIG.TRUCK_SHEET_ID || CONFIG.TRUCK_SHEET_ID === "YOUR_TRUCK_SHEET_ID_HERE") {
      Logger.log("❌ ERROR: Please set your TRUCK_SHEET_ID in the CONFIG object");
      Logger.log("Run setupTruckSheet() to create a new sheet");
      return false;
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.TRUCK_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.TRUCK_SHEET_NAME);
    
    if (!sheet) {
      Logger.log("❌ ERROR: Sheet named '" + CONFIG.TRUCK_SHEET_NAME + "' not found");
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log("✅ Success! Connected to truck sheet");
    Logger.log("Total trucks: " + (data.length - 1));
    
    return true;
    
  } catch (error) {
    Logger.log("❌ ERROR: " + error.toString());
    return false;
  }
}

// Test all connections
function testAllConnections() {
  Logger.log("========== TESTING ALL CONNECTIONS ==========");
  
  Logger.log("\n1. Testing Inventory Sheet:");
  const inventoryOK = testInventoryAccess();
  
  Logger.log("\n2. Testing Truck Sheet:");
  const truckOK = testTruckAccess();
  
  Logger.log("\n3. Testing Knowledge Base:");
  let knowledgeOK = false;
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.KNOWLEDGE_BASE_SHEET_ID)
                               .getSheetByName(CONFIG.KNOWLEDGE_SHEET_NAME);
    if (sheet) {
      Logger.log("✅ Success! Connected to knowledge base");
      knowledgeOK = true;
    }
  } catch (error) {
    Logger.log("❌ ERROR: Could not connect to knowledge base");
  }
  
  Logger.log("\n4. Testing OpenAI:");
  const openaiOK = CONFIG.OPENAI_API_KEY && CONFIG.OPENAI_API_KEY !== "YOUR_OPENAI_API_KEY_HERE";
  if (openaiOK) {
    Logger.log("✅ OpenAI API key is configured");
  } else {
    Logger.log("⚠️ OpenAI API key not configured (optional)");
  }
  
  Logger.log("\n========== SUMMARY ==========");
  Logger.log("Inventory: " + (inventoryOK ? "✅ OK" : "❌ Failed"));
  Logger.log("Trucks: " + (truckOK ? "✅ OK" : "❌ Failed"));
  Logger.log("Knowledge Base: " + (knowledgeOK ? "✅ OK" : "❌ Failed"));
  Logger.log("OpenAI: " + (openaiOK ? "✅ OK" : "⚠️ Not configured"));
}

// Clear cache manually if needed
function clearCache() {
  const cache = CacheService.getScriptCache();
  cache.removeAll([]);
  Logger.log("Cache cleared");
}

// List all available sheets in the spreadsheet
function listAllSheets() {
  try {
    if (!CONFIG.INVENTORY_SHEET_ID || CONFIG.INVENTORY_SHEET_ID === "YOUR_SHEET_ID") {
      Logger.log("Please set CONFIG.INVENTORY_SHEET_ID first");
      return;
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheets = ss.getSheets();
    
    Logger.log("Available sheets in this spreadsheet:");
    sheets.forEach((sheet, index) => {
      Logger.log(`${index + 1}. "${sheet.getName()}"`);
    });
    
  } catch (error) {
    Logger.log("Error: " + error.toString());
  }
}

// =============================
// 📋 Batch Import Functions
// =============================
function batchImportItems(importData) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    
    // Clear cache since we're adding multiple items
    CacheService.getScriptCache().removeAll([]);
    
    const lines = importData.split('\n').filter(line => line.trim());
    const results = [];
    
    for (const line of lines) {
      try {
        // Parse CSV-style input: "Item Name, Quantity, Unit, Location, Notes, Min Stock"
        const parts = line.split(',').map(p => p.trim());
        
        if (parts.length < 3) {
          results.push({
            line: line,
            success: false,
            message: "Invalid format. Need at least: Item Name, Quantity, Unit"
          });
          continue;
        }
        
        const itemData = {
          itemName: parts[0],
          quantity: parseInt(parts[1]) || 0,
          unit: parts[2],
          location: parts[3] || "Unspecified",
          notes: parts[4] || "",
          minStock: parseInt(parts[5]) || 10
        };
        
        // Add using existing function
        const result = addInventory(sheet, itemData);
        results.push({
          line: line,
          success: result.success,
          message: result.message
        });
        
      } catch (error) {
        results.push({
          line: line,
          success: false,
          message: "Error: " + error.toString()
        });
      }
    }
    
    return {
      success: true,
      results: results,
      summary: `Processed ${results.length} items: ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} failed`
    };
    
  } catch (error) {
    Logger.log("Error in batchImportItems: " + error.toString());
    return {
      success: false,
      message: "Error processing batch import: " + error.toString()
    };
  }
}

// =============================
// 🔍 Duplicate Detection Functions
// =============================
function findDuplicates() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) return { duplicates: [] };
    
    const potentialDuplicates = [];
    
    // Compare each item with every other item
    for (let i = 1; i < data.length; i++) {
      const item1 = String(data[i][0] || "").trim();
      if (!item1) continue;
      
      for (let j = i + 1; j < data.length; j++) {
        const item2 = String(data[j][0] || "").trim();
        if (!item2) continue;
        
        // Calculate similarity
        const similarity = calculateSimilarity(item1, item2);
        
        // If similarity is high, flag as potential duplicate
        if (similarity > 0.8) {
          potentialDuplicates.push({
            item1: {
              name: item1,
              row: i + 1,
              quantity: data[i][1],
              unit: data[i][2],
              location: data[i][3]
            },
            item2: {
              name: item2,
              row: j + 1,
              quantity: data[j][1],
              unit: data[j][2],
              location: data[j][3]
            },
            similarity: Math.round(similarity * 100)
          });
        }
      }
    }
    
    return {
      success: true,
      duplicates: potentialDuplicates
    };
    
  } catch (error) {
    Logger.log("Error in findDuplicates: " + error.toString());
    return {
      success: false,
      message: "Error finding duplicates: " + error.toString()
    };
  }
}

// Calculate similarity between two strings (Levenshtein distance based)
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Quick exact match
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = 1 - (distance / maxLength);
  
  // Boost similarity for common typos
  if (areCommonTypos(s1, s2)) {
    return Math.min(similarity + 0.2, 0.95);
  }
  
  return similarity;
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Check for common typos
function areCommonTypos(str1, str2) {
  // Remove common separators and check
  const clean1 = str1.replace(/[-\s_]/g, '');
  const clean2 = str2.replace(/[-\s_]/g, '');
  
  if (clean1 === clean2) return true;
  
  // Check for transposed letters (e.g., "teh" vs "the")
  if (str1.length === str2.length) {
    let differences = 0;
    for (let i = 0; i < str1.length - 1; i++) {
      if (str1[i] === str2[i + 1] && str1[i + 1] === str2[i]) {
        return true;
      }
      if (str1[i] !== str2[i]) differences++;
    }
    if (differences === 1) return true;
  }
  
  // Check for doubled letters (e.g., "arborvitae" vs "arborvittae")
  const withoutDoubles1 = str1.replace(/(.)\1+/g, '$1');
  const withoutDoubles2 = str2.replace(/(.)\1+/g, '$1');
  
  return withoutDoubles1 === withoutDoubles2;
}

// Merge duplicate items
function mergeDuplicates(item1Name, item2Name, keepFirst) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.INVENTORY_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    let item1Row = -1;
    let item2Row = -1;
    
    // Find the items
    for (let i = 1; i < data.length; i++) {
      const itemName = String(data[i][0] || "").trim();
      if (itemName === item1Name) item1Row = i;
      if (itemName === item2Name) item2Row = i;
    }
    
    if (item1Row === -1 || item2Row === -1) {
      return {
        success: false,
        message: "Could not find one or both items"
      };
    }
    
    const keepRow = keepFirst ? item1Row : item2Row;
    const deleteRow = keepFirst ? item2Row : item1Row;
    
    // Combine quantities
    const totalQuantity = (parseInt(data[item1Row][1]) || 0) + (parseInt(data[item2Row][1]) || 0);
    
    // Update the kept item with combined quantity
    sheet.getRange(keepRow + 1, 2).setValue(totalQuantity);
    
    // Delete the other row
    sheet.deleteRow(deleteRow + 1);
    
    // Clear cache
    CacheService.getScriptCache().removeAll([]);
    
    // Log the merge
    logTransaction(sheet, {
      timestamp: new Date(),
      action: "MERGE",
      item: keepFirst ? item1Name : item2Name,
      quantity: totalQuantity,
      unit: data[keepRow][2],
      newTotal: totalQuantity,
      notes: `Merged "${item1Name}" and "${item2Name}"`
    });
    
    return {
      success: true,
      message: `Merged items successfully. Total quantity: ${totalQuantity}`
    };
    
  } catch (error) {
    Logger.log("Error in mergeDuplicates: " + error.toString());
    return {
      success: false,
      message: "Error merging items: " + error.toString()
    };
  }
}
