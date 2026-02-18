import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
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
import EdaDataHub from './pages/EdaDataHub';

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
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />

                    {/* ETL Phase */}
                    <Route path="step/data-staging" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <DataStaging />
                        </ProtectedRoute>
                    } />
                    <Route path="step/data-pull" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <DataPull />
                        </ProtectedRoute>
                    } />
                    <Route path="step/data-platform-connection" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <DataPlatformConnection />
                        </ProtectedRoute>
                    } />

                    {/* EDA Phase */}
                    <Route path="step/kickoff-report" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <KickoffReport />
                        </ProtectedRoute>
                    } />
                    <Route path="step/kickoff-report-review" element={
                        <ProtectedRoute allowedRoles={['admin', 'reviewer']}>
                            <KickoffReportReview />
                        </ProtectedRoute>
                    } />
                    <Route path="step/eda-data-hub" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <EdaDataHub />
                        </ProtectedRoute>
                    } />
                    <Route path="step/exclude-flag-analysis" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <ExcludeFlagAnalysis />
                        </ProtectedRoute>
                    } />
                    <Route path="step/exclude-flag-review" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <ExcludeFlagReview />
                        </ProtectedRoute>
                    } />
                    <Route path="step/brand-stacks-creation" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <BrandStacksCreation />
                        </ProtectedRoute>
                    } />
                    <Route path="step/discovery-tool-analysis" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <DiscoveryToolAnalysis />
                        </ProtectedRoute>
                    } />
                    <Route path="step/tool-review" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <ToolReview />
                        </ProtectedRoute>
                    } />
                    <Route path="step/eda-email-report" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <EdaEmailReport />
                        </ProtectedRoute>
                    } />

                    {/* Model Building Phase */}
                    <Route path="step/eda-code-run" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <EDACodeRun />
                        </ProtectedRoute>
                    } />
                    <Route path="step/category-config" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <CategoryConfig />
                        </ProtectedRoute>
                    } />
                    <Route path="step/dummy-selection" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <DummySelection />
                        </ProtectedRoute>
                    } />
                    <Route path="step/dummy-selection-validation" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <DummySelectionValidation />
                        </ProtectedRoute>
                    } />
                    <Route path="step/best-base-selection" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <BestBaseSelection />
                        </ProtectedRoute>
                    } />
                    <Route path="step/saturation-thresholds" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <SaturationThresholds />
                        </ProtectedRoute>
                    } />
                    <Route path="step/s-curve-adjustments" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <SCurveAdjustments />
                        </ProtectedRoute>
                    } />
                    <Route path="step/model-fit-overall" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <ModelFitOverall />
                        </ProtectedRoute>
                    } />
                    <Route path="step/model-validation-media" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <ModelValidationMedia />
                        </ProtectedRoute>
                    } />
                    <Route path="step/final-model-validation" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <FinalModelValidation />
                        </ProtectedRoute>
                    } />
                    <Route path="step/reports-prep" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <ReportsPrep />
                        </ProtectedRoute>
                    } />

                    {/* Optimisation Phase */}
                    <Route path="step/input-prep-optimisation" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <InputPrepOptimisation />
                        </ProtectedRoute>
                    } />
                    <Route path="step/scenario-alignment" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <ScenarioAlignment />
                        </ProtectedRoute>
                    } />
                    <Route path="step/optimisation-review" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <OptimisationReview />
                        </ProtectedRoute>
                    } />

                    {/* Reporting Phase */}
                    <Route path="step/model-deck-input" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <ModelDeckInput />
                        </ProtectedRoute>
                    } />
                    <Route path="step/automation-code" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <AutomationCode />
                        </ProtectedRoute>
                    } />
                    <Route path="step/tableau-population" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <TableauPopulation />
                        </ProtectedRoute>
                    } />
                    <Route path="step/documentation" element={
                        <ProtectedRoute allowedRoles={['admin', 'modeler']}>
                            <Documentation />
                        </ProtectedRoute>
                    } />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;
