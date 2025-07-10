import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDriveStorage } from '../../hooks/useDriveStorage';
import { CardData } from '../../types';
import { Cloud, CloudOff, Download, Upload, HardDrive, AlertCircle } from 'lucide-react';

interface DriveIntegrationPanelProps {
  cards: CardData[];
  passphrase: string | null;
  onCardsLoaded: (cards: CardData[]) => void;
}

export function DriveIntegrationPanel({ 
  cards, 
  passphrase, 
  onCardsLoaded 
}: DriveIntegrationPanelProps) {
  const { user } = useAuth();
  const { 
    initializeStorage,
    listCards,
    loadCard,
    saveCard,
    deleteCard,
    getStorageUsage,
    loading,
    error,
    progress
  } = useDriveStorage();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{
    totalSize: number;
    cardCount: number;
    imageCount: number;
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Initialize Drive storage when user is authenticated
  useEffect(() => {
    if (user && !isInitialized) {
      initializeStorage()
        .then(() => setIsInitialized(true))
        .catch(err => console.error('Failed to initialize Drive storage:', err));
    }
  }, [user, isInitialized, initializeStorage]);

  // Load storage usage
  useEffect(() => {
    if (isInitialized) {
      getStorageUsage()
        .then(usage => setStorageUsage(usage))
        .catch(err => console.error('Failed to get storage usage:', err));
    }
  }, [isInitialized, getStorageUsage]);

  const handleSyncFromDrive = async () => {
    if (!passphrase) {
      alert('Please set up your passphrase first');
      return;
    }

    setSyncStatus('syncing');
    
    try {
      // List all cards in Drive
      const driveCards = await listCards();
      
      // Load each card
      const loadedCards: CardData[] = [];
      for (const driveCard of driveCards) {
        try {
          const cardData = await loadCard(driveCard.fileId, passphrase);
          loadedCards.push(cardData);
        } catch (err) {
          console.error(`Failed to load card ${driveCard.id}:`, err);
        }
      }
      
      // Update local state
      onCardsLoaded(loadedCards);
      setSyncStatus('idle');
      
      // Refresh storage usage
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
    }
  };

  const handleSyncToDrive = async () => {
    if (!passphrase) {
      alert('Please set up your passphrase first');
      return;
    }

    setSyncStatus('syncing');
    
    try {
      // Get current cards in Drive
      const driveCards = await listCards();
      const driveCardIds = new Set(driveCards.map(dc => dc.id));
      
      // Save/update local cards to Drive
      for (const card of cards) {
        try {
          await saveCard(card, passphrase);
        } catch (err) {
          console.error(`Failed to save card ${card.id}:`, err);
        }
      }
      
      // Delete cards that are in Drive but not locally
      const localCardIds = new Set(cards.map(c => c.id));
      for (const driveCard of driveCards) {
        if (!localCardIds.has(driveCard.id)) {
          try {
            await deleteCard(driveCard.id);
          } catch (err) {
            console.error(`Failed to delete card ${driveCard.id}:`, err);
          }
        }
      }
      
      setSyncStatus('idle');
      
      // Refresh storage usage
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <CloudOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Drive Not Connected</h3>
        <p className="text-sm text-gray-600">
          Sign in with Google to sync your cards to Google Drive
        </p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-blue-900">Initializing Google Drive storage...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cloud className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900">Google Drive Sync</h3>
        </div>
        
        {syncStatus === 'syncing' && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Syncing...</span>
          </div>
        )}
        
        {syncStatus === 'error' && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Sync failed</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={handleSyncFromDrive}
          disabled={loading || syncStatus === 'syncing' || !passphrase}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 mr-2" />
          Load from Drive
        </button>
        
        <button
          onClick={handleSyncToDrive}
          disabled={loading || syncStatus === 'syncing' || !passphrase || cards.length === 0}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4 mr-2" />
          Save to Drive
        </button>
      </div>

      {storageUsage && (
        <div className="bg-gray-50 rounded-md p-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <HardDrive className="w-4 h-4" />
            <span className="font-medium">Storage Usage</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Size:</span>
              <p className="font-medium text-gray-900">{formatBytes(storageUsage.totalSize)}</p>
            </div>
            <div>
              <span className="text-gray-500">Cards:</span>
              <p className="font-medium text-gray-900">{storageUsage.cardCount}</p>
            </div>
            <div>
              <span className="text-gray-500">Images:</span>
              <p className="font-medium text-gray-900">{storageUsage.imageCount}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• All data is encrypted before upload</p>
        <p>• Files are stored in your personal Google Drive</p>
        <p>• Only you can decrypt your cards</p>
      </div>
    </div>
  );
}