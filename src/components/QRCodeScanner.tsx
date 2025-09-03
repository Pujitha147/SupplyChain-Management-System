import { useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const startScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(
      (result) => {
        scanner.clear();
        setIsScanning(false);
        onScan(result);
      },
      (error) => {
        console.warn(`QR Code scan error: ${error}`);
        if (onError) {
          onError(error);
        }
      }
    );

    scannerRef.current = scanner;
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div id="qr-reader" className={isScanning ? 'block' : 'hidden'}></div>
        
        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1">
              Start Scanner
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="flex-1">
              Stop Scanner
            </Button>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <Label htmlFor="manual-input">Enter QR Code manually</Label>
            <Input
              id="manual-input"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter QR code value"
            />
          </div>
          <Button type="submit" variant="outline" className="w-full">
            Verify Manually
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}