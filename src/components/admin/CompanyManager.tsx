import React, { useState, useEffect } from 'react';
import { SupabaseRegistrationService } from '../../utils/supabaseRegistrationService';
import { AuthManager } from '../../utils/authUtils';
import { supabase } from '../../utils/supabaseClient';

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
}

const CompanyManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    if (await AuthManager.shouldUseSupabase()) {
      const result = await SupabaseRegistrationService.getCompanies();
      if (result.success && result.data) {
        setCompanies(result.data);
        // Also save to localStorage for Header component access
        localStorage.setItem('companies', JSON.stringify(result.data));
      } else {
        setCompanies([]);
        localStorage.setItem('companies', '[]');
      }
    } else {
      setCompanies([]); // Optionally, fallback to localStorage if needed
    }
    setIsLoading(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogo(file || null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(undefined);
    }
  };

  const uploadLogoAndGetUrl = async (file: File): Promise<string | undefined> => {
    if (!file) return undefined;
    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      return undefined;
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    // Use the correct bucket name 'company-logos'
    const { data, error } = await supabase.storage.from('company-logos').upload(fileName, file, { upsert: true });
    if (error) {
      setErrorMsg(`Failed to upload logo: ${error.message}`);
      console.error('Supabase Storage upload error:', error);
      return undefined;
    }
    const { data: publicUrlData } = supabase.storage.from('company-logos').getPublicUrl(fileName);
    if (!publicUrlData.publicUrl) {
      setErrorMsg('Failed to get public URL for uploaded logo.');
      console.error('Supabase Storage public URL missing for:', fileName);
      return undefined;
    }
    return publicUrlData.publicUrl;
  };

  const handleAddOrUpdate = async () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Company name is required.');
      return;
    }
    setIsLoading(true);
    let logoUrl: string | undefined = logoPreview;
    if (logo) {
      logoUrl = await uploadLogoAndGetUrl(logo);
      if (!logoUrl) {
        setIsLoading(false);
        return;
      }
    }
    let result: any;
    if (editingId) {
      result = await SupabaseRegistrationService.updateCompany({ id: editingId, name, logoUrl });
      if (result.success && result.data) {
        const updatedCompanies = companies.map(c => c.id === editingId ? result.data : c);
        setCompanies(updatedCompanies);
        // Update localStorage
        localStorage.setItem('companies', JSON.stringify(updatedCompanies));
      }
    } else {
      result = await SupabaseRegistrationService.createCompany({ name, logoUrl });
      if (result.success && result.data) {
        const updatedCompanies = [...companies, result.data];
        setCompanies(updatedCompanies);
        // Update localStorage
        localStorage.setItem('companies', JSON.stringify(updatedCompanies));
      }
    }
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to save company.');
    }
    setName('');
    setLogo(null);
    setLogoPreview(undefined);
    setEditingId(null);
    setIsLoading(false);
    window.dispatchEvent(new Event('companyUpdated'));
  };

  const handleEdit = (company: Company) => {
    setName(company.name);
    setLogoPreview(company.logoUrl);
    setEditingId(company.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this company?')) return;
    setIsLoading(true);
    const result = await SupabaseRegistrationService.deleteCompany(id);
    if (result.success) {
      const updatedCompanies = companies.filter(c => c.id !== id);
      setCompanies(updatedCompanies);
      // Update localStorage
      localStorage.setItem('companies', JSON.stringify(updatedCompanies));
    }
    if (editingId === id) {
      setName('');
      setLogo(null);
      setLogoPreview(undefined);
      setEditingId(null);
    }
    setIsLoading(false);
    window.dispatchEvent(new Event('companyUpdated'));
  };

  const handleCancel = () => {
    setName('');
    setLogo(null);
    setLogoPreview(undefined);
    setEditingId(null);
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Company Management</h2>
      {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border px-3 py-2 rounded w-full md:w-64"
            placeholder="Enter company name"
            disabled={isLoading}
          />
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium mb-1">Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoChange} disabled={isLoading} className="w-full" />
          {logoPreview && (
            <img src={logoPreview} alt="Logo preview" className="mt-2 h-12 w-12 object-contain border rounded" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddOrUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={isLoading}
          >
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              onClick={handleCancel}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr>
              <th className="px-2 py-2 sm:px-4 sm:py-2 border-b">Logo</th>
              <th className="px-2 py-2 sm:px-4 sm:py-2 border-b">Name</th>
              <th className="px-2 py-2 sm:px-4 sm:py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td className="px-2 py-2 sm:px-4 sm:py-2 border-b">
                  {company.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-2 border-b">{company.name}</td>
                <td className="px-2 py-2 sm:px-4 sm:py-2 border-b">
                  <button
                    onClick={() => handleEdit(company)}
                    className="text-blue-600 hover:underline mr-2"
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="text-red-600 hover:underline"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyManager; 