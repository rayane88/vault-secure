import { useState, useEffect } from 'react';
import {
  Shield, LogOut, Plus, Search, Lock, KeyRound, Bitcoin, Image, FileText, CreditCard, StickyNote, Trash2, Eye, EyeOff, ChevronLeft, Copy, Check, Sun, Moon, Download, Wifi, WifiOff
} from 'lucide-react';
import type { VaultItem, VaultItemType, VaultEntry } from '../types';
import { getAllItems, saveItem, deleteItem } from '../db';
import { encryptData, decryptData } from '../crypto';
import { useTheme } from '../hooks/useTheme';
import ItemForm from './ItemForm';
import ExportImport from './ExportImport';

interface Props {
  masterPassword: string;
  onLogout: () => void;
}

type ViewMode = 'list' | 'create' | 'detail';

const typeConfig: Record<VaultItemType, { label: string; icon: typeof Lock; color: string }> = {
  password: { label: 'Mots de passe', icon: KeyRound, color: 'text-blue-400' },
  crypto: { label: 'Crypto', icon: Bitcoin, color: 'text-orange-400' },
  photo: { label: 'Photos', icon: Image, color: 'text-pink-400' },
  file: { label: 'Fichiers', icon: FileText, color: 'text-green-400' },
  note: { label: 'Notes', icon: StickyNote, color: 'text-yellow-400' },
  card: { label: 'Cartes', icon: CreditCard, color: 'text-purple-400' },
};

