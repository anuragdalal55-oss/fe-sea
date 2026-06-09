import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import {
  SeaCarrierRecord,
  SeaHblForm,
  SeaMblForm,
  SeaMblRecord,
  SeaMloRecord,
  SeaTransmissionRecord,
} from '../types/sea';
import { fmtDate, fmtDateTime } from '../utils/dateUtils';
import api from '../utils/api';

const today = () => new Date().toISOString().slice(0, 10);

const CARGO_MOVE_OPTIONS = [
  'TI-ICD Transhipment',
  'LC-LOCAL Cargo',
  'PT-Port to Port',
  'DC-Direct Consignment',
  'CC-CFS to CFS',
  'CI-CFS to ICD',
  'IC-ICD to CFS',
  'II-ICD to ICD',
];

const CARGO_NATURE_OPTIONS = [
  'C-Containerized',
  'B-Break Bulk',
  'L-LCL',
  'G-General Cargo',
];

const ITEM_TYPE_OPTIONS = [
  'OT-Other Cargo',
  'DG-Dangerous Goods',
  'HV-High Value',
  'RF-Refrigerated',
];

const PACKAGE_CODE_OPTIONS = [
  'UNT', 'PLT', 'CTN', 'PKG', 'BAG', 'BOX', 'DRM', 'PCS', 'ROL', 'SET',
];

const CONTAINER_STATUS_OPTIONS = ['FCL', 'LCL'];
const SOC_FLAG_OPTIONS = ['N-NO', 'Y-YES'];

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createHblRow = (index = 0): SeaHblForm => ({
  hbl_no: '',
  hbl_date: today(),
  package_count: '',
  package_type: 'UNT',
  gross_weight: '',
  cargo_nature: 'C-Containerized',
  item_type: 'OT-Other Cargo',
  cargo_move: 'TI-ICD Transhipment',
  port_of_delivery: '',
  dest_cfs: '',
  subline_no: String(index + 1),
  importer_name: '',
  importer_address1: '',
  importer_address2: '',
  importer_address3: '',
  cargo_description: '',
  marks_numbers: 'NM',
  carrier_name: '',
  carrier_code: '',
  bond_no: '',
  transport: '',
  mlo_name: '',
  mlo_code: '',
  container_no: '',
  seal_no: '',
  container_size: '',
  container_type: 'FCL',
  soc_flag: 'N-NO',
  agent_code: '',
  cargo_net_weight: '',
  volume_cbm: '',
  hs_code: '',
  imo_code: '',
  invoice_value_currency: 'INR',
});

const createMblForm = (locationCode = '', profileId = ''): SeaMblForm => ({
  mbl_no: '',
  mbl_date: today(),
  port_of_loading: '',
  vessel_date: '',
  igm_no: '',
  igm_date: '',
  vessel_code: '',
  imo_code: '',
  vessel_voyage_no: '',
  line_no: '',
  vessel_name: '',
  shipping_line: '',
  description: '',
  customs_house_code: locationCode,
  profile_id: profileId,
  total_packages: '0',
  total_gross_weight: '0',
  total_volume_cbm: '0',
  port_of_unloading: locationCode ? locationCode : '',
  cargo_move: '',
  port_of_delivery: '',
  dest_cfs: '',
  subline_no: '1',
  cargo_nature: 'C-Containerized',
  item_type: 'OT-Other Cargo',
  importer_name: '',
  importer_address1: '',
  importer_address2: '',
  importer_address3: '',
  marks_numbers: 'NM',
  transport: '',
  bond_no: '',
  carrier_name: '',
  carrier_code: '',
  mlo_name: '',
  mlo_code: '',
});

