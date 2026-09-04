import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, MapPin, Phone, Save } from 'lucide-react';

interface ProfileProps {
  profile: CompanyProfile;
  onUpdate: (data: Partial<CompanyProfile>) => Promise<void>;
}

export default function Profile({ profile, onUpdate }: ProfileProps) {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdate(formData);
    setIsSaving(false);
    setSaveMessage('Profil berhasil disimpan!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/60 shadow-2xl px-4 py-8 sm:rounded-[2rem] sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="md:grid md:grid-cols-3 md:gap-8 relative z-10">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold leading-6 text-white tracking-tight">Profil Perusahaan</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Informasi ini akan digunakan sebagai kop surat pada hasil export laporan PDF dan Excel.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label htmlFor="company-name" className="block text-sm font-semibold text-neutral-400 mb-2">
                    Nama Perusahaan
                  </label>
                  <div className="mt-1 flex rounded-2xl shadow-sm border border-neutral-800/60 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <span className="inline-flex items-center px-4 border-r border-neutral-800/60 bg-neutral-900/60 text-neutral-500 text-sm">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <input
                      type="text"
                      name="company-name"
                      id="company-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="flex-1 block w-full min-w-0 bg-neutral-950 text-white py-3 px-4 outline-none placeholder-neutral-600 transition-colors"
                      placeholder="Masukkan nama perusahaan"
                    />
                  </div>
                </div>

                <div className="col-span-6">
                  <label htmlFor="street-address" className="block text-sm font-semibold text-neutral-400 mb-2">
                    Alamat Lengkap
                  </label>
                  <div className="mt-1 flex rounded-2xl shadow-sm border border-neutral-800/60 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <span className="inline-flex items-center px-4 border-r border-neutral-800/60 bg-neutral-900/60 text-neutral-500 text-sm">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <textarea
                      name="street-address"
                      id="street-address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="flex-1 block w-full min-w-0 bg-neutral-950 text-white py-3 px-4 outline-none placeholder-neutral-600 transition-colors"
                      placeholder="Masukkan alamat lengkap"
                    />
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="whatsapp" className="block text-sm font-semibold text-neutral-400 mb-2">
                    Nomor WhatsApp
                  </label>
                  <div className="mt-1 flex rounded-2xl shadow-sm border border-neutral-800/60 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <span className="inline-flex items-center px-4 border-r border-neutral-800/60 bg-neutral-900/60 text-neutral-500 text-sm">
                      <Phone className="h-5 w-5" />
                    </span>
                    <input
                      type="text"
                      name="whatsapp"
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      className="flex-1 block w-full min-w-0 bg-neutral-950 text-white py-3 px-4 outline-none placeholder-neutral-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-end gap-4">
                {saveMessage && <span className="text-sm text-indigo-400 font-medium">{saveMessage}</span>}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-lg shadow-indigo-500/20 text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
