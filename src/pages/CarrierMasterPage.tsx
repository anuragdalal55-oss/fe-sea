import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SeaCarrierForm, SeaCarrierRecord } from '../types/sea';
import api from '../utils/api';
import TextInput from '../components/TextInput';
import { sanitizeFreeText } from '../utils/textSanitize';

interface LocationOption {
  id: string;
  iata_code: string;
  city_name: string;
  customs_house_code?: string | null;
}

const emptyForm = (): SeaCarrierForm => ({
  carrier_name: '',
  carrier_code: '',
  bond_number: '',
  transport: '',
  dest: '',
  address: '',
  description: '',
  location_codes: [],
  all_locations: true,
});

const CarrierMasterPage: React.FC = () => {
  const [carriers, setCarriers] = useState<SeaCarrierRecord[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<SeaCarrierForm>(emptyForm());
  const [search, setSearch] = useState('');

  const fetchCarriers = useCallback(async (q = search) => {
    setLoading(true);
    try {
      // No location filter here — the Master page always lists every carrier.
      const response = await api.get('/sea-carriers', { params: q ? { search: q } : {} });
      setCarriers(response.data || []);
    } catch {
      toast.error('Failed to load carriers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data || []);
    } catch {
      toast.error('Failed to load locations');
    }
  }, []);

  useEffect(() => {
    fetchCarriers('');
    fetchLocations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyForm());
  };

  const selectCarrier = (record: SeaCarrierRecord) => {
    setSelectedId(record.id);
    const codes = record.location_codes || [];
    setForm({
      carrier_name: record.carrier_name || '',
      carrier_code: record.carrier_code || '',
      bond_number: record.bond_number || '',
      transport: record.transport || '',
      dest: record.dest || '',
      address: record.address || '',
      description: record.description || '',
      location_codes: codes,
      all_locations: codes.length === 0,
    });
  };

  const updateForm = (field: keyof SeaCarrierForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const locationCode = (l: LocationOption) => l.customs_house_code || l.iata_code;

  const toggleLocationCode = (code: string) => {
    setForm((current) => ({
      ...current,
      location_codes: current.location_codes.includes(code)
        ? current.location_codes.filter((c) => c !== code)
        : [...current.location_codes, code],
    }));
  };

  const handleSave = async () => {
    if (!form.carrier_name.trim()) {
      toast.error('Carrier name is required');
      return;
    }
    if (form.address.length > 35) {
      toast.error('Address must be 35 characters or less');
      return;
    }
    if (form.description.length > 150) {
      toast.error('Description must be 150 characters or less');
      return;
    }
    if (!form.all_locations && form.location_codes.length === 0) {
      toast.error('Select at least one location, or choose All Locations');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, carrier_name: sanitizeFreeText(form.carrier_name) };
      if (selectedId) {
        await api.put(`/sea-carriers/${selectedId}`, payload);
        toast.success('Carrier updated');
      } else {
        await api.post('/sea-carriers', payload);
        toast.success('Carrier created');
      }
      resetForm();
      fetchCarriers('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      toast.error('Select a carrier first');
      return;
    }
    if (!window.confirm(`Delete carrier "${form.carrier_name}"?`)) return;

    setDeleting(true);
    try {
      await api.delete(`/sea-carriers/${selectedId}`);
      toast.success('Carrier deleted');
      resetForm();
      fetchCarriers('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container sea-page">
      <div className="sea-hero">
        <div>
          <div className="sea-eyebrow">Masters</div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>Carrier Master</h1>
          <p className="page-subtitle">
            Create and manage carrier records. Select a carrier when creating MBL to auto-fill related fields.
          </p>
        </div>
        <div className="sea-actions">
          <button className="btn btn-secondary" onClick={resetForm}>New Entry</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : selectedId ? 'Update Carrier' : 'Create Carrier'}
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={!selectedId || deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="sea-layout">
        <div className="card sea-editor-card">
          <div className="card-header">
            <span className="card-title">{selectedId ? `Editing: ${form.carrier_name}` : 'New Carrier'}</span>
          </div>
          <div className="card-body">
            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label">Carrier Name <span className="required">*</span></label>
                <TextInput
                  className="form-control"
                  value={form.carrier_name}
                  onChange={(e) => updateForm('carrier_name', e.target.value)}
                  placeholder="e.g. MAERSK LINE"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Carrier Code</label>
                <input
                  className="form-control font-mono"
                  value={form.carrier_code}
                  onChange={(e) => updateForm('carrier_code', e.target.value.toUpperCase())}
                  placeholder="e.g. MAEU"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bond Number</label>
                <input
                  className="form-control"
                  value={form.bond_number}
                  onChange={(e) => updateForm('bond_number', e.target.value)}
                  placeholder="Bond / IGM bond number"
                />
              </div>
            </div>
            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label">Transport (Mode)</label>
                <input
                  className="form-control"
                  value={form.transport}
                  onChange={(e) => updateForm('transport', e.target.value)}
                  placeholder="e.g. R"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dest (Port of Unloading)</label>
                <input
                  className="form-control"
                  value={form.dest}
                  onChange={(e) => updateForm('dest', e.target.value)}
                  placeholder="e.g. INNSA1 - Nhava Sheva"
                />
              </div>
              {/* <div className="form-group">
                <label className="form-label">
                  Address
                  <span className="text-muted" style={{ fontWeight: 400, marginLeft: 4 }}>
                    ({form.address.length}/35)
                  </span>
                </label>
                <input
                  className="form-control"
                  value={form.address}
                  maxLength={35}
                  onChange={(e) => updateForm('address', e.target.value)}
                  placeholder="Carrier address (max 35 chars)"
                />
              </div> */}
            </div>
            <div className="form-row form-row-1">
              <div className="form-group">
                <label className="form-label">Locations <span className="required">*</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.all_locations}
                    onChange={(e) => setForm((c) => ({ ...c, all_locations: e.target.checked }))}
                    style={{ width: 15, height: 15 }}
                  />
                  <span style={{ fontWeight: 600 }}>All Locations</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    (visible when logged in at any location)
                  </span>
                </label>
                {!form.all_locations && (
                  <>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setForm((c) => ({ ...c, location_codes: locations.map(locationCode) }))}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setForm((c) => ({ ...c, location_codes: [] }))}
                      >
                        Clear
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
                        {form.location_codes.length} selected
                      </span>
                    </div>
                    <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px' }}>
                      {locations.length === 0 && (
                        <div className="text-muted text-sm" style={{ padding: '8px 0' }}>No locations found</div>
                      )}
                      {locations.map((l) => {
                        const code = locationCode(l);
                        return (
                          <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={form.location_codes.includes(code)}
                              onChange={() => toggleLocationCode(code)}
                              style={{ width: 14, height: 14 }}
                            />
                            <span className="font-mono" style={{ fontWeight: 600, fontSize: 13, width: 70 }}>{code}</span>
                            <span style={{ fontSize: 13 }}>{l.city_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* <div className="form-row form-row-1">
              <div className="form-group">
                <label className="form-label">
                  Description
                  <span className="text-muted" style={{ fontWeight: 400, marginLeft: 4 }}>
                    ({form.description.length}/150)
                  </span>
                </label>
                <textarea
                  className="form-control"
                  value={form.description}
                  maxLength={150}
                  rows={2}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Short description of the carrier (max 150 chars)"
                />
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <div className="card sea-register-card">
        <div className="card-header sea-register-header">
          <span className="card-title">Carrier Register</span>
          <div className="sea-search-wrap">
            <input
              className="form-control"
              placeholder="Search name or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCarriers(search)}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => fetchCarriers(search)}>Search</button>
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner"></span> Loading...</div>
          ) : carriers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No carriers found</div>
              <p>Create your first carrier record above.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Carrier Name</th>
                  <th>Code</th>
                  <th>Bond Number</th>
                  <th>Transport</th>
                  <th>Dest</th>
                  <th>Address</th>
                  <th>Description</th>
                  <th>Locations</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map((record) => (
                  <tr
                    key={record.id}
                    className={record.id === selectedId ? 'sea-row-active' : ''}
                    onClick={() => selectCarrier(record)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>{record.carrier_name}</td>
                    <td className="font-mono">{record.carrier_code}</td>
                    <td>{record.bond_number || 'NA'}</td>
                    <td>{record.transport || 'NA'}</td>
                    <td>{record.dest || 'NA'}</td>
                    <td>{record.address || 'NA'}</td>
                    <td>{record.description || 'NA'}</td>
                    <td className="font-mono" style={{ fontSize: 12 }}>
                      {record.location_codes && record.location_codes.length > 0
                        ? record.location_codes.join(', ')
                        : 'All Locations'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="sea-footer">EDI Software Solutions @ 2022 - 2026 All rights reserved</div>
    </div>
  );
};

export default CarrierMasterPage;
