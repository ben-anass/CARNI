import React, { useState, useEffect } from 'react';
import { X, Activity, Heart, Droplet, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { Vitals } from '../../types';

interface VitalsModalProps {
  currentVitals: Vitals;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vitals: Vitals) => Promise<void>;
}

export const VitalsModal: React.FC<VitalsModalProps> = ({
  currentVitals,
  isOpen,
  onClose,
  onSave,
}) => {
  const [bp, setBp] = useState(currentVitals.blood_pressure);
  const [hr, setHr] = useState(currentVitals.heart_rate);
  const [bloodSugar, setBloodSugar] = useState(currentVitals.blood_sugar_mg_dl);
  const [weight, setWeight] = useState(currentVitals.weight_kg);
  const [height, setHeight] = useState(currentVitals.height_cm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBp(currentVitals.blood_pressure);
    setHr(currentVitals.heart_rate);
    setBloodSugar(currentVitals.blood_sugar_mg_dl);
    setWeight(currentVitals.weight_kg);
    setHeight(currentVitals.height_cm);
    setError(null);
  }, [currentVitals, isOpen]);

  if (!isOpen) return null;

  const calculatedBmi =
    height > 0 && weight > 0
      ? Number((weight / Math.pow(height / 100, 2)).toFixed(1))
      : currentVitals.bmi;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bp.trim()) {
      setError('La tension artérielle est obligatoire (ex: 120/80)');
      return;
    }
    if (hr <= 0 || hr > 250) {
      setError('La fréquence cardiaque doit être comprise entre 30 et 250 bpm');
      return;
    }
    if (bloodSugar <= 0 || bloodSugar > 600) {
      setError('La glycémie doit être une valeur médicale réaliste (mg/dL)');
      return;
    }
    if (weight <= 0 || height <= 0) {
      setError('Le poids et la taille doivent être positifs');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        blood_pressure: bp.trim(),
        heart_rate: Number(hr),
        blood_sugar_mg_dl: Number(bloodSugar),
        weight_kg: Number(weight),
        height_cm: Number(height),
        bmi: calculatedBmi,
        last_updated: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-teal-200">
                Constantes de Santé
              </span>
              <h2 className="text-base font-bold text-white">
                Mettre à jour mes mesures physiologiques
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Tension */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                Tension (mmHg)
              </label>
              <input
                type="text"
                placeholder="120/80"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                className="w-full text-sm font-bold rounded-lg border border-slate-300 p-2 bg-white text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
              <span className="text-[10px] text-slate-400 block text-center mt-1">Normale &lt; 130/85</span>
            </div>

            {/* Pouls */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Pouls au repos (bpm)
              </label>
              <input
                type="number"
                placeholder="72"
                value={hr}
                onChange={(e) => setHr(Number(e.target.value))}
                className="w-full text-sm font-bold rounded-lg border border-slate-300 p-2 bg-white text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
              <span className="text-[10px] text-slate-400 block text-center mt-1">Normale : 60 - 100</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Glycémie */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Droplet className="w-3.5 h-3.5 text-amber-500" />
                Glycémie à jeun (mg/dL)
              </label>
              <input
                type="number"
                placeholder="94"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(Number(e.target.value))}
                className="w-full text-sm font-bold rounded-lg border border-slate-300 p-2 bg-white text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
              <span className="text-[10px] text-slate-400 block text-center mt-1">70 - 110 mg/dL</span>
            </div>

            {/* Poids */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                Poids corporel (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="76.5"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full text-sm font-bold rounded-lg border border-slate-300 p-2 bg-white text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
              <span className="text-[10px] text-slate-400 block text-center mt-1">Pesée du matin</span>
            </div>
          </div>

          {/* Taille & calcul automatique IMC */}
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-teal-900 block">Taille (cm)</label>
              <input
                type="number"
                placeholder="180"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-24 text-sm font-bold rounded-lg border border-teal-300 p-1.5 bg-white text-center mt-1"
                required
              />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                Indice IMC Calculé
              </span>
              <span className="text-lg font-black text-teal-950 font-mono">
                {calculatedBmi}
              </span>
              <span className="text-[10px] text-teal-700 block font-semibold">
                {calculatedBmi < 18.5
                  ? 'Insuffisance pondérale'
                  : calculatedBmi < 25
                  ? 'Corpulence normale'
                  : calculatedBmi < 30
                  ? 'Surpoids'
                  : 'Obésité'}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer les mesures</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
