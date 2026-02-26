import React from 'react';
import { fmt$, fmtN } from '../../utils/formatters';

export default function SummaryTab({ data }) {
    const { category_info, time_periods, yoy_change, overall_period, num_brands,
        key_metrics_summary, media_mix, media_spends_table, media_tactics, on_air_analysis, value_added } = data;

    const TableCard = ({ title, children, className = '' }) => (
        <div className={`overflow-hidden rounded-2xl border border-slate-200 mb-6 bg-white ${className}`}>
            {title && (
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-bold text-slate-800 text-sm uppercase tracking-wider">
                    {title}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    {children}
                </table>
            </div>
        </div>
    );

    const Th = ({ children, className = '', colSpan, rowSpan }) => (
        <th colSpan={colSpan} rowSpan={rowSpan} className={`px-4 py-3 bg-slate-100 font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap border-b border-slate-200 ${className}`}>
            {children}
        </th>
    );

    const Td = ({ children, className = '', colSpan, style }) => (
        <td colSpan={colSpan} style={style} className={`px-4 py-3 text-slate-700 border-b border-slate-100 text-sm whitespace-nowrap ${className}`}>
            {children}
        </td>
    );

    return (
        <div className="p-6">
            {/* TOP ROW: Category Info + YOY */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                {/* LEFT: Category + YOY + Overall + Key Metrics + Media Mix */}
                <div className="space-y-6">
                    {/* Category Info (B2-B4) */}
                    <TableCard>
                        <tbody className="divide-y divide-slate-100">
                            {[
                                ['Category:', category_info.category],
                                ['Modeling Time Period:', category_info.modeling_period],
                                ['Subcategories Included', category_info.subcategories]
                            ].map(([k, v], i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 w-1/3 text-xs uppercase tracking-wider">{k}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium whitespace-pre-wrap">{v}</td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>

                    {/* YOY Change % */}
                    <TableCard title="YOY Change %">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <Th className="bg-white">Omni Unit Sales</Th>
                                <Th className="bg-white">Omni GMV ($)</Th>
                                <Th className="bg-white">WMC Spends ($)</Th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {[yoy_change.omni_unit_sales, yoy_change.omni_gmv, yoy_change.wmc_spends].map((v, i) => (
                                    <Td key={i} className={`font-bold ${v >= 0 ? 'text-green-600' : 'text-red-600'}`}>{v}%</Td>
                                ))}
                            </tr>
                        </tbody>
                    </TableCard>

                    {/* Overall Period */}
                    <TableCard title="Overall Period">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <Th className="bg-white">WMC Penetration(%)</Th>
                                <Th className="bg-white">Price</Th>
                                <Th className="bg-white">Unit Sales Online</Th>
                                <Th className="bg-white">GMV Sales Online</Th>
                                <Th className="bg-white">#Brands</Th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <Td>{overall_period.wmc_penetration}%</Td>
                                <Td>${overall_period.price}</Td>
                                <Td>{overall_period.unit_sales_online}%</Td>
                                <Td>{overall_period.gmv_sales_online}%</Td>
                                <Td>{num_brands}</Td>
                            </tr>
                        </tbody>
                    </TableCard>

                    {/* Key Metrics Summary */}
                    <TableCard title="Key Metrics Summary">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <Th className="bg-white"></Th>
                                <Th className="bg-white">Unit Sales Online (%)</Th>
                                <Th className="bg-white">GMV Sales Online (%)</Th>
                                <Th className="bg-white">WMC Penetration(%)</Th>
                                <Th className="bg-white">Price</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {key_metrics_summary.map((r, i) => (
                                <tr key={i} className={r.period === 'Change YOY %' ? 'bg-yellow-50 font-semibold' : ''}>
                                    <Td className="font-medium">{r.period}</Td>
                                    <Td>{r.online_unit_sales}%</Td>
                                    <Td>{r.online_gmv_sales}%</Td>
                                    <Td>{r.wmc_penetration}%</Td>
                                    <Td>{r.period === 'Change YOY %' ? `${r.price}%` : `$${r.price}`}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>

                    {/* Media Mix */}
                    <TableCard title="Media Mix">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <Th className="bg-white"></Th>
                                <Th className="bg-white">Search</Th>
                                <Th className="bg-white">Onsite Display</Th>
                                <Th className="bg-white">Offsite Display</Th>
                                <Th className="bg-white">TV Wall</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {media_mix.map((r, i) => (
                                <tr key={i} className={r.period === 'Change YOY %' ? 'bg-yellow-50 font-semibold' : ''}>
                                    <Td className="font-medium">{r.period}</Td>
                                    <Td>{r.search}%</Td>
                                    <Td>{r.onsite_display}%</Td>
                                    <Td>{r.offsite_display}%</Td>
                                    <Td>{r.tv_wall}%</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>
                </div>

                {/* RIGHT: YOY abs + Online Sales + Media Spends */}
                <div className="space-y-6">
                    <TableCard title="YOY %">
                        <tbody className="divide-y divide-slate-100">
                            {[['Omni Unit Sales', yoy_change.omni_unit_sales], ['Omni GMV ($)', yoy_change.omni_gmv], ['WMC Spends ($)', yoy_change.wmc_spends]].map(([l, v], i) => (
                                <tr key={i}>
                                    <Td className="font-medium">{l}</Td>
                                    <Td className={`font-bold ${v >= 0 ? 'text-green-600' : 'text-red-600'}`}>{v}%</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>

                    <TableCard title="Online Sales">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <Th className="bg-white"></Th>
                                <Th className="bg-white">Unit Sales Online</Th>
                                <Th className="bg-white">GMV Sales Online</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {key_metrics_summary.map((r, i) => (
                                <tr key={i} className={r.period === 'Change YOY %' ? 'bg-yellow-50 font-semibold' : ''}>
                                    <Td className="font-medium">{r.period}</Td>
                                    <Td>{r.online_unit_sales}%</Td>
                                    <Td>{r.online_gmv_sales}%</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>

                    <TableCard title="Media Spends">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <Th className="bg-white">Period</Th>
                                <Th className="bg-white">Search</Th>
                                <Th className="bg-white">Onsite Display</Th>
                                <Th className="bg-white">Offsite Display</Th>
                                <Th className="bg-white">TV Wall</Th>
                                <Th className="bg-white">Total</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {media_spends_table.map((r, i) => (
                                <tr key={i}>
                                    <Td className="font-medium">{r.period}</Td>
                                    <Td>{fmt$(r.search)}</Td>
                                    <Td>{fmt$(r.onsite_display)}</Td>
                                    <Td>{fmt$(r.offsite_display)}</Td>
                                    <Td>{fmt$(r.tv_wall)}</Td>
                                    <Td className="font-bold text-slate-900">{fmt$(r.total)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>
                </div>
            </div>

            {/* MEDIA TACTICS — LEFT (Spend Share) + RIGHT (Absolute Spends) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                <div>
                    <TableCard title="Key Metrics – Media Tactics (Spend Share)">
                        <thead>
                            <tr>
                                <Th rowSpan="2"></Th>
                                <Th colSpan="3" className="text-center border-l bg-slate-50">Spend Share</Th>
                                <Th rowSpan="2" className="border-l">Change<br />YOY %</Th>
                                <Th colSpan="2" className="text-center border-l bg-slate-50">CPC/CPM/CPD</Th>
                                <Th rowSpan="2" className="border-l">Status</Th>
                                <Th rowSpan="2" className="border-l">Type</Th>
                            </tr>
                            <tr>
                                <Th className="border-l text-[10px]">{time_periods.other}</Th>
                                <Th className="text-[10px]">{time_periods.py}</Th>
                                <Th className="text-[10px]">{time_periods.ly}</Th>
                                <Th className="border-l text-[10px]">LY</Th>
                                <Th className="text-[10px]">YOY%</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {media_tactics.map((r, i) => (
                                <tr key={i} className={r.is_total ? 'bg-blue-50 font-bold' : ''}>
                                    <Td className={`min-w-[160px] ${r.is_total ? 'pl-2' : 'pl-5'}`}>{r.name}</Td>
                                    <Td className="border-l">{r.other_share}%</Td>
                                    <Td>{r.py_share}%</Td>
                                    <Td>{r.ly_share}%</Td>
                                    <Td className={`border-l font-bold ${r.yoy_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{r.yoy_change}%</Td>
                                    <Td className="border-l">{r.cpc_cpm_ly}</Td>
                                    <Td className={`font-bold ${r.cpc_cpm_yoy >= 0 ? 'text-green-600' : 'text-red-600'}`}>{r.cpc_cpm_yoy}%</Td>
                                    <Td className={`border-l ${r.status === 'No Data' ? 'text-orange-600' : 'text-slate-700'}`}>{r.status || '—'}</Td>
                                    <Td className="border-l font-medium">{r.metric_type}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>
                </div>
                <div>
                    <TableCard title="Key Metrics – Media Tactics (Absolute Spends)">
                        <thead>
                            <tr>
                                <Th rowSpan="2"></Th>
                                <Th colSpan="3" className="text-center border-l bg-slate-50">Spends</Th>
                                <Th rowSpan="2" className="border-l">Change<br />YOY %</Th>
                            </tr>
                            <tr>
                                <Th className="border-l text-[10px]">{time_periods.other}</Th>
                                <Th className="text-[10px]">{time_periods.py}</Th>
                                <Th className="text-[10px]">{time_periods.ly}</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {media_tactics.map((r, i) => (
                                <tr key={i} className={r.is_total ? 'bg-blue-50 font-bold' : ''}>
                                    <Td className={`min-w-[160px] ${r.is_total ? 'pl-2' : 'pl-5'}`}>{r.name}</Td>
                                    <Td className="border-l">{fmt$(r.spend_other)}</Td>
                                    <Td>{fmt$(r.spend_py)}</Td>
                                    <Td>{fmt$(r.spend_ly)}</Td>
                                    <Td className={`border-l font-bold ${r.spend_yoy >= 0 ? 'text-green-600' : 'text-red-600'}`}>{r.spend_yoy}%</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>
                </div>
            </div>

            {/* ON-AIR + VALUE ADDED */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                    <TableCard title="On-Air / Off-Air Analysis">
                        <thead>
                            <tr>
                                <Th>Media</Th>
                                <Th>OAD</Th>
                                <Th>On_air</Th>
                                <Th>Off_air</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {on_air_analysis.map((r, i) => (
                                <tr key={i}>
                                    <Td className="font-medium">{r.name}</Td>
                                    <Td>{r.oad}</Td>
                                    <Td>
                                        <div className="flex items-center gap-2 justify-center">
                                            <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${r.on_air}%` }} />
                                            </div>
                                            <span className="text-xs">{r.on_air}%</span>
                                        </div>
                                    </Td>
                                    <Td>{r.off_air}%</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableCard>
                </div>
                <div>
                    <TableCard title="Added Value">
                        <thead>
                            <tr>
                                <Th>Tactic Name</Th>
                                <Th>Total Impressions</Th>
                                <Th>AV Impressions</Th>
                                <Th>% of AV</Th>
                                <Th>Days</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {value_added.length > 0 ? value_added.map((r, i) => (
                                <tr key={i}>
                                    <Td className="font-medium">{r.tactic}</Td>
                                    <Td>{fmtN(r.total_imp)}</Td>
                                    <Td>{fmtN(r.av_imp)}</Td>
                                    <Td>{r.pct_av}%</Td>
                                    <Td>{r.num_days}</Td>
                                </tr>
                            )) : (
                                <tr><Td colSpan="5" className="text-slate-400 text-center py-8">No added value impressions detected.</Td></tr>
                            )}
                        </tbody>
                    </TableCard>
                </div>
            </div>
        </div>
    );
}
