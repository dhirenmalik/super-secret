import PageHeader from '../components/PageHeader';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import ComparisonBarChart from '../components/charts/ComparisonBarChart';

const step = steps.find((s) => s.slug === 'discovery-tool-analysis');

// Helper function to get color based on value
const getSpendColor = (value) => {
    const numValue = parseFloat(value);
    if (numValue < 5) return '#FF6B6B'; // Red
    if (numValue < 10) return '#FFE66D'; // Yellow
    if (numValue < 20) return '#C7F0BD'; // Light green
    return '#95E1D3'; // Green
};

export default function DiscoveryToolAnalysis() {
    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Create reports with trends, charts, and comparisons at total and variable level."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="not_started" />
            </PageHeader>

            <div className="grid-2">
                {/* Discovery Tool Details */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon blue">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18" />
                                    <path d="M9 21V9" />
                                </svg>
                            </div>
                            Discovery Tool Details
                        </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                        {/* Category Info */}
                        <table style={{ width: '100%', marginBottom: '20px', fontSize: '13px', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr style={{ background: '#4472C4', color: 'white' }}>
                                    <td style={{ padding: '8px', fontWeight: 600, border: '1px solid #2E5AA8' }}>Category:</td>
                                    <td style={{ padding: '8px', border: '1px solid #2E5AA8' }}>D05 VG SOFTWARE</td>
                                </tr>
                                <tr style={{ background: '#4472C4', color: 'white' }}>
                                    <td style={{ padding: '8px', fontWeight: 600, border: '1px solid #2E5AA8' }}>Modeling Time Period:</td>
                                    <td style={{ padding: '8px', border: '1px solid #2E5AA8' }}>Dec'22 - Jul'25</td>
                                </tr>
                                <tr style={{ background: '#4472C4', color: 'white' }}>
                                    <td style={{ padding: '8px', fontWeight: 600, border: '1px solid #2E5AA8' }}>Subcategories Included</td>
                                    <td style={{ padding: '8px', border: '1px solid #2E5AA8' }}>SOFTWARE</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* YOY Change */}
                        <table style={{ width: '100%', marginBottom: '20px', fontSize: '13px', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                            <thead>
                                <tr style={{ background: '#4472C4', color: 'white' }}>
                                    <th colSpan="3" style={{ padding: '8px', textAlign: 'center', border: '1px solid #2E5AA8' }}>YOY Change %</th>
                                </tr>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Omni Unit Sales</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Omni GMV ($)</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>WMC Spends ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-6%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-20%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-24%</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Overall Period */}
                        <table style={{ width: '100%', marginBottom: '20px', fontSize: '13px', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                            <thead>
                                <tr style={{ background: '#4472C4', color: 'white' }}>
                                    <th colSpan="5" style={{ padding: '8px', textAlign: 'center', border: '1px solid #2E5AA8' }}>Overall period</th>
                                </tr>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>WMC Penetration(%)</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Price</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Unit Sales Online</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>GMV Sales Online</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>#Brands in final stack</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>1.51%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>$19.3</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>10%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>18%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>30</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Key Metrics Summary */}
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                            <thead>
                                <tr style={{ background: '#4472C4', color: 'white' }}>
                                    <th colSpan="5" style={{ padding: '8px', textAlign: 'center', border: '1px solid #2E5AA8' }}>Key Metrics Summary</th>
                                </tr>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}></th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Unit Sales Online (%)</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>GMV Sales Online (%)</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>WMC Penetration(%)</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Dec'22 - Jul'23</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>8.9%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>16.2%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>1.0%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>$20.5</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Aug'23 - Jul'24</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>10.2%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>18.2%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>1.8%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>$20.4</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>Aug'24 - Jul'25</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>9.3%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>20.1%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>1.7%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>$17.3</td>
                                </tr>
                                <tr style={{ background: '#f8f9fa', fontWeight: 600 }}>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>Change YOY %</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-8%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-12%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-5%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-15%</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ marginTop: '20px' }}>
                            <button className="btn btn-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                Generate Discovery Report
                            </button>
                        </div>
                    </div>
                </div>

                {/* Key Metrics - Media Tactics */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18" />
                                    <path d="M9 21V9" />
                                </svg>
                            </div>
                            Key Metrics - Media Tactics
                        </div>
                    </div>
                    <div style={{ padding: '16px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                            <thead>
                                <tr style={{ background: '#4472C4', color: 'white' }}>
                                    <th rowSpan="2" style={{ padding: '6px', border: '1px solid #2E5AA8', fontWeight: 600 }}></th>
                                    <th colSpan="3" style={{ padding: '6px', border: '1px solid #2E5AA8', textAlign: 'center', fontWeight: 600 }}>Spend Share</th>
                                    <th rowSpan="2" style={{ padding: '6px', border: '1px solid #2E5AA8', fontWeight: 600 }}>Change YOY %</th>
                                    <th colSpan="2" style={{ padding: '6px', border: '1px solid #2E5AA8', textAlign: 'center', fontWeight: 600 }}>CPC/CPM/CPD Aug'24 - Jul'25</th>
                                </tr>
                                <tr style={{ background: '#4472C4', color: 'white' }}>
                                    <th style={{ padding: '6px', border: '1px solid #2E5AA8', fontWeight: 600 }}>Dec'22 - Jul'23</th>
                                    <th style={{ padding: '6px', border: '1px solid #2E5AA8', fontWeight: 600 }}>Aug'23 - Jul'24</th>
                                    <th style={{ padding: '6px', border: '1px solid #2E5AA8', fontWeight: 600 }}>Aug'24 - Jul'25</th>
                                    <th style={{ padding: '6px', border: '1px solid #2E5AA8', fontWeight: 600 }}>CPC/CPM/CPD YOY change %</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '10px' }}>
                                <tr style={{ fontWeight: 600 }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd' }}>Search Total</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>18.5%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>11.3%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>21.0%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>42%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.2</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>63%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('7.9') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Sponsored Products Automatic</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>7.9%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>4.4%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>10.3%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>75%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.2</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>108%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('6.8') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Sponsored Products Manual</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>6.8%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.3%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>6.8%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>55%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.1</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>76%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('3.7') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Sponsored Brands</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.7%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.1%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.8%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-7%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.3</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('0.0') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Sponsored Product Video</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.0%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.4%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.2%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-70%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.9</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-49%</td>
                                </tr>
                                <tr style={{ fontWeight: 600 }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd' }}>Onsite Display Total</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>64.2%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>53.6%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>39.9%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-44%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>8.0</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-16%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('26.9') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Onsite Display Audience Targeting</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>26.9%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>15.7%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>14.2%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-32%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>8.9</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-31%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('20.2') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Onsite Display Contextual Targeting</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>20.2%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>16.0%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>9.4%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-55%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>9.9</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-25%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('0.7') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Onsite Display Category Takeover</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.7%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.5%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.3%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-35%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>2,171</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-42%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('3.8') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Onsite Display Keyword</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.8%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.6%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>5.2%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>8%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>11.8</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-12%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('0.4') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Onsite Display Run-Of-Site</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.4%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.2%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.0%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-100%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('8.6') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Onsite Display Homepage Lockout</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>8.6%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.8%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.4%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-32%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>134,345</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>69%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('1.5') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Onsite Display APP Homepage Lockout</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.5%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>5.9%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>4.0%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-49%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>28,557</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-21%</td>
                                </tr>
                                <tr style={{ fontWeight: 600 }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd' }}>Offsite Display Total</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>12.2%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>17.1%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>34.4%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>52%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>9.4</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>107%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('1.3') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Offsite Display Facebook</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.3%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>1.9%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.5%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-80%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>4.0</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-45%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('10.9') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Offsite WN - Display & Preroll</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>10.9%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>12.1%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>10.6%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-34%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.7</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>6%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('0.0') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>Offsite Display Walmart DSP CTV</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.0%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>3.2%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>23.3%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>451%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>33.1</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-13%</td>
                                </tr>
                                <tr style={{ background: getSpendColor('5.1') }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', paddingLeft: '15px' }}>TV Wall</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>5.1%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>18.0%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>4.7%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>-80%</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>0.7</td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>84%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Chart Placeholders */}
            <div className="grid-2" style={{ marginTop: '20px' }}>
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon yellow">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                            </div>
                            Key Events - GMV Sales
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <TimeSeriesChart height={300} type="area" />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 3v18h18" />
                                    <path d="m19 9-5 5-4-4-3 3" />
                                </svg>
                            </div>
                            Spend vs Impressions
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <ComparisonBarChart
                            title="Media Performance Analysis"
                            data={[
                                { date: 'Variable A', spend: 3500, impressions: 4200 },
                                { date: 'Variable B', spend: 2200, impressions: 1800 },
                                { date: 'Variable C', spend: 3800, impressions: 2800 },
                                { date: 'Variable D', spend: 2400, impressions: 9800 },
                                { date: 'Variable E', spend: 4800, impressions: 5200 },
                            ]}
                            dataKey1="spend"
                            dataKey2="impressions"
                            color1="#FFA726"
                            color2="#0071DC"
                            height={300}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '20px' }}>
                <AutomationNote notes={step.automationNotes} />
            </div>
        </div>
    );
}
