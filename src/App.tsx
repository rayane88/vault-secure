import { useState, useEffect } from 'react';
import { isVaultInitialized } from './db';
import { hashPassword } from './crypto';
import { setVaultMeta } from './db';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');

  useEffect(() => {
    isVaultInitialized().then((initialized) => {
      setHasVault(initialized);
      setLoading(false);
    });
  }, []);

  const handleLogin = async (password: string) => {
    setMasterPassword(password);
    setAuthenticated(true);
  };

  const handleCreateVault = async (password: string) => {
    const hash = await hashPassword(password);
    await setVaultMeta('passwordHash', hash);
    setMasterPassword(password);
    setAuthenticated(true);
    setHasVault(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setMasterPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vault-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-vault-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-vault-500 text-sm">Chargement du coffre-fort...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginScreen
        hasVault={hasVault}
        onLogin={handleLogin}
        onCreateVault={handleCreateVault}
      />
    );
  }

  return <Dashboard masterPassword={masterPassword} onLogout={handleLogout} />;
}

export default App;
