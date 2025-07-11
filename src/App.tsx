import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardFormData } from './types';
import { useAuth } from './context/AuthContext';
import { EncryptionDemo } from './components/common/EncryptionDemo';
import { PassphraseSetupModal } from './components/modals/PassphraseSetupModal';
import { CardForm } from './components/cards/CardForm';
import { CardListView } from './components/cards/CardListView';
import { CardDetailModal } from './components/modals/CardDetailModal';
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/common/Logo';
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
  saveCardIndexToDrive,
  deleteAllCardsFromDrive
} from './services/driveStorage';
import { vaultSession } from './services/vaultSession';

type AppView = 'landing' | 'demo' | 'setup' | 'passphrase-entry' | 'dashboard';
type CardModalMode = 'create' | 'edit' | null;

interface AppState {
  hasPassphrase: boolean;
  isDataLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

// Enhanced Header Component with Branding (Fixed Layout)
function Header({ user, onSignOut, showDemo = false, onShowDemo, onDeleteVault }: { 
  user: any; 
  onSignOut: () => void; 
  showDemo?: boolean;
  onShowDemo?: () => void;
  onDeleteVault?: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3">
          {/* Logo and Brand - Fixed Layout */}
          <div className="flex items-center">
            <Logo size={32} className="text-primary flex-shrink-0" />
            <div className="ml-3">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary">SecureCardr</h1>
              <p className="text-xs text-text-secondary hidden sm:block">Zero-Knowledge Vault</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {showDemo && onShowDemo && (
              <button 
                onClick={onShowDemo}
                className="text-text-secondary hover:text-secondary transition-colors text-sm font-medium"
              >
                Demo
              </button>
            )}
            {user && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-sm font-semibold">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-text-secondary hidden lg:block max-w-[200px] truncate">
                    {user.email}
                  </span>
                </div>

                {/* More Options Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {showMoreOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-slate-700 rounded-lg shadow-lg py-1">
                      {onDeleteVault && (
                        <button
                          onClick={() => {
                            setShowMoreOptions(false);
                            onDeleteVault();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-background hover:text-red-300 transition-colors"
                        >
                          Delete Vault & Reset
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowMoreOptions(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile menu */}
        {user && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-sm font-semibold">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </span>
              </div>
              <span className="text-sm text-text-secondary truncate">
                {user.email}
              </span>
            </div>
            {showDemo && onShowDemo && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onShowDemo();
                }}
                className="w-full text-left text-sm font-medium text-text-secondary hover:text-secondary transition-colors py-2"
              >
                View Demo
              </button>
            )}
            {onDeleteVault && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onDeleteVault();
                }}
                className="w-full text-left text-sm font-medium text-red-400 hover:text-red-300 transition-colors py-2"
              >
                Delete Vault & Reset
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignOut();
              }}
              className="w-full text-left text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center space-x-2 py-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// Enhanced Footer Component
function Footer() {
  return (
    <footer className="py-8 text-center border-t border-slate-700 mt-auto">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <Logo size={20} className="text-text-secondary" />
        <p className="text-text-secondary text-sm">© 2025 SecureCardr</p>
      </div>
      <p className="text-xs text-text-secondary">Your cards, your encryption, your control</p>
    </footer>
  );
}

// Enhanced Demo Modal Component
function DemoModal({ isOpen, onClose, onComplete }: { 
  isOpen: boolean; 
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    {
      title: "Your Data",
      content: "Your credit card details are entered securely in your browser.",
      icon: "📱"
    },
    {
      title: "Client-Side Encryption",
      content: "Data is encrypted using AES-256 before it ever leaves your device.",
      icon: "🔒"
    },
    {
      title: "Your Google Drive",
      content: "Only encrypted data is stored in your personal Google Drive folder.",
      icon: "☁️"
    },
    {
      title: "Zero Knowledge",
      content: "We never see your data - you hold the only key to decrypt it.",
      icon: "🔐"
    }
  ];

  if (!isOpen) return null;

  const handleComplete = () => {
    onClose();
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-surface rounded-lg max-w-2xl w-full p-6 animate-scale-in shadow-modal">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-h2 font-semibold text-text-primary">See Encryption in Action</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-slate-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="text-6xl animate-bounce" style={{ animationDelay: '0.1s' }}>
              {steps[currentStep].icon}
            </div>
          </div>
          <h3 className="text-h3 font-semibold text-text-primary text-center mb-4">
            {steps[currentStep].title}
          </h3>
          <p className="text-text-secondary text-center max-w-md mx-auto">
            {steps[currentStep].content}
          </p>
        </div>

        <div className="flex justify-center space-x-2 mb-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep ? 'bg-primary w-8' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-secondary border border-secondary rounded-md hover:bg-secondary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                handleComplete();
              }
            }}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Vault Confirmation Modal
