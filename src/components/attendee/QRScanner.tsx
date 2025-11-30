/**
 * QR Code Scanner Component
 * Allows attendees to join events by scanning QR codes
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { attendeeService } from '@/services/attendee.service';

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
      toast.error('Camera access denied');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScan = (data: string) => {
    setScannedData(data);
    stopScanning();

    // Parse QR data to extract eventId
    try {
      const qrData = JSON.parse(data);
      if (qrData.eventId) {
        joinEvent(qrData.eventId, data);
      } else {
        setError('Invalid QR code format');
        toast.error('Invalid QR code');
      }
    } catch (err) {
      setError('Unable to parse QR code data');
      toast.error('Invalid QR code data');
    }
  };

  const joinEvent = async (eventId: string, qrData: string) => {
    setIsJoining(true);
    try {
      const response = await attendeeService.joinEvent(eventId, {
        joinMethod: 'QR_CODE',
        qrData,
      });

      if (response.success) {
        toast.success('Successfully joined event!');
        navigate(`/attendee/events/${eventId}/dashboard`);
      } else {
        toast.error(response.error || 'Failed to join event');
        setError(response.error || 'Failed to join event');
      }
    } catch (err: any) {
      console.error('Join event error:', err);
      toast.error(err.message || 'Failed to join event');
      setError(err.message || 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  // Simulate QR scanning (for demo purposes - replace with actual QR library like jsQR)
  const simulateScan = () => {
    const mockQRData = JSON.stringify({
      eventId: 'demo-event-id',
      eventName: 'Demo Event',
      timestamp: new Date().toISOString(),
    });
    handleScan(mockQRData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">Scan QR Code</CardTitle>
                  <CardDescription>Point your camera at the event QR code</CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Scanner View */}
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              {isScanning ? (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-white border-dashed rounded-lg opacity-50" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center space-y-4">
                    <Camera className="h-16 w-16 mx-auto opacity-50" />
                    <p className="text-sm opacity-70">Camera not active</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Scanned Data Display */}
            {scannedData && !error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">QR Code Scanned</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Processing event registration...</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isScanning && !isJoining && (
                <Button onClick={startScanning} size="lg" className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              )}

              {isScanning && (
                <>
                  <Button onClick={stopScanning} variant="outline" size="lg" className="flex-1">
                    Stop Scanning
                  </Button>
                  <Button onClick={simulateScan} variant="secondary" size="lg" className="flex-1">
                    Simulate Scan (Demo)
                  </Button>
                </>
              )}

              {isJoining && (
                <Button disabled size="lg" className="flex-1">
                  Joining Event...
                </Button>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Allow camera access when prompted</li>
                <li>Point your camera at the event QR code</li>
                <li>Hold steady until the code is scanned</li>
                <li>You'll be automatically registered for the event</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
