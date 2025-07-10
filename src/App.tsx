import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardFormData } from './types';
import { useAuth } from './context/AuthContext';
import { EncryptionDemo } from './components/common/EncryptionDemo';
import { PassphraseSetupModal } from './components/modals/PassphraseSetupModal';
import { CardForm } from './components/cards/CardForm';
import { CardListView } from './components/cards/CardListView';
import { CardDetailModal } from './components/modals/CardDetailModal';
import { createCardFromFormData, updateCardFromFormData } from './utils/cardValidation';
import { 
  initializeDriveStorage, 
  saveCardToDrive, 
  loadCardFromDrive, 
  loadPreferencesFromDrive, 
  savePreferencesToDrive,
  listCardsFromDrive,
  updateCardInDrive,
  deleteCardFromDrive,
  loadCardIndexFromDrive,
  saveCardIndexToDrive
} from './services/driveStorage';

type AppView = 'welcome' | 'demo' | 'setup' | 'passphrase-entry' | 'cards';
type CardModalMode = 'create' | 'edit' | null;

interface AppState {
  hasPassphrase: boolean;
  isDataLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

// Authentication Check Component
function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gradient mb-4">
              SecureCardr
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Zero-knowledge card vault for secure storage of your sensitive cards
            </p>
          </header>
          
          <main className="max-w-4xl mx-auto">
            <div className="card p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Welcome to SecureCardr
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Sign in with Google to get started. Your data will be encrypted client-side 
                and stored securely in your own Google Drive folder.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={signIn}
                  className="btn-primary w-full sm:w-auto mr-4 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We'll request access to your Google Drive to store your encrypted cards
                </p>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Client-Side Encryption</h3>
                  <p className="text-gray-500 dark:text-gray-400">AES-256 encryption in your browser</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Your Google Drive</h3>
                  <p className="text-gray-500 dark:text-gray-400">Data stored in your own cloud</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Zero Knowledge</h3>
                  <p className="text-gray-500 dark:text-gray-400">We never see your data</p>
                </div>
              </div>
            </div>
          </main>
          
