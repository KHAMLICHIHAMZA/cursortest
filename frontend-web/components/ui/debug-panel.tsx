'use client';

import { useState } from 'react';
import { Card } from './card';
import { Button } from './button';
import { X, Bug, Copy, Check } from 'lucide-react';

interface DebugPanelProps {
  data: any;
  title?: string;
  onClose?: () => void;
}

export function DebugPanel({ data, title = 'Debug Info', onClose }: DebugPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-text">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-text-muted hover:text-text"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copier
                </>
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-xs text-text bg-background p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
}


