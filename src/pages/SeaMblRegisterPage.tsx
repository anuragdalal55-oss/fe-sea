import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { SeaMblRecord } from '../types/sea';
import { fmtDate } from '../utils/dateUtils';
import api from '../utils/api';

const SeaMblRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLocation } = useAuth();

  const [mbls, setMbls] = useState<SeaMblRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedMblId, setExpandedMblId] = useState<string | null>(null);
  const [hblCache, setHblCache] = useState<Record<string, any[]>>({});
  const [viewMbl, setViewMbl] = useState<SeaMblRecord | null>(null);

  const fetchMbls = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const response = await api.get('/sea-mbls', {
        params: {
          page: p,
          pageSize,
          ...(s ? { search: s } : {}),
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
  }, [pageSize, selectedLocation?.customs_house_code]);

  useEffect(() => {
    fetchMbls(1, search);
    setPage(1);
  }, [selectedLocation?.customs_house_code]);

  const doSearch = () => {
    setSearch(searchInput);
    setPage(1);
    fetchMbls(1, searchInput);
  };

  const handleDownload = async (record: SeaMblRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingId(record.id);
    try {
      const resp = await api.post(`/sea-transmissions/generate/${record.id}`, {});
      const blob = new Blob([resp.data.fileContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resp.data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded: ${resp.data.fileName}`);
      setMbls(prev => prev.map(m => m.id === record.id ? { ...m, tx_count: ((m as any).tx_count || 0) + 1 } : m));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGeneratingId(null);
    }
  };

  const toggleHblList = async (record: SeaMblRecord) => {
    if (expandedMblId === record.id) { setExpandedMblId(null); return; }
    setExpandedMblId(record.id);
    if (!hblCache[record.id]) {
      try {
        const resp = await api.get(`/sea-mbls/${record.id}`);
        setHblCache(prev => ({ ...prev, [record.id]: resp.data.hbls || [] }));
      } catch {
        toast.error('Failed to load HBL list');
      }
    }
  };

  const statusBadge = (record: any) => {
    const txCount = record.tx_count || 0;
    if (txCount > 0) {
      return (
        <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 700, border: '1px solid #99f6e4' }}>
          Downloaded
        </span>
      );
    }
    return <span className="badge badge-gray">Draft</span>;
  };

  return (
    <div className="page-container">

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
          MBL Register
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Find by MBL No.:
          </label>
          <input
            className="form-control"
            style={{ width: 210 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
            placeholder="MBL number…"
          />
          <button className="btn btn-secondary btn-sm" onClick={doSearch}>Search</button>
          <button className="btn btn-primary" onClick={() => navigate('/mbl')}>
            + Create MBL + HBL + Container
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner" /> Loading…</div>
          ) : mbls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No MBL records found</div>
              <p>Click "Create MBL + HBL + Container" to get started.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>MBL Number</th>
                  <th>MBL Date</th>
                  <th>Vessel</th>
                  <th>IGM / Voyage</th>
                  <th>Status</th>
                  <th>File</th>
                  <th>Edit</th>
                  <th>HBL</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {mbls.flatMap((record, idx) => {
                  const rows: React.ReactNode[] = [
                    <tr key={record.id} style={{ background: expandedMblId === record.id ? '#f0f5ff' : undefined }}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(page - 1) * pageSize + idx + 1}</td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>
                          {record.mbl_no}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(record.mbl_date || record.created_at)}</td>
                      <td style={{ minWidth: 150 }}>
                        <div style={{ fontWeight: 600 }}>{record.vessel_name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {[record.vessel_date ? fmtDate(record.vessel_date) : null, record.imo_code ? `IMO ${record.imo_code}` : null].filter(Boolean).join(' | ')}
                        </div>
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ fontWeight: 600 }}>{record.igm_no || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {[record.igm_date ? fmtDate(record.igm_date) : null, record.vessel_voyage_no ? `V ${record.vessel_voyage_no}` : null].filter(Boolean).join(' | ')}
                        </div>
                      </td>
                      <td>{statusBadge(record)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={generatingId === record.id}
                            onClick={(e) => handleDownload(record, e)}
                          >
                            {generatingId === record.id ? 'Generating…' : 'Download'}
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#1e3a8a', color: '#fff', border: 'none' }}
                            disabled={generatingId === record.id}
                            onClick={(e) => handleDownload(record, e)}
                          >
                            Sign &amp; Download
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <button
                            className="btn-link"
                            style={{ color: 'var(--primary)', fontWeight: 700 }}
                            onClick={() => navigate('/mbl', { state: { editMblId: record.id } })}
                          >
                            EDIT
                          </button>
                          <button
                            className="btn-link"
                            style={{ color: '#475569' }}
                            onClick={() => navigate('/mbl', { state: { editMblId: record.id } })}
                          >
                            Full Edit
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-link"
                          style={{ color: 'var(--primary)', fontWeight: 600 }}
                          onClick={() => toggleHblList(record)}
                        >
                          HBL List{record.hbl_count ? ` (${record.hbl_count})` : ''}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn-link"
                          style={{ color: 'var(--accent)', fontWeight: 600 }}
                          onClick={() => setViewMbl(record)}
                        >
                          View
                        </button>
                      </td>
                    </tr>,
                  ];

                  // Expanded HBL list row
                  if (expandedMblId === record.id) {
                    rows.push(
                      <tr key={`${record.id}-hbls`}>
                        <td colSpan={10} style={{ padding: '0 0 0 32px', background: '#f5f8ff', borderTop: '1px dashed #c5d0ee' }}>
                          <div style={{ padding: '14px 16px 14px 0' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--primary)' }}>
                              HBL List for {record.mbl_no}
                            </div>
                            {!hblCache[record.id] ? (
                              <div><span className="spinner" /> Loading…</div>
                            ) : hblCache[record.id].length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No HBLs found.</p>
                            ) : (
                              <table style={{ fontSize: 12 }}>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>HBL No.</th>
                                    <th>HBL Date</th>
                                    <th>Importer</th>
                                    <th>Cargo</th>
                                    <th>Pkgs</th>
                                    <th>Gross Wt</th>
                                    <th>Container No.</th>
                                    <th>Size/Type</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {hblCache[record.id].map((hbl: any, hi: number) => {
                                    const containers: any[] = Array.isArray(hbl.containers_json) && hbl.containers_json.length > 0
                                      ? hbl.containers_json
                                      : (hbl.container_no ? [{ container_no: hbl.container_no, container_size: hbl.container_size, container_type: hbl.container_type }] : []);
                                    return (
                                      <tr key={hbl.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>{hi + 1}</td>
                                        <td className="font-mono" style={{ fontWeight: 700 }}>{hbl.hbl_no}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(hbl.hbl_date)}</td>
                                        <td>{hbl.importer_name || '—'}</td>
                                        <td>{hbl.cargo_description || '—'}</td>
                                        <td>{hbl.package_count} {hbl.package_type || ''}</td>
                                        <td>{Number(hbl.gross_weight || 0).toFixed(3)} KG</td>
                                        <td>
                                          {containers.length === 0 ? '—' : containers.map((c, ci) => (
                                            <div key={ci} className="font-mono" style={{ fontSize: 11 }}>{c.container_no || '—'}</div>
                                          ))}
                                        </td>
                                        <td>
                                          {containers.length === 0 ? '—' : containers.map((c, ci) => (
                                            <div key={ci} style={{ fontSize: 11 }}>{[c.container_size, c.container_type].filter(Boolean).join(' / ') || '—'}</div>
                                          ))}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return rows;
                })}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPage={(p) => { setPage(p); fetchMbls(p, search); }}
        />
      </div>

      {/* ── View Modal ── */}
      {viewMbl && (
        <div className="modal-overlay" onClick={() => setViewMbl(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflow: 'auto' }}>
            <div className="modal-header">
              <span className="modal-title">MBL Details — <span className="font-mono">{viewMbl.mbl_no}</span></span>
              <button className="modal-close" onClick={() => setViewMbl(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 24px' }}>
                {[
                  ['MBL No.', viewMbl.mbl_no],
                  ['MBL Date', fmtDate(viewMbl.mbl_date)],
                  ['Status', viewMbl.status],
                  ['IGM No.', viewMbl.igm_no],
                  ['IGM Date', fmtDate(viewMbl.igm_date)],
                  ['Customs House Code', viewMbl.customs_house_code],
                  ['Vessel Name', viewMbl.vessel_name],
                  ['Vessel Code', viewMbl.vessel_code],
                  ['Vessel Date', fmtDate(viewMbl.vessel_date)],
                  ['Voyage No.', viewMbl.vessel_voyage_no],
                  ['IMO Code', viewMbl.imo_code],
                  ['Shipping Line', viewMbl.shipping_line],
                  ['Port of Loading', viewMbl.port_of_loading],
                  ['Port of Unloading', viewMbl.port_of_unloading],
                  ['Line No.', viewMbl.line_no],
                  ['Total Packages', String(viewMbl.total_packages ?? '—')],
                  ['Total Gross Wt (KG)', String(viewMbl.total_gross_weight ?? '—')],
                  ['Total Volume (CBM)', String(viewMbl.total_volume_cbm ?? '—')],
                  ['HBL Count', String(viewMbl.hbl_count ?? 0)],
                  ['Profile', viewMbl.profile_code],
                  ['Company', viewMbl.company_name],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ borderBottom: '1px solid #eef1f8', paddingBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                      {label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setViewMbl(null); navigate('/mbl', { state: { editMblId: viewMbl.id } }); }}
              >
                Full Edit
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewMbl(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeaMblRegisterPage;
