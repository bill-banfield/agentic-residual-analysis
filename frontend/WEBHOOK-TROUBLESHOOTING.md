# n8n Webhook Troubleshooting Guide

## Issue: Webhook Returning 404 Error

### Problem
The n8n webhook is returning:
```json
{
  "code": 404,
  "message": "The requested webhook \"5214914c-a4c0-48ac-8026-19e8226179eb\" is not registered.",
  "hint": "Click the 'Execute workflow' button on the canvas, then try again. (In test mode, the webhook only works for one call after you click this button)"
}
```

### Root Cause
1. **Webhook in Test Mode**: The webhook only works for one call after clicking "Execute workflow"
2. **Workflow Not Active**: The n8n workflow may not be running in production mode
3. **Webhook Node Disabled**: The webhook trigger node might be disabled

## Solutions

### Solution 1: Activate Workflow in n8n
1. Go to your n8n workflow editor
2. Click the **"Activate"** toggle switch in the top right
3. Ensure the workflow status shows as "Active"
4. Test the webhook again

### Solution 2: Use Production Webhook URL
If you have a production n8n instance, update the webhook URL in the code:

**Current URL (Test):**
```
https://endlessformsinfo.app.n8n.cloud/webhook-test/5214914c-a4c0-48ac-8026-19e8226179eb
```

**Production URL Pattern:**
```
https://endlessformsinfo.app.n8n.cloud/webhook/5214914c-a4c0-48ac-8026-19e8226179eb
```

### Solution 3: Execute Workflow Button (Test Mode)
If testing in n8n:
1. Open the workflow in n8n editor
2. Click **"Execute Workflow"** button
3. Immediately test your form (only works once per execution)

### Solution 4: Check Webhook Node Configuration
1. Open the webhook trigger node in n8n
2. Ensure HTTP Method is set to **POST**
3. Verify the webhook path matches your URL
4. Check that the node is properly connected to the workflow

## Testing the Webhook

### Direct Test (cURL)
```bash
curl -X POST "https://endlessformsinfo.app.n8n.cloud/webhook-test/5214914c-a4c0-48ac-8026-19e8226179eb" \
  -H "Content-Type: application/json" \
  -d '{
    "lesseeName": "Test Company",
    "itemDescription": "Test equipment",
    "subjectPrice": 250000
  }'
```

### Expected Response
- **Success**: JSON response with analysis data
- **Test Mode**: Empty response (workflow triggered)
- **Error**: 404 message (webhook not active)

## Frontend Fix Applied

Fixed the "Response body already used" error by:
```javascript
// Before (BROKEN)
responseJson = await response.json();
const responseText = await response.clone().text(); // ERROR!

// After (FIXED)
const responseText = await response.text();
responseJson = JSON.parse(responseText);
```

## Next Steps

1. **Activate the n8n workflow** in production mode
2. **Test the webhook** with the curl command above
3. **Submit the form** once webhook is confirmed working
4. **Monitor the logs** for successful responses

## Alternative URLs to Try

If the test webhook doesn't work, try these patterns:
- `https://endlessformsinfo.app.n8n.cloud/webhook/5214914c-a4c0-48ac-8026-19e8226179eb`
- `https://endlessformsinfo.app.n8n.cloud/webhooks/5214914c-a4c0-48ac-8026-19e8226179eb`

Contact the n8n workflow owner to confirm the correct URL and activation status.