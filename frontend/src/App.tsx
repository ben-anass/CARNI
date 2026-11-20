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
  // Main states
  const [patient, setPatient] = useState<PatientProfile>(INITIAL_PATIENT);
  const [events, setEvents] = useState<HealthEvent[]>(INITIAL_EVENTS);
  const [documents, setDocuments] = useState<MedicalDocument[]>(INITIAL_DOCUMENTS);
  const [sharingSessions, setSharingSessions] = useState<SharingSession[]>(INITIAL_SHARING_SESSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType | 'doctor'>('dashboard');
  const [doctorToken, setDoctorToken] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

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

  // Sync data with Rust backend API if reachable
  const loadBackendData = useCallback(async () => {
    try {
      const isAlive = await api.checkHealth();
      setIsBackendConnected(isAlive);

      if (isAlive) {
        const [pat, evts, docs, shares, logs] = await Promise.all([
          api.getPatient().catch(() => INITIAL_PATIENT),
          api.getEvents().catch(() => INITIAL_EVENTS),
          api.getDocuments().catch(() => INITIAL_DOCUMENTS),
          api.getSharingSessions().catch(() => INITIAL_SHARING_SESSIONS),
          api.getAuditLogs().catch(() => INITIAL_AUDIT_LOGS),
        ]);

        if (pat) setPatient(pat);
        if (evts && evts.length > 0) setEvents(evts);
        if (docs && docs.length > 0) setDocuments(docs);
        if (shares && shares.length > 0) setSharingSessions(shares);
        if (logs && logs.length > 0) setAuditLogs(logs);
      }
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    loadBackendData();
    const interval = setInterval(loadBackendData, 15000);
    return () => clearInterval(interval);
  }, [loadBackendData]);

  // Event Handlers
  const handleSaveEvent = async (
    eventData: Omit<HealthEvent, 'id' | 'created_at'>,
    existingId?: string
  ) => {
    if (existingId) {
      // Update
      const updatedList = events.map((e) =>
        e.id === existingId
          ? { ...e, ...eventData, updated_at: new Date().toISOString() }
          : e
      );
      setEvents(updatedList);
      addToast('success', 'Événement modifié', `"${eventData.title}" a été mis à jour.`);

      // Log in audit
      const auditEntry: AuditLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'RECORD_UPDATED',
        actor: 'Yassine Mansouri (Patient)',
        actor_role: 'PATIENT',
        ip_address: '127.0.0.1 (Local)',
        details: `Modification de l'événement médical : ${eventData.title}`,
        status: 'SUCCESS',
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);

      if (isBackendConnected) {
        api.updateEvent(existingId, eventData).catch(console.error);
      }
    } else {
      // Create new
      const newId = `evt_${Date.now()}`;
      const newEvent: HealthEvent = {
        ...eventData,
        id: newId,
        created_at: new Date().toISOString(),
      };
      setEvents([newEvent, ...events]);
      addToast('success', 'Événement ajouté', `"${eventData.title}" a été enregistré au carnet.`);

      // Log in audit
      const auditEntry: AuditLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'RECORD_CREATED',
        actor: 'Yassine Mansouri (Patient)',
        actor_role: 'PATIENT',
        ip_address: '127.0.0.1 (Local)',
        details: `Ajout au carnet de santé : ${eventData.title} (${eventData.category})`,
        status: 'SUCCESS',
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);

      if (isBackendConnected) {
        api.createEvent(eventData).catch(console.error);
      }
    }
    setEventToEdit(null);
  };

  const handleDeleteEvent = async (id: string) => {
    const deleted = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    addToast('info', 'Événement supprimé', deleted ? `"${deleted.title}" a été retiré.` : undefined);

    if (deleted) {
      const auditEntry: AuditLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'RECORD_DELETED',
        actor: 'Yassine Mansouri (Patient)',
        actor_role: 'PATIENT',
        ip_address: '127.0.0.1 (Local)',
        details: `Suppression de l'événement médical : ${deleted.title}`,
        status: 'WARNING',
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);
    }

    if (isBackendConnected) {
      api.deleteEvent(id).catch(console.error);
    }
  };

  const handleUploadDocument = async (docData: Omit<MedicalDocument, 'id' | 'created_at'>) => {
    const newId = `doc_${Date.now()}`;
    const newDoc: MedicalDocument = {
      ...docData,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setDocuments([newDoc, ...documents]);
    addToast('success', 'Document certifié ajouté', `"${docData.title}" a été scellé dans le coffre-fort.`);

    const auditEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DOCUMENT_UPLOADED',
      actor: 'Yassine Mansouri (Patient)',
      actor_role: 'PATIENT',
      ip_address: '127.0.0.1 (Local)',
      details: `Dépôt sécurisé au coffre-fort : ${docData.title} (${(docData.file_size_bytes / 1024).toFixed(1)} Ko)`,
      status: 'SUCCESS',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    if (isBackendConnected) {
      api.createDocument(docData).catch(console.error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    addToast('info', 'Document supprimé', doc ? `"${doc.title}" a été supprimé.` : undefined);

    if (doc) {
      const auditEntry: AuditLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'DOCUMENT_DELETED',
        actor: 'Yassine Mansouri (Patient)',
        actor_role: 'PATIENT',
        ip_address: '127.0.0.1 (Local)',
        details: `Suppression du document du coffre-fort : ${doc.title}`,
        status: 'WARNING',
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);
    }

    if (isBackendConnected) {
      api.deleteDocument(id).catch(console.error);
    }
  };

  const handleCreateSharingSession = async (
    recipientLabel: string,
    purpose: string,
    durationMinutes: number,
    oneTimeUse: boolean,
    scope: SharingScope
  ) => {
    // Generate unguessable random token
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const token = `carni-sec-${randomHex}`;
    const newSession: SharingSession = {
      id: `sh_${Date.now()}`,
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

    setSharingSessions([newSession, ...sharingSessions]);
    addToast(
      'success',
      'QR Code de partage créé !',
      `Session active pour ${recipientLabel} (${durationMinutes} min).`
    );

    const auditEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SESSION_CREATED',
      actor: 'Yassine Mansouri (Patient)',
      actor_role: 'PATIENT',
      ip_address: '127.0.0.1 (Local)',
      details: `Création session QR Code (${durationMinutes} min) pour ${recipientLabel} • Scope: ${scope.all_events ? 'Tous les événements' : `${scope.event_ids.length} événements`}, ${scope.all_docs ? 'Tous les docs' : `${scope.doc_ids.length} docs`}`,
      status: 'SUCCESS',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    if (isBackendConnected) {
      api.createSharingSession({
        recipient_label: recipientLabel,
        purpose,
        duration_minutes: durationMinutes,
        one_time_use: oneTimeUse,
        scope,
      }).catch(console.error);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    const session = sharingSessions.find((s) => s.id === sessionId);
    setSharingSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, is_revoked: true } : s))
    );
    addToast('info', 'Accès révoqué', 'Le jeton de partage a été invalidé immédiatement.');

    if (session) {
      const auditEntry: AuditLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'SESSION_REVOKED',
        actor: 'Yassine Mansouri (Patient)',
        actor_role: 'PATIENT',
        ip_address: '127.0.0.1 (Local)',
        details: `Révocation manuelle immédiate de l'accès pour ${session.recipient_label} (token: ${session.token})`,
        status: 'REVOKED',
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);
    }

    if (isBackendConnected) {
      api.revokeSharingSession(sessionId).catch(console.error);
    }
  };

  const handleOpenDoctorPortal = (token?: string) => {
    setDoctorToken(token);
    setActiveTab('doctor');
  };

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
              onCreateSession={handleCreateSharingSession}
              onRevokeSession={handleRevokeSession}
              onOpenDoctorPortal={handleOpenDoctorPortal}
            />
          )}

          {activeTab === 'audit' && <AuditLogView logs={auditLogs} />}
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
