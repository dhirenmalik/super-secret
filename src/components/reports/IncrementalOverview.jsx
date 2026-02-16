import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const pieData = [
    { name: 'Total incremental', value: 5.4, color: '#0071dc' },
    { name: 'Base', value: 94.6, color: '#e2e8f0' }
];

const barData = [
    { name: "Previous: Aug'23 - Jul'24", Incremental: 6.9, Base: 93.1 },
    { name: "Latest: Aug'24 - Jul'25", Incremental: 5.3, Base: 94.7 }
];

export default function IncrementalOverview() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
                <h5 style={{ textAlign: 'center', fontSize: '14px', marginBottom: '20px', color: '#475569' }}>
                    WMC Incremental Contribution (Dec'22 - Jul'25)
                </h5>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, value }) => `${value}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
                <h5 style={{ textAlign: 'center', fontSize: '14px', marginBottom: '20px', color: '#475569' }}>
                    WMC Incremental Contribution by Year
                </h5>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer>
                        <BarChart data={barData} layout="vertical" margin={{ left: 50, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                            />
                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                            <Legend verticalAlign="bottom" height={36} />
                            <Bar dataKey="Base" stackId="a" fill="#e2e8f0" barSize={40} />
                            <Bar dataKey="Incremental" stackId="a" fill="#0071dc" barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
