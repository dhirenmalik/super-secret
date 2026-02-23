import React from 'react';

const tacticsData = [
    { sbu: 'SOFTWARE', tactic: 'M_ON_DIS_AT_SUM_IMP', spend: 4725643, days: 1078, imp_clk: 402175540, min: 2591, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_ON_DIS_CT_SUM_IMP', spend: 4308772, days: 1076, imp_clk: 355527583, min: 7108, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_OFF_DIS_WN_WITHOUTCTV_SUM_IMP', spend: 3649578, days: 952, imp_clk: 924174614, min: 5967, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_INSTORE_TV_WALL_SUM_IMP', spend: 2483829, days: 901, imp_clk: 6827323464, min: 373, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_OFF_DIS_DSP_CTV_SUM_IMP', spend: 2185351, days: 417, imp_clk: 64630919, min: 104, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_SP_AB_CLK', spend: 1875264, days: 1089, imp_clk: 2934090, min: 107, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_SP_KWB_CLK', spend: 1410484, days: 978, imp_clk: 1845915, min: 1, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_ON_DIS_HPGTO_SUM_IMP', spend: 1397227, days: 50, imp_clk: 224467271, min: 0, q1: 17 },
    { sbu: 'SOFTWARE', tactic: 'M_ON_DIS_HPLO_SUM_IMP', spend: 1152851, days: 30, imp_clk: 245333322, min: 0, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_ON_DIS_APP_HPLO_SUM_IMP', spend: 1145619, days: 72, imp_clk: 135125773, min: 0, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_ON_DIS_KW_SUM_IMP', spend: 1124300, days: 1079, imp_clk: 83178705, min: 38, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_SBA_CLK', spend: 885468, days: 1038, imp_clk: 738691, min: 1, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_ON_DIS_CATTO_SUM_IMP', spend: 397700, days: 131, imp_clk: 21338148, min: 0, q1: 0 },
    { sbu: 'SOFTWARE', tactic: 'M_OFF_DIS_FB_SUM_IMP', spend: 341861, days: 339, imp_clk: 47712376, min: 138, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_ON_DIS_ROS_SUM_IMP', spend: 72376, days: 406, imp_clk: 27538067, min: 73, q1: 1 },
    { sbu: 'SOFTWARE', tactic: 'M_SV_CLK', spend: 56998, days: 432, imp_clk: 39695, min: 1, q1: 1 },
];

export default function MediaTacticsTable() {
    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th style={{ backgroundColor: '#f4f7fb' }}>SBU</th>
                        <th style={{ backgroundColor: '#f4f7fb' }}>Media_tactic</th>
                        <th style={{ backgroundColor: '#f4f7fb' }}>Total_spend</th>
                        <th style={{ backgroundColor: '#f4f7fb' }}>On_Air_Days</th>
                        <th style={{ backgroundColor: '#f4f7fb' }}>Total_IMP/CLK</th>
                        <th style={{ backgroundColor: '#f4f7fb' }}>Min_IMP/CLK</th>
                    </tr>
                </thead>
                <tbody>
                    {tacticsData.map((row, idx) => (
                        <tr key={idx}>
                            <td style={{ fontSize: '12px' }}>{row.sbu}</td>
                            <td style={{ fontSize: '11px', fontWeight: '500', color: '#0071dc' }}>{row.tactic}</td>
                            <td style={{ fontSize: '12px', textAlign: 'right' }}>{row.spend.toLocaleString('en-US')}</td>
                            <td style={{ fontSize: '12px', textAlign: 'right' }}>{row.days}</td>
                            <td style={{ fontSize: '12px', textAlign: 'right' }}>{row.imp_clk.toLocaleString('en-US')}</td>
                            <td style={{ fontSize: '12px', textAlign: 'right' }}>{row.min}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
