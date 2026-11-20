import React, { useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
  Calendar,
  FileText,
  AlertTriangle,
  Activity,
  PlusCircle,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  HealthEvent,
  MedicalDocument,
  SharingSession,
  SharingScope,
  PatientProfile,
} from '../../types';
import { QRCodeDisplay } from '../common/QRCodeDisplay';

interface SharingViewProps {
  patient: PatientProfile;
  events: HealthEvent[];
  documents: MedicalDocument[];
  sessions: SharingSession[];
  isDemoMode?: boolean;
  onCreateSession: (
    recipient: string,
    purpose: string,
    durationMinutes: number,
    oneTimeUse: boolean,
    scope: SharingScope
  ) => Promise<void>;
  onRevokeSession: (sessionId: string) => Promise<void>;
  onOpenDoctorPortal: (token: string) => void;
}

export const SharingView: React.FC<SharingViewProps> = ({
  patient,
  events,
  documents,
  sessions,
  isDemoMode = false,
  onCreateSession,
  onRevokeSession,
  onOpenDoctorPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states for creating session
  const [recipient, setRecipient] = useState('Dr. Omar Bennani (Cardiologie)');
  const [purpose, setPurpose] = useState('Consultation médicale et avis spécialisé');
  const [durationMinutes, setDurationMinutes] = useState<number>(60); // 1 hour
  const [oneTimeUse, setOneTimeUse] = useState<boolean>(false);

  // Granular consent state
  const [includeAllergies, setIncludeAllergies] = useState(true);
  const [includeVitals, setIncludeVitals] = useState(true);
  const [includeEmergency, setIncludeEmergency] = useState(true);
  const [allEvents, setAllEvents] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    events.slice(0, 2).map((e) => e.id)
  );
  const [allDocs, setAllDocs] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(
    documents.slice(0, 2).map((d) => d.id)
  );

  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) return;
    setCreateError(null);
    setIsCreating(true);

    const scope: SharingScope = {
      all_events: allEvents,
      event_ids: allEvents ? [] : selectedEventIds,
      all_docs: allDocs,
      doc_ids: allDocs ? [] : selectedDocIds,
      include_allergies: includeAllergies,
      include_vitals: includeVitals,
      include_emergency: includeEmergency,
    };

    try {
      await onCreateSession(
        recipient.trim(),
        purpose.trim() || 'Consultation de santé',
        durationMinutes,
        oneTimeUse,
        scope
      );
      setActiveTab('list');
    } catch (err: any) {
      setCreateError(err?.message || 'Erreur lors de la création de la session de partage.');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleEventId = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleDocId = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const activeSessions = sessions.filter(
    (s) => !s.is_revoked && new Date(s.expires_at).getTime() > Date.now()
  );

  const expiredOrRevokedSessions = sessions.filter(
    (s) => s.is_revoked || new Date(s.expires_at).getTime() <= Date.now()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Partage Sécurisé & Consentement Patient
            </h1>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Zéro Fuite de Données
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Générez des QR codes temporaires et choisissez au cas par cas ce que le praticien peut consulter
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nouveau Partage
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Sessions en cours</span>
            {activeSessions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        /* Consent & Sharing Builder Wizard */
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Step 1: Destination & Expiration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Destinataire et Durée de Validité</h3>
                <p className="text-xs text-slate-400">À qui confiez-vous l'accès et pour combien de temps ?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Médecin ou Établissement destinataire <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Omar Bennani (Cardiologie), Clinique Agdal..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif ou Contexte de consultation
                </label>
                <input
                  type="text"
                  placeholder="Ex: Consultation cardiologique, bilan pré-opératoire..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Expiration Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Durée de validité du QR code (Auto-révocation)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { mins: 15, label: '15 minutes', desc: 'Consultation rapide' },
                  { mins: 60, label: '1 heure', desc: 'Examen approfondi' },
                  { mins: 1440, label: '24 heures', desc: 'Hospitalisation de jour' },
                  { mins: 10080, label: '7 jours', desc: 'Suivi post-opératoire' },
                ].map((preset) => {
                  const isSelected = durationMinutes === preset.mins;
                  return (
                    <button
                      key={preset.mins}
                      type="button"
                      onClick={() => setDurationMinutes(preset.mins)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 block">{preset.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{preset.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* One-time use checkbox */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Usage unique (Révocation automatique après consultation)
                </span>
                <span className="text-[11px] text-slate-500">
                  Dès que le médecin a consulté le dossier, le jeton devient immédiatement invalide.
                </span>
              </div>
              <input
                type="checkbox"
                checked={oneTimeUse}
                onChange={(e) => setOneTimeUse(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Step 2: Granular Consent Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Périmètre du Consentement Médical</h3>
                <p className="text-xs text-slate-400">
                  Cochez uniquement les informations médicales que vous autorisez à transmettre
                </p>
              </div>
            </div>

            {/* Critical Info Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-white flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAllergies}
                  onChange={(e) => setIncludeAllergies(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Allergies & Alertes
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Transmettre le signalement de votre allergie à la pénicilline
                  </p>
                </div>
              </label>

              <label className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-white flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVitals}
                  onChange={(e) => setIncludeVitals(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    Constantes Vitales
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Dernières mesures (Tension 120/80, Pouls 72 bpm)
                  </p>
                </div>
              </label>

              <label className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-white flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEmergency}
                  onChange={(e) => setIncludeEmergency(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Contact d'Urgence
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Coordonnées de Mme Amina Mansouri (Épouse)
                  </p>
                </div>
              </label>
            </div>

            {/* Granular Events Selector */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Événements du Carnet de Santé ({allEvents ? 'Tous' : selectedEventIds.length} sélectionné{selectedEventIds.length > 1 ? 's' : ''})
                </span>
                <button
                  type="button"
                  onClick={() => setAllEvents(!allEvents)}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  {allEvents ? 'Choisir au cas par cas' : 'Partager tout le carnet'}
                </button>
              </div>

              {!allEvents && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {events.map((evt) => {
                    const isChecked = selectedEventIds.includes(evt.id);
                    return (
                      <label
                        key={evt.id}
                        className={`flex items-center gap-3 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-teal-50/80 border border-teal-200 text-teal-950 font-semibold'
                            : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEventId(evt.id)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {evt.event_date}
                        </span>
                        <span className="truncate flex-1">{evt.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-100">
                          {evt.category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Granular Documents Selector */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Documents du Coffre-fort ({allDocs ? 'Tous' : selectedDocIds.length} sélectionné{selectedDocIds.length > 1 ? 's' : ''})
                </span>
                <button
                  type="button"
                  onClick={() => setAllDocs(!allDocs)}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  {allDocs ? 'Choisir au cas par cas' : 'Partager tous les documents'}
                </button>
              </div>

              {!allDocs && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {documents.map((doc) => {
                    const isChecked = selectedDocIds.includes(doc.id);
                    return (
                      <label
                        key={doc.id}
                        className={`flex items-center gap-3 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-teal-50/80 border border-teal-200 text-teal-950 font-semibold'
                            : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDocId(doc.id)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate flex-1">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.doctor_or_lab}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col items-end gap-2">
            {createError && (
              <p className="text-xs text-rose-600 font-semibold">{createError}</p>
            )}
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:scale-[1.01] transition-all"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Création en cours…</span>
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  <span>Générer le QR Code Éphémère Sécurisé</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Sessions List & Active QR Cards */
        <div className="space-y-6">
          {/* Active Sessions */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sessions Actives ({activeSessions.length})
            </h2>

            {activeSessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-slate-700">Aucun accès actif</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Aucun médecin n'a actuellement accès à votre dossier.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-3 px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700"
                >
                  Créer un partage
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeSessions.map((session) => {
                  const shareUrl = `${window.location.origin}/share/${session.token}`;
                  return (
                    <div
                      key={session.id}
                      className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                          <span className="text-xs font-bold text-slate-900">
                            {session.recipient_label}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Valide jusqu'à {new Date(session.expires_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mb-4">
                          Motif : <strong>{session.purpose}</strong>
                        </p>

                        {/* QR Code view */}
                        <QRCodeDisplay
                          value={shareUrl}
                          recipientLabel={session.recipient_label}
                          expiresAt={session.expires_at}
                          isRevoked={session.is_revoked}
                          onOpenDoctorView={() => onOpenDoctorPortal(session.token)}
                          onRevoke={() => {
                            if (window.confirm('Révoquer immédiatement l\'accès pour ce praticien ?')) {
                              onRevokeSession(session.id);
                            }
                          }}
                        />

                        {/* Consented summary */}
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Données consenties :</span>
                          <p>
                            • {session.scope.all_events ? 'Tous les événements' : `${session.scope.event_ids.length} événement(s) sélectionnés`}
                          </p>
                          <p>
                            • {session.scope.all_docs ? 'Tous les documents' : `${session.scope.doc_ids.length} document(s) sélectionnés`}
                          </p>
                          <p>
                            • Allergies : {session.scope.include_allergies ? 'Oui' : 'Non'} • Constantes : {session.scope.include_vitals ? 'Oui' : 'Non'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expired or Revoked History */}
          {expiredOrRevokedSessions.length > 0 && (
            <div className="pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Historique des Partages Révoqués ou Expirés ({expiredOrRevokedSessions.length})
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
                {expiredOrRevokedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800">{session.recipient_label}</strong>
                        <span className="text-[10px] font-mono text-slate-400">
                          {session.token}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{session.purpose}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          session.is_revoked
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {session.is_revoked ? 'Révoqué par le patient' : 'Expiré'}
                      </span>
                      <button
                        onClick={() => onOpenDoctorPortal(session.token)}
                        className="px-2.5 py-1 rounded border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                      >
                        Tester sécurité
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
