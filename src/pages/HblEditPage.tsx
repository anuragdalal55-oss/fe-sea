import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { SeaContainerRow, SeaHblForm, SeaHblRecord } from '../types/sea';
import api from '../utils/api';

import DateInput from '../components/DateInput';
const CONTAINER_STATUS_OPTIONS = ['FCL', 'LCL'];
const SOC_FLAG_OPTIONS = ['N-NO', 'Y-YES'];

const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

const parseContainersJson = (raw: any): any[] | null => {
  if (Array.isArray(raw)) return raw.length > 0 ? raw : null;
  if (typeof raw === 'string' && raw.trim()) {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) && parsed.length > 0 ? parsed : null; } catch { return null; }
  }
  return null;
};

const mapRecordToForm = (row: SeaHblRecord): SeaHblForm => ({
  hbl_no: row.hbl_no || '',
  hbl_date: row.hbl_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  package_count: toStr(row.package_count),
  package_type: row.package_type || 'UNT',
  gross_weight: toStr(row.gross_weight),
  cargo_nature: row.cargo_nature || 'C-Containerized',
  item_type: row.item_type || 'OT-Other Cargo',
  cargo_move: row.cargo_move || 'TI-ICD Transhipment',
  port_of_delivery: row.port_of_delivery || '',
  dest_cfs: row.dest_cfs || '',
  subline_no: row.subline_no || '1',
  importer_name: row.importer_name || '',
  importer_address1: row.importer_address1 || '',
  importer_address2: row.importer_address2 || '',
  importer_address3: row.importer_address3 || '',
  cargo_description: row.cargo_description || '',
  marks_numbers: row.marks_numbers || 'NM',
  carrier_name: row.carrier_name || '',
  carrier_code: row.carrier_code || '',
  bond_no: row.bond_no || '',
  transport: row.transport || '',
  mlo_name: row.mlo_name || '',
  mlo_code: row.mlo_code || '',
  containers: (() => {
    const parsed = parseContainersJson((row as any).containers_json);
    if (parsed) {
      return parsed.map((c: any) => ({
        container_no: c.container_no || '',
        seal_no: c.seal_no || '',
        package_count: String(c.package_count ?? ''),
        weight: String(c.weight ?? ''),
        container_size: c.container_size || '',
        container_type: c.container_type || 'FCL',
        soc_flag: c.soc_flag || 'N-NO',
        agent_code: c.agent_code || '',
      }));
    }
    return [{ container_no: row.container_no || '', seal_no: row.seal_no || '', package_count: '', weight: '', container_size: row.container_size || '', container_type: row.container_type || 'FCL', soc_flag: row.soc_flag || 'N-NO', agent_code: row.agent_code || '' }];
  })(),
  cargo_net_weight: toStr(row.cargo_net_weight),
  volume_cbm: toStr(row.volume_cbm),
  hs_code: row.hs_code || '',
  imo_code: row.imo_code || '',
  invoice_value_currency: row.invoice_value_currency || 'INR',
});

const HblEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<SeaHblRecord | null>(null);
  const [form, setForm] = useState<SeaHblForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/sea-hbls/${id}`)
      .then((res) => {
        setRecord(res.data);
        setForm(mapRecordToForm(res.data));
      })
      .catch(() => toast.error('Failed to load HBL'))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: keyof SeaHblForm, value: string) => {
    setForm((current) => current ? { ...current, [field]: value } : current);
  };

  const updateContainer = (ci: number, field: keyof SeaContainerRow, value: string) => {
    setForm(cur => {
      if (!cur) return cur;
      const containers = cur.containers.map((c, i) => i === ci ? { ...c, [field]: value } : c);
      return { ...cur, containers };
    });
  };

  const addContainer = () => {
    setForm(cur => {
      if (!cur) return cur;
      return { ...cur, containers: [...cur.containers, { container_no: '', seal_no: '', package_count: '', weight: '', container_size: '', container_type: 'FCL', soc_flag: 'N-NO', agent_code: '' }] };
    });
  };

  const removeContainer = (ci: number) => {
    setForm(cur => {
      if (!cur || cur.containers.length <= 1) return cur;
      return { ...cur, containers: cur.containers.filter((_, i) => i !== ci) };
    });
  };

  const handleSave = async () => {
    if (!form || !id) return;

    if (!form.hbl_no.trim()) {
      toast.error('HBL number is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        containers: form.containers.map(ct => ({
          container_no: ct.container_no,
          seal_no: ct.seal_no,
          package_count: ct.package_count,
          weight: ct.weight,
          container_size: ct.container_size,
          container_type: ct.container_type,
          soc_flag: ct.soc_flag,
          agent_code: ct.agent_code,
        })),
      };
      const res = await api.put(`/sea-hbls/${id}`, payload);
      setRecord(res.data);
      setForm(mapRecordToForm(res.data));
      toast.success('HBL updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container sea-page">
        <div className="loading-center"><span className="spinner"></span> Loading HBL...</div>
      </div>
    );
  }

  if (!form || !record) {
    return (
      <div className="page-container sea-page">
        <div className="empty-state">
          <div className="empty-state-title">HBL not found</div>
          <button className="btn btn-secondary" onClick={() => navigate('/mbl')}>Back to Console</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container sea-page">
      <div className="sea-hero">
        <div>
          <div className="sea-eyebrow">HBL Edit</div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>
            HBL: {record.hbl_no}
          </h1>
          <p className="page-subtitle">
            MBL: <strong>{(record as any).mbl_no || 'NA'}</strong>
            {(record as any).importer_name && <> &nbsp;·&nbsp; {(record as any).importer_name}</>}
          </p>
        </div>
        <div className="sea-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/mbl')}>Back to Console</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">HBL Details</span>
        </div>
        <div className="card-body">
          <div className="sea-section-title">Identification</div>
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">HBL No. <span className="required">*</span></label>
              <input
                className="form-control font-mono"
                value={form.hbl_no}
                onChange={(e) => update('hbl_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">HBL Date</label>
              <DateInput
                className="form-control"
                value={form.hbl_date}
                onChange={(e) => update('hbl_date', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }}>
            <div className="sea-section-title" style={{ margin: 0 }}>
              Container Details{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>
                ({form.containers.length} container{form.containers.length !== 1 ? 's' : ''})
              </span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addContainer}>+ Add Container</button>
          </div>
          <div className="table-wrapper">
            <table className="ef-container-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Container No. <span style={{ fontSize: 10, fontWeight: 400 }}>(4 alpha+7 num)</span></th>
                  <th>Seal No.</th>
                  <th>Packages</th>
                  <th>Weight (Tons)</th>
                  <th>Container Size</th>
                  <th>Container Status</th>
                  <th>SOC Flag</th>
                  <th>Agent Code</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {form.containers.map((ct, ci) => (
                  <tr key={ci}>
                    <td style={{ color: '#888', fontSize: 12, textAlign: 'center' }}>{ci + 1}</td>
                    <td>
                      <input
                        className="form-control ef-table-input font-mono"
                        value={ct.container_no}
                        maxLength={11}
                        placeholder="AAAA1234567"
                        onChange={(e) => {
                          const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          let result = '';
                          let a = 0, n = 0;
                          for (let i = 0; i < upper.length && result.length < 11; i++) {
                            if (a < 4 && /[A-Z]/.test(upper[i])) { result += upper[i]; a++; }
                            else if (a >= 4 && n < 7 && /[0-9]/.test(upper[i])) { result += upper[i]; n++; }
                          }
                          updateContainer(ci, 'container_no', result);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control ef-table-input"
                        value={ct.seal_no}
                        onChange={(e) => updateContainer(ci, 'seal_no', e.target.value.toUpperCase())}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control ef-table-input"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={ct.package_count}
                        onChange={(e) => updateContainer(ci, 'package_count', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control ef-table-input"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={ct.weight}
                        onChange={(e) => updateContainer(ci, 'weight', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control ef-table-input"
                        value={ct.container_size}
                        onChange={(e) => updateContainer(ci, 'container_size', e.target.value.toUpperCase())}
                      />
                    </td>
                    <td>
                      <select
                        className="form-control ef-table-input"
                        value={ct.container_type}
                        onChange={(e) => updateContainer(ci, 'container_type', e.target.value)}
                      >
                        {CONTAINER_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-control ef-table-input"
                        value={ct.soc_flag}
                        onChange={(e) => updateContainer(ci, 'soc_flag', e.target.value)}
                      >
                        {SOC_FLAG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-control ef-table-input"
                        value={ct.agent_code}
                        onChange={(e) => updateContainer(ci, 'agent_code', e.target.value.toUpperCase())}
                      />
                    </td>
                    <td>
                      <button
                        className="btn-link danger"
                        onClick={() => removeContainer(ci)}
                        disabled={form.containers.length <= 1}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sea-section-title">Weight and Volume</div>
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">Package Count</label>
              <input
                className="form-control"
                type="number"
                value={form.package_count}
                onChange={(e) => update('package_count', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gross Weight</label>
              <input
                className="form-control"
                type="number"
                step="0.001"
                value={form.gross_weight}
                onChange={(e) => update('gross_weight', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Net Weight</label>
              <input
                className="form-control"
                type="number"
                step="0.001"
                value={form.cargo_net_weight}
                onChange={(e) => update('cargo_net_weight', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Volume (CBM)</label>
              <input
                className="form-control"
                type="number"
                step="0.001"
                value={form.volume_cbm}
                onChange={(e) => update('volume_cbm', e.target.value)}
              />
            </div>
          </div>

          <div className="sea-section-title">Cargo Details</div>
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">Package Type</label>
              <input
                className="form-control"
                value={form.package_type}
                onChange={(e) => update('package_type', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">HS Code</label>
              <input
                className="form-control font-mono"
                value={form.hs_code}
                onChange={(e) => update('hs_code', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IMO Code</label>
              <input
                className="form-control"
                value={form.imo_code}
                onChange={(e) => update('imo_code', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Item Type</label>
              <input
                className="form-control"
                value={form.item_type}
                onChange={(e) => update('item_type', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Cargo Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.cargo_description}
                onChange={(e) => update('cargo_description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Marks and Numbers</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.marks_numbers}
                onChange={(e) => update('marks_numbers', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">Invoice Currency</label>
              <input
                className="form-control"
                value={form.invoice_value_currency}
                onChange={(e) => update('invoice_value_currency', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sea-footer">EDI Software Solutions @ 2022 - 2026 All rights reserved</div>
    </div>
  );
};

export default HblEditPage;
