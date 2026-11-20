import React, { useState, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  User,
  Stethoscope,
  Globe,
  Clock,
  Printer,
  Download,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AuditLogEntry, AuditActionType } from '../../types';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const matchesFilter =
          selectedFilter === 'ALL' ||
          (selectedFilter === 'DOCTOR' && log.actor_role === 'MEDECIN') ||
          (selectedFilter === 'PATIENT' && log.actor_role === 'PATIENT') ||
          (selectedFilter === 'SHARING' && log.action.startsWith('SESSION_'));

        const matchesQuery =
          searchQuery.trim() === '' ||
          log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.ip_address.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, selectedFilter, searchQuery]);

  const getActionBadge = (action: AuditActionType, status: AuditLogEntry['status']) => {
    if (status === 'REVOKED') {
      return {
        label: 'Révocation immédiate',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: ShieldAlert,
      };
    }
    switch (action) {
      case 'SESSION_ACCESSED':
        return {
          label: 'Consultation Médecin',
          color: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: Stethoscope,
        };
      case 'SESSION_CREATED':
        return {
          label: 'Génération QR Code',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: ShieldCheck,
        };
      case 'SESSION_REVOKED':
        return {
          label: 'Révocation',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: ShieldAlert,
        };
      case 'DOCUMENT_UPLOADED':
        return {
          label: 'Dépôt Coffre-fort',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Lock,
        };
      case 'RECORD_CREATED':
      case 'RECORD_UPDATED':
        return {
          label: 'Mise à jour Carnet',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: History,
        };
      default:
        return {
          label: action,
          color: 'bg-slate-50 text-slate-600 border-slate-200',
          icon: History,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Journal d'Audit & Traçabilité Souveraine
            </h1>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Immuable
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Historique certifié et horodaté de toutes les créations, accès médecins et révocations
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Exporter le rapport d'audit</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par acteur, adresse IP, détail de consultation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'Toutes les activités' },
            { id: 'DOCTOR', label: 'Accès Médecins' },
            { id: 'SHARING', label: 'Partages & Sessions QR' },
            { id: 'PATIENT', label: 'Actions Patient' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === f.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-700">Aucun enregistrement d'audit</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Aucune activité ne correspond à vos filtres.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action, log.status);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <BadgeIcon className="w-5 h-5 text-slate-600" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {log.actor}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {log.ip_address}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 self-end sm:self-center font-mono">
                    <span className="text-xs text-slate-500 font-semibold block">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 sm:justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security explanation note */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Principe de non-répudiation :</strong> Chaque scan de QR code, téléchargement de document ou tentative d'accès est tracé de manière indélébile dans ce journal d'audit afin de garantir au patient la transparence absolue sur l'usage de ses données de santé.
        </p>
      </div>
    </div>
  );
};
