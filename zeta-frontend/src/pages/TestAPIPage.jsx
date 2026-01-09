import { useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const TestAPIPage = () => {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://zeta-exams-backend.vercel.app';

  const testEndpoint = async (name, endpoint, method = 'GET', data = null) => {
    setResults(prev => ({ ...prev, [name]: { status: 'testing' } }));
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      console.log(`Testing ${name}:`, `${API_URL}${endpoint}`);
      
      const response = await fetch(`${API_URL}${endpoint}`, options);
      const json = await response.json();

      console.log(`Result for ${name}:`, response.status, json);

      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.ok ? 'success' : 'error',
          code: response.status,
          data: json,
        },
      }));
    } catch (error) {
      console.error(`Error in ${name}:`, error);
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'error',
          error: error.message,
        },
      }));
    }
  };

  const runTests = async () => {
    setTesting(true);
    setResults({});

    // Test 1: Base URL
    await testEndpoint('Base URL Check', '/');

    // Test 2: Health check (if exists)
    await testEndpoint('Health Check', '/health');

    // Test 3: API Base
    await testEndpoint('API Base', '/api');

    // Test 4: Register endpoint (with test data)
    await testEndpoint('Register Endpoint', '/api/auth/register', 'POST', {
      email: 'test' + Date.now() + '@example.com',
      phoneNo: '9876543210',
      password: 'Test@123',
      confirmPassword: 'Test@123'
    });

    setTesting(false);
  };

  const getStatusIcon = (status) => {
    if (status === 'testing') return <Loader className="animate-spin text-blue-500" size={20} />;
    if (status === 'success') return <CheckCircle className="text-green-500" size={20} />;
    return <XCircle className="text-red-500" size={20} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Backend API Test
          </h1>

          <div className="mb-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Testing Backend:</p>
              <code className="text-sm bg-gray-100 px-3 py-1 rounded">{API_URL}</code>
            </div>
            
            <button
              onClick={runTests}
              disabled={testing}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            >
              {testing ? 'Testing...' : 'Run Tests'}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {Object.entries(results).map(([name, result]) => (
              <div
                key={name}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{name}</h3>
                  {getStatusIcon(result.status)}
                </div>

                {result.code && (
                  <p className="text-sm text-gray-600 mb-2">
                    Status Code: <span className={`font-mono font-bold ${
                      result.code === 200 ? 'text-green-600' : 
                      result.code === 500 ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>{result.code}</span>
                  </p>
                )}

                {result.data && (
                  <div className="bg-gray-50 rounded p-3 mt-2 overflow-x-auto">
                    <pre className="text-xs font-mono text-gray-800">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}

                {result.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {result.error}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              📋 Common Issues & Solutions:
            </h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                <strong>All tests fail with "Network error":</strong>
                <br />→ Backend is not deployed or URL is wrong in .env
              </li>
              <li>
                <strong>Register fails with 500 error:</strong>
                <br />→ Check Vercel backend logs (see instructions below)
                <br />→ Usually means missing environment variables
              </li>
              <li>
                <strong>CORS error in console:</strong>
                <br />→ Backend needs CORS configuration for your domain
              </li>
              <li>
                <strong>404 errors:</strong>
                <br />→ Route doesn't exist in backend
              </li>
            </ul>
          </div>

          {/* Backend Checklist */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">
              ✅ Backend Checklist (Vercel Dashboard):
            </h4>
            <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
              <li>
                Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Vercel Dashboard</a>
              </li>
              <li>Click on your backend project</li>
              <li>Go to <strong>Settings → Environment Variables</strong></li>
              <li>Make sure these are set:
                <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                  <li>MONGODB_URI</li>
                  <li>JWT_SECRET</li>
                  <li>RESEND_API_KEY (for sending OTP emails)</li>
                  <li>NODE_ENV=production</li>
                </ul>
              </li>
              <li>To check logs: Go to <strong>Deployments</strong> → Click latest → <strong>View Function Logs</strong></li>
            </ol>
          </div>

          {/* Direct Instructions */}
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              🔍 How to Check Backend Logs:
            </h4>
            <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
              <li>Go to your Vercel dashboard</li>
              <li>Click on your backend project (zeta-exams-backend)</li>
              <li>Click "Deployments" tab</li>
              <li>Click on the most recent deployment</li>
              <li>Click "View Function Logs"</li>
              <li>Try to register on your app</li>
              <li>Watch the logs appear in real-time</li>
              <li>Look for red error messages</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAPIPage;