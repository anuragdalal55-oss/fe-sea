import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { SeaHblForm, SeaHblRecord } from '../types/sea';
import api from '../utils/api';

const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

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
  container_no: row.container_no || '',
  seal_no: row.seal_no || '',
  container_size: row.container_size || '',
  container_type: row.container_type || 'FCL',
  soc_flag: row.soc_flag || 'N-NO',
  agent_code: row.agent_code || '',
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

  const handleSave = async () => {
    if (!form || !id) return;

    if (!form.hbl_no.trim()) {
      toast.error('HBL number is required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/sea-hbls/${id}`, form);
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
              <input
                className="form-control"
                type="date"
                value={form.hbl_date}
                onChange={(e) => update('hbl_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Agent Code</label>
              <input
                className="form-control font-mono"
                value={form.agent_code}
                onChange={(e) => update('agent_code', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SOC Flag</label>
              <select
                className="form-control"
                value={form.soc_flag}
                onChange={(e) => update('soc_flag', e.target.value)}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          <div className="sea-section-title">Container</div>
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">Container No.</label>
              <input
                className="form-control font-mono"
                value={form.container_no}
                onChange={(e) => update('container_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seal No.</label>
              <input
                className="form-control font-mono"
                value={form.seal_no}
                onChange={(e) => update('seal_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Container Size</label>
              <input
                className="form-control"
                value={form.container_size}
                onChange={(e) => update('container_size', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Container Type</label>
              <input
                className="form-control"
                value={form.container_type}
                onChange={(e) => update('container_type', e.target.value)}
              />
            </div>
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
