import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function TestWebhook() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testWebhook = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesseeName: "Test Company",
          lesseeEmail: "test@example.com", 
          source: "Webhook Test",
          itemName: "Test Equipment",
          make: "Test",
          model: "Test",
          currentMeter: 100,
          proposedMeter: 200,
          meterUnit: "hours",
          itemDescription: "Test equipment for webhook verification",
          subjectPrice: 100000,
          industry: "Test",
          assetType: "Test Equipment",
          status: "Test",
          application: "Test",
          structure: "Test",
          termMonths: 24,
          timestamp: Date.now()
        })
      });

      const responseText = await response.text();
      let responseJson;
      
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { text: responseText, status: response.status };
      }

      setResult({
        status: response.status,
        ok: response.ok,
        data: responseJson,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setResult({
        status: 'ERROR',
        ok: false,
        data: { 
          error: true, 
          message: (error as Error).message,
          type: 'NetworkError'
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;
    
    if (result.ok && result.status === 200) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (result.status === 404) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!result) return null;
    
    if (result.ok && result.status === 200) {
      return <Badge className="bg-green-100 text-green-800">Working</Badge>;
    } else if (result.status === 404) {
      return <Badge className="bg-red-100 text-red-800">Not Active</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Error</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Webhook Test</h1>
          <p className="text-gray-600">Test the n8n webhook connection and troubleshoot issues</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>n8n Webhook Status</CardTitle>
                <CardDescription>
                  Current webhook: https://endlessformsinfo.app.n8n.cloud/webhook-test/5214914c-a4c0-48ac-8026-19e8226179eb
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                {getStatusBadge()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testWebhook} 
              disabled={testing}
              className="mb-4"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Webhook'
              )}
            </Button>

            {result && (
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Test Result</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Status:</strong> {result.status}
                    </div>
                    <div>
                      <strong>Success:</strong> {result.ok ? 'Yes' : 'No'}
                    </div>
                    <div className="col-span-2">
                      <strong>Timestamp:</strong> {result.timestamp}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Response Data</h3>
                  <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>

                {result.status === 404 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Webhook Not Active:</strong> The n8n workflow needs to be activated. 
                      Go to your n8n editor and click the "Activate" toggle switch, or click "Execute Workflow" if testing.
                    </AlertDescription>
                  </Alert>
                )}

                {result.data?.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription>
                      <strong>Error:</strong> {result.data.errorMessage || result.data.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-blue-900">1. Activate n8n Workflow</h3>
                <p className="text-sm text-blue-700">
                  Go to your n8n workflow editor and click the "Activate" toggle switch in the top right corner.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-green-900">2. Test Mode Execution</h3>
                <p className="text-sm text-green-700">
                  If testing, click "Execute Workflow" button in n8n, then immediately test your form.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-medium text-yellow-900">3. Check Webhook URL</h3>
                <p className="text-sm text-yellow-700">
                  Verify the webhook URL is correct and try the production URL without "-test" suffix.
                </p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-medium text-red-900">4. Contact Workflow Owner</h3>
                <p className="text-sm text-red-700">
                  If issues persist, contact the person who manages the n8n workflow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}