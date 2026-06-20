import { useState, useEffect } from 'react';
import { Download, Upload, X, FileDown, FileUp } from 'lucide-react';
import { getAllItems, getVaultMeta, setVaultMeta } from '../db';
import { encryptData, decryptData } from '../crypto';
import type { VaultItem, VaultEntry } from '../types';

interface Props {
  onClose: () => void;
}

export default function ExportImport({ onClose }: Props) {
  const [mode, setMode] = useState<'export' | 'import' | null>(null);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    getAllItems().then((items) => setCount(items.length));
  }, []);

  const handleExport = async () => {
    setError('');
    setMessage('');
    try {
      const items = await getAllItems();
      const passwordHash = await getVaultMeta('passwordHash');
      
      const payload = {
        version: 1,
        exportedAt: Date.now(),
        passwordHash,
        items,
      };

      if (password) {
        // Chiffrer l'export avec un mot de passe
        const encrypted = await encryptData(payload as unknown as VaultEntry, password);
        const exportObj = {
          encrypted: true,
          ...encrypted,
        };
        setExportData(JSON.stringify(exportObj, null, 2));
      } else {
        // Export non chiffré (JSON brut)
        setExportData(JSON.stringify(payload, null, 2));
      }
    } catch (err) {
      setError('Erreur lors de l\'export : ' + (err as Error).message);
    }
  };

  const handleImport = async () => {
    setError('');
    setMessage('');
    try {
      const parsed = JSON.parse(importData.trim());
      
      if (parsed.encrypted) {
        if (!password) {
          setError('Entrez le mot de passe de l\'export chiffré');
          return;
        }
        // Déchiffrer
        const decrypted = await decryptData(
          parsed.encryptedData,
          parsed.salt,
          parsed.iv,
          parsed.tag,
          password
        );
        const data = decrypted as unknown as { version: number; items: VaultItem[]; passwordHash?: string };
        await importItems(data);
      } else {
        // Import direct
        await importItems(parsed);
      }
      setMessage('Import réussi !');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError('Erreur lors de l\'import : ' + (err as Error).message);
    }
  };

  const importItems = async (data: { version: number; items: VaultItem[]; passwordHash?: string }) => {
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Format d\'import invalide');
    }
    
    for (const item of data.items) {
      await setVaultMeta('item_' + item.id, item); // workaround, on utilise direct
    }
    
    // Sauvegarder les items directement
    const { initDB } = await import('../db');
    const db = await initDB();
    const tx = db.transaction(['vaultItems'], 'readwrite');
    const store = tx.objectStore('vaultItems');
    for (const item of data.items) {
      await new Promise<void>((resolve, reject) => {
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
    
    if (data.passwordHash) {
      await setVaultMeta('passwordHash', data.passwordHash);
    }
  };

  const downloadFile = () => {
    if (!exportData) return;
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-secure-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Fichier téléchargé !');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportData(reader.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="vault-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Sauvegardes</h2>
          <button onClick={onClose} className="text-vault-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-sm text-green-400 mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-vault-danger/10 border border-vault-danger/20 rounded-lg px-3 py-2 text-sm text-vault-danger mb-4">
            {error}
          </div>
        )}

        {!mode && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('export')}
              className="vault-card flex flex-col items-center gap-3 cursor-pointer hover:border-vault-accent"
            >
              <FileDown className="w-8 h-8 text-vault-accent" />
              <div className="text-center">
                <p className="text-white font-medium">Exporter</p>
                <p className="text-vault-500 text-xs mt-1">{count} éléments</p>
              </div>
            </button>
            <button
              onClick={() => setMode('import')}
              className="vault-card flex flex-col items-center gap-3 cursor-pointer hover:border-vault-accent"
            >
              <FileUp className="w-8 h-8 text-vault-success" />
              <div className="text-center">
                <p className="text-white font-medium">Importer</p>
                <p className="text-vault-500 text-xs mt-1">Restaurer une sauvegarde</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'export' && (
          <div className="space-y-4">
            <p className="text-sm text-vault-500">
              Vous pouvez exporter vos données en JSON. Chiffrez l'export avec un mot de passe pour plus de sécurité.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Mot de passe de chiffrement (optionnel)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vault-input"
                placeholder="Laissez vide pour un export non chiffré"
              />
              {password && (
                <p className="text-xs text-vault-warning mt-1">
                  N'oubliez pas ce mot de passe pour restaurer l'export !
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="vault-btn vault-btn-primary flex-1">
                <Download className="w-4 h-4" />
                Générer l'export
              </button>
              <button onClick={() => setMode(null)} className="vault-btn vault-btn-secondary">
                Retour
              </button>
            </div>
            {exportData && (
              <div className="space-y-2">
                <textarea
                  readOnly
                  value={exportData}
                  className="vault-input font-mono text-xs h-32 resize-none"
                />
                <button onClick={downloadFile} className="vault-btn vault-btn-primary w-full">
                  <Download className="w-4 h-4" />
                  Télécharger le fichier JSON
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'import' && (
          <div className="space-y-4">
            <p className="text-sm text-vault-500">
              Sélectionnez un fichier JSON de sauvegarde. Si le fichier est chiffré, entrez le mot de passe.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Fichier de sauvegarde
              </label>
              <div className="border-2 border-dashed border-vault-700 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file" className="cursor-pointer block">
                  <Upload className="w-6 h-6 mx-auto text-vault-500 mb-2" />
                  <p className="text-sm text-vault-500">
                    {importData ? 'Fichier chargé' : 'Cliquez pour sélectionner un fichier JSON'}
                  </p>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Mot de passe de déchiffrement (si chiffré)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vault-input"
                placeholder="Laissez vide si l'export n'est pas chiffré"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleImport} className="vault-btn vault-btn-primary flex-1">
                <Upload className="w-4 h-4" />
                Importer
              </button>
              <button onClick={() => setMode(null)} className="vault-btn vault-btn-secondary">
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
