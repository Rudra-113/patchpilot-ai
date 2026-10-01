import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AppProvider } from "./context/AppContext";
import { ActivityPage } from "./pages/ActivityPage";
import { FindingDetailPage } from "./pages/FindingDetailPage";
import { FixesPage } from "./pages/FixesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ScanDetailPage } from "./pages/ScanDetailPage";
import { ScanPage } from "./pages/ScanPage";
import { SettingsPage } from "./pages/SettingsPage";
import { VerificationPage } from "./pages/VerificationPage";
import { VulnerabilitiesPage } from "./pages/VulnerabilitiesPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppShell />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
            <Route path="/vulnerabilities/:findingId" element={<FindingDetailPage />} />
            <Route path="/fixes" element={<FixesPage />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:scanId" element={<ScanDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
