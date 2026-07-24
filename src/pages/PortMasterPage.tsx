import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SeaPortForm, SeaPortRecord } from '../types/sea';
import api from '../utils/api';

const emptyForm = (): SeaPortForm => ({ port_code: '', port_name: '' });

interface PortMasterPageProps {
  endpoint: string;
  title: string;
  subtitle: string;
  codePlaceholder: string;
  namePlaceholder: string;
}

const PortMasterPage: React.FC<PortMasterPageProps> = ({ endpoint, title, subtitle, codePlaceholder, namePlaceholder }) => {
  const [ports, setPorts] = useState<SeaPortRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<SeaPortForm>(emptyForm());
  const [search, setSearch] = useState('');

  const fetchPorts = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const response = await api.get(endpoint, { params: q ? { search: q } : {} });
      setPorts(response.data || []);
    } catch {
      toast.error('Failed to load ports');
    } finally {
      setLoading(false);
    }
  }, [endpoint, search]);

  useEffect(() => {
    fetchPorts('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyForm());
  };

  const selectPort = (record: SeaPortRecord) => {
    setSelectedId(record.id);
    setForm({ port_code: record.port_code || '', port_name: record.port_name || '' });
  };

  const updateForm = (field: keyof SeaPortForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.port_code.trim()) {
      toast.error('Port code is required');
      return;
    }

    setSaving(true);
    try {
      if (selectedId) {
        await api.put(`${endpoint}/${selectedId}`, form);
        toast.success('Port updated');
      } else {
        await api.post(endpoint, form);
        toast.success('Port created');
      }
      resetForm();
      fetchPorts('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      toast.error('Select a port first');
      return;
    }
    if (!window.confirm(`Delete port "${form.port_code}"?`)) return;

    setDeleting(true);
    try {
      await api.delete(`${endpoint}/${selectedId}`);
      toast.success('Port deleted');
      resetForm();
      fetchPorts('');
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
          <h1 className="page-title" style={{ marginBottom: 8 }}>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <div className="sea-actions">
          <button className="btn btn-secondary" onClick={resetForm}>New Entry</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : selectedId ? 'Update Port' : 'Create Port'}
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={!selectedId || deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="sea-layout">
        <div className="card sea-editor-card">
          <div className="card-header">
            <span className="card-title">{selectedId ? `Editing: ${form.port_code}` : 'New Port'}</span>
          </div>
          <div className="card-body">
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Port Code <span className="required">*</span></label>
                <input
                  className="form-control font-mono"
                  value={form.port_code}
                  onChange={(e) => updateForm('port_code', e.target.value.toUpperCase())}
                  placeholder={codePlaceholder}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Port Name</label>
                <input
                  className="form-control"
                  value={form.port_name}
                  onChange={(e) => updateForm('port_name', e.target.value.toUpperCase())}
                  placeholder={namePlaceholder}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card sea-register-card">
        <div className="card-header sea-register-header">
          <span className="card-title">Port Register</span>
          <div className="sea-search-wrap">
            <input
              className="form-control"
              placeholder="Search code or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPorts(search)}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => fetchPorts(search)}>Search</button>
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner"></span> Loading...</div>
          ) : ports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No ports found</div>
              <p>Create your first port record above.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Port Code</th>
                  <th>Port Name</th>
                </tr>
              </thead>
              <tbody>
                {ports.map((record) => (
                  <tr
                    key={record.id}
                    className={record.id === selectedId ? 'sea-row-active' : ''}
                    onClick={() => selectPort(record)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="font-mono" style={{ fontWeight: 600 }}>{record.port_code}</td>
                    <td>{record.port_name || 'NA'}</td>
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

export default PortMasterPage;
