import React from 'react';

const data = [
    { s: 'x1', ogSpend: '7,932,916', ogContri: '1,420,710', ogIroas: '3.10', ogRev: '24,554,214', optSpend: '7,932,451', optContri: '1,542,159', liftContri: '9%', optIroas: '3.36', optRev: '26,653,227', overallLift: '9%', discAct: '0%', discOpt: '0%', discActIroas: '3.10', discOptIroas: '3.36', iroasLift: '9%', contriLift: '9%' },
    { s: 'x1.1', ogSpend: '7,932,916', ogContri: '1,420,710', ogIroas: '3.10', ogRev: '24,554,214', optSpend: '8,726,280', optContri: '1,739,749', liftContri: '22%', optIroas: '3.45', optRev: '30,097,663', overallLift: '11%', discAct: '0%', discOpt: '0%', discActIroas: '3.10', discOptIroas: '3.45', iroasLift: '11%', contriLift: '22%' },
    { s: 'x1.2', ogSpend: '7,932,916', ogContri: '1,420,710', ogIroas: '3.10', ogRev: '24,554,214', optSpend: '9,519,498', optContri: '1,928,053', liftContri: '36%', optIroas: '3.50', optRev: '33,322,659', overallLift: '13%', discAct: '0%', discOpt: '0%', discActIroas: '3.10', discOptIroas: '3.50', iroasLift: '13%', contriLift: '36%' },
    { s: 'x1.3', ogSpend: '7,932,916', ogContri: '1,420,710', ogIroas: '3.10', ogRev: '24,554,214', optSpend: '10,312,839', optContri: '2,056,600', liftContri: '45%', optIroas: '3.45', optRev: '35,544,354', overallLift: '11%', discAct: '0%', discOpt: '0%', discActIroas: '3.10', discOptIroas: '3.45', iroasLift: '11%', contriLift: '45%' },
    { s: 'x1.5', ogSpend: '7,932,916', ogContri: '1,420,710', ogIroas: '3.10', ogRev: '24,554,214', optSpend: '11,899,503', optContri: '2,275,105', liftContri: '60%', optIroas: '3.30', optRev: '39,320,773', overallLift: '7%', discAct: '0%', discOpt: '0%', discActIroas: '3.10', discOptIroas: '3.30', iroasLift: '7%', contriLift: '60%' }
];

export default function OptimizationResultsTable() {
    return (
        <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header" style={{ background: '#004f91', color: 'white', borderRadius: '8px 8px 0 0' }}>
                <div style={{ fontSize: '14px', fontWeight: '800' }}>Full Optimization Metrics Summary</div>
            </div>
            <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ textAlign: 'left', padding: '12px', border: '1px solid #e2e8f0' }}>Scenario</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0' }}>Og Spends</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0' }}>Og Contri.</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0' }}>Og iRoAS</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0' }}>Og Rev</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0', background: '#dcfce7' }}>Opt Spends</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0', background: '#dcfce7' }}>Opt Contri.</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0', color: '#16a34a' }}>Lift % Contri</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0', background: '#dcfce7' }}>Opt iRoAS</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0', background: '#dcfce7' }}>Opt Rev</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0', color: '#16a34a' }}>Overall Lift %</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0' }}>Disc Act</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0' }}>Disc Opt</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0' }}>Disc Act iRoAS</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0' }}>Disc Opt iRoAS</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0', color: '#16a34a' }}>iRoAS Lift</th>
                            <th style={{ textAlign: 'right', padding: '12px', border: '1px solid #e2e8f0', color: '#16a34a' }}>Contri Lift</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 12px', fontWeight: '800', color: '#1e293b' }}>{row.s}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b' }}>${row.ogSpend}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b' }}>{row.ogContri}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b' }}>${row.ogIroas}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b' }}>${row.ogRev}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', color: '#0071dc' }}>${row.optSpend}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', color: '#0071dc' }}>{row.optContri}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '800', color: '#16a34a' }}>{row.liftContri}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', color: '#0071dc' }}>${row.optIroas}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', color: '#0071dc' }}>${row.optRev}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '800', color: '#16a34a' }}>{row.overallLift}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>{row.discAct}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>{row.discOpt}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>${row.discActIroas}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>${row.discOptIroas}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '800', color: '#16a34a' }}>{row.iroasLift}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '800', color: '#16a34a' }}>{row.contriLift}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
