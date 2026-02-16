import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Generate simulated data based on the image provided
const generatePacingData = () => {
    const data = [];
    const startDate = new Date('2022-09-01');
    const endDate = new Date('2025-08-31');

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        // Base value
        let value = 50000 + Math.random() * 50000;

        // Add yearly spikes (Black Friday / Holiday season)
        if (month === 10 || month === 11) { // Nov/Dec
            value += Math.random() * 400000;
            // Major peaks
            if (month === 10 && currentDate.getDate() > 15 && currentDate.getDate() < 25) {
                if (year === 2022) value = 950000;
                if (year === 2023) value = 750000;
                if (year === 2024) value = 600000;
            }
        }

        // Secondary peaks
        if (month === 5 || month === 6) { // Summer
            value += Math.random() * 100000;
        }

        data.push({
            date: dateStr,
            O_UNIT: Math.round(value)
        });

        // Advance by 1 week to keep data manageable
        currentDate.setDate(currentDate.getDate() + 7);
    }
    return data;
};

const pacingData = generatePacingData();

export default function OUnitPacingChart({ height = 350 }) {
    return (
        <div style={{ width: '100%', height: height }}>
            <h4 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', color: '#1a1a2e' }}>SOFTWARE : O_UNIT pacing</h4>
            <ResponsiveContainer>
                <LineChart
                    data={pacingData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        ticks={['2022-09-01', '2023-01-01', '2023-05-01', '2023-09-01', '2024-01-01', '2024-05-01', '2024-09-01', '2025-01-01', '2025-05-01', '2025-09-01']}
                        interval={'preserveStartEnd'}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: 'var(--shadow-lg)',
                            fontSize: '13px'
                        }}
                    />
                    <Legend verticalAlign="top" align="right" height={36} />
                    <Line
                        type="monotone"
                        dataKey="O_UNIT"
                        stroke="#0000FF"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
