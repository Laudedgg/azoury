import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AccessGate } from '@/components/AccessGate';
import router from './router';

export function App() {
  return (
    <ThemeProvider>
      <AccessGate>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: '#0F2A2A',
                border: '1px solid #1A3F3F',
                color: '#E8F5F3',
              },
              className: 'font-sans',
            }}
            richColors
          />
        </AuthProvider>
      </AccessGate>
    </ThemeProvider>
  );
}

export default App;
