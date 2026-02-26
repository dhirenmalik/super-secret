import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const data = [
    { name: 'Sponsored Products Automatic', headroom: 8.2 },
    { name: 'Sponsored Products Manual', headroom: 9.0 },
    { name: 'Sponsored Brands', headroom: 3.8 },
    { name: 'Sponsored Video', headroom: 14.5 },
    { name: 'Onsite Display Audience Targeting', headroom: 2.7 },
    { name: 'Onsite Display Contextual Targeting', headroom: 1.6 },
    { name: 'Onsite Display Category Takeover', headroom: 49.8 },
    { name: 'Onsite Display Keyword', headroom: 5.0 },
    { name: 'Onsite Display Homepage Lockout', headroom: 254.7 },
    { name: 'Onsite Display APP Homepage Lockout', headroom: 65.9 },
    { name: 'Onsite Display Homepage Gallery Takeover', headroom: 86.6 },
    { name: 'Offsite Display Facebook', headroom: 95.7 },
    { name: 'Offsite Enterprise Network - Preroll & Display', headroom: 1.4 },
    { name: 'Offsite Display Enterprise DSP CTV (video)', headroom: 2.8 },
    { name: 'Instore TV Wall', headroom: 199.6 }
];

export default function HeadroomChart() {
    return (
        <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
            <h5 style={{ textAlign: 'center', fontSize: '14px', marginBottom: '24px', color: '#475569', fontWeight: '700' }}>
                Headroom Analysis
            </h5>
            <div style={{ height: '500px', width: '100%' }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ left: 250, right: 80, top: 10, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: '600' }}
                            width={240}
                        />
                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="headroom" fill="#004f91" radius={[0, 4, 4, 0]} barSize={12}>
                            <LabelList dataKey="headroom" position="right" style={{ fill: '#475569', fontSize: 10, fontWeight: '700' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', marginTop: '20px' }}>
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#475569', textAlign: 'center' }}>
                    <strong>Headroom:</strong> Denotes the gap between Current Daily Spends to Saturation Level Daily Spends
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
                    e.g. The 8.2 value for Sponsored Products Automatic means that the spends for this variable can be increased 8.2 times before it reaches saturation levels
                </div>
            </div>
        </div>
    );
}
