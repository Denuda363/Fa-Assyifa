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
      <div className="bg-[#11141b] border border-slate-800 shadow px-4 py-5 sm:rounded-xl sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-white">Profil Perusahaan</h3>
            <p className="mt-1 text-sm text-slate-400">
              Informasi ini akan digunakan sebagai kop surat pada hasil export laporan PDF dan Excel.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label htmlFor="company-name" className="block text-sm font-medium text-slate-300">
                    Nama Perusahaan
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-800 text-slate-400 text-sm">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      name="company-name"
                      id="company-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm bg-[#0a0c10] border-slate-700 text-white border py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="col-span-6">
                  <label htmlFor="street-address" className="block text-sm font-medium text-slate-300">
                    Alamat Lengkap
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-800 text-slate-400 text-sm">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <textarea
                      name="street-address"
                      id="street-address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm bg-[#0a0c10] border-slate-700 text-white border py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-300">
                    Nomor WhatsApp
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-800 text-slate-400 text-sm">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      name="whatsapp"
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      className="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm bg-[#0a0c10] border-slate-700 text-white border py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end gap-4">
                {saveMessage && <span className="text-sm text-emerald-400 font-medium">{saveMessage}</span>}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
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
