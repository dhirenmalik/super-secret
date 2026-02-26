import React, { useMemo, useState } from 'react';

// ─── Tactic Config ────────────────────────────────────────────────────────────
// Canonical source of truth: prefix → display name + group
// The `prefix` must match what DiscoveryToolAnalysis builds in tacticsMap
// (i.e. spendKey.replace('_SPEND', ''))
const TACTIC_CONFIG = [
    // Search
    { prefix: 'M_SP_AB', name: 'Sponsored Products Automatic', group: 'Search', isCpc: true },
    { prefix: 'M_SP_KWB', name: 'Sponsored Products Manual', group: 'Search', isCpc: true },
    { prefix: 'M_SBA', name: 'Sponsored Brands', group: 'Search', isCpc: true },
    { prefix: 'M_SV', name: 'Sponsored Product Video', group: 'Search', isCpc: true },
    // Onsite Display
    { prefix: 'M_ON_DIS_AT', name: 'Onsite Display Audience Targeting', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_CT', name: 'Onsite Display Contextual Targeting', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_CATTO', name: 'Onsite Display Category Takeover', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_KW', name: 'Onsite Display Keyword', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_ROS', name: 'Onsite Display Run-Of-Site', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_HPLO', name: 'Onsite Display Homepage Lockout', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_APP_HPLO', name: 'Onsite Display APP Homepage Lockout', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_HP', name: 'Onsite Display Homepage', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_HPTO', name: 'Onsite Display Homepage Takeover', group: 'Onsite Display', isCpc: false },
    { prefix: 'M_ON_DIS_HPGTO', name: 'Onsite Display Homepage Gallery Takeover', group: 'Onsite Display', isCpc: false },
    // Offsite Display
    { prefix: 'M_OFF_DIS_FB', name: 'Offsite Display Facebook', group: 'Offsite Display', isCpc: false },
    { prefix: 'M_OFF_DIS_PIN', name: 'Offsite Display Pinterest', group: 'Offsite Display', isCpc: false },
    { prefix: 'M_OFF_DIS_WN_WITHOUTCTV', name: 'Offsite WN - Display & Preroll', group: 'Offsite Display', isCpc: false },
    { prefix: 'M_OFF_DIS_DSP_CTV', name: 'Offsite Display Walmart DSP CTV', group: 'Offsite Display', isCpc: false },
    // TV Wall
    { prefix: 'M_INSTORE_TV_WALL_SUM', name: 'TV Wall', group: 'TV Wall', isCpc: false },
];

// prefix → internal name used in metrics.mediaTactics
// DiscoveryToolAnalysis sets t.name = prefix.replace(/_/g, ' ')
const prefixToInternalName = (prefix) => prefix.replace(/_/g, ' ');

const GROUPS = ['Search', 'Onsite Display', 'Offsite Display', 'TV Wall'];

