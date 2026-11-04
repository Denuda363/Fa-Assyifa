import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, MapPin, Phone, Save, FileCheck, CheckCircle2, ShieldCheck, Printer, Percent, PieChart, Sparkles } from 'lucide-react';

interface ProfileProps {
  profile: CompanyProfile;
  onUpdate: (data: Partial<CompanyProfile>) => Promise<void>;
}

export default function Profile({ profile, onUpdate }: ProfileProps) {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdate({
      ...formData,
      companyProfitPercent: Number(formData.companyProfitPercent) || 15,
      ownerProfitPercent: Number(formData.ownerProfitPercent) || 20
    });
    setIsSaving(false);
    setSaveMessage('Profil & Pengaturan Profit berhasil disimpan ke cloud database!');
    setTimeout(() => setSaveMessage(''), 3500);
  };

  const compPct = formData.companyProfitPercent ?? 15;
  const ownerPct = formData.ownerProfitPercent ?? 20;
  const effectiveOwnerPct = ((compPct * ownerPct) / 100).toFixed(2);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Edit Information */}
        <div className="lg:col-span-7 bg-[#0b0f17]/90 backdrop-blur-2xl border border-neutral-800/80 shadow-2xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-800/70">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Informasi Legalitas & Kop Perusahaan</h3>
                <p className="text-xs text-neutral-400">
                  Data ini dicetak otomatis pada kop dokumen ekspor PDF dan lembar kerja Excel.
                </p>
              </div>
            </div>

            {saveMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="company-name" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Nama Perusahaan / Apotek
                </label>
                <div className="flex rounded-xl shadow-inner border border-neutral-800/80 bg-neutral-950/70 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                  <span className="inline-flex items-center px-3.5 border-r border-neutral-800 text-neutral-500 text-sm">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="company-name"
                    id="company-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 block w-full bg-transparent text-white py-2.5 px-3.5 text-sm font-semibold outline-none placeholder-neutral-600 font-sans"
                    placeholder="Contoh: Apotek Assyifa Farma Cideres"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="street-address" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Alamat Lengkap Kantor / Apotek
                </label>
                <div className="flex rounded-xl shadow-inner border border-neutral-800/80 bg-neutral-950/70 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                  <span className="inline-flex items-center px-3.5 border-r border-neutral-800 text-neutral-500 text-sm">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <textarea
                    name="street-address"
                    id="street-address"
                    required
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="flex-1 block w-full bg-transparent text-white py-2.5 px-3.5 text-xs sm:text-sm outline-none placeholder-neutral-600 font-sans leading-relaxed resize-none"
                    placeholder="Masukkan alamat lengkap apotek beserta kecamatan/kabupaten..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Nomor WhatsApp Resmi
                </label>
                <div className="flex rounded-xl shadow-inner border border-neutral-800/80 bg-neutral-950/70 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                  <span className="inline-flex items-center px-3.5 border-r border-neutral-800 text-neutral-500 text-sm">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="whatsapp"
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="flex-1 block w-full bg-transparent text-white py-2.5 px-3.5 text-sm font-mono font-medium outline-none placeholder-neutral-600"
                  />
                </div>
              </div>

              {/* Persentase Bagi Hasil Section */}
              <div className="pt-4 border-t border-neutral-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Pengaturan Persentase Bagi Hasil (Profit)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Efektif: {effectiveOwnerPct}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Profit % */}
                  <div>
                    <label htmlFor="company-profit-pct-profile" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                      Profit Perusahaan (%)
                    </label>
                    <div className="flex rounded-xl shadow-inner border border-neutral-800/80 bg-neutral-950/70 overflow-hidden focus-within:border-indigo-500 transition-all">
                      <span className="inline-flex items-center px-3.5 border-r border-neutral-800 text-neutral-500 text-sm">
                        <PieChart className="h-4 w-4" />
                      </span>
                      <input
                        type="number"
                        id="company-profit-pct-profile"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.companyProfitPercent ?? 15}
                        onChange={(e) => setFormData({ ...formData, companyProfitPercent: parseFloat(e.target.value) || 0 })}
                        className="flex-1 block w-full bg-transparent text-white py-2.5 px-3.5 text-sm font-mono font-bold outline-none"
                        placeholder="15"
                      />
                      <span className="px-3 py-2.5 text-xs text-indigo-400 font-bold bg-indigo-500/10 border-l border-neutral-800">
                        %
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">Alokasi dari laba bersih (Standar: 15%)</p>
                  </div>

                  {/* Owner Profit % */}
                  <div>
                    <label htmlFor="owner-profit-pct-profile" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                      Profit Owner (%)
                    </label>
                    <div className="flex rounded-xl shadow-inner border border-neutral-800/80 bg-neutral-950/70 overflow-hidden focus-within:border-amber-500 transition-all">
                      <span className="inline-flex items-center px-3.5 border-r border-neutral-800 text-neutral-500 text-sm">
                        <Percent className="h-4 w-4" />
                      </span>
                      <input
                        type="number"
                        id="owner-profit-pct-profile"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.ownerProfitPercent ?? 20}
                        onChange={(e) => setFormData({ ...formData, ownerProfitPercent: parseFloat(e.target.value) || 0 })}
                        className="flex-1 block w-full bg-transparent text-white py-2.5 px-3.5 text-sm font-mono font-bold outline-none"
                        placeholder="20"
                      />
                      <span className="px-3 py-2.5 text-xs text-amber-400 font-bold bg-amber-500/10 border-l border-neutral-800">
                        %
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">Hak owner dari profit perusahaan (Standar: 20%)</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/60 text-xs text-neutral-400 font-mono">
                  Rumus Excel: <span className="text-white">Laba Bersih × {compPct}% × {ownerPct}%</span> = <span className="text-amber-400 font-bold">{effectiveOwnerPct}%</span> (Baris 3 Closing Excel)
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent shadow-lg shadow-indigo-600/25 text-xs sm:text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Profil & Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Kop Document Preview (PC-First) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0b0f17]/90 backdrop-blur-2xl border border-neutral-800/80 rounded-2xl sm:rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Preview Kop Dokumen</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                PDF & Excel
              </span>
            </div>

            {/* Paper Preview Sheet */}
            <div className="bg-white text-slate-900 rounded-xl p-5 shadow-inner space-y-3 font-sans border border-slate-200">
              <div className="text-center pb-3 border-b-2 border-slate-900">
                <h4 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-950 font-serif">
                  {formData.name || 'NAMA PERUSAHAAN'}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {formData.address || 'Alamat lengkap perusahaan akan tampil di sini'}
                </p>
                {formData.whatsapp && (
                  <p className="text-[10px] font-bold text-slate-700 mt-0.5 font-mono">
                    Telp / WhatsApp: {formData.whatsapp}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-800">
                  <span>LAPORAN KAS & KEUANGAN RESMI</span>
                  <span className="font-mono">PERIODE: AKTIF</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                <div className="h-1.5 w-3/4 bg-slate-100 rounded"></div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                <span>Dihasilkan oleh ProfitFlow OS</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Terverifikasi
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed italic">
              Kop di atas merupakan tampilan nyata saat mencetak dokumen PDF atau mengunduh lembar kerja Excel closing bulanan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
