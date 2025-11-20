'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  achatId: number;
  size?: number;
}

export default function QRCodeGenerator({ achatId, size = 200 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [achatId]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, `ACHAT:${achatId}`, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
      }
    } catch (err) {
      setError('Failed to generate QR code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `achat-${achatId}-qrcode.png`;
      link.href = url;
      link.click();
    }
  };

  if (error) {
    return (
      <div className="text-destructive text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {loading && (
        <div className="text-muted-foreground text-sm">Generating QR code...</div>
      )}
      
      <canvas 
        ref={canvasRef} 
        className={`border-2 border-border rounded-lg ${loading ? 'hidden' : ''}`}
      />
      
      {!loading && (
        <button
          onClick={downloadQRCode}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Download QR Code
        </button>
      )}
    </div>
  );
}
