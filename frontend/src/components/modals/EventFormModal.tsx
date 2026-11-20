import React, { useState, useEffect } from 'react';
import { X, Calendar, Stethoscope, FileText, Activity, AlertCircle, Paperclip } from 'lucide-react';
import { HealthEvent, EventCategory, MedicalDocument } from '../../types';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<HealthEvent, 'id' | 'created_at'>, existingId?: string) => void;
  eventToEdit?: HealthEvent | null;
  documents: MedicalDocument[];
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  documents,
}) => {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<EventCategory>('CONSULTATION');
  const [doctorOrFacility, setDoctorOrFacility] = useState('');
  const [description, setDescription] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState<string>('');
  const [tempC, setTempC] = useState<string>('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setEventDate(eventToEdit.event_date);
      setCategory(eventToEdit.category);
      setDoctorOrFacility(eventToEdit.doctor_or_facility);
      setDescription(eventToEdit.description);
      setTreatmentNotes(eventToEdit.treatment_notes || '');
      setBp(eventToEdit.vital_signs?.bp || '');
      setHr(eventToEdit.vital_signs?.hr ? String(eventToEdit.vital_signs.hr) : '');
      setTempC(eventToEdit.vital_signs?.temp_c ? String(eventToEdit.vital_signs.temp_c) : '');
      setSelectedDocs(eventToEdit.attachments || []);
    } else {
      setTitle('');
      setEventDate(new Date().toISOString().slice(0, 10));
      setCategory('CONSULTATION');
      setDoctorOrFacility('');
      setDescription('');
      setTreatmentNotes('');
      setBp('');
      setHr('');
      setTempC('');
      setSelectedDocs([]);
    }
    setErrors({});
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Le titre est obligatoire';
    if (!eventDate) newErrors.eventDate = 'La date est obligatoire';
    if (!doctorOrFacility.trim()) newErrors.doctorOrFacility = 'Le médecin ou l\'établissement est obligatoire';
    if (!description.trim()) newErrors.description = 'La description médicale est obligatoire';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const vital_signs: HealthEvent['vital_signs'] = {};
    if (bp.trim()) vital_signs.bp = bp.trim();
    if (hr.trim() && !isNaN(Number(hr))) vital_signs.hr = Number(hr);
    if (tempC.trim() && !isNaN(Number(tempC))) vital_signs.temp_c = Number(tempC);

    onSave(
      {
        title: title.trim(),
        event_date: eventDate,
        category,
        doctor_or_facility: doctorOrFacility.trim(),
        description: description.trim(),
        treatment_notes: treatmentNotes.trim() || undefined,
        vital_signs: Object.keys(vital_signs).length > 0 ? vital_signs : undefined,
        attachments: selectedDocs,
      },
      eventToEdit ? eventToEdit.id : undefined
    );
    onClose();
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-teal-200">
                Carnet de Santé Numérique
              </span>
              <h2 className="text-base font-bold text-white">
                {eventToEdit ? 'Modifier l\'événement médical' : 'Enregistrer un nouvel événement de santé'}
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
          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie médicale <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="CONSULTATION">🩺 Consultation Médicale</option>
                <option value="ANALYSE">🧪 Analyse & Biologie</option>
                <option value="TRAITEMENT">💊 Traitement & Prescription</option>
                <option value="VACCIN">💉 Vaccination</option>
                <option value="CHIRURGIE">🏥 Intervention / Chirurgie</option>
                <option value="SYMPTOME">⚠️ Symptôme / Observation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date de l'événement <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={`w-full text-xs rounded-xl border ${
                    errors.eventDate ? 'border-rose-400' : 'border-slate-300'
                  } p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
                />
              </div>
              {errors.eventDate && (
                <span className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.eventDate}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Titre de l'événement <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Consultation cardiologie, Bilan sanguin à jeun, Rappel DTP..."
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

          {/* Doctor or Facility */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Praticien ou Établissement de santé <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Dr. Omar Bennani (Clinique Agdal, Rabat), Hôpital Cheikh Khalifa..."
              value={doctorOrFacility}
              onChange={(e) => setDoctorOrFacility(e.target.value)}
              className={`w-full text-xs rounded-xl border ${
                errors.doctorOrFacility ? 'border-rose-400' : 'border-slate-300'
              } p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
            />
            {errors.doctorOrFacility && (
              <span className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.doctorOrFacility}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Constatations cliniques <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Détails du motif, compte-rendu médical, conclusions de l'examen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full text-xs rounded-xl border ${
                errors.description ? 'border-rose-400' : 'border-slate-300'
              } p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
            />
            {errors.description && (
              <span className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.description}
              </span>
            )}
          </div>

          {/* Treatment Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prescription ou Recommandations de traitement (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Ventoline 100µg en cas de crise, prochain bilan dans 6 mois..."
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Vitals */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              Constantes vitales relevées (Optionnel)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Tension (mmHg)</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-1.5 bg-white text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Pouls (bpm)</label>
                <input
                  type="number"
                  placeholder="72"
                  value={hr}
                  onChange={(e) => setHr(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-1.5 bg-white text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Température (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={tempC}
                  onChange={(e) => setTempC(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-1.5 bg-white text-center"
                />
              </div>
            </div>
          </div>

          {/* Link documents from vault */}
          {documents.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                Associer des documents du Coffre-fort ({selectedDocs.length} sélectionné{selectedDocs.length > 1 ? 's' : ''})
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                {documents.map((doc) => {
                  const isChecked = selectedDocs.includes(doc.id);
                  return (
                    <label
                      key={doc.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-teal-50 border border-teal-200 font-semibold text-teal-900' : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDocument(doc.id)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate flex-1">{doc.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{doc.issue_date}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              {eventToEdit ? 'Enregistrer les modifications' : 'Ajouter au carnet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
