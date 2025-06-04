import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const Layout = ({ children }) => {
  const { init } = useAuthStore();
  
  useEffect(() => {
    init();
  }, [init]);
  
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="relative">
        {children}
      </main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f1f23',
            color: '#fff',
            border: '1px solid #404040',
          },
        }}
      />
    </div>
  );
};

export default Layout;