          <footer className="text-center mt-12 text-gray-500 dark:text-gray-400">
            <p>&copy; 2024 SecureCardr. Your data, your control.</p>
          </footer>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Passphrase Entry Modal Component
function PassphraseEntryModal({ 
  isOpen, 
  onSuccess, 
  onCancel 
}: { 
  isOpen: boolean; 
  onSuccess: (passphrase: string) => void; 
  onCancel: () => void; 
}) {
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to load preferences to verify passphrase
      await loadPreferencesFromDrive(passphrase);
      onSuccess(passphrase);
    } catch (err: any) {
      setError('Invalid passphrase. Please try again.');
      console.error('Passphrase verification failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [passphrase, onSuccess]);

  const handleCancel = useCallback(() => {
    setPassphrase('');
    setError(null);
    onCancel();
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Enter Your Passphrase
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Enter your passphrase to decrypt your cards
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passphrase
            </label>
            <input
              id="passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your passphrase"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!passphrase.trim() || isLoading}
            >
              {isLoading ? 'Verifying...' : 'Unlock Cards'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardModalMode, setCardModalMode] = useState<CardModalMode>(null);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [appState, setAppState] = useState<AppState>({
    hasPassphrase: false,
    isDataLoaded: false,
    isLoading: false,
    error: null
  });

  // Initialize Drive storage and check for existing data
  useEffect(() => {
    if (!user) return;

    const initializeApp = async () => {
      setAppState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Initialize Drive storage
        await initializeDriveStorage();
        
        // Check if user has existing data by trying to load preferences
        try {
          const hasData = await checkForExistingData();
          if (hasData) {
            setAppState(prev => ({ ...prev, hasPassphrase: true }));
            setCurrentView('passphrase-entry');
          } else {
            setCurrentView('welcome');
          }
        } catch (err) {
          // No existing data, show welcome
          setCurrentView('welcome');
        }
      } catch (error: any) {
        console.error('Failed to initialize app:', error);
        setAppState(prev => ({ 
          ...prev, 
          error: 'Failed to initialize storage. Please try again.' 
        }));
      } finally {
        setAppState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeApp();
  }, [user]);

  // Check for existing data in Drive
  const checkForExistingData = async (): Promise<boolean> => {
    try {
      const cardsList = await listCardsFromDrive();
      return cardsList.length > 0;
    } catch (error) {
      return false;
    }
  };

  // Load cards from Drive
  const loadCardsFromDrive = async (userPassphrase: string) => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const cardsList = await listCardsFromDrive();
      const loadedCards: Card[] = [];
      
      for (const cardInfo of cardsList) {
        try {
          const cardData = await loadCardFromDrive(cardInfo.fileId, userPassphrase);
          loadedCards.push({
            ...cardData,
            // Store the Drive file ID for updates
            driveFileId: cardInfo.fileId
          } as Card);
        } catch (error) {
          console.error(`Failed to load card ${cardInfo.id}:`, error);
        }
      }
      
      setCards(loadedCards);
      setAppState(prev => ({ ...prev, isDataLoaded: true }));
    } catch (error: any) {
      console.error('Failed to load cards:', error);
      setAppState(prev => ({ 
        ...prev, 
        error: 'Failed to load cards. Please check your passphrase.' 
      }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDemoComplete = useCallback(() => {
    setCurrentView('setup');
  }, []);

  const handlePassphraseSetup = useCallback(async (newPassphrase: string) => {
    setPassphrase(newPassphrase);
    setAppState(prev => ({ ...prev, hasPassphrase: true }));
    
    // Save initial preferences to Drive
    try {
      await savePreferencesToDrive({
        setupCompleted: true,
        createdAt: new Date().toISOString()
      }, newPassphrase);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
    
    setCurrentView('cards');
  }, []);

  const handlePassphraseEntry = useCallback(async (userPassphrase: string) => {
    setPassphrase(userPassphrase);
    await loadCardsFromDrive(userPassphrase);
    setCurrentView('cards');
  }, []);

  const handleCardSubmit = useCallback(async (formData: CardFormData) => {
    if (!passphrase) return;
    
    setAppState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (cardModalMode === 'edit' && cardToEdit) {
        // Update existing card
        const updatedCard = updateCardFromFormData(cardToEdit, formData);
        
        // Update in Drive
        const driveFileId = (cardToEdit as any).driveFileId;
        if (driveFileId) {
          await updateCardInDrive(driveFileId, updatedCard, passphrase);
        }
        
        // Update local state
        setCards(prev => prev.map(card => 
          card.id === cardToEdit.id ? { ...updatedCard, driveFileId } : card
        ));
      } else {
        // Create new card
        const newCard = createCardFromFormData(formData);
        
        // Save to Drive
        const driveFileId = await saveCardToDrive(newCard, passphrase);
        
        // Update local state
        setCards(prev => [...prev, { ...newCard, driveFileId }]);
      }
      
      // Close modal
      setCardModalMode(null);
      setCardToEdit(null);
    } catch (error: any) {
      console.error('Failed to save card:', error);
      setAppState(prev => ({ 
        ...prev, 
        error: 'Failed to save card. Please try again.' 
      }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [cardModalMode, cardToEdit, passphrase]);

  const handleCardEdit = useCallback((card: Card) => {
    setCardToEdit(card);
    setCardModalMode('edit');
  }, []);

  const handleCardDelete = useCallback(async (card: Card) => {
    if (!passphrase) return;
    
    setAppState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Delete from Drive
      await deleteCardFromDrive(card.id);
      
      // Update local state
      setCards(prev => prev.filter(c => c.id !== card.id));
      setShowCardDetail(false);
    } catch (error: any) {
      console.error('Failed to delete card:', error);
      setAppState(prev => ({ 
        ...prev, 
        error: 'Failed to delete card. Please try again.' 
      }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [passphrase]);

  const handleBatchDelete = useCallback(async (cardIds: string[]) => {
    if (!passphrase) return;
    
    setAppState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Delete from Drive
      for (const cardId of cardIds) {
        await deleteCardFromDrive(cardId);
      }
      
      // Update local state
      setCards(prev => prev.filter(card => !cardIds.includes(card.id)));
      
      // Close detail modal if one of the deleted cards was selected
      if (selectedCard && cardIds.includes(selectedCard.id)) {
        setShowCardDetail(false);
        setSelectedCard(null);
      }
    } catch (error: any) {
      console.error('Failed to delete cards:', error);
      setAppState(prev => ({ 
        ...prev, 
        error: 'Failed to delete cards. Please try again.' 
      }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [passphrase, selectedCard]);

  const handleCardClick = useCallback((card: Card) => {
    setSelectedCard(card);
    setShowCardDetail(true);
  }, []);

  const handleAddCard = useCallback(() => {
    setCardToEdit(null);
    setCardModalMode('create');
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // Reset app state
      setCurrentView('welcome');
      setPassphrase(null);
      setCards([]);
      setSelectedCard(null);
      setCardModalMode(null);
      setCardToEdit(null);
      setShowCardDetail(false);
      setAppState({
        hasPassphrase: false,
        isDataLoaded: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut]);

  // Loading screen for app initialization
  if (appState.isLoading && currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Setting up your secure vault...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthCheck>
      {currentView === 'welcome' && (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-8">
            <header className="text-center mb-12">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-gradient">
                  SecureCardr
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Welcome, {user?.displayName || user?.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Your data is encrypted client-side and stored securely in your own Google Drive.
              </p>
            </header>
            
            <main className="max-w-4xl mx-auto">
              {appState.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{appState.error}</p>
                </div>
              )}
              
              <div className="card p-8 text-center">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Ready to Create Your Secure Vault
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  Let's set up your secure card vault. You can see how the encryption works
                  or jump straight to setting up your passphrase.
                </p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => setCurrentView('demo')}
                    className="btn-primary w-full sm:w-auto mr-4"
                  >
                    See How Encryption Works
                  </button>
                  <button 
                    onClick={() => setCurrentView('setup')}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Set Up Passphrase
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {currentView === 'demo' && (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentView('welcome')}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Welcome
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Sign Out
                </button>
              </div>
              
              <EncryptionDemo onComplete={handleDemoComplete} />
            </div>
          </div>
        </div>
      )}

      {currentView === 'setup' && (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <PassphraseSetupModal
            isOpen={true}
            onComplete={handlePassphraseSetup}
            onCancel={() => setCurrentView('welcome')}
          />
        </div>
      )}

      {currentView === 'passphrase-entry' && (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <PassphraseEntryModal
            isOpen={true}
            onSuccess={handlePassphraseEntry}
            onCancel={() => setCurrentView('welcome')}
          />
        </div>
      )}

      {currentView === 'cards' && (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    SecureCardr
                  </h1>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {cards.length} cards • Encrypted & Secure
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAddCard}
                    className="btn-primary flex items-center space-x-2"
                    disabled={appState.isLoading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Card</span>
                  </button>
                  
                  <button
                    onClick={() => setCurrentView('demo')}
                    className="btn-secondary text-sm"
                  >
                    View Demo
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            {appState.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{appState.error}</p>
              </div>
            )}
            
            {appState.isLoading && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <p className="text-blue-800 dark:text-blue-200">Syncing with Drive...</p>
                </div>
              </div>
            )}
            
            <CardListView
              cards={cards}
              onCardClick={handleCardClick}
              onCardEdit={handleCardEdit}
              onCardDelete={handleCardDelete}
              onBatchDelete={handleBatchDelete}
              layout={layout}
              onLayoutChange={setLayout}
            />
          </main>

          {/* Modals */}
          {cardModalMode && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {cardModalMode === 'create' ? 'Add New Card' : 'Edit Card'}
                  </h2>
                </div>
                
                <div className="p-6">
                  <CardForm
                    initialData={cardToEdit || undefined}
                    onSubmit={handleCardSubmit}
                    onCancel={() => {
                      setCardModalMode(null);
                      setCardToEdit(null);
                    }}
                    mode={cardModalMode}
                  />
                </div>
              </div>
            </div>
          )}

          <CardDetailModal
            card={selectedCard}
            isOpen={showCardDetail}
            onClose={() => {
              setShowCardDetail(false);
              setSelectedCard(null);
            }}
            onEdit={handleCardEdit}
            onDelete={handleCardDelete}
          />
        </div>
      )}
    </AuthCheck>
  );
}

export default App;
