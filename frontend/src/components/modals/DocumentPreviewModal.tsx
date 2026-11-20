import React from 'react';
import { X, FileText, Download, Printer, Shield, Calendar, Building, Tag } from 'lucide-react';
import { MedicalDocument } from '../../types';

interface DocumentPreviewModalProps {
  document: MedicalDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !document) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 uppercase tracking-wider">
                  {document.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {formatFileSize(document.file_size_bytes)}
                </span>
              </div>
              <h2 className="text-base font-bold text-white truncate max-w-md">
                {document.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Meta Row */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <strong>{document.doctor_or_lab}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{document.issue_date}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-teal-700 font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Document certifié CARNI Vault</span>
          </div>
        </div>

        {/* Document Body (Simulated Medical PDF Paper View) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70">
          <div className="bg-white p-8 rounded-xl shadow-xs border border-slate-200 min-h-[380px] font-sans relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-6xl font-black text-slate-900 uppercase rotate-[-25deg]">
                CARNI VAULT
              </span>
            </div>

            {/* Document Content Header */}
            <div className="border-b-2 border-teal-800 pb-4 mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-900">
                  {document.doctor_or_lab}
                </h3>
                <p className="text-xs text-slate-500">Royaume du Maroc • Système de Santé Numérique</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Réf: {document.id.toUpperCase()}-2026</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Date d'édition</span>
                <span className="text-xs font-semibold text-slate-800">{document.issue_date}</span>
              </div>
            </div>

            {/* Structured Text Content Preview */}
            <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line font-mono bg-slate-50/60 p-4 rounded-lg border border-slate-100">
              {document.content_preview ||
                `Document médical numérisé : ${document.title}\nÉmis par : ${document.doctor_or_lab}\nFichier source : ${document.file_name}\nFormat : ${document.file_type}`}
            </div>

            {/* Document Notes */}
            {document.notes && (
              <div className="mt-4 p-3 bg-teal-50/60 border-l-3 border-teal-600 rounded-r-lg text-xs text-teal-900">
                <strong className="font-semibold">Note d'accompagnement :</strong> {document.notes}
              </div>
            )}

            {/* Tags */}
            {document.tags.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3 h-3 text-slate-400" />
                {document.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Doctor Signature Block */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                <span>Signature électronique certifiée</span>
                <p className="text-[10px] text-slate-400">Authentification SHA-256 valide</p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-800">{document.doctor_or_lab}</span>
                <p className="text-[10px] text-teal-600 font-bold uppercase">Cachet Numérique Apposé</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {document.file_name}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={() => {
                const element = window.document.createElement('a');
                const file = new Blob([document.content_preview || 'Document CARNI'], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = document.file_name;
                window.document.body.appendChild(element);
                element.click();
                window.document.body.removeChild(element);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
