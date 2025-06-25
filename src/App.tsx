import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardFormData } from './types';
import { EncryptionDemo } from './components/common/EncryptionDemo';
import { PassphraseSetupModal } from './components/modals/PassphraseSetupModal';
import { CardForm } from './components/cards/CardForm';
import { CardListView } from './components/cards/CardListView';
import { CardDetailModal } from './components/modals/CardDetailModal';
import { createCardFromFormData, updateCardFromFormData } from './utils/cardValidation';

type AppView = 'welcome' | 'demo' | 'setup' | 'cards';
type CardModalMode = 'create' | 'edit' | null;

function App() {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [isPassphraseSetup, setIsPassphraseSetup] = useState(false);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardModalMode, setCardModalMode] = useState<CardModalMode>(null);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showCardDetail, setShowCardDetail] = useState(false);

  // Sample data for demo
  const demoCards: Card[] = useMemo(() => [
    {
      id: '1',
      category: 'credit',
      nickname: 'My Visa Card',
      number: '4532 1234 5678 9000',
      expiryDate: '12/25',
      last4: '9000',
      notes: 'Primary credit card for online purchases',
      addedAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2', 
      category: 'loyalty',
      nickname: 'Starbucks Rewards',
      number: '6789123456789',
      notes: 'Free coffee after 10 purchases',
      addedAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10'),
    },
    {
      id: '3',
      category: 'id',
      nickname: 'Driver License',
      number: 'DL123456789',
      expiryDate: '08/28',
      issueDate: '08/20',
      notes: 'Remember to renew before expiration',
      addedAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
  ], []);

  const handleDemoComplete = useCallback(() => {
    setCurrentView('setup');
  }, []);

  const handlePassphraseSetup = useCallback((newPassphrase: string) => {
    setPassphrase(newPassphrase);
    setIsPassphraseSetup(true);
    setCurrentView('cards');
    // In demo mode, load sample data
    setCards(demoCards);
  }, [demoCards]);

  const handleCardSubmit = useCallback(async (formData: CardFormData) => {
    try {
      if (cardModalMode === 'edit' && cardToEdit) {
        // Update existing card
        const updatedCard = updateCardFromFormData(cardToEdit, formData);
        setCards(prev => prev.map(card => 
          card.id === cardToEdit.id ? { ...updatedCard, imageUrl: card.imageUrl } : card
        ));
      } else {
        // Create new card
        const newCard = createCardFromFormData(formData);
        setCards(prev => [...prev, { ...newCard, imageUrl: undefined }]);
      }
      
      // Close modal
      setCardModalMode(null);
      setCardToEdit(null);
    } catch (error) {
      console.error('Failed to save card:', error);
      throw error;
    }
  }, [cardModalMode, cardToEdit]);

  const handleCardEdit = useCallback((card: Card) => {
    setCardToEdit(card);
    setCardModalMode('edit');
  }, []);

  const handleCardDelete = useCallback((card: Card) => {
    setCards(prev => prev.filter(c => c.id !== card.id));
    setShowCardDetail(false);
  }, []);

  const handleCardClick = useCallback((card: Card) => {
    setSelectedCard(card);
    setShowCardDetail(true);
  }, []);

  const handleAddCard = useCallback(() => {
    setCardToEdit(null);
    setCardModalMode('create');
  }, []);

  if (currentView === 'welcome') {
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
                Your data is encrypted client-side and stored securely in your own Google Drive.
                We never see or access your unencrypted information.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setCurrentView('demo')}
                  className="btn-primary w-full sm:w-auto mr-4"
                >
                  See How It Works
                </button>
                <button 
                  onClick={() => setCurrentView('setup')}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Get Started
                </button>
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

  if (currentView === 'demo') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setCurrentView('welcome')}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Welcome
              </button>
            </div>
            
            <EncryptionDemo onComplete={handleDemoComplete} />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PassphraseSetupModal
          isOpen={true}
          onComplete={handlePassphraseSetup}
          onCancel={() => setCurrentView('welcome')}
        />
      </div>
    );
  }

  // Cards view
  return (
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <CardListView
          cards={cards}
          onCardClick={handleCardClick}
          onCardEdit={handleCardEdit}
          onCardDelete={handleCardDelete}
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
  );
}

export default App;
