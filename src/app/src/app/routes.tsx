import { createBrowserRouter, Navigate, useRouteError, isRouteErrorResponse } from 'react-router';
import { RootLayout } from './components/root-layout';
import { WorkspacePage } from './pages/workspace-page';
import { WorkspacesPage } from './pages/workspaces-page';
import { ProjectsPage } from './pages/projects-page';
import { DatasetsPage } from './pages/datasets-page';
import { ModelsPage } from './pages/models-page';
import { AnalysisPage } from './pages/analysis-page';
import { ReportsPage } from './pages/reports-page';
import { ProjectDetailPage } from './pages/project-detail-page';

function RedirectToWorkspaces() {
  return <Navigate to="/workspaces" replace />;
}

function RootErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
    ? error.message
    : 'An unexpected error occurred.';

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        <a href="/projects" className="px-4 py-2 bg-[#3F98FF] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb]">
          Back to Projects
        </a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    // Full-screen workspace editor — no sidebar, Figma-style
    path: '/workspace/:id',
    Component: WorkspacePage,
    ErrorBoundary: RootErrorBoundary,
  },
  {
    // Pages with sidebar
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: RedirectToWorkspaces },
      { path: 'workspaces', Component: WorkspacesPage },
      { path: 'projects', Component: ProjectsPage },
      { path: 'projects/:id', Component: ProjectDetailPage },
      { path: 'datasets', Component: DatasetsPage },
      { path: 'models', Component: ModelsPage },
      { path: 'analysis', Component: AnalysisPage },
      { path: 'reports', Component: ReportsPage },
      // Catch old links
      { path: 'dashboard', Component: RedirectToWorkspaces },
      { path: '*', Component: RedirectToWorkspaces },
    ],
  },
]);