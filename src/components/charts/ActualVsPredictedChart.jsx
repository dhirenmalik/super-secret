import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Generate simulated data for Actual vs Predicted
const generateComparisonData = () => {
    const data = [];
    const startDate = new Date('2022-10-01');
    const endDate = new Date('2025-07-31');

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        // Base value with some seasonality and noise
        let base = 70000 + Math.random() * 40000;

        // Seasonality peaks
        if (month === 10 || month === 11) base += 300000 + Math.random() * 200000; // Holiday
        if (month === 4 || month === 5) base += 100000 + Math.random() * 100000; // Summer

        // Match the large spikes in the image
        if (year === 2022 && month === 10 && currentDate.getDate() > 20) base = 650000;
        if (year === 2023 && month === 9 && currentDate.getDate() > 20) base = 750000;
        if (year === 2023 && month === 10 && currentDate.getDate() > 20) base = 680000;
        if (year === 2024 && month === 10 && currentDate.getDate() > 20) base = 600000;

        const actual = Math.max(10000, base + (Math.random() - 0.5) * 40000);
        // Predicted follows actual with very minor error
        const predicted = actual * (0.95 + Math.random() * 0.1);

        data.push({
            date: dateStr,
            Actual: Math.round(actual),
            Predicted: Math.round(predicted)
        });

        currentDate.setDate(currentDate.getDate() + 7);
    }
    return data;
};

const comparisonData = generateComparisonData();

export default function ActualVsPredictedChart({ height = 400 }) {
    return (
        <div style={{ width: '100%', height: height, padding: '20px' }}>
            <div style={{ marginBottom: '20px', fontFamily: 'monospace', fontSize: '13px' }}>
                <div style={{ fontWeight: 'bold' }}>**********TRAIN FIT***********</div>
                <div>r2: 0.8870252048292756</div>
                <div>MAPE: 15.338175065052958</div>
            </div>

            <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e293b', fontWeight: '500' }}>Actual vs Predicted Modeling Period</h4>

            <ResponsiveContainer>
                <LineChart
                    data={comparisonData}
                    margin={{ top: 5, right: 30, left: 40, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        ticks={['2023-01-01', '2023-07-01', '2024-01-01', '2024-07-01', '2025-01-01', '2025-07-01']}
                        tickFormatter={(str) => {
                            const d = new Date(str);
                            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(val) => val.toLocaleString('en-US')}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: 'var(--shadow-lg)',
                            fontSize: '12px'
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        height={50}
                        iconType="line"
                        formatter={(value) => <span style={{ color: '#475569', fontSize: '12px' }}>Modeling {value}</span>}
                    />
                    <Line
                        type="monotone"
                        dataKey="Actual"
                        stroke="#0071dc"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Predicted"
                        stroke="#ffc220"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
