import { RouterProvider } from 'react-router';
import { router } from './routes';
import { DemoProvider } from './context/demo-context';

function App() {
  return (
    <DemoProvider>
      <RouterProvider router={router} />
    </DemoProvider>
  );
}

export default App;