function DeleteVaultModal({ isOpen, onClose, onConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-surface rounded-lg max-w-md w-full p-6 animate-scale-in shadow-modal">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Delete Vault & Reset</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-text-secondary mb-4">
            This action will permanently delete all your encrypted cards from Google Drive. This cannot be undone.
          </p>
          <p className="text-text-secondary mb-4">
            You'll need to set up a new passphrase and start fresh. Make sure you have backups if needed.
          </p>
          <p className="text-sm text-red-400">
            Type <span className="font-mono font-bold">DELETE</span> to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-background border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-text-primary"
            placeholder="Type DELETE to confirm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'DELETE'}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Everything
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Passphrase Entry Component
function PassphraseEntry({ onSuccess, onCancel }: { 
  onSuccess: (passphrase: string) => void; 
  onCancel: () => void; 
}) {
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await loadPreferencesFromDrive(passphrase);
      // Store passphrase in session for 5 minutes
      await vaultSession.storePassphrase(passphrase);
      onSuccess(passphrase);
    } catch (err: any) {
      setError('Invalid passphrase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface max-w-md w-full p-8 rounded-lg shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <Logo size={48} className="text-primary" />
        </div>
        
        <h2 className="text-h2 font-semibold text-text-primary mb-2 text-center">
          Welcome back
        </h2>
        <p className="text-text-secondary mb-6 text-center">
          Enter your passphrase to unlock your vault
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter your passphrase"
              className="w-full px-4 py-3 bg-background border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary pr-12"
              autoFocus
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {showPassphrase ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-md animate-fade-in">
              <p className="text-red-200 text-small flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center space-x-2"
            disabled={!passphrase.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Unlocking...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span>Unlock Vault</span>
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              disabled={isLoading}
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Enhanced Dashboard Component with Mobile-Friendly Design
// Loading Overlay Component
function LoadingOverlay({ message = "Loading your secure vault..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-surface rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <Logo size={64} className="text-primary animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
            </div>
          </div>
          <p className="text-text-primary font-medium mb-2">{message}</p>
          <p className="text-text-secondary text-sm text-center">
            Decrypting your cards with your passphrase...
          </p>
          <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ 
  cards, 
  onAddCard, 
  onCardClick, 
  onCardEdit, 
  onCardDelete, 
  onBatchDelete,
  isLoading 
}: {
  cards: Card[];
  onAddCard: () => void;
  onCardClick: (card: Card) => void;
  onCardEdit: (card: Card) => void;
  onCardDelete: (card: Card) => void;
  onBatchDelete: (cardIds: string[]) => void;
  isLoading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', label: 'All Cards', icon: '🎯' },
    { id: 'credit', label: 'Credit', icon: '💳' },
    { id: 'debit', label: 'Debit', icon: '💰' },
    { id: 'loyalty', label: 'Loyalty', icon: '🎁' },
    { id: 'id', label: 'ID', icon: '🆔' },
    { id: 'other', label: 'Other', icon: '📋' }
  ];

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: cards.length,
    credit: cards.filter(c => c.category === 'credit').length,
    debit: cards.filter(c => c.category === 'debit').length,
    loyalty: cards.filter(c => c.category === 'loyalty').length
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Stats Bar */}
      <div className="bg-surface/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
              <p className="text-xs text-text-secondary">Total Cards</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{stats.credit}</p>
              <p className="text-xs text-text-secondary">Credit Cards</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-secondary">{stats.debit}</p>
              <p className="text-xs text-text-secondary">Debit Cards</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-accent">{stats.loyalty}</p>
              <p className="text-xs text-text-secondary">Loyalty Cards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-surface border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search your cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-2.5 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              {/* Layout Toggle */}
              <div className="hidden sm:flex items-center bg-background rounded-lg p-1">
                <button
                  onClick={() => setLayout('grid')}
                  className={`p-2 rounded ${layout === 'grid' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'} transition-colors`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={`p-2 rounded ${layout === 'list' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'} transition-colors`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Add Card Button */}
              <button
                onClick={onAddCard}
                className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Card</span>
              </button>
            </div>
          </div>

          {/* Category Filters - Desktop */}
          <div className="hidden lg:flex items-center gap-2 mt-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-background text-text-secondary hover:text-text-primary hover:bg-slate-800'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* Category Filters - Mobile */}
          {showFilters && (
            <div className="lg:hidden grid grid-cols-3 gap-2 mt-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-background text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span className="block text-lg mb-1">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filteredCards.length === 0 && cards.length === 0 && (
          <div className="text-center py-20">
            <div className="mb-6">
              <Logo size={80} className="text-text-secondary mx-auto opacity-50" />
            </div>
            <h3 className="text-2xl font-semibold text-text-primary mb-3">Your vault is empty</h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Start securing your cards with zero-knowledge encryption. Add your first card to get started.
            </p>
            <button
              onClick={onAddCard}
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Your First Card</span>
            </button>
          </div>
        )}

        {filteredCards.length === 0 && cards.length > 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No cards found</h3>
            <p className="text-text-secondary">Try adjusting your search or filters</p>
          </div>
        )}

        {filteredCards.length > 0 && (
          <div className={layout === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredCards.map((card) => (
              <div
                key={card.id}
                onClick={() => onCardClick(card)}
                className={`
                  bg-surface rounded-lg cursor-pointer transition-all duration-200 
                  hover:transform hover:-translate-y-1 hover:shadow-2xl 
                  border border-slate-700 hover:border-primary/50 overflow-hidden
                  ${layout === 'list' ? 'flex items-center p-4' : card.imageUrl ? 'pb-6' : 'p-6'}
                `}
              >
                {layout === 'grid' ? (
                  // Grid Layout
                  <>
                    {/* Card Image */}
                    {card.imageUrl && (
                      <div className="mb-4 -mx-6 -mt-6">
                        <img
                          src={card.imageUrl}
                          alt={`${card.nickname} card`}
                          className="w-full h-32 object-cover rounded-t-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCardClick(card);
                          }}
                        />
                      </div>
                    )}
                    
                    <div className={`flex justify-between items-start mb-4 ${card.imageUrl ? 'px-6' : ''}`}>
                      <div className="flex-1 mr-2">
                        <h3 className="text-lg font-semibold text-text-primary truncate">
                          {card.nickname}
                        </h3>
                        <p className="text-sm text-text-secondary capitalize">
                          {card.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCardEdit(card);
                          }}
                          className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCardDelete(card);
                          }}
                          className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className={`space-y-2 ${card.imageUrl ? 'px-6' : ''}`}>
                      {card.number && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary">Number</span>
                          <span className="text-sm text-text-primary font-mono">
                            •••• {card.number.slice(-4)}
                          </span>
                        </div>
                      )}
                      {card.expiryDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary">Expires</span>
                          <span className="text-sm text-text-primary">{card.expiryDate}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // List Layout
                  <>
                    <div className="flex-1 flex items-center space-x-4">
                      {/* Card Image or Icon */}
                      {card.imageUrl ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={card.imageUrl}
                            alt={`${card.nickname} card`}
                            className="w-full h-full object-cover"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCardClick(card);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">
                            {card.category === 'credit' ? '💳' : 
                             card.category === 'debit' ? '💰' : 
                             card.category === 'loyalty' ? '🎁' : 
                             card.category === 'id' ? '🆔' : '📋'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{card.nickname}</h3>
                        <p className="text-sm text-text-secondary">
                          {card.number ? `•••• ${card.number.slice(-4)}` : card.category}
                          {card.expiryDate && ` • Exp: ${card.expiryDate}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardEdit(card);
                        }}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardDelete(card);
                        }}
                        className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showDeleteVaultModal, setShowDeleteVaultModal] = useState(false);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardModalMode, setCardModalMode] = useState<CardModalMode>(null);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [appState, setAppState] = useState<AppState>({
    hasPassphrase: false,
    isDataLoaded: false,
    isLoading: false,
    error: null
  });

  // Helper function to load user cards with optimized loading
  const loadUserCards = useCallback(async (userPassphrase: string) => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const cardsList = await listCardsFromDrive();
      const loadedCards: Card[] = [];
      
      // Load cards with progress indication
      const totalCards = cardsList.length;
      let loadedCount = 0;
      
      // Use Promise.all for parallel loading with error handling
      const cardPromises = cardsList.map(async (cardInfo) => {
        try {
          const cardData = await loadCardFromDrive(cardInfo.fileId, userPassphrase);
          loadedCount++;
          
          // Update loading progress
          if (loadedCount % 5 === 0) {
            // Update UI every 5 cards to avoid too many re-renders
            setAppState(prev => ({ ...prev, isLoading: true }));
          }
          
          return {
            ...cardData,
            driveFileId: cardInfo.fileId
          } as Card;
        } catch (error) {
          console.error(`Failed to load card ${cardInfo.id}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(cardPromises);
      const validCards = results.filter((card): card is Card => card !== null);
      
      setCards(validCards);
      setAppState(prev => ({ ...prev, isDataLoaded: true }));
    } catch (error) {
      console.error('Failed to load cards:', error);
      setAppState(prev => ({ ...prev, error: 'Failed to load cards' }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Initialize app when user signs in
  useEffect(() => {
    if (!user) return;

    const initializeApp = async () => {
      setAppState(prev => ({ ...prev, isLoading: true }));
      
      try {
        await initializeDriveStorage();
        
        // Check for existing session first
        const sessionPassphrase = await vaultSession.retrievePassphrase();
        if (sessionPassphrase) {
          // Valid session exists, load cards directly
          setPassphrase(sessionPassphrase);
          await loadUserCards(sessionPassphrase);
          setCurrentView('dashboard');
          return;
        }
        
        // No session, check for existing data
        const cardsList = await listCardsFromDrive();
        if (cardsList.length > 0) {
          setAppState(prev => ({ ...prev, hasPassphrase: true }));
          setCurrentView('passphrase-entry');
        } else {
          setCurrentView('setup');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setCurrentView('setup');
      } finally {
        setAppState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeApp();
  }, [user]);

  // Handle delete vault
  const handleDeleteVault = async () => {
    if (!passphrase) return;
    
    setAppState(prev => ({ ...prev, isLoading: true }));
    try {
      await deleteAllCardsFromDrive();
      setCards([]);
      setPassphrase(null);
      // Clear vault session
      vaultSession.clearSession();
      setCurrentView('setup');
      setShowDeleteVaultModal(false);
    } catch (error) {
      console.error('Failed to delete vault:', error);
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Logo size={64} className="text-primary mx-auto mb-4 animate-pulse" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Connecting to Google...</p>
        </div>
      </div>
    );
  }

  // Not signed in - show landing page
  if (!user) {
    return (
      <>
        <LandingPage
          onStartGoogle={signIn}
          onShowDemo={() => setShowDemoModal(true)}
        />
        <DemoModal 
          isOpen={showDemoModal} 
          onClose={() => setShowDemoModal(false)}
          onComplete={() => {
            // Stay on landing page after demo completes
            setShowDemoModal(false);
          }}
        />
      </>
    );
  }

  // Signed in - show appropriate view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        user={user} 
        onSignOut={signOut} 
        showDemo={currentView === 'dashboard'} 
        onShowDemo={() => setShowDemoModal(true)}
        onDeleteVault={currentView === 'dashboard' ? () => setShowDeleteVaultModal(true) : undefined}
      />
      
      <main className="flex-1">
        {currentView === 'setup' && (
          <div className="min-h-screen bg-background">
            <PassphraseSetupModal
              isOpen={true}
              onComplete={async (newPassphrase) => {
                setPassphrase(newPassphrase);
                // Store passphrase in session for 5 minutes
                await vaultSession.storePassphrase(newPassphrase);
                setCurrentView('dashboard');
              }}
              onCancel={() => {
                signOut();
                setCurrentView('landing');
              }}
            />
          </div>
        )}

        {currentView === 'passphrase-entry' && (
          <>
            <PassphraseEntry
              onSuccess={async (userPassphrase) => {
                setPassphrase(userPassphrase);
                // Use optimized loading function
                await loadUserCards(userPassphrase);
                setCurrentView('dashboard');
              }}
              onCancel={() => {
                signOut();
                setCurrentView('landing');
              }}
            />
            {appState.isLoading && <LoadingOverlay />}
          </>
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            cards={cards}
            onAddCard={() => {
              setCardToEdit(null);
              setCardModalMode('create');
            }}
            onCardClick={(card) => {
              setSelectedCard(card);
              setShowCardDetail(true);
            }}
            onCardEdit={(card) => {
              setCardToEdit(card);
              setCardModalMode('edit');
            }}
            onCardDelete={async (card) => {
              if (!passphrase) return;
              
              const confirmDelete = window.confirm(`Are you sure you want to delete "${card.nickname}"?`);
              if (!confirmDelete) return;
              
              try {
                await deleteCardFromDrive(card.id);
                setCards(prev => prev.filter(c => c.id !== card.id));
                setShowCardDetail(false);
              } catch (error) {
                console.error('Failed to delete card:', error);
              }
            }}
            onBatchDelete={async (cardIds) => {
              if (!passphrase) return;
              try {
                for (const cardId of cardIds) {
                  await deleteCardFromDrive(cardId);
                }
                setCards(prev => prev.filter(card => !cardIds.includes(card.id)));
              } catch (error) {
                console.error('Failed to delete cards:', error);
              }
            }}
            isLoading={appState.isLoading}
          />
        )}
      </main>

      {/* Demo Modal */}
      <DemoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)}
      />

      {/* Delete Vault Modal */}
      <DeleteVaultModal
        isOpen={showDeleteVaultModal}
        onClose={() => setShowDeleteVaultModal(false)}
        onConfirm={handleDeleteVault}
      />

      {/* Card Form Modal */}
      {cardModalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-h2 font-semibold text-text-primary">
                {cardModalMode === 'create' ? 'Add New Card' : 'Edit Card'}
              </h2>
              <button
                onClick={() => {
                  setCardModalMode(null);
                  setCardToEdit(null);
                }}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <CardForm
                initialData={cardToEdit || undefined}
                onSubmit={async (formData) => {
                  if (!passphrase) return;
                  
                  try {
                    // Convert image file to data URL if present
                    let imageUrl: string | undefined;
                    if (formData.image) {
                      const reader = new FileReader();
                      imageUrl = await new Promise<string>((resolve, reject) => {
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(formData.image!);
                      });
                    }
                    
                    if (cardModalMode === 'edit' && cardToEdit) {
                      const updatedCard = {
                        ...updateCardFromFormData(cardToEdit, formData),
                        imageUrl: imageUrl || cardToEdit.imageUrl
                      };
                      const driveFileId = (cardToEdit as any).driveFileId;
                      if (driveFileId) {
                        await updateCardInDrive(driveFileId, updatedCard, passphrase);
                      }
                      setCards(prev => prev.map(card => 
                        card.id === cardToEdit.id ? { ...updatedCard, driveFileId } : card
                      ));
                    } else {
                      const newCard = {
                        ...createCardFromFormData(formData),
                        imageUrl
                      };
                      const driveFileId = await saveCardToDrive(newCard, passphrase);
                      setCards(prev => [...prev, { ...newCard, driveFileId }]);
                    }
                    
                    setCardModalMode(null);
                    setCardToEdit(null);
                  } catch (error) {
                    console.error('Failed to save card:', error);
                  }
                }}
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

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={showCardDetail}
        onClose={() => {
          setShowCardDetail(false);
          setSelectedCard(null);
        }}
        onEdit={(card) => {
          setCardToEdit(card);
          setCardModalMode('edit');
          setShowCardDetail(false);
        }}
        onDelete={async (card) => {
          if (!passphrase) return;
          
          const confirmDelete = window.confirm(`Are you sure you want to delete "${card.nickname}"?`);
          if (!confirmDelete) return;
          
          try {
            await deleteCardFromDrive(card.id);
            setCards(prev => prev.filter(c => c.id !== card.id));
            setShowCardDetail(false);
          } catch (error) {
            console.error('Failed to delete card:', error);
          }
        }}
      />

      {currentView === 'dashboard' && <Footer />}
    </div>
  );
}

export default App;
