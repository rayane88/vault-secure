import { useState } from 'react';
import {
  KeyRound, Bitcoin, Image, FileText, StickyNote, CreditCard, Eye, EyeOff, Shuffle, Check, Wand2, X, Minus, Plus
} from 'lucide-react';
import type { VaultItemType, VaultEntry } from '../types';
import { generatePasswordAdvanced, calculatePasswordStrength, type PasswordOptions } from '../crypto';

interface Props {
  onSave: (type: VaultItemType, title: string, data: VaultEntry) => void;
  onCancel: () => void;
}

const typeOptions: { value: VaultItemType; label: string; icon: typeof KeyRound; description: string }[] = [
  { value: 'password', label: 'Mot de passe', icon: KeyRound, description: 'Site web, application, compte' },
  { value: 'crypto', label: 'Crypto', icon: Bitcoin, description: 'Portefeuille, clés, seed phrase' },
  { value: 'card', label: 'Carte bancaire', icon: CreditCard, description: 'Numéro, expiration, CVV' },
  { value: 'note', label: 'Note', icon: StickyNote, description: 'Texte secret, informations' },
  { value: 'photo', label: 'Photo', icon: Image, description: 'Image privée, capture' },
  { value: 'file', label: 'Fichier', icon: FileText, description: 'Document, archive, PDF' },
];

