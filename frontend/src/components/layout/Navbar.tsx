import React from 'react';
import { Shield, AlertTriangle, Stethoscope, User, Menu, Wifi, WifiOff } from 'lucide-react';
import { PatientProfile } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

interface NavbarProps {
  patient: PatientProfile;
  onOpenEmergency: () => void;
  onToggleMobileMenu: () => void;
  onOpenDoctorPortal: () => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  patient,
  onOpenEmergency,
  onToggleMobileMenu,
  onOpenDoctorPortal,
  isBackendConnected,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-[106px]" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  CARNI
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  MAROC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">
                Carnet de Santé Numérique & Souverain
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Emergency, Backend Status, Doctor View & Patient profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Backend API status indicator */}
          <div
            className={`hidden lg:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${
              isBackendConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isBackendConnected ? 'Connecté à l\'API Axum Rust (SQLite)' : 'Mode local / Démo'}
          >
            {isBackendConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">Rust API Synchro</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium">Mode Local Actif</span>
              </>
            )}
          </div>

          {/* Doctor Portal View Direct Button */}
          <button
            onClick={onOpenDoctorPortal}
            className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden md:inline">Espace Médecin</span>
          </button>

          {/* Emergency Pill with live pulse */}
          <button
            onClick={onOpenEmergency}
            className="relative px-3 sm:px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Fiche Urgence</span>
          </button>

          {/* Patient Quick Chip */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              YM
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {patient.full_name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {patient.cin_cnss}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
