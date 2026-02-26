import React from 'react';

export default function InputTab({ input_sheet }) {
    return (
        <div className="p-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 max-w-lg mb-8">
                <table className="min-w-full text-left text-sm">
                    <tbody className="divide-y divide-slate-100">
                        <tr>
                            <td className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 w-1/3">Select Brand</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{input_sheet.brand}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 bg-slate-50 font-semibold text-slate-700">Start Date</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(input_sheet.start_date).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 bg-slate-50 font-semibold text-slate-700">End Date</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(input_sheet.end_date).toLocaleDateString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Custom Time Periods</h4>
            <div className="overflow-hidden rounded-2xl border border-slate-200 max-w-2xl">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase tracking-widest text-slate-500">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Period</th>
                            <th className="px-4 py-3 font-semibold">Start Date</th>
                            <th className="px-4 py-3 font-semibold">End Date</th>
                            <th className="px-4 py-3 font-semibold">Months</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {input_sheet.custom_periods.map((p, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3 font-semibold text-slate-900">{p.label}</td>
                                <td className="px-4 py-3 text-slate-600">{new Date(p.start).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-slate-600">{new Date(p.end).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-slate-600">{p.months}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
