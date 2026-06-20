import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';
import { hashPassword } from '../crypto';
import { getVaultMeta } from '../db';

interface Props {
  hasVault: boolean;
  onLogin: (password: string) => void;
  onCreateVault: (password: string) => void;
}

export default function LoginScreen({ hasVault, onLogin, onCreateVault }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'create'>(hasVault ? 'login' : 'create');
  const [strength, setStrength] = useState(0);

  const checkStrength = (pwd: string) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    setStrength(s);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === 'create') checkStrength(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'create') {
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      await onCreateVault(password);
      return;
    }

    // Vérification du mot de passe existant
    const storedHash = await getVaultMeta('passwordHash');
    if (!storedHash) {
      setError('Coffre-fort non initialisé');
      return;
    }
    const inputHash = await hashPassword(password);
    if (inputHash !== storedHash) {
      setError('Mot de passe incorrect');
      return;
    }
    await onLogin(password);
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-green-500'];
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Très fort'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-input p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Vault Secure</h1>
          <p className="text-vault-500 text-sm">Coffre-fort numérique personnel</p>
        </div>

        {/* Carte principale */}
        <div className="vault-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-vault-accent/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-vault-accent" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">
                {mode === 'login' ? 'Accéder au coffre-fort' : 'Créer un coffre-fort'}
              </h2>
              <p className="text-vault-500 text-xs">
                {mode === 'login' ? 'Entrez votre mot de passe maître' : 'Choisissez un mot de passe fort'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Mot de passe maître
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="vault-input pr-10"
                  placeholder="••••••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'create' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="vault-input"
                    placeholder="••••••••••••"
                  />
                </div>
                {password && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-theme-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${strengthColors[strength]}`}
                          style={{ width: `${(strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-vault-500 w-20 text-right">
                        {strengthLabels[strength]}
                      </span>
                    </div>
                    <p className="text-xs text-vault-500">
                      Utilisez au moins 12 caractères avec des majuscules, chiffres et symboles
                    </p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="bg-vault-danger/10 border border-vault-danger/20 rounded-lg px-3 py-2 text-sm text-vault-danger">
                {error}
              </div>
            )}

            <button type="submit" className="vault-btn vault-btn-primary w-full">
              {mode === 'login' ? (
                <>
                  <Lock className="w-4 h-4" />
                  Déverrouiller
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Créer le coffre-fort
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {hasVault && (
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'create' : 'login');
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full mt-4 text-sm text-vault-accent hover:text-vault-accent-hover transition-colors"
            >
              {mode === 'login' ? 'Créer un nouveau coffre-fort' : 'Accéder à un coffre-fort existant'}
            </button>
          )}
        </div>

        {/* Info sécurité */}
        <div className="mt-6 text-center">
          <p className="text-xs text-vault-600">
            <Shield className="w-3 h-3 inline mr-1" />
            Chiffrement AES-256-GCM • Données stockées localement uniquement
          </p>
        </div>
      </div>
    </div>
  );
}