const GROUP_STYLE = {
    'Search': { header: 'bg-indigo-700', total: 'bg-indigo-50' },
    'Onsite Display': { header: 'bg-violet-700', total: 'bg-violet-50' },
    'Offsite Display': { header: 'bg-teal-700', total: 'bg-teal-50' },
    'TV Wall': { header: 'bg-orange-700', total: 'bg-orange-50' },
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtPct = (v, digits = 1) => (v == null || isNaN(v)) ? '-' : `${Number(v).toFixed(digits)}%`;
const fmtYoy = (v) => {
    if (v == null || isNaN(v)) return '-';
    const sign = v > 0 ? '+' : '';
    return `${sign}${Number(v).toFixed(0)}%`;
};
const fmtCpa = (v, isCpc) => {
    if (!v || isNaN(v) || v === 0) return '-';
    return isCpc ? `$${Number(v).toFixed(2)}` : `$${v >= 1000 ? (v / 1000).toFixed(1) + 'K' : Number(v).toFixed(1)}`;
};
const colorYoy = (v) => {
    if (v == null || isNaN(v) || v === 0) return 'text-slate-500';
    return v > 0 ? 'text-emerald-600' : 'text-rose-600';
};
const shareColor = (v) => {
    if (!v || v === 0) return 'text-slate-400';
    if (v >= 15) return 'text-emerald-700';
    if (v >= 5) return 'text-slate-700';
    return 'text-amber-600';
};

// ─── OAD Table ────────────────────────────────────────────────────────────────
function OadTable({ rows }) {
    if (!rows.length) return <p className="text-xs text-slate-400 px-4 py-3">No tactic data available.</p>;
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <div className="bg-slate-700 px-4 py-3">
                <h3 className="text-white text-xs font-extrabold uppercase tracking-widest">OAD (On-Air Days) Analysis</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="px-4 py-2 text-left font-bold text-slate-600 uppercase tracking-wider">Media</th>
                            <th className="px-4 py-2 text-center font-bold text-slate-600 uppercase tracking-wider">OAD</th>
                            <th className="px-4 py-2 text-center font-bold text-indigo-600 uppercase tracking-wider">On_air</th>
                            <th className="px-4 py-2 text-center font-bold text-rose-500 uppercase tracking-wider">Off_air</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((t, i) => {
                            const oad = t.shares.filter(s => s > 0).length;
                            const onAir = t.shares.length > 0 ? (oad / t.shares.length) * 100 : 0;
                            const isZero = t.shares.every(s => s === 0);
                            return (
                                <tr key={t.displayName} className={`border-b border-slate-100 hover:bg-slate-50 ${isZero ? 'text-rose-400' : 'text-slate-700'}`}>
                                    <td className="px-4 py-2">{t.displayName}</td>
                                    <td className="px-4 py-2 text-center font-mono">{oad}</td>
                                    <td className="px-4 py-2 text-center font-mono">{onAir.toFixed(0)}%</td>
                                    <td className="px-4 py-2 text-center font-mono">{(100 - onAir).toFixed(0)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Skeleton cell for loading state ──────────────────────────────────────────
const Sk = ({ w = 'w-16', h = 'h-3.5' }) => (
    <div className={`${w} ${h} bg-slate-200 rounded animate-pulse inline-block`} />
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MediaTacticsTable({ metrics, isLoading = false }) {
    const [showOad, setShowOad] = useState(false);
    const [yoyShowNumbers, setYoyShowNumbers] = useState(false);

    // Build a lookup: internal name → tactic data from metrics
    const tacticLookup = useMemo(() => {
        const map = {};
        (metrics?.mediaTactics || []).forEach(t => {
            map[t.name] = t; // key is e.g. "M SP AB"
        });
        return map;
    }, [metrics]);

    const periodLabels = useMemo(() => (metrics?.periods || []).map(p => p.name), [metrics]);

    // Build enriched rows by walking TACTIC_CONFIG in order (so named display is guaranteed)
    const enrichedRows = useMemo(() => {
        return TACTIC_CONFIG.map(cfg => {
            const internalName = prefixToInternalName(cfg.prefix);
            const data = tacticLookup[internalName];
            return {
                displayName: cfg.name,
                group: cfg.group,
                isCpc: cfg.isCpc,
                shares: data?.shares || [0, 0, 0],
                spends: data?.spends || [0, 0, 0],
                spendYoy: data?.spendYoy || 0,
                cpa: data?.cpa || 0,
                cpaYoy: data?.cpaYoy || 0,
            };
        });
    }, [tacticLookup]);

    // Group rows
    const grouped = useMemo(() => {
        const map = {};
        GROUPS.forEach(g => { map[g] = []; });
        enrichedRows.forEach(r => {
            if (map[r.group]) map[r.group].push(r);
        });
        return map;
    }, [enrichedRows]);

    // Show loading skeleton
    if (isLoading) {
        return (
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <div className="bg-slate-700 px-5 py-4 flex items-center justify-between">
                    <h2 className="text-white text-sm font-extrabold uppercase tracking-widest">Media Tactics Table</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200">
                                {['Tactic', 'P1 Share', 'P2 Share', 'P3 Share', 'Spend YOY', 'CPA', 'CPA YOY'].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="px-4 py-2.5"><Sk w="w-40" /></td>
                                    <td className="px-4 py-2.5"><Sk /></td>
                                    <td className="px-4 py-2.5"><Sk /></td>
                                    <td className="px-4 py-2.5"><Sk /></td>
                                    <td className="px-4 py-2.5"><Sk w="w-10" /></td>
                                    <td className="px-4 py-2.5"><Sk w="w-12" /></td>
                                    <td className="px-4 py-2.5"><Sk w="w-10" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }



    const thBase = "px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white text-center whitespace-nowrap";
    const tdBase = "px-3 py-2 text-[11px] text-center font-mono border-b border-slate-100";

    if (!metrics) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Key Metrics · Media Tactics</h2>
                <button
                    onClick={() => setShowOad(v => !v)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ${showOad ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}
                >
                    {showOad ? 'Hide OAD' : 'Show OAD Table'}
                </button>
            </div>

            {/* Main Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ minWidth: 860 }}>
                        <thead>
                            <tr className="bg-slate-800">
                                <th className={`${thBase} text-left pl-4 w-56`}></th>
                                <th colSpan={3} className={`${thBase} border-x border-slate-600 bg-blue-800`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <span>Spend Share</span>
                                        <div className="flex rounded overflow-hidden border border-blue-300 text-[9px] font-bold">
                                            <button onClick={() => setYoyShowNumbers(false)} className={`px-1.5 py-0.5 transition-colors ${!yoyShowNumbers ? 'bg-white text-blue-800' : 'bg-blue-600 text-white'}`}>%</button>
                                            <button onClick={() => setYoyShowNumbers(true)} className={`px-1.5 py-0.5 transition-colors ${yoyShowNumbers ? 'bg-white text-blue-800' : 'bg-blue-600 text-white'}`}>#</button>
                                        </div>
                                    </div>
                                </th>
                                <th className={`${thBase} bg-indigo-600 border-x border-slate-600`}>YOY%</th>
                                <th className={`${thBase} bg-slate-700`}>CPC/CPM/CPD<br /><span className="font-normal normal-case opacity-75">{periodLabels[2] || 'Latest'}</span></th>
                                <th className={`${thBase} bg-slate-600`}>CPC/CPM/CPD<br /><span className="font-normal normal-case opacity-75">YOY %</span></th>
                            </tr>
                            <tr className="bg-slate-700 border-b border-slate-600">
                                <th className="px-4 py-1.5 text-left text-[10px] text-slate-400"></th>
                                {[0, 1, 2].map(i => (
                                    <th key={i} className="px-3 py-1.5 text-[10px] font-bold text-blue-200 text-center border-x border-slate-600">
                                        {periodLabels[i] || `P${i + 1}`}
                                    </th>
                                ))}
                                <th className="px-3 py-1.5 text-[10px] text-slate-400"></th>
                                <th className="px-3 py-1.5 text-[10px] text-slate-400"></th>
                                <th className="px-3 py-1.5 text-[10px] text-slate-400"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {GROUPS.map(groupName => {
                                const rows = grouped[groupName] || [];
                                const style = GROUP_STYLE[groupName];

                                // Totals
                                const totalShares = [0, 1, 2].map(i => rows.reduce((s, r) => s + (r.shares[i] || 0), 0));
                                const activeRows = rows.filter(r => r.shares.some(s => s > 0));
                                const avgYoy = activeRows.length ? activeRows.reduce((s, r) => s + r.spendYoy, 0) / activeRows.length : 0;

                                return (
                                    <React.Fragment key={groupName}>
                                        {/* Group header & total (Skip for TV Wall) */}
                                        {groupName !== 'TV Wall' && (
                                            <>
                                                <tr className={style.header}>
                                                    <td colSpan={7} className="px-4 py-1.5 text-[11px] font-extrabold text-white uppercase tracking-wider">
                                                        {groupName} Total
                                                    </td>
                                                </tr>
                                                <tr className={`${style.total} border-b-2 border-slate-300`}>
                                                    <td className="px-4 py-2 text-[11px] font-bold text-slate-600 pl-8 italic">Total</td>
                                                    {[0, 1, 2].map(i => (
                                                        <td key={i} className={`${tdBase} font-bold ${shareColor(totalShares[i])}`}>
                                                            {yoyShowNumbers
                                                                ? (() => { const s = activeRows.reduce((acc, r) => acc + (r.spends?.[i] || 0), 0); return `$${new Intl.NumberFormat('en-US').format(Math.round(s))}`; })()
                                                                : fmtPct(totalShares[i])}
                                                        </td>
                                                    ))}
                                                    <td className={`${tdBase} font-bold ${colorYoy(avgYoy)}`}>{fmtYoy(avgYoy)}</td>
                                                    <td className={`${tdBase} text-slate-400`}>-</td>
                                                    <td className={`${tdBase} text-slate-400`}>-</td>
                                                </tr>
                                            </>
                                        )}
                                        {/* Tactic rows */}
                                        {rows.map((r, ri) => {
                                            const isZero = r.shares.every(s => s === 0);
                                            return (
                                                <tr key={r.displayName} className={`border-b border-slate-100 hover:bg-indigo-50/30 transition-colors ${isZero ? 'bg-rose-50/30' : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                                    <td className={`px-4 py-2 pl-${groupName === 'TV Wall' ? '4 font-bold text-slate-800' : '8 text-slate-700'} text-[11px] max-w-[220px] truncate ${isZero ? 'text-rose-500 font-normal' : ''}`} title={r.displayName}>
                                                        {r.displayName}
                                                    </td>
                                                    {[0, 1, 2].map(i => (
                                                        <td key={i} className={`${tdBase} ${isZero ? 'text-rose-400' : shareColor(r.shares[i])}`}>
                                                            {yoyShowNumbers
                                                                ? `$${new Intl.NumberFormat('en-US').format(Math.round(r.spends?.[i] || 0))}`
                                                                : fmtPct(r.shares[i])}
                                                        </td>
                                                    ))}
                                                    <td className={`${tdBase} ${colorYoy(r.spendYoy)}`}>{fmtYoy(r.spendYoy)}</td>
                                                    <td className={`${tdBase} ${isZero ? 'text-slate-400' : 'text-slate-700'}`}>{fmtCpa(r.cpa, r.isCpc)}</td>
                                                    <td className={`${tdBase} ${colorYoy(r.cpaYoy)}`}>{fmtYoy(r.cpaYoy)}</td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* OAD Table */}
            {showOad && <OadTable rows={enrichedRows} />}
        </div>
    );
}
