/**
 * Login Page Component
 * Email/password authentication with MFA support
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(email, password, mfaCode || undefined);

      if (response.success && response.data) {
        // Login successful
        navigate('/dashboard');
      } else if (response.requiresMfa) {
        // MFA required
        setRequiresMfa(true);
        setMfaMethod(response.mfaMethod || 'totp');
        setError('');
      } else {
        // Login failed
        setError(response.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-light to-surface-muted dark:from-dark-bg dark:to-dark-surface p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {requiresMfa ? 'Two-Factor Authentication' : 'DrishtiX Login'}
          </CardTitle>
          <CardDescription className="text-center">
            {requiresMfa
              ? `Enter your ${mfaMethod === 'totp' ? 'authenticator' : 'verification'} code`
              : 'Enter your credentials to access the platform'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresMfa ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@drishtix.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="mfaCode">{mfaMethod === 'totp' ? 'Authenticator Code' : 'Verification Code'}</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  autoFocus
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-sm text-muted-foreground text-center">
                  {mfaMethod === 'totp'
                    ? 'Enter the 6-digit code from your authenticator app'
                    : 'Enter the 6-digit code sent to your device'}
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {requiresMfa ? 'Verifying...' : 'Signing in...'}
                </>
              ) : requiresMfa ? (
                'Verify Code'
              ) : (
                'Sign In'
              )}
            </Button>

            {requiresMfa && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setRequiresMfa(false);
                  setMfaCode('');
                  setError('');
                }}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            )}
          </form>

          {!requiresMfa && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Default credentials for testing:</p>
              <p className="font-mono text-xs mt-1">admin@drishtix.com / password</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
