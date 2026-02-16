import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
    { name: 'Variable A', Value1: 4000, Value2: 2400 },
    { name: 'Variable B', Value1: 3000, Value2: 1398 },
    { name: 'Variable C', Value1: 2000, Value2: 9800 },
    { name: 'Variable D', Value1: 2780, Value2: 3908 },
    { name: 'Variable E', Value1: 1890, Value2: 4800 },
];

export default function ComparisonBarChart({ height = 300 }) {
    return (
        <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                    <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="Value1" name="Dataset 1" fill="#0071dc" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Value2" name="Dataset 2" fill="#ffc220" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
