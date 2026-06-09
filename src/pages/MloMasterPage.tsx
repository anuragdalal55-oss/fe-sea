import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SeaMloForm, SeaMloRecord } from '../types/sea';
import api from '../utils/api';

const emptyForm = (): SeaMloForm => ({
  mlo_name: '',
  mlo_code: '',
  agent_code: '',
});

const MloMasterPage: React.FC = () => {
  const [mlos, setMlos] = useState<SeaMloRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<SeaMloForm>(emptyForm());
  const [search, setSearch] = useState('');

  const fetchMlos = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const response = await api.get('/sea-mlos', { params: q ? { search: q } : {} });
      setMlos(response.data || []);
    } catch {
      toast.error('Failed to load MLOs');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchMlos('');
  }, []);

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyForm());
  };

  const selectMlo = (record: SeaMloRecord) => {
    setSelectedId(record.id);
    setForm({
      mlo_name: record.mlo_name || '',
      mlo_code: record.mlo_code || '',
      agent_code: record.agent_code || '',
    });
  };

  const updateForm = (field: keyof SeaMloForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.mlo_name.trim()) {
      toast.error('MLO name is required');
      return;
    }
    if (!form.mlo_code.trim()) {
      toast.error('MLO code is required');
      return;
    }

    setSaving(true);
    try {
      if (selectedId) {
        await api.put(`/sea-mlos/${selectedId}`, form);
        toast.success('MLO updated');
      } else {
        await api.post('/sea-mlos', form);
        toast.success('MLO created');
      }
      resetForm();
      fetchMlos('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      toast.error('Select an MLO first');
      return;
    }
    if (!window.confirm(`Delete MLO "${form.mlo_name}"?`)) return;

    setDeleting(true);
    try {
      await api.delete(`/sea-mlos/${selectedId}`);
      toast.success('MLO deleted');
      resetForm();
      fetchMlos('');
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
          <h1 className="page-title" style={{ marginBottom: 8 }}>MLO Master</h1>
          <p className="page-subtitle">
            Create and manage MLO (Marine Line Operator) records. Select an MLO when creating MBL to auto-fill related fields.
          </p>
        </div>
        <div className="sea-actions">
          <button className="btn btn-secondary" onClick={resetForm}>New Entry</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : selectedId ? 'Update MLO' : 'Create MLO'}
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={!selectedId || deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="sea-layout">
        <div className="card sea-editor-card">
          <div className="card-header">
            <span className="card-title">{selectedId ? `Editing: ${form.mlo_name}` : 'New MLO'}</span>
          </div>
          <div className="card-body">
            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label">MLO Name <span className="required">*</span></label>
                <input
                  className="form-control"
                  value={form.mlo_name}
                  onChange={(e) => updateForm('mlo_name', e.target.value)}
                  placeholder="e.g. MAERSK INDIA PVT LTD"
                />
              </div>
              <div className="form-group">
                <label className="form-label">MLO Code <span className="required">*</span></label>
                <input
                  className="form-control font-mono"
                  value={form.mlo_code}
                  onChange={(e) => updateForm('mlo_code', e.target.value.toUpperCase())}
                  placeholder="e.g. MAEU"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Agent Code</label>
                <input
                  className="form-control font-mono"
                  value={form.agent_code}
                  onChange={(e) => updateForm('agent_code', e.target.value.toUpperCase())}
                  placeholder="e.g. AGNT001"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card sea-register-card">
        <div className="card-header sea-register-header">
          <span className="card-title">MLO Register</span>
          <div className="sea-search-wrap">
            <input
              className="form-control"
              placeholder="Search name or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMlos(search)}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => fetchMlos(search)}>Search</button>
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner"></span> Loading...</div>
          ) : mlos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No MLO records found</div>
              <p>Create your first MLO record above.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>MLO Name</th>
                  <th>MLO Code</th>
                  <th>Agent Code</th>
                </tr>
              </thead>
              <tbody>
                {mlos.map((record) => (
                  <tr
                    key={record.id}
                    className={record.id === selectedId ? 'sea-row-active' : ''}
                    onClick={() => selectMlo(record)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>{record.mlo_name}</td>
                    <td className="font-mono">{record.mlo_code}</td>
                    <td className="font-mono">{record.agent_code || 'NA'}</td>
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

export default MloMasterPage;
