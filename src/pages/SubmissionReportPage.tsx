import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { fmtDateTime } from '../utils/dateUtils';
import api from '../utils/api';
import Pagination from '../components/Pagination';

const PAGE_SIZE_OPTIONS = [50, 100, 250, 500];

interface TransmissionRow {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  username?: string | null;
  mbl_no?: string | null;
}

const SubmissionReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<TransmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sea-transmissions', { params: { page, pageSize } });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load submission report');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

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

  return (
    <div className="page-container">
      <div className="sea-hero" style={{ marginBottom: 20 }}>
        <div>
          <div className="sea-eyebrow">Reports</div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Submission Report</h1>
          <p className="page-subtitle">MBL files that have been generated and downloaded</p>
        </div>
        <div className="sea-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/mbl-register')}>Back to MBL Register</button>
          <button className="btn btn-secondary" onClick={fetchRows}>Refresh</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header sea-register-header">
          <span className="card-title">
            Submitted Files
            <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 400, color: '#888' }}>
              {total} record{total !== 1 ? 's' : ''}
            </span>
          </span>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner" /> Loading…</div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No submissions yet</div>
              <p>Files downloaded from MBL Register will appear here.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>MBL Number</th>
                  <th>File Name</th>
                  <th>Sent By</th>
                  <th>Sent At</th>
                  <th>Status</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono" style={{ fontWeight: 700 }}>{row.mbl_no || '—'}</td>
                    <td className="font-mono text-sm">{row.file_name}</td>
                    <td>{(row.username || '—').toUpperCase()}</td>
                    <td className="text-muted text-sm">{fmtDateTime(row.created_at)}</td>
                    <td><span className="badge badge-success">{row.status || 'generated'}</span></td>
                    <td>
                      <button className="btn-link" onClick={() => handleDownload(row)}>
                        ↓ {row.file_name}
                      </button>
                    </td>
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
