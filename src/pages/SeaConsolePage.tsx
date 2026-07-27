import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  SeaCarrierRecord,
  SeaContainerRow,
  SeaHblForm,
  SeaMblForm,
  SeaMblRecord,
  SeaMloRecord,
} from '../types/sea';
import { formatWeight, roundContainerWeight } from '../utils/numberUtils';
import api from '../utils/api';

import DateInput from '../components/DateInput';
import TextArea from '../components/TextArea';
import TextInput from '../components/TextInput';
import { sanitizeFreeText } from '../utils/textSanitize';
const today = () => new Date().toISOString().slice(0, 10);

// Only 3 cargo move options as per requirement
const CARGO_MOVE_OPTIONS = [
  'TI-ICD Transhipment',
  'LC-LOCAL Cargo',
  'TC-Transhipment Cargo',
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

// Full package code list as per requirement
const PACKAGE_CODE_OPTIONS = [
  { value: 'BDL', label: 'BDL (BUNDLE)' },
  { value: 'BGS', label: 'BGS (BAGS)' },
  { value: 'BLK', label: 'BLK (BULK)' },
  { value: 'BLO', label: 'BLO (BLOCKS)' },
  { value: 'BLS', label: 'BLS (BALES)' },
  { value: 'BOX', label: 'BOX (BOXES)' },
  { value: 'CAN', label: 'CAN (CANS)' },
  { value: 'CAS', label: 'CAS (CASES)' },
  { value: 'CLS', label: 'CLS (COILS)' },
  { value: 'CON', label: 'CON (CONTAI)' },
  { value: 'CRT', label: 'CRT (CRATES)' },
  { value: 'CTN', label: 'CTN (CARTON)' },
  { value: 'COL', label: 'COL (COLLIE)' },
  { value: 'DRM', label: 'DRM (DRUMS)' },
  { value: 'LOG', label: 'LOG (LOGS)' },
  { value: 'PAL', label: 'PAL (PALLS)' },
  { value: 'PKG', label: 'PKG (PACKAG)' },
  { value: 'PLT', label: 'PLT (PALLET)' },
  { value: 'PCS', label: 'PCS (PIECES)' },
  { value: 'RLS', label: 'RLS (ROLLS)' },
  { value: 'REL', label: 'REL (REELS)' },
  { value: 'SKD', label: 'SKD (SKID)' },
  { value: 'UNT', label: 'UNT (UNITS)' },
  { value: 'BRL', label: 'BRL (BARREL)' },
];

const CONTAINER_STATUS_OPTIONS = ['FCL', 'LCL'];
const SOC_FLAG_OPTIONS = ['N-NO', 'Y-YES'];

type PortOption = { code: string; name: string };

// Searchable port autocomplete backed by a master list fetched from the backend.
// Typing a code that doesn't exist yet offers to create it via `onCreate`, which
// persists the new port to the loading/delivery port master and adds it to the list.
const PortSearch: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: PortOption[];
  onCreate?: (code: string) => Promise<void>;
  placeholder?: string;
}> = ({ value, onChange, options, onCreate, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!value) return options.slice(0, 15);
    const q = value.toUpperCase();
    return options.filter(
      (o) => (o.code || '').toUpperCase().includes(q) || (o.name || '').toUpperCase().includes(q)
    ).slice(0, 20);
  }, [value, options]);

  const exactMatch = React.useMemo(
    () => options.some((o) => (o.code || '').toUpperCase() === value.toUpperCase()),
    [value, options]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async () => {
    if (!onCreate || !value.trim() || creating) return;
    setCreating(true);
    try {
      await onCreate(value.trim().toUpperCase());
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-control"
        value={value}
        placeholder={placeholder || 'Type to search port...'}
        onChange={(e) => { onChange(e.target.value.toUpperCase()); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (filtered.length > 0 || (onCreate && value.trim() && !exactMatch)) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #d4dbff', borderRadius: 6,
          maxHeight: 220, overflowY: 'auto', zIndex: 2000,
          boxShadow: '0 4px 20px rgba(24,64,242,0.13)',
        }}>
          {filtered.map((o) => (
            <div
              key={o.code}
              style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f0f4ff' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.code); setOpen(false); }}
            >
              <strong style={{ color: '#1a3fbf' }}>{o.code}</strong>
              <span style={{ color: '#555', marginLeft: 8 }}>{o.name}</span>
            </div>
          ))}
          {onCreate && value.trim() && !exactMatch && (
            <div
              style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12, color: '#1a7f37', fontWeight: 600 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
            >
              {creating ? 'Adding…' : `+ Add "${value.trim().toUpperCase()}" as new port`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NameSearch: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: Array<{ name: string; code: string }>;
  placeholder?: string;
  onSelect?: (name: string, code: string) => void;
}> = ({ value, onChange, options, placeholder, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!value) return options.slice(0, 15);
    const q = value.toUpperCase();
    return options.filter(
      (o) => (o.name || '').toUpperCase().includes(q) || (o.code || '').toUpperCase().includes(q)
    ).slice(0, 20);
  }, [value, options]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-control"
        value={value}
        placeholder={placeholder || 'Type to search...'}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #d4dbff', borderRadius: 6,
          maxHeight: 220, overflowY: 'auto', zIndex: 2000,
          boxShadow: '0 4px 20px rgba(24,64,242,0.13)',
        }}>
          {filtered.map((o) => (
            <div
              key={o.code + o.name}
              style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f0f4ff' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o.name);
                if (onSelect) onSelect(o.name, o.code);
                setOpen(false);
              }}
            >
              <strong style={{ color: '#1a3fbf' }}>{o.name}</strong>
              {o.code && <span style={{ color: '#888', marginLeft: 8, fontSize: 11 }}>{o.code}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ImporterOption {
  id: string;
  importer_name: string;
  address1: string;
  address2: string;
  address3: string;
}

const ImporterSearch: React.FC<{
  value: string;
  onChange: (name: string) => void;
  onSelect: (name: string, addr1: string, addr2: string, addr3: string) => void;
}> = ({ value, onChange, onSelect }) => {
  const [options, setOptions] = useState<ImporterOption[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value || value.length < 2) { setOptions([]); setOpen(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/sea-importers', { params: { q: value } });
        const data: ImporterOption[] = res.data || [];
        setOptions(data);
        if (data.length > 0) setOpen(true);
      } catch {
        setOptions([]);
      }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <TextArea
        className="form-control"
        style={{ minHeight: 70 }}
        maxLength={35}
        value={value}
        onChange={(e) => { onChange(e.target.value.toUpperCase()); setOpen(true); }}
        onFocus={() => { if (options.length > 0) setOpen(true); }}
      />
      {open && options.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
          border: '1px solid #d4dbff', borderRadius: 6, maxHeight: 220, overflowY: 'auto',
          zIndex: 3000, boxShadow: '0 4px 20px rgba(24,64,242,0.13)',
        }}>
          {options.map((opt) => (
            <div
              key={opt.id}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f4ff' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(opt.importer_name, opt.address1 || '', opt.address2 || '', opt.address3 || '');
                setOpen(false);
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.importer_name}</div>
              {(opt.address1 || opt.address2 || opt.address3) && (
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                  {[opt.address1, opt.address2, opt.address3].filter(Boolean).join(' | ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Container number: 4 alpha + 7 numeric, auto-format as user types
const formatContainerNo = (raw: string): string => {
  const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let result = '';
  let alphaCount = 0;
  let numCount = 0;
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (alphaCount < 4) {
      if (/[A-Z]/.test(ch)) { result += ch; alphaCount++; }
    } else if (numCount < 7) {
      if (/[0-9]/.test(ch)) { result += ch; numCount++; }
    }
  }
  return result;
};

const isValidContainerNo = (val: string): boolean => /^[A-Z]{4}\d{7}$/.test(val);

const emptyContainer = (): SeaContainerRow => ({
  container_no: '',
  seal_no: '',
  package_count: '',
  weight: '',
  container_size: '',
  container_type: 'FCL',
  soc_flag: 'N-NO',
  agent_code: '',
});

const createHblRow = (index = 0): SeaHblForm => ({
  hbl_no: '',
  hbl_date: today(),
  package_count: '',
  package_type: 'PKG',
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
  containers: [emptyContainer()],
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

const parseContainersJson = (raw: any): any[] | null => {
  if (Array.isArray(raw)) return raw.length > 0 ? raw : null;
  if (typeof raw === 'string' && raw.trim()) {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) && parsed.length > 0 ? parsed : null; } catch { return null; }
  }
  return null;
};

const mapHblRecordToForm = (row: any, fallbackMbl?: any): SeaHblForm => ({
  hbl_no: row.hbl_no || '',
  hbl_date: row.hbl_date?.slice(0, 10) || today(),
  package_count: String(row.package_count ?? ''),
  package_type: row.package_type || 'PKG',
  gross_weight: formatWeight(row.gross_weight),
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
  containers: (() => {
    const parsed = parseContainersJson(row.containers_json);
    if (parsed) {
      return parsed.map((c: any) => ({
        container_no: c.container_no || '',
        seal_no: c.seal_no || '',
        package_count: String(c.package_count ?? ''),
        weight: formatWeight(c.weight),
        container_size: c.container_size || '',
        container_type: c.container_type || 'FCL',
        soc_flag: c.soc_flag || 'N-NO',
        agent_code: c.agent_code || '',
      }));
    }
    return [{
      container_no: row.container_no || '',
      seal_no: row.seal_no || '',
      package_count: '',
      weight: '',
      container_size: row.container_size || '',
      container_type: row.container_type || 'FCL',
      soc_flag: row.soc_flag || 'N-NO',
      agent_code: row.agent_code || '',
    }];
  })(),
  cargo_net_weight: String(row.cargo_net_weight ?? ''),
  volume_cbm: String(row.volume_cbm ?? ''),
  hs_code: row.hs_code || '',
  imo_code: row.imo_code || '',
  invoice_value_currency: row.invoice_value_currency || 'INR',
});

const SeaConsolePage: React.FC = () => {
  const { selectedLocation, user } = useAuth();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  const [selectedMblId, setSelectedMblId] = useState<string | null>(null);
  const [form, setForm] = useState<SeaMblForm>(createMblForm());
  const [hbls, setHbls] = useState<SeaHblForm[]>([createHblRow(0)]);
  const [activeHblTab, setActiveHblTab] = useState(0);
  const [saving, setSaving] = useState(false);

  const [carriers, setCarriers] = useState<SeaCarrierRecord[]>([]);
  const [mlos, setMlos] = useState<SeaMloRecord[]>([]);
  const [loadingPorts, setLoadingPorts] = useState<PortOption[]>([]);
  const [deliveryPorts, setDeliveryPorts] = useState<PortOption[]>([]);

  const toPortOptions = (rows: any[]): PortOption[] =>
    (rows || []).map((r) => ({ code: r.port_code || '', name: r.port_name || '' }));

  useEffect(() => {
    // Scope MLO/Carrier options to the user's current login location — records
    // tagged "All Locations" (location_codes null/empty) still show everywhere.
    const customsHouseCode = selectedLocation?.customs_house_code || user?.customs_house_code || '';
    const locationParams = customsHouseCode ? { customs_house_code: customsHouseCode } : {};
    api.get('/sea-carriers', { params: locationParams }).then((r) => setCarriers(r.data || [])).catch(() => {});
    api.get('/sea-mlos', { params: locationParams }).then((r) => setMlos(r.data || [])).catch(() => {});
    api.get('/sea-loading-ports').then((r) => setLoadingPorts(toPortOptions(r.data))).catch(() => {});
    api.get('/sea-delivery-ports').then((r) => setDeliveryPorts(toPortOptions(r.data))).catch(() => {});
  }, [selectedLocation?.customs_house_code, user?.customs_house_code]);

  // Persists a new port typed into the Loading/Delivery Port autocomplete to its master table
  const createLoadingPort = async (code: string) => {
    try {
      const res = await api.post('/sea-loading-ports', { port_code: code, port_name: '' });
      setLoadingPorts((prev) => [...prev.filter((p) => p.code !== code), { code: res.data.port_code, name: res.data.port_name || '' }]);
      toast.success(`Added loading port ${code}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add loading port');
    }
  };

  const createDeliveryPort = async (code: string) => {
    try {
      const res = await api.post('/sea-delivery-ports', { port_code: code, port_name: '' });
      setDeliveryPorts((prev) => [...prev.filter((p) => p.code !== code), { code: res.data.port_code, name: res.data.port_name || '' }]);
      toast.success(`Added delivery port ${code}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add delivery port');
    }
  };

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

  useEffect(() => { if (!selectedMblId) resetEditor(); }, [resetEditor, selectedMblId]);

  useEffect(() => {
    const editMblId = (routerLocation.state as any)?.editMblId;
    if (editMblId) {
      loadDetail(editMblId);
      window.history.replaceState({}, '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.state]);

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

  const updateContainer = (hblIndex: number, containerIndex: number, field: keyof SeaContainerRow, value: string) =>
    setHbls((c) => c.map((row, i) => {
      if (i !== hblIndex) return row;
      const containers = row.containers.map((ct, ci) => ci === containerIndex ? { ...ct, [field]: value } : ct);
      return { ...row, containers };
    }));

  const addContainer = (hblIndex: number) =>
    setHbls((c) => c.map((row, i) => {
      if (i !== hblIndex) return row;
      return { ...row, containers: [...row.containers, { ...emptyContainer(), agent_code: row.mlo_code || '' }] };
    }));

  const removeContainer = (hblIndex: number, containerIndex: number) =>
    setHbls((c) => c.map((row, i) => {
      if (i !== hblIndex) return row;
      if (row.containers.length <= 1) return row;
      return { ...row, containers: row.containers.filter((_, ci) => ci !== containerIndex) };
    }));

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
      // Validate container numbers
      for (let ci = 0; ci < hbls[i].containers.length; ci++) {
        const ct = hbls[i].containers[ci];
        if (ct.container_no && !isValidContainerNo(ct.container_no)) {
          toast.error(`HBL ${i + 1}, Container ${ci + 1}: Number must be 4 letters + 7 digits (e.g. ABCD1234567)`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        description: sanitizeFreeText(form.description),
        importer_name: sanitizeFreeText(form.importer_name),
        importer_address1: sanitizeFreeText(form.importer_address1),
        importer_address2: sanitizeFreeText(form.importer_address2),
        importer_address3: sanitizeFreeText(form.importer_address3),
        customs_house_code: form.customs_house_code || selectedLocation?.customs_house_code || user?.customs_house_code || '',
        profile_id: form.profile_id || user?.profile_id || '',
        hbls: hbls.map(hbl => ({
          ...hbl,
          importer_name: sanitizeFreeText(hbl.importer_name),
          importer_address1: sanitizeFreeText(hbl.importer_address1),
          importer_address2: sanitizeFreeText(hbl.importer_address2),
          importer_address3: sanitizeFreeText(hbl.importer_address3),
          cargo_description: sanitizeFreeText(hbl.cargo_description),
          containers: hbl.containers.map(ct => ({
            container_no: ct.container_no,
            seal_no: ct.seal_no,
            package_count: ct.package_count,
            weight: ct.weight,
            container_size: ct.container_size,
            container_type: ct.container_type,
            soc_flag: ct.soc_flag,
            agent_code: ct.agent_code,
          })),
        })),
      };
      const response = selectedMblId
        ? await api.put(`/sea-mbls/${selectedMblId}`, payload)
        : await api.post('/sea-mbls', payload);

      // Patch containers_json on each saved HBL via PUT /sea-hbls/:id, which saves
      // containers directly without going through prepareHblRows (preserves package_count/weight)
      const savedHbls: any[] = response.data?.hbls ?? [];
      const patchedHbls = savedHbls.map((savedHbl: any, i: number) => {
        const formHbl = hbls[i] ?? hbls.find(h => h.hbl_no === savedHbl.hbl_no);
        if (!formHbl || !savedHbl.id) return savedHbl;
        const containersPatch = formHbl.containers.map((ct: any) => ({
          container_no: ct.container_no,
          seal_no: ct.seal_no,
          package_count: ct.package_count,
          weight: ct.weight,
          container_size: ct.container_size,
          container_type: ct.container_type,
          soc_flag: ct.soc_flag,
          agent_code: ct.agent_code,
        }));
        api.put(`/sea-hbls/${savedHbl.id}`, {
          ...formHbl,
          importer_name: sanitizeFreeText(formHbl.importer_name),
          importer_address1: sanitizeFreeText(formHbl.importer_address1),
          importer_address2: sanitizeFreeText(formHbl.importer_address2),
          importer_address3: sanitizeFreeText(formHbl.importer_address3),
          cargo_description: sanitizeFreeText(formHbl.cargo_description),
          containers: containersPatch,
        }).catch(() => {});
        return { ...savedHbl, containers_json: containersPatch };
      });
      applyRecord({ ...response.data, hbls: patchedHbls });
      toast.success(selectedMblId ? 'MBL updated' : 'MBL created');
      // Auto-save unique importer name+address combinations to the importer master
      const seen = new Set<string>();
      for (const hbl of hbls) {
        const importerName = sanitizeFreeText(hbl.importer_name);
        if (importerName) {
          const key = `${hbl.importer_name}|${hbl.importer_address1}|${hbl.importer_address2}|${hbl.importer_address3}`;
          if (!seen.has(key)) {
            seen.add(key);
            api.post('/sea-importers', {
              importer_name: importerName,
              address1: sanitizeFreeText(hbl.importer_address1),
              address2: sanitizeFreeText(hbl.importer_address2),
              address3: sanitizeFreeText(hbl.importer_address3),
            }).catch(() => {});
          }
        }
      }
      // Same pattern as the Location page: after a successful save, return to the MBL register list
      navigate('/mbl-register');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const activeHbl = hbls[activeHblTab];

  return (
    <div className="page-container entry-form-page">

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ENTRY FORM â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="ef-form-wrap">

        {/* â”€â”€ MBL Details â”€â”€ */}
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
              <DateInput
                className="form-control"
                value={form.mbl_date}
                onChange={(e) => updateForm('mbl_date', e.target.value)}
              />
            </div>
            <div className="form-group ef-req">
              <label className="form-label">Loading Port</label>
              <PortSearch
                value={form.port_of_loading}
                onChange={(v) => updateForm('port_of_loading', v)}
                options={loadingPorts}
                onCreate={createLoadingPort}
                placeholder="Type to search loading port..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Date</label>
              <DateInput
                className="form-control"
                value={form.vessel_date}
                onChange={(e) => updateForm('vessel_date', e.target.value)}
              />
            </div>
          </div>

          {/* IGM / Vessel fields â€” can be filled later, not required on first save */}
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">IGM No. <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.igm_no}
                onChange={(e) => updateForm('igm_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IGM Date <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <DateInput
                className="form-control"
                value={form.igm_date}
                onChange={(e) => updateForm('igm_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Code <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.vessel_code}
                onChange={(e) => updateForm('vessel_code', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IMO Code <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.imo_code}
                onChange={(e) => updateForm('imo_code', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">Voyage No. <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.vessel_voyage_no}
                onChange={(e) => updateForm('vessel_voyage_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Line No. <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.line_no}
                onChange={(e) => updateForm('line_no', e.target.value.toUpperCase())}
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
                onChange={(e) => updateForm('shipping_line', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group ef-req">
              <label className="form-label">Remarks</label>
              <TextInput
                className="form-control"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>

        <div className="ef-divider" />

        {/* â”€â”€ HBL Details â”€â”€ */}
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

              {/* Row 1: Cargo Move, Port of Delivery, Dest CFS, Subline */}
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
                  <PortSearch
                    value={activeHbl.port_of_delivery}
                    onChange={(v) => updateHbl(activeHblTab, 'port_of_delivery', v)}
                    options={deliveryPorts}
                    onCreate={createDeliveryPort}
                    placeholder="Type to search delivery port..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dest(CFS)</label>
                  <input
                    className="form-control"
                    value={activeHbl.dest_cfs}
                    onChange={(e) => updateHbl(activeHblTab, 'dest_cfs', e.target.value.toUpperCase())}
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

              {/* Row 2: HBL No, HBL Date, Package, Package Code */}
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
                  <DateInput
                    className="form-control"
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
                    {PACKAGE_CODE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Weight, Weight Unit, Cargo Nature, Item Type */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">Gross Weight (KGS)</label>
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

              {/* Row 4: Importer Name + Addresses (35-char limit each) */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">
                    Importer Name
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.importer_name || '').length}/35)
                    </span>
                  </label>
                  <ImporterSearch
                    value={activeHbl.importer_name}
                    onChange={(name) => updateHbl(activeHblTab, 'importer_name', name)}
                    onSelect={(name, addr1, addr2, addr3) => {
                      updateHbl(activeHblTab, 'importer_name', name);
                      updateHbl(activeHblTab, 'importer_address1', addr1);
                      updateHbl(activeHblTab, 'importer_address2', addr2);
                      updateHbl(activeHblTab, 'importer_address3', addr3);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Address 1
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.importer_address1 || '').length}/35)
                    </span>
                  </label>
                  <TextArea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    maxLength={35}
                    value={activeHbl.importer_address1}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address1', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Address 2
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.importer_address2 || '').length}/35)
                    </span>
                  </label>
                  <TextArea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    maxLength={35}
                    value={activeHbl.importer_address2}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address2', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Address 3
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.importer_address3 || '').length}/35)
                    </span>
                  </label>
                  <TextArea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    maxLength={35}
                    value={activeHbl.importer_address3}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address3', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {/* Row 5: Description (150-char limit), Mark & No, Carrier, Carrier Code */}
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">
                    Description
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.cargo_description || '').length}/150)
                    </span>
                  </label>
                  <TextArea
                    className="form-control"
                    style={{ minHeight: 60 }}
                    maxLength={150}
                    value={activeHbl.cargo_description}
                    onChange={(e) => updateHbl(activeHblTab, 'cargo_description', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mark &amp; No.</label>
                  <input
                    className="form-control"
                    value={activeHbl.marks_numbers}
                    onChange={(e) => updateHbl(activeHblTab, 'marks_numbers', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Carrier Name</label>
                  <NameSearch
                    value={activeHbl.carrier_name}
                    options={carriers.map((c) => ({ name: c.carrier_name || '', code: c.carrier_code || '' }))}
                    placeholder="Type to search carrier..."
                    onChange={(name) => updateHbl(activeHblTab, 'carrier_name', name)}
                    onSelect={(name, code) => {
                      const carrier = carriers.find((c) => c.carrier_name === name);
                      updateHbl(activeHblTab, 'carrier_name', name);
                      updateHbl(activeHblTab, 'carrier_code', code);
                      if (carrier?.bond_number) updateHbl(activeHblTab, 'bond_no', carrier.bond_number);
                      if (carrier?.transport) updateHbl(activeHblTab, 'transport', carrier.transport);
                      if (carrier?.dest) updateHbl(activeHblTab, 'dest_cfs', carrier.dest);
                    }}
                  />
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

              {/* Row 6: Bond, Transport, MLO Name, MLO Code */}
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">Bond No.</label>
                  <input
                    className="form-control"
                    value={activeHbl.bond_no}
                    onChange={(e) => updateHbl(activeHblTab, 'bond_no', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Transport</label>
                  <input
                    className="form-control"
                    value={activeHbl.transport}
                    onChange={(e) => updateHbl(activeHblTab, 'transport', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">MLO Name</label>
                  <NameSearch
                    value={activeHbl.mlo_name}
                    options={mlos.map((m) => ({ name: m.mlo_name || '', code: m.mlo_code || '' }))}
                    placeholder="Type to search MLO..."
                    onChange={(name) => updateHbl(activeHblTab, 'mlo_name', name)}
                    onSelect={(name, code) => {
                      updateHbl(activeHblTab, 'mlo_name', name);
                      updateHbl(activeHblTab, 'mlo_code', code);
                      if (code) {
                        setHbls((prev) =>
                          prev.map((h, i) =>
                            i !== activeHblTab
                              ? h
                              : {
                                  ...h,
                                  containers: h.containers.map((c) => ({
                                    ...c,
                                    agent_code: code,
                                  })),
                                }
                          )
                        );
                      }
                    }}
                  />
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

              {/* â”€â”€ Container Details â”€â”€ */}
              <div className="ef-divider" style={{ margin: '18px 0 14px' }} />
              <div className="ef-section-header" style={{ marginBottom: 10 }}>
                <div className="ef-section-title" style={{ fontSize: 15 }}>
                  Container Details{' '}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>
                    ({activeHbl.containers.length} container{activeHbl.containers.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addContainer(activeHblTab)}>
                  + Add Container
                </button>
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
                    {activeHbl.containers.map((ct, ci) => (
                      <tr key={ci}>
                        <td style={{ textAlign: 'center', color: '#888', fontSize: 12 }}>{ci + 1}</td>
                        <td>
                          <input
                            className="form-control ef-table-input font-mono"
                            value={ct.container_no}
                            maxLength={11}
                            placeholder="AAAA1234567"
                            style={{ borderColor: ct.container_no && !isValidContainerNo(ct.container_no) ? '#dc2626' : '' }}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'container_no', formatContainerNo(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            value={ct.seal_no}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'seal_no', e.target.value.toUpperCase())}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ct.package_count}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'package_count', e.target.value)}
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
                            onChange={(e) => updateContainer(activeHblTab, ci, 'weight', e.target.value)}
                            onBlur={(e) => updateContainer(activeHblTab, ci, 'weight', roundContainerWeight(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            value={ct.container_size}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'container_size', e.target.value.toUpperCase())}
                          />
                        </td>
                        <td>
                          <select
                            className="form-control ef-table-input"
                            value={ct.container_type}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'container_type', e.target.value)}
                          >
                            {CONTAINER_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-control ef-table-input"
                            value={ct.soc_flag}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'soc_flag', e.target.value)}
                          >
                            {SOC_FLAG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            value={ct.agent_code}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'agent_code', e.target.value.toUpperCase())}
                          />
                        </td>
                        <td>
                          <button
                            className="btn-link danger"
                            onClick={() => removeContainer(activeHblTab, ci)}
                            title="Remove container"
                            disabled={activeHbl.containers.length <= 1}
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
          )}
        </div>

        {/* â”€â”€ Form Actions â”€â”€ */}
        <div className="ef-form-actions">
          <button className="btn btn-warning" onClick={resetEditor}>Reset</button>
          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Savingâ€¦' : 'Save MBL + HBL + Container'}
          </button>
        </div>
      </div>

      <div className="sea-footer">EDI Software Solutions @ 2022 â€“ 2026 All rights reserved</div>
    </div>
  );
};

export default SeaConsolePage;