const mapHblRecordToForm = (row: any, fallbackMbl?: any): SeaHblForm => ({
  hbl_no: row.hbl_no || '',
  hbl_date: row.hbl_date?.slice(0, 10) || today(),
  package_count: String(row.package_count ?? ''),
  package_type: row.package_type || 'UNT',
  gross_weight: String(row.gross_weight ?? ''),
  cargo_nature: row.cargo_nature || fallbackMbl?.cargo_nature || 'C-Containerized',
  item_type: row.item_type || fallbackMbl?.item_type || 'OT-Other Cargo',
  cargo_move: row.cargo_move || fallbackMbl?.cargo_move || 'TI-ICD Transhipment',
  port_of_delivery: row.port_of_delivery || fallbackMbl?.port_of_delivery || '',
  dest_cfs: row.dest_cfs || fallbackMbl?.dest_cfs || '',
  subline_no: row.subline_no || '',
  importer_name: row.importer_name || fallbackMbl?.importer_name || '',
  importer_address1: row.importer_address1 || fallbackMbl?.importer_address1 || '',
  importer_address2: row.importer_address2 || fallbackMbl?.importer_address2 || '',
  importer_address3: row.importer_address3 || fallbackMbl?.importer_address3 || '',
  cargo_description: row.cargo_description || '',
  marks_numbers: row.marks_numbers || 'NM',
  carrier_name: row.carrier_name || fallbackMbl?.carrier_name || '',
  carrier_code: row.carrier_code || fallbackMbl?.carrier_code || '',
  bond_no: row.bond_no || fallbackMbl?.bond_no || '',
  transport: row.transport || fallbackMbl?.transport || '',
  mlo_name: row.mlo_name || fallbackMbl?.mlo_name || '',
  mlo_code: row.mlo_code || fallbackMbl?.mlo_code || '',
  container_no: row.container_no || '',
  seal_no: row.seal_no || '',
  container_size: row.container_size || '',
  container_type: row.container_type || 'FCL',
  soc_flag: row.soc_flag || 'N-NO',
  agent_code: row.agent_code || '',
  cargo_net_weight: String(row.cargo_net_weight ?? ''),
  volume_cbm: String(row.volume_cbm ?? ''),
  hs_code: row.hs_code || '',
  imo_code: row.imo_code || '',
  invoice_value_currency: row.invoice_value_currency || 'INR',
});

