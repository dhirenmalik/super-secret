import React from 'react';

import { formatMillions, formatCurrencyMillions } from '../../utils/formatters';

const SummarySheet = ({ summary }) => {
    if (!summary) return null;

    const formatCurrency = (val) => formatCurrencyMillions(val);
    const formatNumber = (val) => formatMillions(val);
    const formatPct = (val) => `${(val || 0).toFixed(2)}%`;

    const SummaryTable = ({ title, rows, showPct = true, isPart1 = false }) => (
        <div className="mb-6 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
                <h3 className="text-sm font-bold text-slate-700">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-tighter font-black border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-right">Sales</th>
                            <th className="px-4 py-2 text-right">Spends</th>
                            <th className="px-4 py-2 text-right">Units</th>
                            {showPct && (
                                <>
                                    <th className="px-4 py-2 text-right">Sales %</th>
                                    <th className="px-4 py-2 text-right">Spends %</th>
                                    <th className="px-4 py-2 text-right">Units %</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-4 py-2 font-semibold text-slate-600 text-left">{row.type}</td>
                                <td className="px-4 py-2 font-mono text-right">{formatNumber(row.sales)}</td>
                                <td className="px-4 py-2 font-mono text-slate-500 text-right">{formatNumber(row.spends)}</td>
                                <td className="px-4 py-2 font-mono text-slate-500 text-right">{formatNumber(row.units)}</td>
                                {showPct && (
                                    <>
                                        <td className="px-4 py-2 font-bold text-blue-600 text-right">{formatPct(row.sales_pct)}</td>
                                        <td className="px-4 py-2 text-slate-500 text-right">{formatPct(row.spends_pct)}</td>
                                        <td className="px-4 py-2 text-slate-500 text-right">{formatPct(row.units_pct)}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="summary-sheet mt-4 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
                Summary Sheet
            </h2>

            {/* Part 1 Removed */}
            {/* Part 2 Removed as per request */}

            {/* Part 3 */}
            {summary.part3 && (
                <SummaryTable
                    title="Part 3: After Exclude Flag Analysis"
                    rows={summary.part3}
                />
            )}
        </div>
    );
};

export default SummarySheet;
