import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderLock,
  QrCode,
  ShieldCheck,
  History,
  X,
  HeartPulse,
  Info,
} from 'lucide-react';

export type TabType = 'dashboard' | 'journal' | 'vault' | 'sharing' | 'audit';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  eventCount: number;
  docCount: number;
  activeShareCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  eventCount,
  docCount,
  activeShareCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Vue d\'ensemble',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'journal' as TabType,
      label: 'Carnet de Santé',
      icon: BookOpen,
      badge: eventCount > 0 ? eventCount : null,
    },
    {
      id: 'vault' as TabType,
      label: 'Coffre-fort Médical',
      icon: FolderLock,
      badge: docCount > 0 ? docCount : null,
    },
    {
      id: 'sharing' as TabType,
      label: 'Partage Sécurisé & QR',
      icon: QrCode,
      badge: activeShareCount > 0 ? `${activeShareCount} actif` : null,
      badgeColor: activeShareCount > 0 ? 'bg-teal-500 text-white' : undefined,
    },
    {
      id: 'audit' as TabType,
      label: 'Journal d\'Audit',
      icon: History,
      badge: null,
    },
  ];

  const handleNavClick = (tab: TabType) => {
    onSelectTab(tab);
    if (isOpenMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 p-4">
      {/* Mobile close button */}
      <div className="md:hidden flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
        <button
          onClick={onCloseMobile}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation links */}
      <div className="space-y-1.5 flex-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    item.badgeColor || (isActive ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-600')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Security banner card */}
      <div className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50/50 rounded-2xl border border-teal-100 text-xs text-teal-900 mt-4">
        <div className="flex items-center gap-2 font-bold text-teal-800 mb-1">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Souveraineté des Données</span>
        </div>
        <p className="text-[11px] text-teal-700/90 leading-relaxed">
          Vos données restent sous votre contrôle exclusif. Aucun partage n'a lieu sans votre consentement explicite.
        </p>
      </div>

      {/* Hackathon Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <span className="text-[10px] text-slate-400 block font-medium">
          CARNI MVP • Hackathon Santé Maroc 🇲🇦
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
