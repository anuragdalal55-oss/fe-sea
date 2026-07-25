import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { SeaMblRecord } from '../types/sea';
import { fmtDate } from '../utils/dateUtils';
import { roundContainerWeight } from '../utils/numberUtils';
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
  const [viewMbl, setViewMbl] = useState<SeaMblRecord | null>(null);
  const [form3Record, setForm3Record] = useState<SeaMblRecord | null>(null);
  const [form3Hbls, setForm3Hbls] = useState<any[]>([]);
  const [form3Loading, setForm3Loading] = useState(false);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openForm3 = async (record: SeaMblRecord) => {
    setForm3Record(record);
    setForm3Loading(true);
    setForm3Hbls([]);
    try {
      const resp = await api.get(`/sea-mbls/${record.id}`);
      setForm3Hbls(resp.data.hbls || []);
    } catch {
      toast.error('Failed to load Form 3 data');
    } finally {
      setForm3Loading(false);
    }
  };

  const statusBadge = (record: any) => {
    if (record.status === 'draft') {
      return <span className="badge badge-gray">Draft</span>;
    }
    return (
      <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 700, border: '1px solid #99f6e4' }}>
        Downloaded
      </span>
    );
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
                  <th>Checklist / Form 3</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {mbls.flatMap((record, idx) => {
                  const rows: React.ReactNode[] = [
                    <tr key={record.id}>
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
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => { e.stopPropagation(); navigate('/mbl', { state: { editMblId: record.id } }); }}
                          >
                            Edit
                          </button>
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
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#334155', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => navigate(`/checklist/${record.id}`)}
                          >
                            Checklist
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#0f766e', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => openForm3(record)}
                          >
                            Form 3
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#6d28d9', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => navigate(`/mbl-register/hbl-list/${record.id}`)}
                          >
                            HBL List
                          </button>
                        </div>
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

      {/* ── Form 3 Overlay ── */}
      {form3Record && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 9999, overflowY: 'auto' }}>
          <style>{`@media print { .f3-noprint { display: none !important; } @page { margin: 12mm; } }`}</style>

          {/* Toolbar */}
          <div className="f3-noprint" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderBottom: '2px solid #1a3fbf', background: '#f0f4ff' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setForm3Record(null)}>← Back</button>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Print</button>
            <button
              className="btn btn-sm"
              style={{ background: '#6d28d9', color: '#fff', border: 'none' }}
              onClick={() => navigate(`/mbl-register/hbl-list/${form3Record.id}`)}
            >
              HBL List
            </button>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a3fbf' }}>
              Form 3 — Pending Statement — {form3Record.mbl_no}
            </span>
          </div>

          {form3Loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" /> Loading…</div>
          ) : (
            <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 24px 48px' }}>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>CARGO DECLARATION</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>(See Regulation 3 &amp; 4)</div>
              </div>

              {/* Header info grid */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18, border: '1px solid #333', fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Igm No:</strong> {form3Record.igm_no || '—'}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Igm Date:</strong> {fmtDate(form3Record.igm_date)}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Imo Code:</strong> {form3Record.imo_code || '—'}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Vessel Code:</strong> {form3Record.vessel_code || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Voyage No:</strong> {form3Record.vessel_voyage_no || '—'}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Line:</strong> {form3Record.line_no || '—'}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Mbl No:</strong> {form3Record.mbl_no}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Mbl Date:</strong> {fmtDate(form3Record.mbl_date)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Port of Delivery:</strong> {form3Hbls[0]?.port_of_delivery || form3Record.port_of_delivery || '—'}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Port Code:</strong> {form3Record.port_of_loading || '—'}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}><strong>Shipping Line:</strong> {form3Record.shipping_line || '—'}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #555' }}></td>
                  </tr>
                </tbody>
              </table>

              {/* Cargo table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#e8ecf8' }}>
                    {['Line No', 'BL No / Date', 'Packages', 'Mark & Number', 'Gross Wt. (Kg)', 'Description', 'CFS Code', 'Importer', 'Container Details'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', border: '1px solid #666', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form3Hbls.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center', color: '#888' }}>No HBL records found.</td></tr>
                  ) : form3Hbls.map((hbl: any, i: number) => {
                    const containers: any[] = Array.isArray(hbl.containers_json) && hbl.containers_json.length > 0
                      ? hbl.containers_json
                      : (hbl.container_no ? [{
                          container_no: hbl.container_no, seal_no: hbl.seal_no,
                          container_type: hbl.container_type, container_size: hbl.container_size,
                          agent_code: hbl.agent_code, package_count: hbl.package_count, weight: hbl.gross_weight,
                        }] : []);
                    const tdStyle: React.CSSProperties = { padding: '8px 8px', border: '1px solid #aaa', verticalAlign: 'top', fontSize: 11 };
                    return (
                      <tr key={hbl.id} style={{ borderBottom: '1px solid #bbb' }}>
                        <td style={tdStyle}>
                          <div>{form3Record.line_no || '—'}</div>
                          <div style={{ color: '#666', fontSize: 10 }}>{hbl.subline_no || (i + 1)}</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{hbl.hbl_no}</div>
                          <div style={{ color: '#555', marginTop: 2 }}>{fmtDate(hbl.hbl_date)}</div>
                        </td>
                        <td style={tdStyle}>
                          <div>{hbl.package_count || 0}</div>
                          {hbl.package_type && <div style={{ color: '#555' }}>{hbl.package_type}</div>}
                        </td>
                        <td style={tdStyle}>{hbl.marks_numbers || '—'}</td>
                        <td style={tdStyle}>{Number(hbl.gross_weight || 0).toFixed(0)} KGS</td>
                        <td style={{ ...tdStyle, maxWidth: 180 }}>{hbl.cargo_description || '—'}</td>
                        <td style={tdStyle}>{hbl.dest_cfs || '—'}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600 }}>{hbl.importer_name || '—'}</div>
                          {[hbl.importer_address1, hbl.importer_address2, hbl.importer_address3].filter(Boolean).map((a: string, ai: number) => (
                            <div key={ai} style={{ fontSize: 10, color: '#555' }}>{a}</div>
                          ))}
                        </td>
                        <td style={tdStyle}>
                          {containers.map((ct: any, ci: number) => (
                            <div key={ci} style={{
                              paddingBottom: ci < containers.length - 1 ? 8 : 0,
                              marginBottom: ci < containers.length - 1 ? 8 : 0,
                              borderBottom: ci < containers.length - 1 ? '1px solid #ccc' : 'none',
                            }}>
                              <div style={{ fontWeight: 600 }}>{ct.agent_code || '—'}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: 11 }}>{ct.container_no || '—'}</div>
                              <div>{ct.seal_no || '—'}</div>
                              <div>{ct.container_type || 'FCL'}</div>
                              <div>{ct.package_count || 0}</div>
                              <div>{ct.weight ? `${roundContainerWeight(ct.weight)} Tons` : '—'}</div>
                            </div>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="f3-noprint" style={{ marginTop: 28, textAlign: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Print Page</button>
              </div>
            </div>
          )}
        </div>
      )}

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
