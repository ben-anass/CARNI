import React, { useState } from 'react';
import { X, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MedicalDocument, DocumentCategory } from '../../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (doc: Omit<MedicalDocument, 'id' | 'created_at'>, file: File) => Promise<void>;
  isDemoMode?: boolean;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isDemoMode = false,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('ORDONNANCE');
  const [doctorOrLab, setDoctorOrLab] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      return;
    }

    const selectedFile = e.target.files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError('Format non autorisé. Formats acceptés : PDF, JPG, PNG.');
      setFile(null);
      return;
    }

    if (selectedFile.size > maxSizeBytes) {
      setFileError('Fichier trop volumineux. Taille maximale autorisée : 10 Mo.');
      setFile(null);
      return;
    }

    setFile(selectedFile);

    if (!title.trim()) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Le titre du document est obligatoire';
    if (!doctorOrLab.trim()) newErrors.doctorOrLab = 'Le médecin ou laboratoire émetteur est obligatoire';
    if (!issueDate) newErrors.issueDate = 'La date du document est obligatoire';
    if (!file) newErrors.file = 'Veuillez sélectionner un fichier médical';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setIsUploading(true);
    try {
      await onUpload({
        title: title.trim(),
        category,
        file_name: file!.name,
        file_type: file!.type,
        file_size_bytes: file!.size,
        issue_date: issueDate,
        doctor_or_lab: doctorOrLab.trim(),
        notes: notes.trim() || undefined,
        tags,
      }, file!);
      onClose();
    } catch (err: any) {
      setFileError(err?.message || 'Erreur lors du dépôt du document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-teal-400">
                Coffre-fort Médical Sécurisé
              </span>
              <h2 className="text-base font-bold text-white">
                Ajouter un document médical
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fichier médical (PDF ou Image) <span className="text-rose-500">*</span>
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-5 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} Ko • {file.type || 'Fichier médical'} • Prêt
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 text-teal-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Cliquez ou glissez-déposez votre document ici
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PDF, JPG ou PNG • Taille max 10 Mo
                  </p>
                </div>
              )}
            </div>
            {fileError && (
              <span className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {fileError}
              </span>
            )}
            {errors.file && (
              <span className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.file}
              </span>
            )}
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie de document <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="ORDONNANCE">📄 Ordonnance Médicale</option>
                <option value="BILAN">🧪 Bilan Biologique / Sanguin</option>
                <option value="IMAGERIE">🩻 Radiologie & Scanner / IRM</option>
                <option value="COMPTE_RENDU">📑 Compte-Rendu Clinique</option>
                <option value="CERTIFICAT">📜 Certificat / Vaccination</option>
                <option value="AUTRE">📁 Autre document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date du document <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Titre du document <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Ordonnance traitement asthme, Bilan métabolique Zerktouni..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full text-xs rounded-xl border ${
                errors.title ? 'border-rose-400' : 'border-slate-300'
              } p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
            />
            {errors.title && (
              <span className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </span>
            )}
          </div>

          {/* Doctor or Lab */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Médecin ou Laboratoire émetteur <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Laboratoire Zerktouni, Dr. Omar Bennani, Clinique Agdal..."
              value={doctorOrLab}
              onChange={(e) => setDoctorOrLab(e.target.value)}
              className={`w-full text-xs rounded-xl border ${
                errors.doctorOrLab ? 'border-rose-400' : 'border-slate-300'
              } p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
            />
            {errors.doctorOrLab && (
              <span className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.doctorOrLab}
              </span>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mots-clés / Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              placeholder="Ex: Asthme, Contrôle, Traitement, Urgent"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes personnelles (Optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Remarques, posologie mentionnée, recommandations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {isDemoMode && (
            <p className="text-xs text-amber-800">Mode démo. Le fichier original ne sera pas conservé.</p>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dépôt en cours…</span>
                </>
              ) : (
                <span>Enregistrer le document</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
