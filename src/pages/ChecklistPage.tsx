import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { SeaMblRecord } from '../types/sea';
import { fmtDate } from '../utils/dateUtils';
import { formatWeight } from '../utils/numberUtils';
import api from '../utils/api';

const ChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<SeaMblRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/sea-mbls/${id}`)
      .then((res) => setRecord(res.data))
      .catch(() => toast.error('Failed to load MBL details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>CheckList - ${record?.mbl_no || ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 16px; }
            h2 { text-align: center; font-size: 16px; margin: 16px 0 10px; border-bottom: 1px solid #999; padding-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; font-size: 11px; }
            th { background: #f5f5f5; font-weight: bold; }
            .section-table td:first-child { font-weight: bold; width: 160px; }
            .no-border { border: none !important; }
            .print-btn { display: none; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-center"><span className="spinner" /> Loading Checklist…</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-title">MBL not found</div>
          <button className="btn btn-secondary" onClick={() => navigate('/mbl')}>Back to Console</button>
        </div>
      </div>
    );
  }

  const hbls = record.hbls || [];

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Action bar — not printed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
        <button className="btn btn-primary" onClick={handlePrint}>Print Page</button>
      </div>

      {/* Printable area */}
      <div ref={printRef}>
        <h1 style={{ textAlign: 'center', fontSize: 28, marginBottom: 20, fontFamily: 'Arial, sans-serif' }}>
          CheckList
        </h1>

        {/* MBL Details */}
        <div style={{ border: '1px solid #ccc', marginBottom: 24, fontFamily: 'Arial, sans-serif' }}>
          <h2 style={{ textAlign: 'center', fontSize: 18, padding: '10px 0', borderBottom: '1px solid #ccc', margin: 0, background: '#fafafa' }}>
            MBL Details
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                  Mbl No: <span style={{ fontWeight: 'normal' }}>{record.mbl_no}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                  Mbl Date: <span style={{ fontWeight: 'normal' }}>{record.mbl_date ? fmtDate(record.mbl_date) : '—'}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                  Igm No: <span style={{ fontWeight: 'normal' }}>{record.igm_no || '—'}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                  Igm Date: <span style={{ fontWeight: 'normal' }}>{record.igm_date ? fmtDate(record.igm_date) : '—'}</span>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                  Imo Code: <span style={{ fontWeight: 'normal' }}>{record.imo_code || '—'}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                  Vessal Code: <span style={{ fontWeight: 'normal' }}>{record.vessel_code || '—'}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                  Voyage No: <span style={{ fontWeight: 'normal' }}>{record.vessel_voyage_no || '—'}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                  Line: <span style={{ fontWeight: 'normal' }}>{record.line_no || '—'}</span>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                  Loading Port: <span style={{ fontWeight: 'normal' }}>{record.port_of_loading || '—'}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                  Discharge Port: <span style={{ fontWeight: 'normal' }}>{record.port_of_unloading || 'NHAVASHEVA'}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }} colSpan={2}>
                  Shipping Line: <span style={{ fontWeight: 'normal' }}>{record.shipping_line || record.carrier_name || '—'}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* HBL Details */}
        {hbls.map((hbl, hi) => {
          const containers: any[] = (() => {
            if ((hbl as any).containers_json && Array.isArray((hbl as any).containers_json)) {
              return (hbl as any).containers_json;
            }
            return [{
              container_no: hbl.container_no,
              seal_no: hbl.seal_no,
              package_count: '',
              weight: '',
              container_size: hbl.container_size,
              container_type: hbl.container_type,
              soc_flag: hbl.soc_flag,
              agent_code: hbl.agent_code,
            }];
          })();

          return (
            <div key={hbl.id || hi} style={{ border: '1px solid #ccc', marginBottom: 24, fontFamily: 'Arial, sans-serif' }}>
              <h2 style={{ textAlign: 'center', fontSize: 18, padding: '10px 0', borderBottom: '1px solid #ccc', margin: 0, background: '#fafafa' }}>
                HBL/Container Details
              </h2>

              {/* HBL Info row 1 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '20%' }}>
                      Subline No: <span style={{ fontWeight: 'normal' }}>{hbl.subline_no || String(hi + 1)}</span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                      HBL No: <span style={{ fontWeight: 'normal' }}>{hbl.hbl_no}</span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '20%' }}>
                      HBL Date: <span style={{ fontWeight: 'normal' }}>{hbl.hbl_date ? fmtDate(hbl.hbl_date) : '—'}</span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '35%' }}>
                      Port of Delivery: <span style={{ fontWeight: 'normal' }}>{hbl.port_of_delivery || '—'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                      Dest (CFS)
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px' }}>{hbl.dest_cfs || '—'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                      Packages: <span style={{ fontWeight: 'normal' }}>{hbl.package_count} {hbl.package_type || 'PKG'}</span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>
                      Gross Weight:: <span style={{ fontWeight: 'normal' }}>{formatWeight(hbl.gross_weight)} KGS</span>
                      &nbsp;&nbsp; Cargo Movement: <span style={{ fontWeight: 'normal' }}>{(hbl.cargo_move || '').split('-')[0]}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>Mark &amp; No</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px' }}>{hbl.marks_numbers || 'NM'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>Description:</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', whiteSpace: 'pre-wrap' }}>
                      {hbl.cargo_description || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>ImporterName</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px' }}>{hbl.importer_name || '—'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold' }}>Address:</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px' }}>
                      {[hbl.importer_address1, hbl.importer_address2, hbl.importer_address3]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Container table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 4 }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #ddd', padding: '5px 8px' }}>Container No:</th>
                    <th style={{ border: '1px solid #ddd', padding: '5px 8px' }}>Seal No:</th>
                    <th style={{ border: '1px solid #ddd', padding: '5px 8px' }}>Packages:</th>
                    <th style={{ border: '1px solid #ddd', padding: '5px 8px' }}>Weight (Tons)</th>
                    <th style={{ border: '1px solid #ddd', padding: '5px 8px' }}>Container Size:</th>
                    <th style={{ border: '1px solid #ddd', padding: '5px 8px' }}>Type:</th>
                    <th style={{ border: '1px solid #ddd', padding: '5px 8px' }}>SOC Flag:</th>
                    <th style={{ border: '1px solid #ddd', padding: '5px 8px' }}>Agent Code:</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((ct: any, ci: number) => (
                    <tr key={ci}>
                      <td style={{ border: '1px solid #ddd', padding: '5px 8px', fontFamily: 'monospace' }}>{ct.container_no || '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{ct.seal_no || '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{ct.package_count || '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{ct.weight ? formatWeight(ct.weight) : '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{ct.container_size || '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{(ct.container_type || '').split('-')[0]}</td>
                      <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{(ct.soc_flag || '').split('-')[0]}</td>
                      <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{ct.agent_code || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Grand Total — across all HBLs/Containers on this MBL */}
        {hbls.length > 0 && (() => {
          const grandHblPkgs = hbls.reduce((s, h) => s + (Number(h.package_count) || 0), 0);
          const grandHblWt = hbls.reduce((s, h) => s + (Number(h.gross_weight) || 0), 0);
          const allContainers = hbls.flatMap(h => {
            if ((h as any).containers_json && Array.isArray((h as any).containers_json)) {
              return (h as any).containers_json;
            }
            return [{ package_count: '', weight: '' }];
          });
          const grandContainerPkgs = allContainers.reduce((s: number, c: any) => s + (Number(c.package_count) || 0), 0);
          const grandContainerWt = allContainers.reduce((s: number, c: any) => s + (Number(c.weight) || 0), 0);

          return (
            <div style={{ border: '1px solid #ccc', marginBottom: 24, fontFamily: 'Arial, sans-serif' }}>
              <h2 style={{ textAlign: 'center', fontSize: 18, padding: '10px 0', borderBottom: '1px solid #ccc', margin: 0, background: '#fafafa' }}>
                Total
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                      HBL Packages: <span style={{ fontWeight: 'normal' }}>{grandHblPkgs || '—'}</span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                      HBL Weight: <span style={{ fontWeight: 'normal' }}>{grandHblWt ? formatWeight(grandHblWt) : '—'}</span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                      Container Pkgs: <span style={{ fontWeight: 'normal' }}>{grandContainerPkgs || '—'}</span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontWeight: 'bold', width: '25%' }}>
                      Container Weight: <span style={{ fontWeight: 'normal' }}>{grandContainerWt ? formatWeight(grandContainerWt) : '—'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Print button inside printable area (visible on screen only) */}
        <div style={{ textAlign: 'center', padding: '20px 0' }} className="print-btn">
          <button
            className="btn btn-secondary"
            onClick={handlePrint}
            style={{ padding: '8px 24px', fontSize: 14 }}
          >
            Print Page
          </button>
        </div>
      </div>

      <div className="sea-footer">EDI Software Solutions @ 2022 – 2026 All rights reserved</div>
    </div>
  );
};

export default ChecklistPage;