const SeaConsolePage: React.FC = () => {
  const { selectedLocation, user } = useAuth();
  const navigate = useNavigate();

  const [mbls, setMbls] = useState<SeaMblRecord[]>([]);
  const [history, setHistory] = useState<SeaTransmissionRecord[]>([]);
  const [selectedMblId, setSelectedMblId] = useState<string | null>(null);
  const [form, setForm] = useState<SeaMblForm>(createMblForm());
  const [hbls, setHbls] = useState<SeaHblForm[]>([createHblRow(0)]);
  const [activeHblTab, setActiveHblTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [carriers, setCarriers] = useState<SeaCarrierRecord[]>([]);
  const [mlos, setMlos] = useState<SeaMloRecord[]>([]);

  useEffect(() => {
    api.get('/sea-carriers').then((r) => setCarriers(r.data || [])).catch(() => {});
    api.get('/sea-mlos').then((r) => setMlos(r.data || [])).catch(() => {});
  }, []);

  const resetEditor = useCallback(() => {
    setSelectedMblId(null);
    setForm(createMblForm(
      selectedLocation?.customs_house_code || user?.customs_house_code || '',
      user?.profile_id || ''
    ));
    setHbls([createHblRow(0)]);
    setActiveHblTab(0);
  }, [selectedLocation?.customs_house_code, user?.customs_house_code, user?.profile_id]);

  const applyRecord = useCallback((record: SeaMblRecord) => {
    setSelectedMblId(record.id);
    setForm({
      mbl_no: record.mbl_no || '',
      mbl_date: record.mbl_date?.slice(0, 10) || today(),
      port_of_loading: record.port_of_loading || '',
      vessel_date: record.vessel_date?.slice(0, 10) || '',
      igm_no: record.igm_no || '',
      igm_date: record.igm_date?.slice(0, 10) || '',
      vessel_code: record.vessel_code || '',
      imo_code: record.imo_code || '',
      vessel_voyage_no: record.vessel_voyage_no || '',
      line_no: record.line_no || '',
      vessel_name: record.vessel_name || '',
      shipping_line: record.shipping_line || '',
      description: record.description || '',
      customs_house_code: record.customs_house_code || selectedLocation?.customs_house_code || '',
      profile_id: record.profile_id || user?.profile_id || '',
      total_packages: String(record.total_packages ?? '0'),
      total_gross_weight: String(record.total_gross_weight ?? '0'),
      total_volume_cbm: String(record.total_volume_cbm ?? '0'),
      port_of_unloading: record.port_of_unloading || '',
      cargo_move: record.cargo_move || '',
      port_of_delivery: record.port_of_delivery || '',
      dest_cfs: record.dest_cfs || '',
      subline_no: record.subline_no || '1',
      cargo_nature: record.cargo_nature || 'C-Containerized',
      item_type: record.item_type || 'OT-Other Cargo',
      importer_name: record.importer_name || '',
      importer_address1: record.importer_address1 || '',
      importer_address2: record.importer_address2 || '',
      importer_address3: record.importer_address3 || '',
      marks_numbers: record.marks_numbers || 'NM',
      transport: record.transport || '',
      bond_no: record.bond_no || '',
      carrier_name: record.carrier_name || '',
      carrier_code: record.carrier_code || '',
      mlo_name: record.mlo_name || '',
      mlo_code: record.mlo_code || '',
    });
    const mappedHbls = record.hbls && record.hbls.length > 0
      ? record.hbls.map((h, i) => mapHblRecordToForm(
          { ...h, subline_no: h.subline_no || String(i + 1) },
          record
        ))
      : [createHblRow(0)];
    setHbls(mappedHbls);
    setActiveHblTab(0);
  }, [selectedLocation?.customs_house_code, user?.profile_id]);

  const fetchMbls = useCallback(async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const response = await api.get('/sea-mbls', {
        params: {
          page: nextPage,
          pageSize: nextPageSize,
          ...(search ? { search } : {}),
          ...(selectedLocation?.customs_house_code ? { customs_house_code: selectedLocation.customs_house_code } : {}),
        },
      });
      setMbls(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch {
      toast.error('Failed to load MBL records');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedLocation?.customs_house_code]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get('/sea-transmissions');
      setHistory((response.data || []).slice(0, 6));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => { fetchMbls(page, pageSize); }, [fetchMbls, page, pageSize]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { if (!selectedMblId) resetEditor(); }, [resetEditor, selectedMblId]);

  const loadDetail = async (id: string) => {
    try {
      const response = await api.get(`/sea-mbls/${id}`);
      applyRecord(response.data);
    } catch {
      toast.error('Failed to load MBL details');
    }
  };

  const updateForm = (field: keyof SeaMblForm, value: string) =>
    setForm((c) => ({ ...c, [field]: value }));

  const updateHbl = (index: number, field: keyof SeaHblForm, value: string) =>
    setHbls((c) => c.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const addHbl = () => {
    const newIndex = hbls.length;
    setHbls((c) => [...c, createHblRow(newIndex)]);
    setActiveHblTab(newIndex);
  };

  const deleteHbl = (index: number) => {
    if (hbls.length === 1) {
      setHbls([createHblRow(0)]);
      return;
    }
    const updated = hbls
      .filter((_, i) => i !== index)
      .map((h, i) => ({ ...h, subline_no: String(i + 1) }));
    setHbls(updated);
    setActiveHblTab(Math.min(index, updated.length - 1));
  };

  const validateForm = () => {
    if (!form.mbl_no.trim()) { toast.error('MBL number is required'); return false; }
    const seen = new Set<string>();
    for (let i = 0; i < hbls.length; i++) {
      const hblNo = hbls[i].hbl_no.trim().toUpperCase();
      if (!hblNo) { toast.error(`HBL number is required on HBL ${i + 1}`); return false; }
      if (seen.has(hblNo)) { toast.error(`Duplicate HBL number: ${hblNo}`); return false; }
      seen.add(hblNo);
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        customs_house_code: form.customs_house_code || selectedLocation?.customs_house_code || user?.customs_house_code || '',
        profile_id: form.profile_id || user?.profile_id || '',
        hbls,
      };
      const response = selectedMblId
        ? await api.put(`/sea-mbls/${selectedMblId}`, payload)
        : await api.post('/sea-mbls', payload);
      applyRecord(response.data);
      await fetchMbls(1, pageSize);
      await fetchHistory();
      setPage(1);
      toast.success(selectedMblId ? 'MBL updated' : 'MBL created');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMblId) { toast.error('Select an MBL first'); return; }
    if (!window.confirm(`Delete ${form.mbl_no}?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/sea-mbls/${selectedMblId}`);
      toast.success('MBL deleted');
      resetEditor();
      await fetchMbls(1, pageSize);
      setPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedMblId) { toast.error('Save or select an MBL first'); return; }
    setGenerating(true);
    try {
      const response = await api.post(`/sea-transmissions/generate/${selectedMblId}`, {});
      const blob = new Blob([response.data.fileContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = response.data.fileName; a.click();
      window.URL.revokeObjectURL(url);
      toast.success(response.data.message || 'File downloaded');
      await fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const activeHbl = hbls[activeHblTab];

  return (
    <div className="page-container entry-form-page">

      {/* ── Top action bar ── */}
      <div className="ef-topbar">
        <div className="ef-topbar-title">
          {selectedMblId ? `Editing: ${form.mbl_no}` : 'New Sea Entry'}
        </div>
        <div className="ef-topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={resetEditor}>New Entry</button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGenerate}
            disabled={!selectedMblId || generating}
          >
            {generating ? 'Preparing…' : 'Generate Placeholder'}
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={!selectedMblId || deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* ══════════════════ ENTRY FORM ══════════════════ */}
      <div className="ef-form-wrap">

        {/* ── MBL Details ── */}
        <div className="ef-section">
          <div className="ef-section-title">MBL Details</div>

          <div className="form-row form-row-4">
            <div className="form-group ef-req">
              <label className="form-label">MBL No.</label>
              <input
                className="form-control font-mono"
                value={form.mbl_no}
                onChange={(e) => updateForm('mbl_no', e.target.value.toUpperCase())}
                placeholder="MBLXXXXXXXXX"
              />
            </div>
            <div className="form-group ef-req">
              <label className="form-label">MBL Date</label>
              <input
                className="form-control"
                type="date"
                value={form.mbl_date}
                onChange={(e) => updateForm('mbl_date', e.target.value)}
              />
            </div>
            <div className="form-group ef-req">
              <label className="form-label">Loading Port</label>
              <input
                className="form-control"
                value={form.port_of_loading}
                onChange={(e) => updateForm('port_of_loading', e.target.value.toUpperCase())}
                placeholder="(CODE) -- PORT NAME"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Date</label>
              <input
                className="form-control"
                type="date"
                value={form.vessel_date}
                onChange={(e) => updateForm('vessel_date', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">IGM No.</label>
              <input
                className="form-control"
                value={form.igm_no}
                onChange={(e) => updateForm('igm_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group ef-req">
              <label className="form-label">IGM Date</label>
              <input
                className="form-control"
                type="date"
                value={form.igm_date}
                onChange={(e) => updateForm('igm_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Code</label>
              <input
                className="form-control"
                value={form.vessel_code}
                onChange={(e) => updateForm('vessel_code', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IMO Code</label>
              <input
                className="form-control"
                value={form.imo_code}
                onChange={(e) => updateForm('imo_code', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">Voyage No.</label>
              <input
                className="form-control"
                value={form.vessel_voyage_no}
                onChange={(e) => updateForm('vessel_voyage_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Line No.</label>
              <input
                className="form-control"
                value={form.line_no}
                onChange={(e) => updateForm('line_no', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Name</label>
              <input
                className="form-control"
                value={form.vessel_name}
                onChange={(e) => updateForm('vessel_name', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group ef-req">
              <label className="form-label">Shipping Line</label>
              <input
                className="form-control"
                value={form.shipping_line}
                onChange={(e) => updateForm('shipping_line', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group ef-req">
              <label className="form-label">Remarks</label>
              <input
                className="form-control"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="ef-divider" />

        {/* ── HBL Details ── */}
        <div className="ef-section">
          <div className="ef-section-header">
            <div className="ef-section-title">HBL Details</div>
            <button className="btn btn-primary btn-sm" onClick={addHbl}>Add HBL</button>
          </div>

          {/* Tab bar */}
          <div className="tab-bar ef-hbl-tabs">
            {hbls.map((_, i) => (
              <button
                key={i}
                className={`tab-btn${activeHblTab === i ? ' active' : ''}`}
                onClick={() => setActiveHblTab(i)}
              >
                HBL {i + 1}
              </button>
            ))}
          </div>

          {activeHbl && (
            <div className="ef-hbl-body">
              {/* Delete HBL */}
              <div className="ef-hbl-delete-row">
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => deleteHbl(activeHblTab)}
                >
                  Delete HBL
                </button>
              </div>

              {/* Row 1 */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">Cargo Move</label>
                  <select
                    className="form-control"
                    value={activeHbl.cargo_move}
                    onChange={(e) => updateHbl(activeHblTab, 'cargo_move', e.target.value)}
                  >
                    {CARGO_MOVE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Port of Delivery</label>
                  <input
                    className="form-control"
                    value={activeHbl.port_of_delivery}
                    onChange={(e) => updateHbl(activeHblTab, 'port_of_delivery', e.target.value.toUpperCase())}
                    placeholder="CODE (PORT NAME)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dest(CFS)</label>
                  <input
                    className="form-control"
                    value={activeHbl.dest_cfs}
                    onChange={(e) => updateHbl(activeHblTab, 'dest_cfs', e.target.value)}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Subline No.</label>
                  <input
                    className="form-control"
                    value={activeHbl.subline_no}
                    readOnly
                    style={{ background: '#f3f6fd', color: '#66718f', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">HBL No.</label>
                  <input
                    className="form-control font-mono"
                    value={activeHbl.hbl_no}
                    onChange={(e) => updateHbl(activeHblTab, 'hbl_no', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">HBL Date</label>
                  <input
                    className="form-control"
                    type="date"
                    value={activeHbl.hbl_date}
                    onChange={(e) => updateHbl(activeHblTab, 'hbl_date', e.target.value)}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Package</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    value={activeHbl.package_count}
                    onChange={(e) => updateHbl(activeHblTab, 'package_count', e.target.value)}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Package Code</label>
                  <select
                    className="form-control"
                    value={activeHbl.package_type}
                    onChange={(e) => updateHbl(activeHblTab, 'package_type', e.target.value)}
                  >
                    {PACKAGE_CODE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">Weight</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.001"
                    min="0"
                    value={activeHbl.gross_weight}
                    onChange={(e) => updateHbl(activeHblTab, 'gross_weight', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight Unit</label>
                  <input
                    className="form-control"
                    value="KGS"
                    readOnly
                    style={{ background: '#f3f6fd', color: '#66718f', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Cargo Nature</label>
                  <select
                    className="form-control"
                    value={activeHbl.cargo_nature}
                    onChange={(e) => updateHbl(activeHblTab, 'cargo_nature', e.target.value)}
                  >
                    {CARGO_NATURE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Item Type</label>
                  <select
                    className="form-control"
                    value={activeHbl.item_type}
                    onChange={(e) => updateHbl(activeHblTab, 'item_type', e.target.value)}
                  >
                    {ITEM_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4 */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">Importer Name</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    value={activeHbl.importer_name}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Importer Address1</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    value={activeHbl.importer_address1}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address1', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address 2</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    value={activeHbl.importer_address2}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address2', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address 3</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    value={activeHbl.importer_address3}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address3', e.target.value)}
                  />
                </div>
              </div>

              {/* Row 5 */}
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    className="form-control"
                    value={activeHbl.cargo_description}
                    onChange={(e) => updateHbl(activeHblTab, 'cargo_description', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mark &amp; No.</label>
                  <input
                    className="form-control"
                    value={activeHbl.marks_numbers}
                    onChange={(e) => updateHbl(activeHblTab, 'marks_numbers', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Carrier Name</label>
                  <select
                    className="form-control"
                    value={activeHbl.carrier_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const carrier = carriers.find((c) => c.carrier_name === name);
                      updateHbl(activeHblTab, 'carrier_name', name);
                      if (carrier) {
                        updateHbl(activeHblTab, 'carrier_code', carrier.carrier_code || '');
                        if (carrier.bond_number) updateHbl(activeHblTab, 'bond_no', carrier.bond_number);
                        if (carrier.transport) updateHbl(activeHblTab, 'transport', carrier.transport);
                      }
                    }}
                  >
                    <option value="">-- Select Carrier --</option>
                    {carriers.map((c) => (
                      <option key={c.id} value={c.carrier_name}>{c.carrier_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Carrier Code</label>
                  <input
                    className="form-control font-mono"
                    value={activeHbl.carrier_code}
                    onChange={(e) => updateHbl(activeHblTab, 'carrier_code', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {/* Row 6 */}
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">Bond No.</label>
                  <input
                    className="form-control"
                    value={activeHbl.bond_no}
                    onChange={(e) => updateHbl(activeHblTab, 'bond_no', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Transport</label>
                  <input
                    className="form-control"
                    value={activeHbl.transport}
                    onChange={(e) => updateHbl(activeHblTab, 'transport', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">MLO Name</label>
                  <select
                    className="form-control"
                    value={activeHbl.mlo_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const mlo = mlos.find((m) => m.mlo_name === name);
                      updateHbl(activeHblTab, 'mlo_name', name);
                      if (mlo) updateHbl(activeHblTab, 'mlo_code', mlo.mlo_code || '');
                    }}
                  >
                    <option value="">-- Select MLO --</option>
                    {mlos.map((m) => (
                      <option key={m.id} value={m.mlo_name}>{m.mlo_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">MLO Code</label>
                  <input
                    className="form-control font-mono"
                    value={activeHbl.mlo_code}
                    onChange={(e) => updateHbl(activeHblTab, 'mlo_code', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {/* ── Container Details ── */}
              <div className="ef-divider" style={{ margin: '18px 0 14px' }} />
              <div className="ef-section-header" style={{ marginBottom: 10 }}>
                <div className="ef-section-title" style={{ fontSize: 15 }}>Container Details</div>
                <button className="btn btn-primary btn-sm" onClick={() => toast('One container per HBL is supported')}>
                  Add Container
                </button>
              </div>

              <div className="table-wrapper">
                <table className="ef-container-table">
                  <thead>
                    <tr>
                      <th>Container No.</th>
                      <th>Seal No.</th>
                      <th>Packages</th>
                      <th>Weight(Tons)</th>
                      <th>Container Size</th>
                      <th>Container Status</th>
                      <th>SOC Flag</th>
                      <th>Agent Code</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          className="form-control ef-table-input font-mono"
                          value={activeHbl.container_no}
                          onChange={(e) => updateHbl(activeHblTab, 'container_no', e.target.value.toUpperCase())}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control ef-table-input"
                          value={activeHbl.seal_no}
                          onChange={(e) => updateHbl(activeHblTab, 'seal_no', e.target.value.toUpperCase())}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control ef-table-input"
                          type="number"
                          min="0"
                          value={activeHbl.package_count}
                          onChange={(e) => updateHbl(activeHblTab, 'package_count', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control ef-table-input"
                          type="number"
                          step="0.001"
                          min="0"
                          value={activeHbl.gross_weight}
                          onChange={(e) => updateHbl(activeHblTab, 'gross_weight', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control ef-table-input"
                          value={activeHbl.container_size}
                          onChange={(e) => updateHbl(activeHblTab, 'container_size', e.target.value.toUpperCase())}
                        />
                      </td>
                      <td>
                        <select
                          className="form-control ef-table-input"
                          value={activeHbl.container_type}
                          onChange={(e) => updateHbl(activeHblTab, 'container_type', e.target.value)}
                        >
                          {CONTAINER_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-control ef-table-input"
                          value={activeHbl.soc_flag}
                          onChange={(e) => updateHbl(activeHblTab, 'soc_flag', e.target.value)}
                        >
                          {SOC_FLAG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          className="form-control ef-table-input"
                          value={activeHbl.agent_code}
                          onChange={(e) => updateHbl(activeHblTab, 'agent_code', e.target.value.toUpperCase())}
                        />
                      </td>
                      <td>
                        <button
                          className="btn-link danger"
                          onClick={() => updateHbl(activeHblTab, 'container_no', '')}
                          title="Clear container"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Form Actions ── */}
        <div className="ef-form-actions">
          <button className="btn btn-warning" onClick={resetEditor}>Reset</button>
          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save MBL + HBL + Container'}
          </button>
        </div>
      </div>

      {/* ══════════════════ SAVED MBL REGISTER ══════════════════ */}
      <div className="card sea-register-card" style={{ marginTop: 28 }}>
        <div className="card-header sea-register-header">
          <div>
            <span className="card-title">Saved MBL Register</span>
            <div className="text-sm text-muted" style={{ marginTop: 2 }}>
              Click any row to load it into the editor above.
            </div>
          </div>
          <div className="sea-search-wrap">
            <input
              className="form-control"
              placeholder="Search MBL, importer, or HBL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { setPage(1); fetchMbls(1, pageSize); }
              }}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setPage(1); fetchMbls(1, pageSize); }}
            >
              Search
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner" /> Loading…</div>
          ) : mbls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No MBL records found</div>
              <p>Create your first sea shipment from the editor above.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>MBL No.</th>
                  <th>Date</th>
                  <th>Importer</th>
                  <th>Shipping Line</th>
                  <th>Location</th>
                  <th>Packages</th>
                  <th>Gross Wt</th>
                  <th>HBLs</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {mbls.map((record) => (
                  <tr
                    key={record.id}
                    className={record.id === selectedMblId ? 'sea-row-active' : ''}
                    onClick={() => loadDetail(record.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="font-mono" style={{ fontWeight: 700 }}>{record.mbl_no}</td>
                    <td>{fmtDate(record.mbl_date || record.created_at)}</td>
                    <td>{record.importer_name || '—'}</td>
                    <td>{record.shipping_line || record.carrier_name || '—'}</td>
                    <td className="font-mono text-sm">{record.customs_house_code || '—'}</td>
                    <td>{record.total_packages}</td>
                    <td>{toNumber(record.total_gross_weight).toFixed(3)}</td>
                    <td>{record.hbl_count || 0}</td>
                    <td><span className="badge badge-info">{record.status}</span></td>
                    <td>{fmtDateTime(record.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPage={(p) => setPage(p)}
          onPageSize={(ps) => { setPageSize(ps); setPage(1); }}
        />
      </div>

      <div className="sea-footer">EDI Software Solutions @ 2022 – 2026 All rights reserved</div>
    </div>
  );
};

export default SeaConsolePage;
