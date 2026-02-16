import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
    { name: 'Pre-Promo', Sales: 590, Forecast: 800, Lift: 140 },
    { name: 'Wk 1', Sales: 868, Forecast: 967, Lift: 150 },
    { name: 'Wk 2', Sales: 1397, Forecast: 1098, Lift: 989 },
    { name: 'Wk 3', Sales: 1480, Forecast: 1200, Lift: 1228 },
    { name: 'Wk 4', Sales: 1520, Forecast: 1108, Lift: 1100 },
    { name: 'Post-Promo', Sales: 1400, Forecast: 680, Lift: 170 },
];

export default function ReportPreviewChart({ height = 400 }) {
    return (
        <div style={{ width: '100%', height: height, background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#333' }}>Campaign Performance Preview</h3>
            <ResponsiveContainer>
                <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                    <CartesianGrid stroke="#f5f5f5" />
                    <XAxis dataKey="name" scale="band" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Sales" barSize={20} fill="#0071dc" />
                    <Line yAxisId="right" type="monotone" dataKey="Lift" stroke="#ffc220" strokeWidth={3} />
                    <Line yAxisId="left" type="monotone" dataKey="Forecast" stroke="#2e2e2e" strokeDasharray="5 5" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
