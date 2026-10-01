import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AppProvider } from "./context/AppContext";
import { LandingPage } from "./pages/LandingPage";
import { ModulePage } from "./pages/ModulePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OverviewPage } from "./pages/OverviewPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppShell />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/scan" element={<ModulePage id="scan" />} />
            <Route path="/vulnerabilities" element={<ModulePage id="vulnerabilities" />} />
            <Route path="/fixes" element={<ModulePage id="fixes" />} />
            <Route path="/verification" element={<ModulePage id="verification" />} />
            <Route path="/activity" element={<ModulePage id="activity" />} />
            <Route path="/history" element={<ModulePage id="history" />} />
            <Route path="/settings" element={<ModulePage id="settings" />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