export default function ItemForm({ onSave, onCancel }: Props) {
  const [type, setType] = useState<VaultItemType>('password');
  const [title, setTitle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; type: string; size: number } | null>(null);

  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [pwdLength, setPwdLength] = useState(16);
  const [pwdOptions, setPwdOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [generatedPwdPreview, setGeneratedPwdPreview] = useState('');
  const [pwdStrength, setPwdStrength] = useState(0);

  // Champs spécifiques
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');

  const [walletName, setWalletName] = useState('');
  const [address, setAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [network, setNetwork] = useState('');

  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [bank, setBank] = useState('');

  const [noteContent, setNoteContent] = useState('');

  const handleGeneratePassword = () => {
    const pwd = generatePasswordAdvanced(pwdOptions);
    setPassword(pwd);
    setGeneratedPwdPreview(pwd);
    setPwdStrength(calculatePasswordStrength(pwd));
  };

  const updatePwdOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    const next = { ...pwdOptions, [key]: value };
    setPwdOptions(next);
    const pwd = generatePasswordAdvanced(next);
    setGeneratedPwdPreview(pwd);
    setPwdStrength(calculatePasswordStrength(pwd));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
      setFileInfo({ name: file.name, type: file.type, size: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let data: VaultEntry;

    switch (type) {
      case 'password':
        data = { website, username, password, notes };
        break;
      case 'crypto':
        data = { walletName, address, privateKey, seedPhrase, network, notes };
        break;
      case 'card':
        data = { cardHolder, cardNumber, expiryDate, cvv, bank, notes };
        break;
      case 'note':
        data = { content: noteContent };
        break;
      case 'photo':
        data = {
          photoName: fileInfo?.name || title,
          photoData: fileData || '',
          notes,
        };
        break;
      case 'file':
        data = {
          fileName: fileInfo?.name || title,
          fileType: fileInfo?.type || '',
          fileSize: fileInfo?.size || 0,
          fileData: fileData || '',
          notes,
        };
        break;
      default:
        data = { content: '' };
    }

    onSave(type, title.trim(), data);
  };

  const selectedTypeInfo = typeOptions.find((t) => t.value === type);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Type d'élément</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {typeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = type === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setType(option.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'border-vault-accent bg-vault-accent/10 text-white'
                    : 'border-vault-700 bg-theme-card text-vault-500 hover:text-white hover:border-vault-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-center">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs opacity-70">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="vault-input"
            placeholder={`Ex: ${selectedTypeInfo?.label}`}
            required
          />
        </div>

        {/* Formulaire Mot de passe */}
        {type === 'password' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Site web</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="vault-input"
                placeholder="exemple.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="vault-input"
                placeholder="votre_nom"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPwdStrength(calculatePasswordStrength(e.target.value));
                  }}
                  className="vault-input pr-20"
                  placeholder="••••••••••••"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-vault-500 hover:text-white rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordGenerator(true);
                      const pwd = generatePasswordAdvanced(pwdOptions);
                      setGeneratedPwdPreview(pwd);
                      setPwdStrength(calculatePasswordStrength(pwd));
                    }}
                    className="p-1.5 text-vault-accent hover:text-white rounded"
                    title="Générateur avancé"
                  >
                    <Wand2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-theme-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pwdStrength}%`,
                          backgroundColor: pwdStrength < 40 ? '#ef4444' : pwdStrength < 70 ? '#f59e0b' : '#22c55e'
                        }}
                      />
                    </div>
                    <span className="text-xs text-vault-500">
                      {pwdStrength < 40 ? 'Faible' : pwdStrength < 70 ? 'Moyen' : 'Fort'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Générateur */}
            {showPasswordGenerator && (
              <div className="bg-theme-input border border-vault-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">Générateur de mot de passe</h4>
                  <button
                    type="button"
                    onClick={() => setShowPasswordGenerator(false)}
                    className="text-vault-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-vault-900 rounded-lg p-3 font-mono text-sm text-white break-all text-center">
                  {generatedPwdPreview}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Longueur : {pwdLength}</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(4, pwdLength - 1);
                        setPwdLength(next);
                        updatePwdOption('length', next);
                      }}
                      className="p-1 rounded bg-theme-muted hover:bg-theme-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min={4}
                      max={64}
                      value={pwdLength}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPwdLength(val);
                        updatePwdOption('length', val);
                      }}
                      className="flex-1 accent-vault-accent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(64, pwdLength + 1);
                        setPwdLength(next);
                        updatePwdOption('length', next);
                      }}
                      className="p-1 rounded bg-theme-muted hover:bg-theme-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'uppercase' as const, label: 'Majuscules (A-Z)' },
                    { key: 'lowercase' as const, label: 'Minuscules (a-z)' },
                    { key: 'numbers' as const, label: 'Chiffres (0-9)' },
                    { key: 'symbols' as const, label: 'Symboles (!@#$)' },
                    { key: 'excludeAmbiguous' as const, label: 'Exclure 0, O, l, 1' },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pwdOptions[opt.key]}
                        onChange={(e) => updatePwdOption(opt.key, e.target.checked)}
                        className="rounded accent-vault-accent"
                      />
                      <span className="text-sm text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="vault-btn vault-btn-primary flex-1"
                  >
                    <Shuffle className="w-4 h-4" />
                    Regénérer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(generatedPwdPreview);
                      setPwdStrength(calculatePasswordStrength(generatedPwdPreview));
                      setShowPasswordGenerator(false);
                    }}
                    className="vault-btn vault-btn-secondary flex-1"
                  >
                    <Check className="w-4 h-4" />
                    Utiliser
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formulaire Crypto */}
        {type === 'crypto' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nom du portefeuille</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="vault-input"
                placeholder="MetaMask, Ledger, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Réseau</label>
              <input
                type="text"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="vault-input"
                placeholder="Ethereum, Bitcoin, Solana..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Adresse publique</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="vault-input font-mono"
                placeholder="0x..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Clé privée</label>
              <div className="relative">
                <input
                  type={showPrivateKey ? 'text' : 'password'}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="vault-input pr-10"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-500 hover:text-white"
                >
                  {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Phrase de récupération (Seed)</label>
              <textarea
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                className="vault-input min-h-[80px] resize-none"
                placeholder="12 ou 24 mots de récupération..."
              />
            </div>
          </div>
        )}

        {/* Formulaire Carte */}
        {type === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Titulaire de la carte</label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="vault-input"
                placeholder="NOM PRÉNOM"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Banque</label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="vault-input"
                placeholder="Nom de la banque"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Numéro de carte</label>
              <div className="relative">
                <input
                  type={showCard ? 'text' : 'password'}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="vault-input pr-10 font-mono"
                  placeholder="1234 5678 9012 3456"
                />
                <button
                  type="button"
                  onClick={() => setShowCard(!showCard)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-500 hover:text-white"
                >
                  {showCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Date d'expiration</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="vault-input font-mono"
                  placeholder="MM/AA"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">CVV</label>
                <div className="relative">
                  <input
                    type={showCVV ? 'text' : 'password'}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="vault-input pr-10 font-mono"
                    placeholder="123"
                    maxLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCVV(!showCVV)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-500 hover:text-white"
                  >
                    {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire Note */}
        {type === 'note' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Contenu</label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="vault-input min-h-[200px] resize-none"
              placeholder="Votre note secrète..."
              required
            />
          </div>
        )}

        {/* Formulaire Photo / Fichier */}
        {(type === 'photo' || type === 'file') && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {type === 'photo' ? 'Photo' : 'Fichier'}
            </label>
            <div className="border-2 border-dashed border-vault-700 rounded-lg p-6 text-center hover:border-vault-500 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept={type === 'photo' ? 'image/*' : undefined}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <FileText className="w-10 h-10 mx-auto text-vault-500 mb-2" />
                <p className="text-vault-500 text-sm">
                  {fileInfo ? (
                    <span className="text-white">{fileInfo.name}</span>
                  ) : (
                    'Cliquez pour sélectionner un fichier'
                  )}
                </p>
                {fileInfo && (
                  <p className="text-vault-600 text-xs mt-1">
                    {(fileInfo.size / 1024).toFixed(1)} Ko
                  </p>
                )}
              </label>
            </div>
            {type === 'photo' && fileData && (
              <img src={fileData} alt="Preview" className="mt-4 max-w-full max-h-64 rounded-lg border border-vault-700" />
            )}
          </div>
        )}

        {/* Notes communes */}
        {type !== 'note' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="vault-input min-h-[80px] resize-none"
              placeholder="Informations supplémentaires..."
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onCancel} className="vault-btn vault-btn-secondary flex-1">
            Annuler
          </button>
          <button type="submit" className="vault-btn vault-btn-primary flex-1">
            <Check className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
