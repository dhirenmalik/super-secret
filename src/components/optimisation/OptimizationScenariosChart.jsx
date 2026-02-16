import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Text } from 'recharts';

const data = [
    { name: 'Same Spend', spendOg: 7.9, spendOpt: 7.9, sales: 26.6, iroas: 3.36, lift: '9%' },
    { name: '10% Inc.', spendOg: 7.9, spendOpt: 8.7, sales: 30.1, iroas: 3.45, lift: '11%' },
    { name: '20% Inc.', spendOg: 7.9, spendOpt: 9.5, sales: 33.3, iroas: 3.50, lift: '13%' },
    { name: '30% Inc.', spendOg: 7.9, spendOpt: 10.3, sales: 35.5, iroas: 3.45, lift: '11%' },
    { name: '50% Inc.', spendOg: 7.9, spendOpt: 11.9, sales: 39.3, iroas: 3.30, lift: '7%' }
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <div style={{ fontWeight: '800', marginBottom: '8px', color: '#1e293b' }}>{label}</div>
                {payload.map((p, i) => (
                    <div key={i} style={{ fontSize: '12px', color: p.color, marginBottom: '4px' }}>
                        {p.name}: {p.name.includes('iRoAS') ? `$${p.value}` : `$${p.value}M`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function OptimizationScenariosChart() {
    return (
        <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>WMC MEDIA OPTIMIZATION SCENARIOS</h3>
                <div style={{ fontSize: '14px', color: '#0071dc', fontWeight: '600' }}>Aug'24 - Jul'25 (12 months)</div>
            </div>

            <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer>
                    <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: '700', fill: '#64748b' }}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            label={{ value: 'Spends / Sales ($M)', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11, fontWeight: '600' }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            label={{ value: 'iRoAS', angle: 90, position: 'insideRight', offset: 10, fontSize: 11, fontWeight: '600' }}
                            domain={[3.0, 3.7]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} />

                        <Bar yAxisId="left" dataKey="spendOg" stackId="a" name="Spend - Original Mix" fill="#75d5ff" barSize={30} radius={[0, 0, 0, 0]} />
                        <Bar yAxisId="left" dataKey="spendOpt" stackId="b" name="Spend - Optimal Mix" fill="#00b4ff" barSize={30} radius={[0, 0, 0, 0]} />
                        <Bar yAxisId="left" dataKey="sales" name="Incremental Sales" fill="#f4b183" barSize={45} />

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="iroas"
                            name="iRoAS"
                            stroke="#92d050"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#92d050', strokeWidth: 2, stroke: 'white' }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '40px' }}>
                {data.map((item, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a' }}>+{item.lift}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lift in iRoAS</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
