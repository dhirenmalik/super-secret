import React, { useState } from 'react';

const BrandExclusionTable = ({ data }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'sales_share', direction: 'descending' });

    if (!data || !data.rows) return null;

    const sortedData = [...data.rows].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('brand')} className="cursor-pointer">Brand{getSortIcon('brand')}</th>
                        <th onClick={() => requestSort('sales_share')} className="cursor-pointer">Sales Share{getSortIcon('sales_share')}</th>
                        <th onClick={() => requestSort('spend_share')} className="cursor-pointer">Spend Share{getSortIcon('spend_share')}</th>
                        <th onClick={() => requestSort('unit_share')} className="cursor-pointer">Unit Share{getSortIcon('unit_share')}</th>
                        <th title="Private Brand Label">Private</th>
                        <th title="Mapping Issue Brand">Mapping</th>
                        <th title="Combine with higher parent">Combine</th>
                        <th>Exclude</th>
                        <th>Issue Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, index) => (
                        <tr key={index}>
                            <td style={{ fontWeight: 600 }}>{row.brand}</td>
                            <td>{(row.sales_share || 0).toFixed(2)}%</td>
                            <td>{(row.spend_share || 0).toFixed(2)}%</td>
                            <td>{(row.unit_share || 0).toFixed(2)}%</td>
                            <td style={{ textAlign: 'center' }}>
                                {row.private_brand === 1 && (
                                    <span className="badge badge-error">PB</span>
                                )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                {row.mapping_issue === 1 && (
                                    <span className="badge badge-warning">MI</span>
                                )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                {row.combine_flag === 1 && (
                                    <span className="badge badge-info">Yes</span>
                                )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <span className={`badge ${row.exclude_flag === 1 ? 'badge-error' : 'badge-success'}`}>
                                    {row.exclude_flag === 1 ? 'Yes' : 'No'}
                                </span>
                            </td>
                            <td>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {row.reason_issue_type === 'low_share' ? 'Low Sales Share (<0.1%)' : row.reason_issue_type === 'none' ? '-' : row.reason_issue_type}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BrandExclusionTable;
