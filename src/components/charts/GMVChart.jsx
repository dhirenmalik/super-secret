import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Generate mock daily data from Dec 22 to Jul 25
const generateData = () => {
    const data = [];
    const start = new Date('2022-12-01');
    const end = new Date('2025-07-31');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        const month = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear().toString().slice(-2);
        const dayOfWeek = d.getDay();

        // Base value with growth over time
        const timeFactor = (d - start) / (end - start);

        // In-store: High volatility, weekly peaks
        const inStoreBase = 400 + (timeFactor * 100);
        const inStorePeak = Math.sin(d.getTime() / (1000 * 60 * 60 * 24 * 7) * 2 * Math.PI) * 150;
        const inStoreRandom = Math.random() * 50;

        // Online: Lower base, sharper peaks
        const onlineBase = 80 + (timeFactor * 60);
        const onlinePeak = Math.sin(d.getTime() / (1000 * 60 * 60 * 24 * 7) * 2 * Math.PI) * 40;
        const onlineRandom = Math.random() * 20;

        data.push({
            date: `${month} ${year}`,
            inStore: Math.max(0, inStoreBase + inStorePeak + inStoreRandom),
            online: Math.max(0, onlineBase + onlinePeak + onlineRandom),
            fullDate: new Date(d)
        });
    }
    return data;
};

const gmvData = generateData();

export default function GMVChart() {
    return (
        <div className="card" style={{ padding: '24px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>IN-STORE GMV ($) & ONLINE GMV ($)</h3>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Proprietary & Confidential</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Online GMV Share (%)</div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>13.2%</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Online GMV($) YoY (%)</div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>36.1%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>In-Store GMV($)</div>
                <div style={{ height: '180px', width: '100%' }}>
                    <ResponsiveContainer>
                        <LineChart data={gmvData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                interval={8}
                            />
                            <YAxis hide />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="inStore"
                                stroke="#00b4ff"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>Online* GMV($)</div>
                <div style={{ height: '180px', width: '100%' }}>
                    <ResponsiveContainer>
                        <LineChart data={gmvData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                interval={8}
                            />
                            <YAxis hide />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="online"
                                stroke="#00b4ff"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>
                    *Online includes dotcom and online VG Software
                </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '20px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8' }}>
                <div>PROPRIETARY & CONFIDENTIAL</div>
                <div>Source: Enterprise Omnichannel Sales, Dec 2022 - Jul 2025</div>
            </div>
        </div>
    );
}
