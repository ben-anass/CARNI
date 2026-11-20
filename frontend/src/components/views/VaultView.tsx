import React, { useState, useMemo } from 'react';
import {
  FolderLock,
  UploadCloud,
  Search,
  Filter,
  FileText,
  Eye,
  Download,
  Trash2,
  Calendar,
  Building,
  Tag,
  ShieldCheck,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import { api } from '../../services/api';
import { MedicalDocument, DocumentCategory } from '../../types';

interface VaultViewProps {
  documents: MedicalDocument[];
  onOpenUpload: () => void;
  onPreviewDocument: (doc: MedicalDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  documents,
  onOpenUpload,
  onPreviewDocument,
  onDeleteDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'Tous les documents' },
    { id: 'ORDONNANCE', label: 'Ordonnances' },
    { id: 'BILAN', label: 'Bilans & Biologie' },
    { id: 'IMAGERIE', label: 'Imagerie & Radios' },
    { id: 'COMPTE_RENDU', label: 'Comptes-Rendus' },
    { id: 'CERTIFICAT', label: 'Certificats' },
  ];

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCategory =
        selectedCategory === 'ALL' || doc.category === selectedCategory;
      const matchesQuery =
        searchQuery.trim() === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.doctor_or_lab.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [documents, selectedCategory, searchQuery]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const getDocIcon = (cat: DocumentCategory) => {
    switch (cat) {
      case 'ORDONNANCE':
        return <FileText className="w-5 h-5 text-teal-600" />;
      case 'BILAN':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'IMAGERIE':
        return <FileImage className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Coffre-fort Médical Sécurisé
            </h1>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Coffre-fort
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Archivage certifié de vos ordonnances, comptes-rendus et examens médicaux
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
        >
          <UploadCloud className="w-4 h-4 text-teal-400" />
          <span>Déposer un document</span>
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, laboratoire, médecin, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <FolderLock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Aucun document dans le coffre-fort</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Aucun document ne correspond à vos filtres. Vous pouvez déposer votre première ordonnance ou analyse.
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors"
          >
            Déposer un document maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getDocIcon(doc.category)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {doc.category}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer le document "${doc.title}" du coffre-fort ?`)) {
                            onDeleteDocument(doc.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Supprimer du coffre-fort"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{doc.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.doctor_or_lab}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {doc.issue_date}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size_bytes)}</span>
                  </div>

                  {doc.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-3 flex-wrap">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {doc.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
                  <button
                    onClick={() => onPreviewDocument(doc)}
                    className="flex-1 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    <span>Consulter aperçu</span>
                  </button>
                  {doc.has_file && (
                    <a
                      href={api.documentDownloadUrl(doc.id)}
                      className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Télécharger l’original"
                      aria-label="Télécharger l’original"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
