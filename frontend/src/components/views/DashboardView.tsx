import React from 'react';
import {
  Activity,
  Heart,
  Droplet,
  Scale,
  PlusCircle,
  QrCode,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  ExternalLink,
  FolderLock,
  Edit3,
} from 'lucide-react';
import { PatientProfile, HealthEvent, MedicalDocument, SharingSession } from '../../types';
import { TabType } from '../layout/Sidebar';

interface DashboardViewProps {
  patient: PatientProfile;
  events: HealthEvent[];
  documents: MedicalDocument[];
  sharingSessions: SharingSession[];
  onNavigate: (tab: TabType) => void;
  onOpenNewEvent: () => void;
  onOpenUploadDoc: () => void;
  onOpenEmergency: () => void;
  onOpenVitalsModal: () => void;
  onOpenDoctorPortal: (token?: string) => void;
  onRevokeSession: (sessionId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patient,
  events,
  documents,
  sharingSessions,
  onNavigate,
  onOpenNewEvent,
  onOpenUploadDoc,
  onOpenVitalsModal,
  onOpenDoctorPortal,
  onRevokeSession,
}) => {
  const activeSessions = sharingSessions.filter(
    (s) => !s.is_revoked && new Date(s.expires_at).getTime() > Date.now()
  );

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    .slice(0, 4);

  const getCategoryBadge = (cat: HealthEvent['category']) => {
    switch (cat) {
      case 'CONSULTATION':
        return { label: 'Consultation', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'ANALYSE':
        return { label: 'Biologie', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'TRAITEMENT':
        return { label: 'Traitement', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'VACCIN':
        return { label: 'Vaccination', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'CHIRURGIE':
        return { label: 'Intervention', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'SYMPTOME':
        return { label: 'Symptôme', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative backdrop shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-teal-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-teal-300">
                Dossier Médical Souverain
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-mono">{patient.cin_cnss}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bonjour, {patient.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-teal-200/90 font-medium mt-0.5 italic">
              « Votre santé. Votre mémoire. Votre contrôle. »
            </p>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Votre carnet de santé numérique est à jour. Vous contrôlez à 100% l'accès à vos données médicales et vos partages éphémères.
            </p>

            {/* Critical Allergies Badge */}
            {patient.allergies.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Allergie majeure déclarée :
                </span>
                {patient.allergies.map((all, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/30 text-xs font-bold"
                  >
                    {all.name} ({all.severity})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenNewEvent}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouvel événement</span>
            </button>
            <button
              onClick={() => onNavigate('sharing')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 backdrop-blur-md transition-all"
            >
              <QrCode className="w-4 h-4 text-teal-300" />
              <span>Partage QR Médecin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vitals Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Constantes Physiologiques en Temps Réel</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Dernier relevé enregistré : {new Date(patient.vitals.last_updated).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <button
          onClick={onOpenVitalsModal}
          className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-teal-600" />
          <span>Mettre à jour mes mesures</span>
        </button>
      </div>

      {/* Vitals Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tension */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Tension Artérielle</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {patient.vitals.blood_pressure}
            </span>
            <span className="text-xs text-slate-400 font-medium">mmHg</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Pression optimale
          </div>
        </div>

        {/* Fréquence Cardiaque */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Pouls au repos</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {patient.vitals.heart_rate}
            </span>
            <span className="text-xs text-slate-400 font-medium">bpm</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Rythme sinusal régulier
          </div>
        </div>

        {/* Glycémie */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Glycémie à jeun</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {patient.vitals.blood_sugar_mg_dl}
            </span>
            <span className="text-xs text-slate-400 font-medium">mg/dL</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> {(patient.vitals.blood_sugar_mg_dl / 100).toFixed(2)} g/L (Normal)
          </div>
        </div>

        {/* Poids & IMC */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Poids & Indice IMC</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {patient.vitals.weight_kg}
            </span>
            <span className="text-xs text-slate-400 font-medium">kg</span>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full ml-auto">
              IMC {patient.vitals.bmi}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Taille : {patient.vitals.height_cm} cm • Corpulence normale
          </div>
        </div>
      </div>

      {/* Active Temporary Sharing Alerts (if any) */}
      {activeSessions.length > 0 && (
        <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                    Session de Partage Active ({activeSessions.length})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    En direct
                  </span>
                </div>
                <p className="text-xs text-teal-900 mt-0.5">
                  Autorisé pour : <strong>{activeSessions[0].recipient_label}</strong> ({activeSessions[0].purpose})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onOpenDoctorPortal(activeSessions[0].token)}
                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                <span>Tester accès</span>
              </button>
              <button
                onClick={() => onRevokeSession(activeSessions[0].id)}
                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
              >
                Révoquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Events & Vault Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Health Events (2 columns on large) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Événements de Santé Récents</h2>
              <p className="text-xs text-slate-500">Dernières consultations et examens enregistrés</p>
            </div>
            <button
              onClick={() => onNavigate('journal')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 group"
            >
              <span>Voir tout le carnet</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="space-y-3.5">
            {recentEvents.map((event) => {
              const badge = getCategoryBadge(event.category);
              return (
                <div
                  key={event.id}
                  onClick={() => onNavigate('journal')}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.event_date}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{event.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{event.doctor_or_facility}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{event.description}</p>
                  </div>

                  {event.vital_signs?.bp && (
                    <div className="hidden sm:block text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tension</span>
                      <span className="text-xs font-mono font-bold text-teal-800">{event.vital_signs.bp}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vault Quick Access Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <FolderLock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Coffre-fort Médical</h3>
                  <span className="text-xs text-slate-500">{documents.length} documents certifiés</span>
                </div>
              </div>
              <button
                onClick={onOpenUploadDoc}
                className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold"
                title="Ajouter un document"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Vos ordonnances, bilans biologiques et comptes-rendus numérisés avec prévisualisation certifiée.
            </p>

            {/* List of 3 recent documents */}
            <div className="space-y-2">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigate('vault')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-between gap-2 border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {doc.doctor_or_lab} • {doc.issue_date}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {doc.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('vault')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Accéder au Coffre-fort</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
