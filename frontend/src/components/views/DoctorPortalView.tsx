import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Calendar,
  FileText,
  Phone,
  ArrowLeft,
  Clock,
  Eye,
  Lock,
} from 'lucide-react';
import {
  PatientProfile,
  HealthEvent,
  MedicalDocument,
  SharingSession,
  ConsentedPatientProfile,
} from '../../types';
import { api } from '../../services/api';
import { BrandLogo } from '../common/BrandLogo';

interface DoctorPortalViewProps {
  token?: string;
  patient: PatientProfile;
  events: HealthEvent[];
  documents: MedicalDocument[];
  onBackToApp: () => void;
  onPreviewDocument: (doc: MedicalDocument) => void;
}

export const DoctorPortalView: React.FC<DoctorPortalViewProps> = ({
  token,
  patient: fallbackPatient,
  events: fallbackEvents,
  documents: fallbackDocuments,
  onBackToApp,
  onPreviewDocument,
}) => {
  const [loading, setLoading] = useState(!!token);
  const [session, setSession] = useState<SharingSession | null>(null);
  const [patient, setPatient] = useState<ConsentedPatientProfile | PatientProfile>(fallbackPatient);
  const [consentedEvents, setConsentedEvents] = useState<HealthEvent[]>([]);
  const [consentedDocuments, setConsentedDocuments] = useState<MedicalDocument[]>([]);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setLoading(true);
      setErrorCode(null);

      api.accessSharedSession(token)
        .then((res) => {
          setSession(res.session);
          setPatient(res.patient);
          setConsentedEvents(res.events);
          setConsentedDocuments(res.documents);
          setLoading(false);
        })
        .catch((err: Error) => {
          setSession(null);
          setErrorCode(err.message || 'ACCESS_DENIED');
          setLoading(false);
        });
    } else {
      setSession(null);
      setErrorCode('NOT_FOUND');
      setLoading(false);
    }
  }, [token]);

  const isInvalid = !session || session.is_revoked || errorCode !== null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Professional Portal Header */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center px-2">
              <BrandLogo className="h-8 w-16" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  CARNI • Portail Professionnel de Santé
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  MAROC SANTÉ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Consultation médicale temporaire sous contrôle souverain du patient
              </p>
            </div>
          </div>

          <button
            onClick={onBackToApp}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quitter la session</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm max-w-md mx-auto my-12">
            <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-800">Vérification des autorisations...</h3>
            <p className="text-xs text-slate-400 mt-1">Connexion sécurisée au registre de partage CARNI</p>
          </div>
        ) : isInvalid ? (
          /* Access Denied / Expired / Revoked Screen */
          <div className="bg-white rounded-3xl border border-rose-200 p-10 text-center shadow-lg max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Accès Médical Expiré ou Révoqué
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {errorCode === 'REVOKED'
                ? 'Cette session a été révoquée par le patient. L\'autorisation d\'accès est immédiatement et définitivement résiliée.'
                : errorCode === 'EXPIRED'
                ? 'La durée de validité de ce lien temporaire est dépassée. Le praticien ne peut plus consulter ces données sans un nouveau QR code.'
                : errorCode === 'NOT_FOUND'
                ? 'Le jeton de consultation transmis est invalide ou n\'existe pas dans le système.'
                : 'L\'accès à ce dossier médical a été verrouillé pour des raisons de sécurité ou de consentement révoqué.'}
            </p>
            <div className="mt-5 p-3.5 bg-slate-50 rounded-xl text-left font-mono text-[11px] text-slate-600 border border-slate-200 space-y-1.5">
              <div>• Statut : <span className="text-rose-600 font-bold">{errorCode || 'Invalide / Révoqué'}</span></div>
              <div>• Sécurité : Zéro donnée médicale exposée</div>
            </div>
            <button
              onClick={onBackToApp}
              className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Retour à l'application CARNI
            </button>
          </div>
        ) : (
          /* Valid Consented Doctor View */
          <>
            {/* Live Security Bar */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-900">
                      Accès Autorisé pour : {session.recipient_label}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      Session Active
                    </span>
                    {session.one_time_use && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        Usage Unique Consommé
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-teal-800 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expire le {new Date(session.expires_at).toLocaleTimeString('fr-FR')} • Traçabilité auditable active</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Patient Identity Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {patient.full_name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {patient.full_name}
                      <span className="text-xs font-normal text-slate-500">
                        ({patient.age} ans, {patient.gender === 'M' ? 'Homme' : 'Femme'})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Identifiant : {patient.cin_cnss} • {patient.city}, Maroc
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Groupe Sanguin</span>
                    <span className="text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
                      {patient.blood_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Alerts & Vitals (if explicitly consented) */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Allergies Alert */}
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl">
                    <span className="text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Allergies & Alertes Vitales Autorisées
                    </span>
                    <div className="space-y-1.5">
                      {patient.allergies.map((all, i) => (
                        <div key={i} className="text-xs text-rose-950 font-semibold bg-white p-2 rounded-lg border border-rose-100">
                          <strong>{all.name} :</strong> {all.reaction} ({all.severity})
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Allergies non transmises par le patient.</span>
                  </div>
                )}

                {/* Vitals */}
                {patient.vitals ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5 mb-2">
                      <Activity className="w-4 h-4 text-teal-600" />
                      Constantes Vitales Autorisées
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Tension</span>
                        <span className="text-xs font-mono font-bold text-slate-900">{patient.vitals.blood_pressure}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Pouls</span>
                        <span className="text-xs font-mono font-bold text-slate-900">{patient.vitals.heart_rate} bpm</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Glycémie</span>
                        <span className="text-xs font-mono font-bold text-slate-900">{patient.vitals.blood_sugar_mg_dl} mg/dL</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Constantes physiologiques non transmises.</span>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              {patient.emergency_contact ? (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  <span>
                    Contact d'urgence autorisé : <strong>{patient.emergency_contact.name} ({patient.emergency_contact.relation})</strong>
                  </span>
                  <a
                    href={`tel:${patient.emergency_contact.phone}`}
                    className="font-bold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {patient.emergency_contact.phone}
                  </a>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
                  Contact d'urgence non inclus dans le périmètre de partage.
                </div>
              )}
            </div>

            {/* Consented Health Events */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Antécédents & Événements Médicaux Transmis ({consentedEvents.length})
                </h3>
              </div>

              {consentedEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">
                  Aucun événement du carnet n'a été sélectionné pour ce partage.
                </p>
              ) : (
                <div className="space-y-3">
                  {consentedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                        <span className="text-xs font-mono text-slate-400">{evt.event_date}</span>
                      </div>
                      <p className="text-xs text-teal-800 font-semibold">{evt.doctor_or_facility}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                      {evt.treatment_notes && (
                        <p className="text-xs text-purple-900 font-medium bg-purple-50 p-2 rounded-lg mt-2">
                          Prescription / Notes : {evt.treatment_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consented Medical Documents */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Documents Médicaux Transmis ({consentedDocuments.length})
                </h3>
              </div>

              {consentedDocuments.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">
                  Aucun document numérisé n'a été sélectionné pour ce partage.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {consentedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50/40 flex items-start justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                            {doc.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{doc.issue_date}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{doc.title}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{doc.doctor_or_lab}</p>
                      </div>

                      <button
                        onClick={() => onPreviewDocument(doc)}
                        className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Aperçu</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medical Audit Notice */}
            <div className="p-4 bg-slate-200/50 rounded-2xl text-center text-xs text-slate-500">
              <span className="block font-medium">
                Accès temporaire consenti • Toute consultation est tracée et opposable dans le journal d'audit du patient.
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
