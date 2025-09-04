import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Shield, AlertCircle, CheckCircle, Copy, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function DecryptPage() {
  const [searchParams] = useSearchParams();
  const encryptedDataFromUrl = searchParams.get('key');
  // Fix URL encoding issue where + becomes space
  const fixedEncryptedData = encryptedDataFromUrl ? encryptedDataFromUrl.replace(/ /g, '+') : '';
  const [encryptedData, setEncryptedData] = useState(fixedEncryptedData);
  const [decryptedData, setDecryptedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (encryptedData) {
      decryptData(encryptedData);
    }
  }, [encryptedData]);

  const decryptData = async (encrypted: string) => {
    try {
      const secretKey = import.meta.env.VITE_DECRYPT_SECRET_KEY;
      
      if (!secretKey) {
        throw new Error('VITE_DECRYPT_SECRET_KEY is not configured in environment variables');
      }
      
      // Don't decode if manually input, only decode if from URL
      let decodedString = encrypted;
      
      // If it looks like it came from URL (has spaces instead of +), fix it
      if (decodedString.includes(' ') && !decodedString.includes('+')) {
        decodedString = decodedString.replace(/ /g, '+');
      }
      
      // Remove any other whitespace (newlines, tabs, etc)
      decodedString = decodedString.replace(/[\n\r\t]/g, '');
      
      // Fix base64 padding if needed
      while (decodedString.length % 4) {
        decodedString += '=';
      }
      
      
      // Decode from base64
      const raw = atob(decodedString);
      const rawArray = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        rawArray[i] = raw.charCodeAt(i);
      }

      // Extract IV (first 16 bytes) and ciphertext
      const iv = rawArray.slice(0, 16);
      const ciphertext = rawArray.slice(16);

      // Create key from secret using SHA-256
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secretKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
      
      // Import key for AES-256-CBC
      const key = await crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: iv },
        key,
        ciphertext
      );

      // Convert to string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);
      
      // Parse JSON
      const data = JSON.parse(decryptedString);
      setDecryptedData(data);
      setError(null);
    } catch (err) {
      setError('Failed to decrypt data. Invalid or corrupted encryption.');
      setDecryptedData(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Failed to copy
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto mt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AES Decryption Tool</h1>
          <p className="text-gray-600">Decrypt and verify encrypted warehouse data</p>
        </div>

        {/* Encrypted Data Card */}
        <Card className="p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Encrypted Data</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="w-4 h-4 mr-1" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={encryptedData}
                onChange={(e) => setEncryptedData(e.target.value)}
                placeholder="Paste encrypted data here..."
                className="font-mono text-sm"
              />
              <Button 
                onClick={() => {
                  if (encryptedData) {
                    decryptData(encryptedData);
                    setIsEditing(false);
                  }
                }}
                className="w-full"
              >
                Decrypt
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm break-all">
              {encryptedData || 'No encrypted data provided'}
            </div>
          )}
          
          {encryptedData && !isEditing && (
            <div className="mt-3 text-xs text-gray-600 space-y-1">
              <p>Length: {encryptedData.length} characters</p>
              {encryptedDataFromUrl && encryptedDataFromUrl.includes(' ') && (
                <p className="text-orange-600">Note: URL encoding detected and fixed (+ characters restored)</p>
              )}
            </div>
          )}
        </Card>

        {/* Result Card */}
        <Card className="p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Decryption Result</h2>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Decryption Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : decryptedData ? (
            <div className="space-y-4">
              {/* Success Header */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-900">Successfully Decrypted</p>
                </div>
              </div>

              {/* JSON Output */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">JSON Output</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(decryptedData, null, 2))}
                    className={cn(
                      "text-xs",
                      copied && "text-green-600"
                    )}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </Button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100 font-mono">
                    <code>{JSON.stringify(decryptedData, null, 2)}</code>
                  </pre>
                </div>
              </div>

              {/* Parsed Fields */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Parsed Fields</h3>
                <div className="space-y-2">
                  {Object.entries(decryptedData).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">{key}</p>
                        <p className="font-mono text-sm mt-0.5 break-all">{String(value)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(String(value))}
                        className="ml-2 flex-shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="animate-pulse">
                <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Decrypting...</p>
            </div>
          )}

          {/* Technical Details */}
          {decryptedData && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Technical Details</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs font-mono text-gray-600">
                <p>Algorithm: AES-256-CBC</p>
                <p>Key Derivation: SHA-256</p>
                <p>IV Length: 16 bytes</p>
                <p>Encoding: Base64</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}