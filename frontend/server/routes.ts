import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getCachedResponse, setCachedResponse, getCacheStats } from "./redis";

export async function registerRoutes(app: Express): Promise<Server> {
  // Store for tracking async webhook responses - must be declared first
  const pendingRequests = new Map();

  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Test endpoint to simulate successful webhook response
  app.get("/api/test-webhook-response/:requestId", (req, res) => {
    const requestId = req.params.requestId;
    console.log('=== TEST WEBHOOK RESPONSE ===');
    console.log('Request ID:', requestId);
    
    const mockAnalysis = {
      residualAnalysis: "Based on the equipment specifications provided, this 2025 Volvo A30G demonstrates excellent market positioning with an estimated residual value of 72% after 24 months. The analysis indicates strong depreciation resistance typical of premium Volvo construction equipment.",
      recommendation: "APPROVED - Equipment shows exceptional residual value retention",
      marketFactors: "Strong Volvo brand recognition, robust dealer network, and high demand in construction sector",
      riskAssessment: "Low risk - Premium brand with proven track record",
      estimatedValue: "$365,580 (after 24 months)"
    };
    
    // Store the result for polling
    pendingRequests.set(requestId, {
      status: 'completed',
      result: mockAnalysis,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ success: true, message: 'Test analysis stored', requestId });
  });



  // Callback endpoint for n8n GET webhook responses with caching
  app.get("/api/webhook-callback/:requestId", async (req, res) => {
    const requestId = req.params.requestId;
    console.log('=== WEBHOOK GET CALLBACK RECEIVED ===');
    console.log('Request ID:', requestId);
    console.log('Headers:', req.headers);
    console.log('Query params:', req.query);
    console.log('Raw query:', req.url);
    console.log('=====================================');
    
    // Get the response from query parameters or body
    let responseData: any = req.query;
    
    // If there's a specific response parameter, use it
    if (req.query.response && typeof req.query.response === 'string') {
      try {
        responseData = JSON.parse(req.query.response);
      } catch (e) {
        responseData = req.query.response;
      }
    }
    
    // Extract item description for caching (try to get from stored request data)
    const pendingRequest = pendingRequests.get(requestId);
    const itemDescription = pendingRequest?.formData?.itemDescription || 'Unknown Equipment';
    
    // Cache the response for future requests
    await setCachedResponse(itemDescription, responseData);
    console.log(`💾 CACHED callback response for: ${itemDescription}`);
    
    // Store the result
    pendingRequests.set(requestId, {
      status: 'completed',
      result: responseData,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ success: true, message: 'Result received', requestId });
  });

  // Keep POST endpoint for backward compatibility
  app.post("/api/webhook-callback/:requestId", (req, res) => {
    const requestId = req.params.requestId;
    console.log('=== WEBHOOK POST CALLBACK RECEIVED ===');
    console.log('Request ID:', requestId);
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Raw body type:', typeof req.body);
    console.log('=====================================');
    
    // Store the result
    pendingRequests.set(requestId, {
      status: 'completed',
      result: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Result received', requestId });
  });

  // Alternative webhook result endpoint - for direct n8n HTTP Request node calls
  app.post("/api/webhook-result/:id", async (req, res) => {
    const { id } = req.params;
    console.log('=== DIRECT RESULT ENDPOINT CALLED ===');
    console.log('Result ID:', id);
    console.log('Result data:', req.body);
    
    // Extract item description for caching (try to get from stored request data)
    const pendingRequest = pendingRequests.get(id);
    const itemDescription = pendingRequest?.formData?.itemDescription || 'Unknown Equipment';
    
    // Cache the response for future requests
    await setCachedResponse(itemDescription, req.body);
    console.log(`💾 CACHED POST result for: ${itemDescription}`);
    
    // Also cache by request ID for better persistence
    await setCachedResponse(`request_${id}`, req.body);
    console.log(`💾 CACHED POST result by request ID: request_${id}`);
    
    // Store the result with the provided ID
    pendingRequests.set(id, {
      status: 'completed',
      result: req.body,
      completedAt: new Date().toISOString()
    });
    
    // IMPORTANT: Also try to find and update any existing requests that might match by timestamp
    // This handles cases where n8n uses just timestamp but frontend expects lesseeName_timestamp
    const allKeys = Array.from(pendingRequests.keys());
    for (const key of allKeys) {
      if (key.endsWith(`_${id}`) || key.includes(id)) {
        console.log(`Found matching pending request: ${key}, updating with result`);
        pendingRequests.set(key, {
          status: 'completed',
          result: req.body,
          completedAt: new Date().toISOString(),
          matchedFromId: id
        });
      }
    }
    
    console.log('Result stored. Request ID:', id);
    console.log('Current pending requests:', Array.from(pendingRequests.keys()));
    
    res.status(200).json({ success: true, message: 'Result received' });
  });

  // Polling endpoint to check for results
  app.get("/api/webhook-status/:requestId", async (req, res) => {
    const requestId = req.params.requestId;
    let result = pendingRequests.get(requestId);
    
    console.log(`Polling for request ID: ${requestId}`);
    console.log(`Current pending requests:`, Array.from(pendingRequests.keys()));
    console.log(`Direct result found:`, result ? 'YES' : 'NO');
    
    // If direct match found, return it
    if (result) {
      res.json(result);
      return;
    }
    
    // Try to find a partial match - n8n might use just the timestamp part
    // Extract timestamp from requestId (format: lesseeName_timestamp)
    const timestampMatch = requestId.match(/_(\d+)$/);
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      console.log(`Looking for results with timestamp: ${timestamp}`);
      
      // Check if any pending request matches this timestamp
      for (const [key, value] of pendingRequests.entries()) {
        if (key === timestamp || key.includes(timestamp)) {
          console.log(`Found matching result by timestamp: ${key}`);
          result = value;
          break;
        }
      }
    }
    
    if (result) {
      res.json(result);
      return;
    }
    
    // If not found in memory, check if we can find it in cache
    // First try by request ID, then by common equipment names
    console.log(`Checking cache for request_${requestId}`);
    const cachedByRequestId = await getCachedResponse(`request_${requestId}`);
    if (cachedByRequestId) {
      console.log(`Found cached data by request ID: request_${requestId}`);
      res.json({
        status: 'completed',
        result: cachedByRequestId,
        timestamp: new Date().toISOString(),
        source: 'cache_fallback_by_request_id'
      });
      return;
    }
    
    // Also try cache with just the timestamp part
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      const cachedByTimestamp = await getCachedResponse(`request_${timestamp}`);
      if (cachedByTimestamp) {
        console.log(`Found cached data by timestamp: ${timestamp}`);
        res.json({
          status: 'completed',
          result: cachedByTimestamp,
          timestamp: new Date().toISOString(),
          source: 'cache_fallback_by_timestamp'
        });
        return;
      }
    }
    
    // Fallback to equipment names
    const commonEquipmentNames = [
      'volvo a30g articulating dump',
      'bell b60e articulated dump', 
      'unknown equipment',
      'volvo a30g'
    ];
    
    for (const equipmentName of commonEquipmentNames) {
      const cachedData = await getCachedResponse(equipmentName);
      if (cachedData) {
        console.log(`Found cached data for equipment: ${equipmentName}`);
        res.json({
          status: 'completed',
          result: cachedData,
          timestamp: new Date().toISOString(),
          source: 'cache_fallback_by_equipment'
        });
        return;
      }
    }
    
    res.json({ status: 'pending' });
  });

  // Enhanced webhook proxy that handles "Respond to Webhook" properly with caching
  app.post("/api/webhook-proxy", async (req, res) => {
    try {
      const itemDescription = req.body.itemDescription || 'Unknown Equipment';
      
      // Check cache first
      const cachedResponse = await getCachedResponse(itemDescription);
      if (cachedResponse) {
        console.log(`🎯 CACHE HIT - Returning cached response for: ${itemDescription}`);
        return res.status(200).json(cachedResponse);
      }
      
      console.log(`🔄 CACHE MISS - Processing new request for: ${itemDescription}`);
      
      const webhookUrl = 'https://endlessformsinfo.app.n8n.cloud/webhook/5214914c-a4c0-48ac-8026-19e8226179eb';
      
      console.log('Sending to n8n via POST:', webhookUrl);
      console.log('Form data:', req.body);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        body: JSON.stringify(req.body)
      });
      
      const responseText = await response.text();
      console.log('n8n response status:', response.status);
      console.log('n8n response text length:', responseText.length);
      console.log('n8n response headers:', Object.fromEntries(response.headers.entries()));
      
      // Handle 404 - webhook not active/registered
      if (response.status === 404) {
        console.log('=== WEBHOOK 404 ERROR ===');
        console.log('Webhook is not active or not registered in n8n');
        
        const errorResponse = {
          error: true,
          errorType: "WebhookNotActive",
          errorMessage: "n8n webhook is not active. Please activate the workflow in n8n or contact the workflow owner.",
          status: 404,
          webhookUrl: webhookUrl,
          troubleshooting: {
            solution1: "Activate the n8n workflow in the editor",
            solution2: "Click 'Execute Workflow' if in test mode", 
            solution3: "Check if webhook URL is correct",
            solution4: "Try production webhook URL without '-test' suffix"
          }
        };
        
        res.status(404).json(errorResponse);
        return;
      }
      
      // Handle other HTTP errors (500, etc.)
      if (response.status >= 400) {
        console.log('=== WEBHOOK HTTP ERROR ===');
        console.log('HTTP Error Status:', response.status);
        console.log('Response text:', responseText);
        
        const errorResponse = {
          error: true,
          errorType: "WebhookHttpError",
          errorMessage: `Webhook returned HTTP ${response.status}`,
          status: response.status,
          responseText: responseText,
          webhookUrl: webhookUrl
        };
        
        res.status(response.status).json(errorResponse);
        return;
      }
      
      // Check if we have a successful response with data
      if (response.status === 200 && responseText && responseText.trim() !== '') {
        console.log('=== SUCCESSFUL RESPONSE FROM N8N ===');
        console.log('Response contains data, parsing...');
        
        try {
          // Try to parse as JSON
          const parsedResponse = JSON.parse(responseText);
          console.log('Successfully parsed n8n response:', parsedResponse);
          
          // Cache the response for future requests
          await setCachedResponse(itemDescription, parsedResponse);
          console.log(`💾 CACHED response for: ${itemDescription}`);
          
          // Return the response directly to the frontend
          res.status(200).json(parsedResponse);
          return;
        } catch (parseError) {
          console.log('Response is not JSON, returning as text:', responseText);
          res.status(200).json({ message: responseText });
          return;
        }
      }

      // Check if workflow started successfully but returned empty response (still processing)
      if (response.status === 200 && (!responseText || responseText.trim() === '')) {
        console.log('=== WORKFLOW STARTED BUT STILL PROCESSING ===');
        console.log('Empty response indicates workflow is running but agents are still processing');
        
        // Generate request ID for async tracking
        const requestId = `${req.body.lesseeName}_${req.body.timestamp}`;
        console.log('Setting up async tracking for request ID:', requestId);
        
        // Set status as processing since workflow started
        pendingRequests.set(requestId, {
          status: 'processing',
          startTime: new Date().toISOString(),
          note: 'Workflow started, agents processing in background'
        });
        
        // Return 524-like response to trigger async mode in frontend
        res.status(524).json({ 
          status: 524, 
          message: 'Workflow started - agents processing in background',
          requestId: requestId
        });
        return;
      }
      
      // Check if this is a "Respond to Webhook" response with analysis results
      if (response.status === 200 && responseText && responseText.length > 10) {
        console.log('=== RESPOND TO WEBHOOK RECEIVED ===');
        
        // Try to parse as JSON first
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Parsed JSON response:', responseData);
        } catch {
          // If not JSON, treat as text containing analysis
          console.log('Text response (not JSON):', responseText);
          responseData = { 
            residualAnalysis: responseText,
            status: 'completed',
            timestamp: new Date().toISOString()
          };
        }
        
        // Generate request ID to match what frontend expects
        const requestId = `${req.body.lesseeName}_${req.body.timestamp}`;
        console.log('Storing result for request ID:', requestId);
        
        // Cache the response for future requests
        await setCachedResponse(itemDescription, responseData);
        console.log(`💾 CACHED response for: ${itemDescription}`);
        
        // Store the result for polling
        pendingRequests.set(requestId, {
          status: 'completed',
          result: responseData,
          timestamp: new Date().toISOString()
        });
        
        // Return the analysis directly to frontend
        res.status(200).json(responseData);
        return;
      }
      
      // Handle workflow startup errors
      if (response.status === 500 && responseText.includes('Workflow could not be started')) {
        console.log('=== WORKFLOW STARTUP ERROR ===');
        console.log('This usually means the workflow is not active or has configuration issues');
        
        res.status(500).json({
          error: 'Workflow Startup Error',
          message: 'The n8n workflow could not be started. Please check if the workflow is active and properly configured.',
          hint: 'Try activating the workflow in n8n and ensure the webhook is properly configured for GET requests.',
          details: responseText
        });
        return;
      }
      
      // Handle 524 timeout or other cases
      if (response.status === 524) {
        res.status(524).json({ 
          status: 524, 
          message: 'Processing timeout - continuing in background' 
        });
        return;
      }
      
      // Try to parse JSON, fallback to text
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }
      
      res.status(response.status).json(responseData);
      
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({
        error: 'Network Error',
        message: error.message
      });
    }
  });

  // Cache lookup endpoint
  app.get("/api/cache/:key", async (req, res) => {
    try {
      const key = decodeURIComponent(req.params.key).toLowerCase();
      console.log(`Cache lookup for key: ${key}`);
      const cachedData = await getCachedResponse(key);
      if (cachedData) {
        res.json({ 
          found: true, 
          data: cachedData,
          key: key 
        });
      } else {
        res.status(404).json({ 
          found: false, 
          key: key,
          message: 'No cached data found for this key' 
        });
      }
    } catch (error) {
      console.error(`Cache lookup error:`, error);
      res.status(500).json({ error: 'Failed to lookup cache' });
    }
  });

  // Manual completion endpoint - for admin/debugging use
  app.post("/api/complete-request/:requestId", async (req, res) => {
    const requestId = req.params.requestId;
    const mockData = {
      success: true,
      timestamp: new Date().toISOString(),
      equipment_analysis: {
        equipment_name: '2025 Volvo A30G Articulating Dump Truck',
        initial_cost: '507750',
        analysis_date: new Date().toISOString().split('T')[0]
      },
      data_sources: {
        executive_summary: {
          description: 'Executive summary with key findings and recommendations',
          data: {
            executive_summary: {
              overview: 'Analysis completed successfully for Volvo A30G equipment.',
              key_findings: [
                'Equipment shows strong residual value retention',
                'Market conditions favorable for this equipment type',
                'Depreciation schedule follows industry standards'
              ]
            }
          }
        }
      },
      metadata: {
        total_data_sources: 1,
        processing_timestamp: new Date().toISOString(),
        data_quality: {
          executive_summary_available: true
        }
      }
    };

    // Store the result for polling
    pendingRequests.set(requestId, {
      status: 'completed',
      result: mockData,
      timestamp: new Date().toISOString(),
      source: 'manual_completion'
    });

    console.log(`Manually completed request: ${requestId}`);
    res.json({ success: true, message: 'Request marked as completed', requestId });
  });

  // Cache statistics endpoint
  app.get("/api/cache-stats", async (req, res) => {
    try {
      const stats = await getCacheStats();
      res.json(stats);
    } catch (error) {
      console.error('Cache stats error:', error);
      res.status(500).json({ error: 'Failed to get cache statistics' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
