import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function EnvDebug() {
  const [connectionResult, setConnectionResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const envVars = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'NODE_ENV': import.meta.env.NODE_ENV,
    'MODE': import.meta.env.MODE,
    'DEV': import.meta.env.DEV,
    'PROD': import.meta.env.PROD
  };

  const testSupabaseConnection = async () => {
    setIsTesting(true);
    setConnectionResult('Testing connection...');
    
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables');
      }
      
      // Test the Supabase client
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          setConnectionResult('✅ Connected to Supabase! (Table "users" not found - this is normal for new projects)');
        } else {
          setConnectionResult(`⚠️ Connected but error: ${error.message}`);
        }
      } else {
        setConnectionResult('✅ Connected to Supabase successfully!');
      }
    } catch (error: any) {
      setConnectionResult(`❌ Connection failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const checkEnvFile = () => {
    const expectedUrl = 'https://fyybjmtuplfhruuhbtpv.supabase.co';
    const expectedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eWJqbXR1cGxmaHJ1dWhidHB2IiwidG9rZW4iOiJhbm9uIiwiaWF0IjoxNzU2NjM4Nzk0LCJleHAiOjIwNzIyMTQ3OTR9.eozY3nelff2JEDeKtoiY5OjrfcufFRYeafqteb-U6c';
    
    const actualUrl = import.meta.env.VITE_SUPABASE_URL;
    const actualKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    let result = '';
    
    if (actualUrl === expectedUrl) {
      result += '✅ URL matches expected value\n';
    } else {
      result += `❌ URL mismatch. Expected: ${expectedUrl}, Got: ${actualUrl}\n`;
    }
    
    if (actualKey === expectedKey) {
      result += '✅ Key matches expected value\n';
    } else {
      result += `❌ Key mismatch. Expected: ${expectedKey.substring(0, 20)}..., Got: ${actualKey ? actualKey.substring(0, 20) + '...' : 'MISSING'}\n`;
    }
    
    setConnectionResult(result);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Environment Variables Debug
          </CardTitle>
          <CardDescription>
            This component helps debug environment variable loading issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Variables Display */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Environment Variables:</h3>
            <div className="grid gap-3">
              {Object.entries(envVars).map(([key, value]) => {
                let status = 'bg-slate-100 border-slate-300 text-slate-800';
                let displayValue = value;
                
                if (key.startsWith('VITE_SUPABASE_')) {
                  if (!value) {
                    status = 'bg-red-100 border-red-300 text-red-800';
                    displayValue = 'MISSING';
                  } else if (value.length < 50) {
                    status = 'bg-yellow-100 border-yellow-300 text-yellow-800';
                    displayValue = `${value} (Too short - may be invalid)`;
                  } else {
                    status = 'bg-green-100 border-green-300 text-green-800';
                    displayValue = `${value.substring(0, 20)}...${value.substring(value.length - 10)}`;
                  }
                }
                
                return (
                  <div key={key} className={`p-3 rounded-lg border ${status}`}>
                    <strong>{key}:</strong> {displayValue}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={testSupabaseConnection} 
              disabled={isTesting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTesting ? 'Testing...' : 'Test Supabase Connection'}
            </Button>
            
            <Button 
              onClick={checkEnvFile} 
              variant="outline"
            >
              Check .env File
            </Button>
          </div>

          {/* Results */}
          {connectionResult && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
              <div className="p-4 bg-slate-100 rounded-lg font-mono text-sm whitespace-pre-wrap text-slate-800">
                {connectionResult}
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Debug Information:</h3>
            <div className="text-sm space-y-2 text-slate-800">
              <p><strong>import.meta.env type:</strong> {typeof import.meta.env}</p>
              <p><strong>import.meta.env keys:</strong> {Object.keys(import.meta.env || {}).join(', ')}</p>
              <p><strong>Current environment:</strong> {import.meta.env.MODE || 'unknown'}</p>
              <p><strong>Is development:</strong> {import.meta.env.DEV ? 'Yes' : 'No'}</p>
              <p><strong>Is production:</strong> {import.meta.env.PROD ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
