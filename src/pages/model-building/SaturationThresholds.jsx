import React from 'react';
import BasePage from './BasePage';

const sat_bound_dict = {
    "M_SP_AB_CLK": [0.4, 1.2],
    "M_SP_KWB_CLK": [0.4, 1.2],
    "M_SBA_CLK": [0.4, 1.2],
    "M_SV_CLK": [0.4, 1.2],
    "M_ON_DIS_AT_SUM_IMP": [0.8, -0.3],
    "M_ON_DIS_CT_SUM_IMP": [0.9, -0.7],
    "M_ON_DIS_CATTO_SUM_IMP": [0.4, 1.2],
    "M_ON_DIS_KW_SUM_IMP": [0.4, 1.2],
    "M_ON_DIS_ROS_SUM_IMP": [0.4, 1.2],
    "M_ON_DIS_HPLO_SUM_IMP": [0.4, 2],
    "M_ON_DIS_APP_HPLO_SUM_IMP": [0.4, 2],
    "M_ON_DIS_HPGTO_SUM_IMP": [0.6, -0.2],
    "M_OFF_DIS_WN_WITHOUTCTV_SUM_IMP": [0.9, -0.6],
    "M_OFF_DIS_DSP_CTV_SUM_IMP": [0.9, -0.3],
    "M_OFF_DIS_FB_SUM_IMP": [0.4, 1.2],
    "M_INSTORE_TV_WALL_SUM_IMP": [0.9, 9]
};

const thres_bound_dict = {
    "M_SP_AB_CLK": [0.3, 0.3],
    "M_SP_KWB_CLK": [0.3, 0.3],
    "M_SBA_CLK": [0.3, 0.3],
    "M_SV_CLK": [0.3, 0.3],
    "M_ON_DIS_AT_SUM_IMP": [0.5, 0.5],
    "M_ON_DIS_CT_SUM_IMP": [0.3, 0.3],
    "M_ON_DIS_CATTO_SUM_IMP": [0.3, 0.3],
    "M_ON_DIS_KW_SUM_IMP": [0.3, 0.3],
    "M_ON_DIS_ROS_SUM_IMP": [0.3, 0.3],
    "M_ON_DIS_HPLO_SUM_IMP": [0.3, 0.3],
    "M_ON_DIS_APP_HPLO_SUM_IMP": [0.3, 0.3],
    "M_ON_DIS_HPGTO_SUM_IMP": [0.3, 0.3],
    "M_OFF_DIS_WN_WITHOUTCTV_SUM_IMP": [0.3, 0.3],
    "M_OFF_DIS_DSP_CTV_SUM_IMP": [0.5, 0.5],
    "M_OFF_DIS_FB_SUM_IMP": [0.3, 0.3],
    "M_INSTORE_TV_WALL_SUM_IMP": [0.3, 0.3]
};

export default function SaturationThresholds() {
    return (
        <BasePage stepId={18}>
            <div className="card" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
                <div style={{ display: 'flex', gap: '12px', padding: '16px' }}>
                    <div style={{ color: '#f59e0b' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>Stability Warning</div>
                        <div style={{ fontSize: '13px', color: '#b45309', lineHeight: '1.5' }}>
                            Keeping high upper bound for threshold and low lower bound for saturation might cause a very narrow range for S-curve.
                            In cases where there are no raw data points between the range, DE can run into <strong>data sparsity errors</strong>.
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20v-6M6 20V10M18 20V4" />
                            </svg>
                        </div>
                        Saturation & Threshold Bounds
                    </div>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Media Variable</th>
                                <th style={{ textAlign: 'center' }}>Saturation [L, U]</th>
                                <th style={{ textAlign: 'center' }}>Threshold [L, U]</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(sat_bound_dict).map((variable) => (
                                <tr key={variable}>
                                    <td style={{ fontWeight: '600', fontSize: '11px' }}>{variable}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            color: '#15803d',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: '700'
                                        }}>
                                            [{sat_bound_dict[variable][0]}, {sat_bound_dict[variable][1]}]
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            background: 'rgba(0, 113, 220, 0.1)',
                                            color: 'var(--color-primary)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: '700'
                                        }}>
                                            [{thres_bound_dict[variable][0]}, {thres_bound_dict[variable][1]}]
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="btn btn-primary">Update Bounds & Recalculate</button>
            </div>
        </BasePage>
    );
}
