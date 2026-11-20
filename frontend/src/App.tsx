import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_PATIENT,
  INITIAL_EVENTS,
  INITIAL_DOCUMENTS,
  INITIAL_SHARING_SESSIONS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import {
  PatientProfile,
  HealthEvent,
  MedicalDocument,
  SharingSession,
  AuditLogEntry,
  SharingScope,
} from './types';
import { api } from './services/api';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { JournalView } from './components/views/JournalView';
import { VaultView } from './components/views/VaultView';
import { SharingView } from './components/views/SharingView';
import { AuditLogView } from './components/views/AuditLogView';
import { DoctorPortalView } from './components/views/DoctorPortalView';
import { EmergencyModal } from './components/modals/EmergencyModal';
import { EventFormModal } from './components/modals/EventFormModal';
import { DocumentUploadModal } from './components/modals/DocumentUploadModal';
import { DocumentPreviewModal } from './components/modals/DocumentPreviewModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';

export const App: React.FC = () => {
  // Main states — initialized to empty; filled from backend if reachable, mock data otherwise
  const [patient, setPatient] = useState<PatientProfile>(INITIAL_PATIENT);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [sharingSessions, setSharingSessions] = useState<SharingSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType | 'doctor'>('dashboard');
  const [doctorToken, setDoctorToken] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Modals state
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<HealthEvent | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<MedicalDocument | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check URL pathname for /share/:token on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const token = path.replace('/share/', '').trim();
      if (token) {
        setDoctorToken(token);
        setActiveTab('doctor');
      }
    }
  }, []);

  // Load data from backend on mount; fall back to mock only if backend unreachable
  const loadBackendData = useCallback(async () => {
    try {
      const isAlive = await api.checkHealth();
      setIsBackendConnected(isAlive);

      if (isAlive) {
        setIsDemoMode(false);
        // Fetch all data from the real backend — await every call, surface errors
        const [pat, evts, docs, shares, logs] = await Promise.all([
          api.getPatient(),
          api.getEvents(),
          api.getDocuments(),
          api.getSharingSessions(),
          api.getAuditLogs(),
        ]);
        setPatient(pat);
        setEvents(evts);
        setDocuments(docs);
        setSharingSessions(shares);
        setAuditLogs(logs);
      } else {
        // Backend unreachable: fall back to mock data with clear DEMO MODE indicator
        setIsBackendConnected(false);
        setIsDemoMode(true);
        setPatient(INITIAL_PATIENT);
        setEvents(INITIAL_EVENTS);
        setDocuments(INITIAL_DOCUMENTS);
        setSharingSessions(INITIAL_SHARING_SESSIONS);
        setAuditLogs(INITIAL_AUDIT_LOGS);
      }
    } catch {
      setIsBackendConnected(false);
      setIsDemoMode(true);
      setPatient(INITIAL_PATIENT);
      setEvents(INITIAL_EVENTS);
      setDocuments(INITIAL_DOCUMENTS);
      setSharingSessions(INITIAL_SHARING_SESSIONS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
    } finally {
      setIsAppLoading(false);
    }
  }, []);

  // Refresh data lists from backend (called after every mutation)
  const refreshAllData = useCallback(async () => {
    if (!isBackendConnected) return;
    try {
      const [evts, docs, shares, logs] = await Promise.all([
        api.getEvents(),
        api.getDocuments(),
        api.getSharingSessions(),
        api.getAuditLogs(),
      ]);
      setEvents(evts);
      setDocuments(docs);
      setSharingSessions(shares);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to refresh data from backend', err);
    }
  }, [isBackendConnected]);

  useEffect(() => {
    loadBackendData();
    const interval = setInterval(loadBackendData, 15000);
    return () => clearInterval(interval);
  }, [loadBackendData]);

  // Event Handlers — always await API; show errors visibly; never create local fake records

  const handleSaveEvent = async (
    eventData: Omit<HealthEvent, 'id' | 'created_at'>,
    existingId?: string
  ): Promise<boolean> => {
    if (isDemoMode) {
      // Demo mode: local-only mutations with clear warning
      if (existingId) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === existingId
              ? { ...e, ...eventData, updated_at: new Date().toISOString() }
              : e
          )
        );
        addToast('warning', '[DÉMO] Événement modifié localement', 'Backend non connecté — données non persistées.');
      } else {
        const newEvent: HealthEvent = {
          ...eventData,
          id: `evt_local_${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        setEvents((prev) => [newEvent, ...prev]);
        addToast('warning', '[DÉMO] Événement ajouté localement', 'Backend non connecté — données non persistées.');
      }
      setEventToEdit(null);
      return true;
    }

    // Backend connected: await the API call, use the returned record (server ID/timestamp)
    try {
      if (existingId) {
        const updated = await api.updateEvent(existingId, eventData);
        setEvents((prev) => prev.map((e) => (e.id === existingId ? updated : e)));
        addToast('success', 'Événement modifié', `"${updated.title}" a été mis à jour.`);
      } else {
        const created = await api.createEvent(eventData);
        setEvents((prev) => [created, ...prev]);
        addToast('success', 'Événement ajouté', `"${created.title}" a été enregistré au carnet.`);
      }
    } catch (err: unknown) {
      addToast(
        'error',
        'Erreur',
        err instanceof Error ? err.message : 'Impossible de sauvegarder l\'événement.'
      );
      return false;
    }

    try {
      // Refresh audit logs from backend (backend wrote the real audit entry)
      setAuditLogs(await api.getAuditLogs());
    } catch (err: unknown) {
      addToast(
        'error',
        'Erreur de chargement du journal',
        err instanceof Error ? err.message : 'Impossible de charger le journal d\'audit.'
      );
    }

    return true;
  };

  const handleDeleteEvent = async (id: string) => {
    if (isDemoMode) {
      const deleted = events.find((e) => e.id === id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      addToast('warning', '[DÉMO] Événement supprimé localement', deleted ? `"${deleted.title}"` : undefined);
      return;
    }

    const deleted = events.find((e) => e.id === id);
    try {
      await api.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      addToast('info', 'Événement supprimé', deleted ? `"${deleted.title}" a été retiré.` : undefined);
    } catch (err: unknown) {
      addToast(
        'error',
        'Erreur de suppression',
        err instanceof Error ? err.message : 'Impossible de supprimer l\'événement.'
      );
      return;
    }

    try {
      setAuditLogs(await api.getAuditLogs());
    } catch (err: unknown) {
      addToast(
        'error',
        'Erreur de chargement du journal',
        err instanceof Error ? err.message : 'Impossible de charger le journal d\'audit.'
      );
    }
  };

  const handleUploadDocument = async (docData: Omit<MedicalDocument, 'id' | 'created_at'>, file: File) => {
    if (isDemoMode) {
      const newDoc: MedicalDocument = {
        ...docData,
        id: `doc_local_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setDocuments((prev) => [newDoc, ...prev]);
      addToast('warning', '[DÉMO] Document ajouté localement', 'Backend non connecté — le fichier n\'est pas stocké.');
      return;
    }

    try {
      const created = await api.createDocument(docData, file);
      setDocuments((prev) => [created, ...prev]);
      addToast('success', 'Document enregistré', `"${created.title}" a été enregistré dans le coffre-fort.`);
      void api.getAuditLogs().then(setAuditLogs).catch(console.error);
    } catch (err: any) {
      addToast('error', 'Erreur de dépôt', err?.message || 'Impossible d\'enregistrer le document.');
      throw err;
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (isDemoMode) {
      const doc = documents.find((d) => d.id === id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      addToast('warning', '[DÉMO] Document supprimé localement', doc ? `"${doc.title}"` : undefined);
      return;
    }

    const doc = documents.find((d) => d.id === id);
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      addToast('info', 'Document supprimé', doc ? `"${doc.title}" a été supprimé.` : undefined);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      addToast('error', 'Erreur de suppression', err?.message || 'Impossible de supprimer le document.');
    }
  };

  const handleCreateSharingSession = async (
    recipientLabel: string,
    purpose: string,
    durationMinutes: number,
    oneTimeUse: boolean,
    scope: SharingScope
  ) => {
    if (isDemoMode) {
      // Demo mode: generate a local-only session clearly marked as demo
      const token = `DEMO-${Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`;
      const newSession: SharingSession = {
        id: `sh_local_${Date.now()}`,
        token,
        recipient_label: recipientLabel,
        purpose,
        scope,
        expires_at: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        is_revoked: false,
        access_count: 0,
        one_time_use: oneTimeUse,
      };
      setSharingSessions((prev) => [newSession, ...prev]);
      addToast('warning', '[DÉMO] Session créée localement', 'Backend non connecté — le QR code ne fonctionnera pas.');
      return;
    }

    // Backend connected: backend generates the authoritative token
    try {
      const session = await api.createSharingSession({
        recipient_label: recipientLabel,
        purpose,
        duration_minutes: durationMinutes,
        one_time_use: oneTimeUse,
        scope,
      });
      // Use only the server-returned session (with server-generated token and ID)
      setSharingSessions((prev) => [session, ...prev]);
      addToast(
        'success',
        'QR Code de partage créé !',
        `Session active pour ${session.recipient_label} (${durationMinutes} min).`
      );
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      addToast('error', 'Erreur de création du partage', err?.message || 'Impossible de créer la session de partage.');
      throw err;
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (isDemoMode) {
      setSharingSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, is_revoked: true } : s))
      );
      addToast('warning', '[DÉMO] Accès révoqué localement', 'Le jeton n\'est pas réellement invalidé (backend non connecté).');
      return;
    }

    try {
      await api.revokeSharingSession(sessionId);
      // Refresh from backend to get authoritative state
      const [shares, logs] = await Promise.all([
        api.getSharingSessions(),
        api.getAuditLogs(),
      ]);
      setSharingSessions(shares);
      setAuditLogs(logs);
      addToast('info', 'Accès révoqué', 'Le jeton de partage a été invalidé côté serveur.');
    } catch (err: any) {
      addToast('error', 'Erreur de révocation', err?.message || 'Impossible de révoquer la session.');
    }
  };

  const handleOpenDoctorPortal = (token?: string) => {
    setDoctorToken(token);
    setActiveTab('doctor');
  };

  // Loading screen
  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Connexion au serveur CARNI…</p>
        </div>
      </div>
    );
  }

  // If viewing Doctor Portal
  if (activeTab === 'doctor') {
    return (
      <DoctorPortalView
        token={doctorToken}
        patient={patient}
        events={events}
        documents={documents}
        sessions={sharingSessions}
        onBackToApp={() => setActiveTab('dashboard')}
        onPreviewDocument={(doc) => setPreviewDocument(doc)}
      />
    );
  }

  const activeShareCount = sharingSessions.filter(
    (s) => !s.is_revoked && new Date(s.expires_at).getTime() > Date.now()
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Demo Mode Banner — shown prominently when backend is not reachable */}
      {isDemoMode && (
        <div className="bg-amber-500 text-white text-center text-xs font-bold py-2 px-4">
          ⚠️ MODE DÉMO — Backend non connecté. Les données affichées sont fictives et ne sont pas persistées. Lancez{' '}
          <code className="bg-amber-600 px-1 rounded">cargo run</code> dans le dossier{' '}
          <code className="bg-amber-600 px-1 rounded">backend/</code> pour activer le mode réel.
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        patient={patient}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenDoctorPortal={() => handleOpenDoctorPortal()}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          eventCount={events.length}
          docCount={documents.length}
          activeShareCount={activeShareCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              patient={patient}
              events={events}
              documents={documents}
              sharingSessions={sharingSessions}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewEvent={() => {
                setEventToEdit(null);
                setIsEventModalOpen(true);
              }}
              onOpenUploadDoc={() => setIsUploadModalOpen(true)}
              onOpenEmergency={() => setIsEmergencyOpen(true)}
              onOpenVitalsModal={() => setIsEmergencyOpen(false)} // placeholder — VitalsModal is not in scope
              onOpenDoctorPortal={(token) => handleOpenDoctorPortal(token)}
              onRevokeSession={handleRevokeSession}
            />
          )}

          {activeTab === 'journal' && (
            <JournalView
              events={events}
              documents={documents}
              onOpenNewEvent={() => {
                setEventToEdit(null);
                setIsEventModalOpen(true);
              }}
              onEditEvent={(event) => {
                setEventToEdit(event);
                setIsEventModalOpen(true);
              }}
              onDeleteEvent={handleDeleteEvent}
              onPreviewDocument={(doc) => setPreviewDocument(doc)}
            />
          )}

          {activeTab === 'vault' && (
            <VaultView
              documents={documents}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onPreviewDocument={(doc) => setPreviewDocument(doc)}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {activeTab === 'sharing' && (
            <SharingView
              patient={patient}
              events={events}
              documents={documents}
              sessions={sharingSessions}
              isDemoMode={isDemoMode}
              onCreateSession={handleCreateSharingSession}
              onRevokeSession={handleRevokeSession}
              onOpenDoctorPortal={handleOpenDoctorPortal}
            />
          )}

          {activeTab === 'audit' && <AuditLogView logs={auditLogs} isDemoMode={isDemoMode} />}
        </main>
      </div>

      {/* Modals */}
      <EmergencyModal
        patient={patient}
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        documents={documents}
      />

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadDocument}
        isDemoMode={isDemoMode}
      />

      <DocumentPreviewModal
        document={previewDocument}
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
      />

      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
