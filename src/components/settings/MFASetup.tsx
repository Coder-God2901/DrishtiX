/**
 * MFA Setup Component
 * Allows users to configure Two-Factor Authentication (TOTP)
 */

import { useState } from 'react';
import { authService } from '../../services/auth.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';
import { Shield, Download, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

export function MFASetup() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [password, setPassword] = useState('');

  /**
   * Initialize MFA setup - get QR code and backup codes
   */
  const handleSetupMFA = async () => {
    setIsLoading(true);
    try {
      const response = await authService.setupMFA();

      setQrCode(response.qrCode);
      setSecret(response.secret);
      setBackupCodes(response.backupCodes);
      toast.success('MFA setup initiated. Scan the QR code with your authenticator app.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup MFA';
      toast.error(errorMessage);
      console.error('MFA setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Enable MFA after verifying TOTP code
   */
  const handleEnableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await authService.enableMFA(verificationCode);

      setIsMFAEnabled(true);
      toast.success('MFA enabled successfully!', {
        description: 'Your account is now protected with two-factor authentication.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid verification code';
      toast.error(errorMessage);
      console.error('MFA enable error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disable MFA with password verification
   */
  const handleDisableMFA = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      await authService.disableMFA(password);

      setIsMFAEnabled(false);
      setQrCode(null);
      setSecret(null);
      setBackupCodes([]);
      setShowDisableConfirm(false);
      setPassword('');
      toast.success('MFA disabled successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable MFA';
      toast.error(errorMessage);
      console.error('MFA disable error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Download backup codes as text file
   */
  const downloadBackupCodes = () => {
    const content = `DrishtiX Backup Codes\n\nIMPORTANT: Store these codes in a safe place.\nEach code can only be used once.\n\n${backupCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drishtix-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Backup codes downloaded');
  };

  /**
   * Copy backup codes to clipboard
   */
  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
          <p className="text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isMFAEnabled ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            MFA Status
          </CardTitle>
          <CardDescription>
            {isMFAEnabled
              ? 'Your account is protected with two-factor authentication'
              : 'Two-factor authentication is currently disabled'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isMFAEnabled && !qrCode && (
            <Button onClick={handleSetupMFA} disabled={isLoading}>
              Enable Two-Factor Authentication
            </Button>
          )}

          {isMFAEnabled && !showDisableConfirm && (
            <Button variant="destructive" onClick={() => setShowDisableConfirm(true)}>
              Disable MFA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* QR Code Setup */}
      {qrCode && !isMFAEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Scan QR Code</CardTitle>
            <CardDescription>Use an authenticator app like Google Authenticator, Authy, or 1Password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <img src={qrCode} alt="MFA QR Code" className="w-64 h-64" />
            </div>

            <Alert>
              <AlertDescription>
                <strong>Manual Entry:</strong> If you can't scan the QR code, enter this secret key manually:{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{secret}</code>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes */}
      {backupCodes.length > 0 && !isMFAEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Save Backup Codes</CardTitle>
            <CardDescription>
              Store these codes safely. Each can be used once if you lose access to your authenticator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="px-3 py-2 bg-white dark:bg-gray-800 rounded border">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Make sure to download or copy these backup codes before proceeding. You won't be able to see them again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Verification */}
      {qrCode && !isMFAEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Verify Setup</CardTitle>
            <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button onClick={handleEnableMFA} disabled={isLoading || verificationCode.length !== 6} className="w-full">
              Verify and Enable MFA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Disable MFA Confirmation */}
      {showDisableConfirm && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Disable Two-Factor Authentication</CardTitle>
            <CardDescription>Enter your password to confirm you want to disable MFA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Disabling MFA will make your account less secure. Are you sure you want to continue?
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisableConfirm(false);
                  setPassword('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisableMFA}
                disabled={isLoading || !password}
                className="flex-1"
              >
                Disable MFA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
