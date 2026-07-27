import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { SeaMblRecord } from '../types/sea';
import { fmtDate } from '../utils/dateUtils';
import { formatWeight, roundContainerWeight } from '../utils/numberUtils';
import api from '../utils/api';

const parseContainers = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const SeaHblListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mbl, setMbl] = useState<SeaMblRecord | null>(null);
  const [hbls, setHbls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [containersFor, setContainersFor] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHbls = () => {
    if (!id) return;
    setLoading(true);
    api.get(`/sea-mbls/${id}`)
      .then((res) => {
        setMbl(res.data);
        setHbls(res.data.hbls || []);
      })
      .catch(() => toast.error('Failed to load HBL list'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHbls();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteHbl = async (hbl: any) => {
    if (!window.confirm(`Delete HBL "${hbl.hbl_no}"? Remaining subline numbers will shift up to close the gap. This cannot be undone.`)) return;
    setDeletingId(hbl.id);
    try {
      await api.delete(`/sea-hbls/${hbl.id}`);
      toast.success(`Deleted HBL ${hbl.hbl_no}`);
      loadHbls();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete HBL');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPackages = hbls.reduce((s, h) => s + (Number(h.package_count) || 0), 0);
  const totalWeight = hbls.reduce((s, h) => s + (Number(h.gross_weight) || 0), 0);

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>HBL List</h1>
          <p className="page-subtitle">
            MBL No. <span className="font-mono" style={{ fontWeight: 700 }}>{mbl?.mbl_no || '—'}</span>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/mbl-register')}>
          Back MBL List
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner" /> Loading…</div>
          ) : hbls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No HBL records found</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mbl No</th>
                  <th>Subline No</th>
                  <th>Hbl No</th>
                  <th>Hbl Date</th>
                  <th>Packages</th>
                  <th>PkgCode</th>
                  <th>Weight</th>
                  <th>Cargo Movement</th>
                  <th>Delivery Port</th>
                  <th>Carrier Name</th>
                  <th>Edit</th>
                  <th>Container List</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {hbls.map((h, idx) => (
                  <tr key={h.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                    <td className="font-mono">{mbl?.mbl_no}</td>
                    <td>{h.subline_no || idx + 1}</td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>{h.hbl_no}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(h.hbl_date)}</td>
                    <td>{h.package_count ?? 0}</td>
                    <td>{h.package_type || '—'}</td>
                    <td>{formatWeight(h.gross_weight) || 0}</td>
                    <td>{h.cargo_move || '—'}</td>
                    <td>{h.port_of_delivery || '—'}</td>
                    <td>{h.carrier_name || '—'}</td>
                    <td>
                      <button className="btn-link" onClick={() => navigate(`/hbl/${h.id}`)}>
                        Edit
                      </button>
                    </td>
                    <td>
                      <button className="btn-link" onClick={() => setContainersFor(h)}>
                        Container List
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#b91c1c', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
                        disabled={deletingId === h.id}
                        onClick={() => handleDeleteHbl(h)}
                      >
                        {deletingId === h.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} style={{ fontWeight: 700, textAlign: 'right' }}>Total</td>
                  <td style={{ fontWeight: 700 }}>{totalPackages}</td>
                  <td />
                  <td style={{ fontWeight: 700 }}>{formatWeight(totalWeight)}</td>
                  <td colSpan={6} />
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-16">
        <button className="btn btn-secondary" onClick={() => navigate('/mbl-register')}>
          Back MBL List
        </button>
      </div>

      {containersFor && (
        <div className="modal-overlay" onClick={() => setContainersFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <span className="modal-title">
                Containers — <span className="font-mono">{containersFor.hbl_no}</span>
              </span>
              <button className="modal-close" onClick={() => setContainersFor(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Container No.</th>
                      <th>Seal No.</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Packages</th>
                      <th>Weight (Tons)</th>
                      <th>Agent Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const containers = parseContainers(containersFor.containers_json);
                      if (containers.length === 0) {
                        return (
                          <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 16 }}>No containers found.</td></tr>
                        );
                      }
                      return containers.map((c: any, ci: number) => (
                        <tr key={ci}>
                          <td>{ci + 1}</td>
                          <td className="font-mono">{c.container_no || '—'}</td>
                          <td>{c.seal_no || '—'}</td>
                          <td>{c.container_size || '—'}</td>
                          <td>{c.container_type || '—'}</td>
                          <td>{c.package_count || 0}</td>
                          <td>{c.weight ? roundContainerWeight(c.weight) : 0}</td>
                          <td>{c.agent_code || '—'}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setContainersFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="sea-footer">EDI Software Solutions @ 2022 – 2026 All rights reserved</div>
    </div>
  );
};

export default SeaHblListPage;
