import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceDot } from 'recharts';

// S-curve function (Hill function)
const hill = (x, alpha, gamma) => {
    return Math.pow(x, alpha) / (Math.pow(x, alpha) + Math.pow(gamma, alpha));
};

const generateSCurveData = (alpha, gamma, maxVal, maxVC) => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
        const x = (i / 100) * maxVal;
        const y = hill(x, alpha, gamma) * maxVC;
        points.push({ x, y });
    }
    return points;
};

export default function ResponseCurveChart({
    title = "Response Curve",
    alpha = 3,
    gamma = 250000,
    maxVal = 1000000,
    maxVC = 400000000,
    metrics = {} // { thres: [x,y], inf: [x,y], avg: [x,y], sat: [x,y] }
}) {
    const data = generateSCurveData(alpha, gamma, maxVal, maxVC);

    return (
        <div style={{ padding: '10px' }}>
            <h5 style={{ textAlign: 'center', fontSize: '13px', marginBottom: '15px', color: '#475569' }}>{title}</h5>
            <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Raw Impression"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(val) => val > 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Volume Contribution"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(val) => val > 1000000 ? `${(val / 1000000).toFixed(0)}M` : val}
                        />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Scatter line lineJointType="monotone" shape="none" data={data} stroke="#94a3b8" strokeWidth={2} />

                        {metrics.thres && <ReferenceDot x={metrics.thres[0]} y={metrics.thres[1]} r={4} fill="#ef4444" stroke="none" />}
                        {metrics.inf && <ReferenceDot x={metrics.inf[0]} y={metrics.inf[1]} r={4} fill="#f59e0b" stroke="none" />}
                        {metrics.avg && <ReferenceDot x={metrics.avg[0]} y={metrics.avg[1]} r={4} fill="#475569" stroke="none" />}
                        {metrics.sat && <ReferenceDot x={metrics.sat[0]} y={metrics.sat[1]} r={4} fill="#0ea5e9" stroke="none" />}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></div> Threshold
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></div> Inflection
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#475569' }}></div> Average
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9' }}></div> Saturation
                </div>
            </div>
        </div>
    );
}
