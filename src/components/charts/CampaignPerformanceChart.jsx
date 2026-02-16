import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CampaignPerformanceChart({ data, title = "Campaign Performance Preview" }) {
    return (
        <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text)' }}>
                {title}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value, name) => {
                            if (name === 'sales') return [value, 'Sales'];
                            if (name === 'lift') return [value, 'Lift'];
                            if (name === 'forecast') return [value, 'Forecast'];
                            return [value, name];
                        }}
                        labelFormatter={(label) => label}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => {
                            if (value === 'sales') return 'Sales';
                            if (value === 'lift') return 'Lift';
                            if (value === 'forecast') return 'Forecast';
                            return value;
                        }}
                    />
                    <Bar
                        yAxisId="left"
                        dataKey="sales"
                        fill="#0071DC"
                        radius={[4, 4, 0, 0]}
                        name="sales"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="lift"
                        stroke="#FFA726"
                        strokeWidth={3}
                        dot={{ fill: '#FFA726', r: 4 }}
                        name="lift"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="forecast"
                        stroke="#94A3B8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="forecast"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
