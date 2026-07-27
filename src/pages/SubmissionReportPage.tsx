import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fmtDate, fmtDateTime } from '../utils/dateUtils';
import api from '../utils/api';
import Pagination from '../components/Pagination';
import DateInput from '../components/DateInput';

const PAGE_SIZE_OPTIONS = [50, 100, 250, 500];
const today = () => new Date().toISOString().slice(0, 10);

interface HblEntry {
  hbl_no: string;
  port_of_delivery: string | null;
}

interface TransmissionRow {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  username?: string | null;
  mbl_no?: string | null;
  vessel_date?: string | null;
  port_of_discharge?: string | null;
  hbl_count?: number;
  hbls?: HblEntry[];
}

interface UserOption {
  id: string;
  username: string;
}

const STATUS_COLORS: Record<string, string> = {
  generated: '#f59e0b',
  acknowledged: '#22c55e',
  error: '#ef4444',
  placeholder: '#94a3b8',
};

const StatusDot: React.FC<{ status: string }> = ({ status }) => (
  <span
    title={status}
    style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: STATUS_COLORS[status] || '#94a3b8',
    }}
  />
);

const SubmissionReportPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['master_admin', 'admin']);
  const navigate = useNavigate();

  const [rows, setRows] = useState<TransmissionRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ user_id: '', from_date: today(), to_date: today() });

  const f = (k: string, v: string) => setFilters((p) => ({ ...p, [k]: v }));

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/sea-transmissions/users');
      setUsers(res.data || []);
    } catch {
      // ignore
    }
  }, [isAdmin]);

  const buildParams = (extra: Record<string, any> = {}) => {
    const p: any = { ...extra };
    if (isAdmin && filters.user_id) p.user_id = filters.user_id;
    if (filters.from_date) p.from_date = filters.from_date;
    if (filters.to_date) p.to_date = filters.to_date;
    return p;
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sea-transmissions', { params: buildParams({ page, pageSize }) });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load submission report');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleSearch = () => setPage(1);
  const handleClear = () => { setFilters({ user_id: '', from_date: today(), to_date: today() }); setPage(1); };

  const totalHbls = rows.reduce((s, r) => s + Number(r.hbl_count || 0), 0);

  const handleDownload = async (row: TransmissionRow) => {
    try {
      const res = await api.get(`/sea-transmissions/download/${row.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = row.file_name;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/sea-transmissions', { params: buildParams({ export: 'true' }) });
      const allRows: TransmissionRow[] = res.data;
      const header = ['MBL No', 'HBL No', 'Vessel Date', 'Port Of Discharge', 'Port of Delivery', 'User', 'Transmission Date', 'Status'].join(',');
      const csvRows: string[] = [];
      allRows.forEach((r) => {
        const hbls = r.hbls && r.hbls.length > 0 ? r.hbls : [{ hbl_no: '', port_of_delivery: '' }];
        hbls.forEach((h, i) => {
          csvRows.push([
            i === 0 ? (r.mbl_no || '') : '',
            h.hbl_no || '',
            i === 0 && r.vessel_date ? fmtDate(r.vessel_date) : '',
            r.port_of_discharge || '',
            h.port_of_delivery || '',
            i === 0 ? (r.username || '') : '',
            i === 0 ? fmtDateTime(r.created_at) : '',
            i === 0 ? r.status : '',
          ].join(','));
        });
      });
      const blob = new Blob([header + '\n' + csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission-report-${today()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const area = document.getElementById('submission-report-print');
    if (!area) return;
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;
    win.document.write(`<html><head><title>Account Statement</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px;margin:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:4px 6px;font-size:10px}
      th{background:#e2e8f0;font-weight:700}
      @media print{body{margin:0}}</style></head>
      <body><h3>Account Statement (${filters.from_date} to ${filters.to_date})</h3>${area.innerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  return (
    <div className="page-container">
      <div className="sea-hero" style={{ marginBottom: 20 }}>
        <div>
          <div className="sea-eyebrow">Reports</div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Account Statement</h1>
          <p className="page-subtitle">MBL/HBL files that have been generated and transmitted</p>
        </div>
        <div className="sea-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/mbl-register')}>Back to MBL Register</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {isAdmin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">User</label>
                <select className="form-control" style={{ minWidth: 150 }} value={filters.user_id} onChange={(e) => f('user_id', e.target.value)}>
                  <option value="">All Users</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>)}
                </select>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date</label>
              <DateInput className="form-control" value={filters.from_date} onChange={(e) => f('from_date', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <DateInput className="form-control" value={filters.to_date} onChange={(e) => f('to_date', e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
            <button className="btn btn-secondary" onClick={handleClear}>Clear</button>
            {rows.length > 0 && (
              <>
                <button className="btn btn-secondary" onClick={handlePrint}>Print</button>
                <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
                  {exporting ? 'Exporting...' : '↓ CSV'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header sea-register-header">
          <span className="card-title">
            Account Statement
            <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 400, color: '#888' }}>
              {total} MBL{total !== 1 ? 's' : ''} &nbsp;|&nbsp; Total HBLs: {totalHbls}
            </span>
          </span>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner" /> Loading…</div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No submissions yet</div>
              <p>Files generated from MBL Register will appear here.</p>
            </div>
          ) : (
            <div id="submission-report-print">
              <table>
                <thead>
                  <tr>
                    <th>MBL No/HBL No</th>
                    <th>Vessel Date</th>
                    <th>Port Of Discharge</th>
                    <th>Port of Delivery</th>
                    <th>User</th>
                    <th>Transmission Date</th>
                    <th>Status</th>
                    <th>No of HBL</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const hbls = row.hbls && row.hbls.length > 0 ? row.hbls : [];
                    return (
                      <React.Fragment key={row.id}>
                        <tr>
                          <td className="font-mono" style={{ fontWeight: 700 }}>
                            <button className="btn-link" style={{ fontWeight: 700 }} onClick={() => handleDownload(row)}>
                              {row.mbl_no || '—'}
                            </button>
                          </td>
                          <td>{row.vessel_date ? fmtDate(row.vessel_date) : '—'}</td>
                          <td className="font-mono text-sm">{row.port_of_discharge || '—'}</td>
                          <td className="font-mono text-sm">{hbls[0]?.port_of_delivery || '—'}</td>
                          <td>{(row.username || '—').toUpperCase()}</td>
                          <td className="text-muted text-sm">{fmtDateTime(row.created_at)}</td>
                          <td><StatusDot status={row.status} /></td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.hbl_count || 0}</td>
                        </tr>
                        {hbls.map((h, i) => (
                          <tr key={`${row.id}-${i}`} style={{ background: '#f8fafc' }}>
                            <td className="font-mono text-sm" style={{ paddingLeft: 20, color: 'var(--text-muted)' }}>{h.hbl_no}</td>
                            <td></td>
                            <td className="font-mono text-sm">{row.port_of_discharge || '—'}</td>
                            <td className="font-mono text-sm">{h.port_of_delivery || '—'}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  <tr style={{ fontWeight: 700, background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={7}><strong>Total MBLs: {total}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong>{totalHbls}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={(ps) => { setPageSize(ps); setPage(1); }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>

      <div className="sea-footer">EDI Software Solutions @ 2022 – 2026 All rights reserved</div>
    </div>
  );
};

export default SubmissionReportPage;
