import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fmtDate } from '../utils/dateUtils';
import api from '../utils/api';
import Pagination from '../components/Pagination';

const PAGE_SIZE_OPTIONS = [50, 100, 250, 500];

interface PendingRow {
  id: string;
  mbl_no: string;
  vessel_date: string | null;
  gateway_port: string | null;
  delivery_port: string | null;
  vessel_name: string | null;
  remarks: string | null;
  created_by: string | null;
  created_by_id: string | null;
  created_at: string;
}

interface UserOption {
  id: string;
  username: string;
}

const PendingStatementPage: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<PendingRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [mblSearch, setMblSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const isAdmin = hasRole(['master_admin', 'admin']);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/sea-pending/users');
      setUsers(res.data || []);
    } catch {
      // ignore
    }
  }, [isAdmin]);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (selectedUser) params.user_id = selectedUser;
      if (mblSearch.trim()) params.search = mblSearch.trim();
      const res = await api.get('/sea-pending', { params });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load pending statements');
    } finally {
      setLoading(false);
    }
  }, [selectedUser, mblSearch, page, pageSize]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleSearch = () => { setPage(1); };

  return (
    <div className="page-container">
      <div className="sea-hero" style={{ marginBottom: 20 }}>
        <div>
          <div className="sea-eyebrow">Reports</div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Pending Statement By User</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Draft MBLs awaiting transmission — all users' : 'Your draft MBLs awaiting transmission'}
          </p>
        </div>
        <div className="sea-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/mbl-register')}>Back to MBL Register</button>
          <button className="btn btn-secondary" onClick={fetchPending}>Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', padding: '14px 20px' }}>
          {isAdmin && (
            <div className="form-group" style={{ minWidth: 200, margin: 0 }}>
              <label className="form-label">User</label>
              <select
                className="form-control"
                value={selectedUser}
                onChange={(e) => { setSelectedUser(e.target.value); setPage(1); }}
              >
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{(u.username || '—').toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group" style={{ minWidth: 220, margin: 0 }}>
            <label className="form-label">MBL No.</label>
            <input
              className="form-control"
              value={mblSearch}
              onChange={(e) => setMblSearch(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search MBL..."
            />
          </div>
          <div style={{ paddingBottom: 2 }}>
            <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="card">
        <div className="card-header sea-register-header">
          <span className="card-title">
            Pending Records
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
              <div className="empty-state-title">No pending records found</div>
              <p>All MBLs have been transmitted, or no records match the filter.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>MBL Number</th>
                  <th>Vessel Date</th>
                  <th>Gateway Port</th>
                  <th>Delivery Port</th>
                  <th>Created By</th>
                  <th>Vessel Name</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono" style={{ fontWeight: 700 }}>{row.mbl_no}</td>
                    <td>{row.vessel_date ? fmtDate(row.vessel_date) : '—'}</td>
                    <td>{row.gateway_port || '—'}</td>
                    <td>{row.delivery_port || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{(row.created_by || '—').toUpperCase()}</td>
                    <td>{row.vessel_name || '—'}</td>
                    <td>{row.remarks || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 4 }}
                        onClick={() => navigate(`/checklist/${row.id}`)}
                      >
                        Checklist
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/mbl', { state: { editMblId: row.id } })}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700, background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={8}><strong>Total Pending MBLs: {total}</strong></td>
                </tr>
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

export default PendingStatementPage;
