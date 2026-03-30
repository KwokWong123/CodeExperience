import { Outlet } from 'react-router';
import { AppSidebar } from './app-sidebar';

export function RootLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <AppSidebar />
      <div className="flex-1 overflow-hidden flex min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