export default function Dashboard({ masterPassword, onLogout }: Props) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<VaultItem[]>([]);
  const [selectedType, setSelectedType] = useState<VaultItemType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [decryptedData, setDecryptedData] = useState<VaultEntry | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExportImport, setShowExportImport] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    let result = items;
    if (selectedType !== 'all') {
      result = result.filter((i) => i.type === selectedType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q));
    }
    setFilteredItems(result);
  }, [items, selectedType, search]);

  const loadItems = async () => {
    setLoading(true);
    const allItems = await getAllItems();
    setItems(allItems);
    setFilteredItems(allItems);
    setLoading(false);
  };

  const handleSaveItem = async (type: VaultItemType, title: string, data: VaultEntry) => {
    const encrypted = await encryptData(data, masterPassword);
    const item: VaultItem = {
      id: crypto.randomUUID(),
      type,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...encrypted,
    };
    await saveItem(item);
    await loadItems();
    setViewMode('list');
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) return;
    await deleteItem(id);
    await loadItems();
    if (selectedItem?.id === id) {
      setViewMode('list');
      setSelectedItem(null);
    }
  };

  const handleViewItem = async (item: VaultItem) => {
    try {
      const data = await decryptData(
        item.encryptedData,
        item.salt,
        item.iv,
        item.tag,
        masterPassword
      );
      setSelectedItem(item);
      setDecryptedData(data);
      setShowSecret(false);
      setViewMode('detail');
    } catch {
      alert('Erreur de déchiffrement. Le mot de passe maître est peut-être incorrect.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const counts = {
    all: items.length,
    password: items.filter((i) => i.type === 'password').length,
    crypto: items.filter((i) => i.type === 'crypto').length,
    photo: items.filter((i) => i.type === 'photo').length,
    file: items.filter((i) => i.type === 'file').length,
    note: items.filter((i) => i.type === 'note').length,
    card: items.filter((i) => i.type === 'card').length,
  };

  if (viewMode === 'create') {
    return (
      <div className="min-h-screen">
        <div className="border-b border-vault-700">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setViewMode('list')}
              className="vault-btn vault-btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <h2 className="text-white font-semibold">Ajouter un élément</h2>
            <div className="w-24" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ItemForm onSave={handleSaveItem} onCancel={() => setViewMode('list')} />
        </div>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedItem && decryptedData) {
    const typeInfo = typeConfig[selectedItem.type];
    const TypeIcon = typeInfo.icon;
    const data = decryptedData;

    return (
      <div className="min-h-screen">
        <div className="border-b border-vault-700">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setViewMode('list')}
              className="vault-btn vault-btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex items-center gap-2">
              <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
              <h2 className="text-white font-semibold truncate max-w-xs">{selectedItem.title}</h2>
            </div>
            <button
              onClick={() => handleDeleteItem(selectedItem.id)}
              className="vault-btn vault-btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="vault-card space-y-4">
            {selectedItem.type === 'password' && (
              <>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Site web</label>
                  <p className="text-white text-lg font-medium mt-1">{(data as any).website}</p>
                </div>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Nom d'utilisateur</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white text-lg font-medium">{(data as any).username}</p>
                    <button onClick={() => copyToClipboard((data as any).username)} className="text-vault-500 hover:text-white">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Mot de passe</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white text-lg font-mono">
                      {showSecret ? (data as any).password : '••••••••••••••••'}
                    </p>
                    <button onClick={() => setShowSecret(!showSecret)} className="text-vault-500 hover:text-white">
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => copyToClipboard((data as any).password)} className="text-vault-500 hover:text-white">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {selectedItem.type === 'crypto' && (
              <>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Portefeuille</label>
                  <p className="text-white text-lg font-medium mt-1">{(data as any).walletName}</p>
                </div>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Réseau</label>
                  <p className="text-white mt-1">{(data as any).network || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Adresse</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white font-mono break-all">{(data as any).address}</p>
                    <button onClick={() => copyToClipboard((data as any).address)} className="text-vault-500 hover:text-white shrink-0">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Clé privée</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white font-mono break-all">
                      {showSecret ? (data as any).privateKey : '••••••••••••••••••••••••••••••••'}
                    </p>
                    <button onClick={() => setShowSecret(!showSecret)} className="text-vault-500 hover:text-white shrink-0">
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => copyToClipboard((data as any).privateKey)} className="text-vault-500 hover:text-white shrink-0">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {(data as any).seedPhrase && (
                  <div>
                    <label className="text-xs text-vault-500 uppercase tracking-wider">Phrase de récupération (Seed)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-white font-mono break-all">
                        {showSecret ? (data as any).seedPhrase : '••••••••••••••••••••••••••••••••'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedItem.type === 'note' && (
              <div>
                <label className="text-xs text-vault-500 uppercase tracking-wider">Contenu</label>
                <div className="mt-2 bg-theme-input rounded-lg p-4 border border-vault-700">
                  <p className="text-white whitespace-pre-wrap">{(data as any).content}</p>
                </div>
              </div>
            )}

            {selectedItem.type === 'card' && (
              <>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Titulaire</label>
                  <p className="text-white text-lg font-medium mt-1">{(data as any).cardHolder}</p>
                </div>
                <div>
                  <label className="text-xs text-vault-500 uppercase tracking-wider">Numéro de carte</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white font-mono text-lg">
                      {showSecret ? (data as any).cardNumber : '•••• •••• •••• ••••'}
                    </p>
                    <button onClick={() => setShowSecret(!showSecret)} className="text-vault-500 hover:text-white">
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <label className="text-xs text-vault-500 uppercase tracking-wider">Expiration</label>
                    <p className="text-white font-mono mt-1">{(data as any).expiryDate}</p>
                  </div>
                  <div>
                    <label className="text-xs text-vault-500 uppercase tracking-wider">CVV</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-white font-mono">{showSecret ? (data as any).cvv : '•••'}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {(selectedItem.type === 'photo' || selectedItem.type === 'file') && (
              <div>
                <label className="text-xs text-vault-500 uppercase tracking-wider">Fichier</label>
                <div className="mt-2 bg-theme-input rounded-lg p-4 border border-vault-700">
                  <p className="text-white font-medium">{(data as any).fileName || (data as any).photoName}</p>
                  <p className="text-vault-500 text-sm mt-1">
                    {(data as any).fileType} • {((data as any).fileSize || 0).toLocaleString()} octets
                  </p>
                  {(data as any).photoData && (
                    <img
                      src={(data as any).photoData}
                      alt="Vault"
                      className="mt-4 max-w-full rounded-lg border border-vault-700"
                    />
                  )}
                  {(data as any).fileData && (
                    <a
                      href={(data as any).fileData}
                      download={(data as any).fileName}
                      className="vault-btn vault-btn-primary mt-4 inline-flex"
                    >
                      Télécharger le fichier
                    </a>
                  )}
                </div>
              </div>
            )}

            {(data as any).notes && (
              <div>
                <label className="text-xs text-vault-500 uppercase tracking-wider">Notes</label>
                <p className="text-white mt-1">{(data as any).notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-input">
      {/* Header */}
      <header className="border-b border-vault-700 bg-theme-header">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Vault Secure</h1>
              <p className="text-vault-500 text-xs">{items.length} élément(s) sécurisé(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" title={isOnline ? 'En ligne' : 'Hors-ligne'}>
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-vault-success" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-vault-warning" />
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="vault-btn vault-btn-secondary p-2"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowExportImport(true)}
              className="vault-btn vault-btn-secondary p-2"
              title="Sauvegardes"
            >
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onLogout} className="vault-btn vault-btn-secondary">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'password', 'crypto', 'card', 'note', 'photo', 'file'] as const).map((type) => {
              const label = type === 'all' ? 'Tout' : typeConfig[type]?.label || type;
              const Icon = type === 'all' ? Lock : typeConfig[type]?.icon || Lock;
              const isActive = selectedType === type;
              const count = counts[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-vault-accent text-white'
                      : 'bg-theme-card text-vault-500 hover:text-white hover:bg-theme-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-theme-muted'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vault-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="vault-input pl-9 w-48 sm:w-64"
              />
            </div>
            <button onClick={() => setViewMode('create')} className="vault-btn vault-btn-primary">
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-vault-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-card flex items-center justify-center">
              <Lock className="w-8 h-8 text-vault-600" />
            </div>
            <p className="text-white font-medium mb-1">
              {items.length === 0 ? 'Votre coffre-fort est vide' : 'Aucun résultat'}
            </p>
            <p className="text-vault-500 text-sm">
              {items.length === 0 ? 'Ajoutez votre premier élément sécurisé' : 'Essayez une autre recherche'}
            </p>
            {items.length === 0 && (
              <button onClick={() => setViewMode('create')} className="vault-btn vault-btn-primary mt-4">
                <Plus className="w-4 h-4" />
                Ajouter un élément
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const typeInfo = typeConfig[item.type];
              const TypeIcon = typeInfo.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleViewItem(item)}
                  className="vault-card cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-theme-input flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-medium truncate group-hover:text-vault-accent transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-vault-500 text-xs mt-0.5">{typeInfo.label}</p>
                      <p className="text-vault-600 text-xs mt-1">
                        {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="text-vault-600 hover:text-vault-danger transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showExportImport && (
        <ExportImport
          onClose={() => setShowExportImport(false)}
        />
      )}
    </div>
  );
}
