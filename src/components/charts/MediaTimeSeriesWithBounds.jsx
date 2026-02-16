import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const generateTimeSeriesData = (baseVal, noise, spikes = []) => {
    const data = [];
    const start = new Date('2022-10-01');
    for (let i = 0; i < 150; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i * 7);
        let val = baseVal + Math.random() * noise;

        spikes.forEach(spike => {
            if (i >= spike.start && i <= spike.end) val += spike.magnitude;
        });

        data.push({
            date: d.toISOString().split('T')[0],
            value: Math.max(0, val)
        });
    }
    return data;
};

export default function MediaTimeSeriesWithBounds({
    title = "Media Impressions",
    dataConfig = { base: 200000, noise: 500000, spikes: [{ start: 60, end: 70, magnitude: 3000000 }] },
    bounds = { thres: 500000, sat: 3000000, inf: 1500000 }
}) {
    const data = generateTimeSeriesData(dataConfig.base, dataConfig.noise, dataConfig.spikes);

    return (
        <div style={{ padding: '10px' }}>
            <h5 style={{ textAlign: 'center', fontSize: '13px', marginBottom: '15px', color: '#475569' }}>{title}</h5>
            <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            ticks={['2023-01-01', '2024-01-01', '2025-01-01']}
                            tickFormatter={(str) => {
                                const d = new Date(str);
                                return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1.5} dot={false} />

                        <ReferenceLine y={bounds.thres} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Thres', fill: '#ef4444', fontSize: 9 }} />
                        <ReferenceLine y={bounds.sat} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'right', value: 'Sat', fill: '#3b82f6', fontSize: 9 }} />
                        <ReferenceLine y={bounds.inf} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: 'Inf', fill: '#f59e0b', fontSize: 9 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b' }}>
                    <div style={{ width: '10px', height: '1px', background: '#ef4444', borderBottom: '1px dashed #ef4444' }}></div> Target Threshold
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b' }}>
                    <div style={{ width: '10px', height: '1px', background: '#3b82f6', borderBottom: '1px dashed #3b82f6' }}></div> Target Saturation
                </div>
            </div>
        </div>
    );
}
