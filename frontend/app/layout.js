import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Production Video Portal',
  description: 'Manage and view production media.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
       
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;600;700&display=swap" rel="stylesheet" precedence="default"  />
      <body>
        {children}
        {/* Global Toast Configuration */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1f2937', // gray-800
              color: '#fff',
              border: '1px solid #374151', // gray-700
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' }, // emerald-500
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' }, // red-500
            },
          }}
        />
      </body>
    </html>
  );
}