import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Stethoscope,
  Pill,
  Syringe,
  AlertTriangle,
  FileText,
  Activity,
  Edit2,
  Trash2,
  Paperclip,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import { HealthEvent, EventCategory, MedicalDocument } from '../../types';

interface JournalViewProps {
  events: HealthEvent[];
  documents: MedicalDocument[];
  onOpenNewEvent: () => void;
  onEditEvent: (event: HealthEvent) => void;
  onDeleteEvent: (id: string) => void;
  onPreviewDocument: (doc: MedicalDocument) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  events,
  documents,
  onOpenNewEvent,
  onEditEvent,
  onDeleteEvent,
  onPreviewDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<HealthEvent | null>(null);

  const categories: { id: string; label: string; icon: any }[] = [
    { id: 'ALL', label: 'Tous', icon: Filter },
    { id: 'CONSULTATION', label: 'Consultations', icon: Stethoscope },
    { id: 'ANALYSE', label: 'Analyses & Biologie', icon: Activity },
    { id: 'TRAITEMENT', label: 'Traitements', icon: Pill },
    { id: 'VACCIN', label: 'Vaccinations', icon: Syringe },
    { id: 'CHIRURGIE', label: 'Chirurgies', icon: Heart },
    { id: 'SYMPTOME', label: 'Symptômes', icon: AlertTriangle },
  ];

  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const matchesCategory =
          selectedCategory === 'ALL' || evt.category === selectedCategory;
        const matchesQuery =
          searchQuery.trim() === '' ||
          evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evt.doctor_or_facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evt.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }, [events, selectedCategory, searchQuery]);

  const getCategoryConfig = (cat: EventCategory) => {
    switch (cat) {
      case 'CONSULTATION':
        return { label: 'Consultation', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'ANALYSE':
        return { label: 'Analyse / Biologie', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'TRAITEMENT':
        return { label: 'Traitement', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'VACCIN':
        return { label: 'Vaccin', badge: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'CHIRURGIE':
        return { label: 'Chirurgie', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'SYMPTOME':
        return { label: 'Symptôme', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  const docMap = useMemo(() => {
    const map = new Map<string, MedicalDocument>();
    documents.forEach((d) => map.set(d.id, d));
    return map;
  }, [documents]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Carnet de Santé Numérique
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Historique chronologique complet de vos consultations, examens et traitements
          </p>
        </div>

        <button
          onClick={onOpenNewEvent}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un événement</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, médecin, clinique, mot-clé clinique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Timeline / Cards */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Aucun événement trouvé</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Aucun enregistrement ne correspond à vos critères de recherche. Essayez de réinitialiser les filtres.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            className="mt-4 px-3 py-1.5 text-xs text-teal-600 font-semibold hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const config = getCategoryConfig(event.category);
            const attachedDocs = event.attachments
              .map((id) => docMap.get(id))
              .filter(Boolean) as MedicalDocument[];

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${config.badge}`}>
                      {config.label}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {event.event_date}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      onClick={() => onEditEvent(event)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Modifier cet événement"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Supprimer l'événement "${event.title}" ?`)) {
                          onDeleteEvent(event.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer cet événement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Event Main Content */}
                <div className="mt-3">
                  <h3 className="text-base font-bold text-slate-900">{event.title}</h3>
                  <p className="text-xs font-semibold text-teal-800 mt-0.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    {event.doctor_or_facility}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Treatment Notes */}
                {event.treatment_notes && (
                  <div className="mt-3 p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                    <Pill className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Recommandations / Prescription :</strong>{' '}
                      <span>{event.treatment_notes}</span>
                    </div>
                  </div>
                )}

                {/* Vital Signs (if present) */}
                {event.vital_signs && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500">
                    {event.vital_signs.bp && (
                      <span className="inline-flex items-center gap-1 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                        <Activity className="w-3 h-3 text-teal-600" />
                        Tension: <strong>{event.vital_signs.bp} mmHg</strong>
                      </span>
                    )}
                    {event.vital_signs.hr && (
                      <span className="inline-flex items-center gap-1 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                        <Heart className="w-3 h-3 text-rose-500" />
                        Pouls: <strong>{event.vital_signs.hr} bpm</strong>
                      </span>
                    )}
                    {event.vital_signs.temp_c && (
                      <span className="inline-flex items-center gap-1 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                        Temp: <strong>{event.vital_signs.temp_c} °C</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Attached Documents */}
                {attachedDocs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Paperclip className="w-3 h-3" />
                      Documents joints du Coffre-fort ({attachedDocs.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {attachedDocs.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => onPreviewDocument(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100/80 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span className="truncate max-w-[200px]">{doc.title}</span>
                          <span className="text-[10px] text-teal-600 bg-white/70 px-1 rounded">
                            Aperçu
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
