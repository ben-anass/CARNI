import React, { useMemo, useState } from 'react';
import { generateQRCodeMatrix } from '../../utils/qr';
import { Copy, Check, ExternalLink, ShieldAlert, Clock, Sparkles } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  recipientLabel?: string;
  expiresAt?: string;
  isRevoked?: boolean;
  onOpenDoctorView?: () => void;
  onRevoke?: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 220,
  recipientLabel,
  expiresAt,
  isRevoked = false,
  onOpenDoctorView,
  onRevoke,
}) => {
  const [copied, setCopied] = useState(false);

  const matrix = useMemo(() => {
    try {
      return generateQRCodeMatrix(value);
    } catch (err) {
      console.error('QR generation error:', err);
      return [];
    }
  }, [value]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  const isInactive = isRevoked || isExpired;

  const moduleCount = matrix.length;
  const cellSize = moduleCount > 0 ? size / (moduleCount + 4) : 10;
  const offset = cellSize * 2;

  return (
    <div className="flex flex-col items-center bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Status banner if inactive */}
      {isRevoked && (
        <div className="w-full mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Accès révoqué définitivement par le patient</span>
        </div>
      )}
      {isExpired && !isRevoked && (
        <div className="w-full mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-xs font-semibold">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Session expirée (délai dépassé)</span>
        </div>
      )}

      {/* QR Code Container */}
      <div className={`relative p-3 rounded-xl bg-white border border-slate-100 shadow-inner ${isInactive ? 'opacity-40 grayscale' : ''}`}>
        {matrix.length > 0 ? (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="shape-rendering-crispEdges block"
          >
            <rect width={size} height={size} fill="#ffffff" rx={8} />
            {matrix.map((row, y) =>
              row.map((cell, x) =>
                cell ? (
                  <rect
                    key={`${x}-${y}`}
                    x={offset + x * cellSize}
                    y={offset + y * cellSize}
                    width={cellSize * 0.96}
                    height={cellSize * 0.96}
                    rx={cellSize * 0.2}
                    fill="#0f172a"
                  />
                ) : null
              )
            )}
            {/* Center security seal */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size * 0.09}
              fill="#0d9488"
              stroke="#ffffff"
              strokeWidth={2.5}
            />
          </svg>
        ) : (
          <div className="flex items-center justify-center w-48 h-48 text-slate-400 text-xs">
            Génération du code...
          </div>
        )}
      </div>

      {recipientLabel && (
        <div className="mt-3 text-center">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
            Destinataire autorisé
          </span>
          <span className="text-sm font-bold text-slate-800">
            {recipientLabel}
          </span>
        </div>
      )}

      {/* Secret token badge */}
      <div className="mt-3 w-full bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Jeton de partage sécurisé</div>
          <div className="text-xs font-mono font-medium text-teal-800 truncate">
            {value}
          </div>
        </div>
        <button
          onClick={copyToClipboard}
          className="shrink-0 p-1.5 hover:bg-slate-200/70 text-slate-600 rounded-md transition-colors"
          title="Copier le lien d'accès"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Actions */}
      <div className="mt-4 w-full flex items-center gap-2">
        {onOpenDoctorView && (
          <button
            onClick={onOpenDoctorView}
            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Tester vue médecin</span>
          </button>
        )}
        {onRevoke && !isInactive && (
          <button
            onClick={onRevoke}
            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Révoquer</span>
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
        <Sparkles className="w-3 h-3 text-teal-500" />
        <span>Chiffré de bout en bout • Zéro donnée dans le QR code</span>
      </div>
    </div>
  );
};
