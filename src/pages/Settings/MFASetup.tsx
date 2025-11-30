import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Shield, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export function MFASetup() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Enable/disable state
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');

  const handleSetupMFA = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await authService.setupMFA();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setSuccess('MFA setup initiated. Scan the QR code with your authenticator app.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.enableMFA(verificationCode);
      await refreshUser();
      setSuccess('MFA enabled successfully! Your account is now more secure.');
      setVerificationCode('');
      // Clear setup state
      setQrCode(null);
      setSecret(null);
      setBackupCodes([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!password) {
      setError('Password is required to disable MFA');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.disableMFA(password);
      await refreshUser();
      setSuccess('MFA disabled successfully.');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = `DrishtiX MFA Backup Codes\n\nGenerated: ${new Date().toISOString()}\nEmail: ${user?.email}\n\n${backupCodes.join('\n')}\n\nStore these codes securely. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drishtix-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setSuccess('Backup codes copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Current Status</p>
              <p className="text-sm text-muted-foreground">{user?.mfaEnabled ? 'MFA is enabled' : 'MFA is disabled'}</p>
            </div>
            <div>
              {user?.mfaEnabled ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Disabled</span>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Enable MFA Flow */}
          {!user?.mfaEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Enable Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Follow these steps to set up 2FA using an authenticator app like Google Authenticator or Authy.
                </p>
              </div>

              {/* Step 1: Setup MFA */}
              {!qrCode && (
                <Button onClick={handleSetupMFA} disabled={loading}>
                  <Key className="mr-2 h-4 w-4" />
                  {loading ? 'Setting up...' : 'Start Setup'}
                </Button>
              )}

              {/* Step 2: Scan QR Code */}
              {qrCode && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Step 1: Scan QR Code</h4>
                    <p className="text-sm text-muted-foreground">Open your authenticator app and scan this QR code:</p>
                    <div className="flex justify-center p-4 bg-white rounded-lg border">
                      <img src={qrCode} alt="MFA QR Code" className="w-64 h-64" />
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">Can't scan? Enter manually</summary>
                      <div className="mt-2 p-3 bg-muted rounded font-mono text-xs break-all">{secret}</div>
                    </details>
                  </div>

                  {/* Step 3: Backup Codes */}
                  {backupCodes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Step 2: Save Backup Codes</h4>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Save these backup codes in a secure location. You can use them to access your account if you
                          lose your authenticator device. Each code can only be used once.
                        </AlertDescription>
                      </Alert>
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                          {backupCodes.map((code, idx) => (
                            <div key={idx} className="p-2 bg-background rounded border">
                              {code}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                            Copy to Clipboard
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Verify */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Step 3: Verify</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code from your authenticator app to complete setup:
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="max-w-32 text-center text-lg font-mono"
                      />
                      <Button onClick={handleEnableMFA} disabled={loading || verificationCode.length !== 6}>
                        {loading ? 'Verifying...' : 'Enable MFA'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Disable MFA Flow */}
          {user?.mfaEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Disable Two-Factor Authentication</h3>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Disabling MFA will make your account less secure. You will need to enter your password to confirm.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button variant="destructive" onClick={handleDisableMFA} disabled={loading || !password}>
                {loading ? 'Disabling...' : 'Disable MFA'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
