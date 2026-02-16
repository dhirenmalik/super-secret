import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DataStaging from './pages/DataStaging';
import DataPull from './pages/DataPull';
import DataPlatformConnection from './pages/DataPlatformConnection';
import KickoffReport from './pages/KickoffReport';
import KickoffReportReview from './pages/KickoffReportReview';
import ExcludeFlagAnalysis from './pages/ExcludeFlagAnalysis';
import ExcludeFlagReview from './pages/ExcludeFlagReview';
import BrandStacksCreation from './pages/BrandStacksCreation';
import DiscoveryToolAnalysis from './pages/DiscoveryToolAnalysis';
import ToolReview from './pages/ToolReview';
import EdaEmailReport from './pages/EdaEmailReport';

// Model Building Pages
import EDACodeRun from './pages/model-building/EDACodeRun';
import CategoryConfig from './pages/model-building/CategoryConfig';
import DummySelection from './pages/model-building/DummySelection';
import DummySelectionValidation from './pages/model-building/DummySelectionValidation';
import BestBaseSelection from './pages/model-building/BestBaseSelection';
import SaturationThresholds from './pages/model-building/SaturationThresholds';
import SCurveAdjustments from './pages/model-building/SCurveAdjustments';
import ModelFitOverall from './pages/model-building/ModelFitOverall';
import ModelValidationMedia from './pages/model-building/ModelValidationMedia';
import FinalModelValidation from './pages/model-building/FinalModelValidation';
import ReportsPrep from './pages/model-building/ReportsPrep';

// Optimisation Pages
import InputPrepOptimisation from './pages/optimisation/InputPrepOptimisation';
import ScenarioAlignment from './pages/optimisation/ScenarioAlignment';
import OptimisationReview from './pages/optimisation/OptimisationReview';

// Reporting Pages
import ModelDeckInput from './pages/reporting/ModelDeckInput';
import AutomationCode from './pages/reporting/AutomationCode';
import TableauPopulation from './pages/reporting/TableauPopulation';
import Documentation from './pages/reporting/Documentation';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />

                {/* ETL Phase */}
                <Route path="step/data-staging" element={<DataStaging />} />
                <Route path="step/data-pull" element={<DataPull />} />
                <Route path="step/data-platform-connection" element={<DataPlatformConnection />} />

                {/* EDA Phase */}
                <Route path="step/kickoff-report" element={<KickoffReport />} />
                <Route path="step/kickoff-report-review" element={<KickoffReportReview />} />
                <Route path="step/exclude-flag-analysis" element={<ExcludeFlagAnalysis />} />
                <Route path="step/exclude-flag-review" element={<ExcludeFlagReview />} />
                <Route path="step/brand-stacks-creation" element={<BrandStacksCreation />} />
                <Route path="step/discovery-tool-analysis" element={<DiscoveryToolAnalysis />} />
                <Route path="step/tool-review" element={<ToolReview />} />
                <Route path="step/eda-email-report" element={<EdaEmailReport />} />

                {/* Model Building Phase */}
                <Route path="step/eda-code-run" element={<EDACodeRun />} />
                <Route path="step/category-config" element={<CategoryConfig />} />
                <Route path="step/dummy-selection" element={<DummySelection />} />
                <Route path="step/dummy-selection-validation" element={<DummySelectionValidation />} />
                <Route path="step/best-base-selection" element={<BestBaseSelection />} />
                <Route path="step/saturation-thresholds" element={<SaturationThresholds />} />
                <Route path="step/s-curve-adjustments" element={<SCurveAdjustments />} />
                <Route path="step/model-fit-overall" element={<ModelFitOverall />} />
                <Route path="step/model-validation-media" element={<ModelValidationMedia />} />
                <Route path="step/final-model-validation" element={<FinalModelValidation />} />
                <Route path="step/reports-prep" element={<ReportsPrep />} />

                {/* Optimisation Phase */}
                <Route path="step/input-prep-optimisation" element={<InputPrepOptimisation />} />
                <Route path="step/scenario-alignment" element={<ScenarioAlignment />} />
                <Route path="step/optimisation-review" element={<OptimisationReview />} />

                {/* Reporting Phase */}
                <Route path="step/model-deck-input" element={<ModelDeckInput />} />
                <Route path="step/automation-code" element={<AutomationCode />} />
                <Route path="step/tableau-population" element={<TableauPopulation />} />
                <Route path="step/documentation" element={<Documentation />} />
            </Route>
        </Routes>
    );
}

export default App;
