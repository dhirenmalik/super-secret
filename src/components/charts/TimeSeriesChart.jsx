import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
    { name: 'Jan', Sales: 4000, Units: 2400, Spend: 2400 },
    { name: 'Feb', Sales: 3000, Units: 1398, Spend: 2210 },
    { name: 'Mar', Sales: 2000, Units: 9800, Spend: 2290 },
    { name: 'Apr', Sales: 2780, Units: 3908, Spend: 2000 },
    { name: 'May', Sales: 1890, Units: 4800, Spend: 2181 },
    { name: 'Jun', Sales: 2390, Units: 3800, Spend: 2500 },
    { name: 'Jul', Sales: 3490, Units: 4300, Spend: 2100 },
];

export default function TimeSeriesChart({ type = 'line', height = 300 }) {
    if (type === 'area') {
        return (
            <div style={{ width: '100%', height: height }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0071dc" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#0071dc" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            cursor={{ stroke: '#0071dc', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area type="monotone" dataKey="Sales" stroke="#0071dc" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="Sales" stroke="#0071dc" strokeWidth={2} dot={{ r: 4, fill: '#0071dc', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Units" stroke="#ffc220" strokeWidth={2} dot={{ r: 4, fill: '#ffc220', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
