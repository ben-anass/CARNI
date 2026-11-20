import React from 'react';
import { X, AlertTriangle, Phone, Heart, Activity, ShieldCheck, Printer } from 'lucide-react';
import { PatientProfile } from '../../types';

interface EmergencyModalProps {
  patient: PatientProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ patient, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Urgent red header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-rose-200">
                Fiche d'Urgence Médicale
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {patient.full_name}
                <span className="text-xs bg-rose-500/80 px-2 py-0.5 rounded-full font-mono">
                  {patient.age} ans • {patient.gender === 'M' ? 'Homme' : 'Femme'}
                </span>
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

        {/* Modal content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Blood group banner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                {patient.blood_type}
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-700 uppercase">Groupe Sanguin</span>
                <p className="text-sm font-semibold text-rose-950">Rhésus Positif (O+)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Immatriculation</span>
                <p className="text-xs font-mono font-semibold text-slate-800">{patient.cin_cnss}</p>
                <p className="text-[11px] text-slate-500">{patient.city}, Maroc</p>
              </div>
            </div>
          </div>

          {/* Critical Allergies Box */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Allergies Majeures & Contre-Indications Absolues</span>
            </div>
            <div className="space-y-2">
              {patient.allergies.map((allergy, i) => (
                <div
                  key={i}
                  className="bg-white p-2.5 rounded-lg border border-amber-200 flex items-start justify-between gap-3 shadow-xs"
                >
                  <div>
                    <span className="text-sm font-bold text-slate-900">{allergy.name}</span>
                    <p className="text-xs text-rose-600 font-medium">{allergy.reaction}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 uppercase">
                    {allergy.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chronic Conditions & Treatments */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
              Pathologies Chroniques & Antécédents
            </span>
            <div className="flex flex-wrap gap-2">
              {patient.chronic_conditions.map((cond, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  {cond}
                </span>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-teal-600" />
                Contact d'Urgence (Personne de Confiance / ICE)
              </span>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                {patient.emergency_contact.relation}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-teal-100">
              <div>
                <p className="text-sm font-bold text-slate-900">{patient.emergency_contact.name}</p>
                <p className="text-xs text-slate-500">{patient.emergency_contact.city}</p>
              </div>
              <a
                href={`tel:${patient.emergency_contact.phone}`}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" />
                {patient.emergency_contact.phone}
              </a>
            </div>
          </div>

          {/* Attending Physician */}
          <div className="text-xs text-slate-500 flex items-center justify-between px-1">
            <span>Médecin référent : <strong className="text-slate-700">{patient.attending_physician}</strong></span>
            <span className="flex items-center gap-1 text-teal-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Fiche validée
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimer la fiche</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
