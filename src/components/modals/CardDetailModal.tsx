/**
 * Card Detail View Modal
 * Displays full card information with options to edit, delete, or export
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../../types';
import { CategoryBadge } from '../cards/CardCategoryComponents';
import { maskCardNumber, formatCardNumber } from '../../utils/cardValidation';
import { Logo } from '../common/Logo';

interface CardDetailModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
  onImageView?: (imageUrl: string) => void;
  className?: string;
}

export function CardDetailModal({
  card,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onImageView,
  className = "",
}: CardDetailModalProps) {
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowFullNumber(false);
      setShowDeleteConfirm(false);
      setCopiedField(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCopyToClipboard = useCallback(async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (card && showDeleteConfirm) {
      onDelete(card);
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  }, [card, showDeleteConfirm, onDelete, onClose]);

  const handleEdit = useCallback(() => {
    if (card) {
      onEdit(card);
      onClose();
    }
  }, [card, onEdit, onClose]);

  if (!isOpen || !card) {
    return null;
  }

  const categoryEmoji = {
    credit: '💳',
    debit: '💰',
    loyalty: '🎁',
    id: '🆔',
    other: '📋'
  }[card.category] || '📋';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className={`bg-surface rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">{categoryEmoji}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  {card.nickname}
                </h2>
                <p className="text-sm text-text-secondary">
                  Added {card.addedAt.toLocaleDateString()}
                  {card.updatedAt.getTime() !== card.addedAt.getTime() && (
                    <span> • Updated {card.updatedAt.toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Card Details Grid */}
          <div className="space-y-4">
            {/* Card Number */}
            {card.number && (
              <div className="bg-background rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-secondary">Card Number</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFullNumber(!showFullNumber)}
                      className="text-xs text-primary hover:text-blue-600 transition-colors"
                    >
                      {showFullNumber ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleCopyToClipboard(card.number!, 'number')}
                      className="p-1 text-text-secondary hover:text-primary transition-colors"
                      aria-label="Copy card number"
                    >
                      {copiedField === 'number' ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <p className="font-mono text-lg text-text-primary">
                  {showFullNumber ? formatCardNumber(card.number) : maskCardNumber(card.number)}
                </p>
              </div>
            )}

            {/* Expiry Date and CVV Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {card.expiryDate && (
                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-secondary">Expiry Date</label>
                    <button
                      onClick={() => handleCopyToClipboard(card.expiryDate!, 'expiry')}
                      className="p-1 text-text-secondary hover:text-primary transition-colors"
                      aria-label="Copy expiry date"
                    >
                      {copiedField === 'expiry' ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-lg text-text-primary">{card.expiryDate}</p>
                </div>
              )}

              {card.cvv && (
                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-secondary">CVV</label>
                    <button
                      onClick={() => handleCopyToClipboard(card.cvv!, 'cvv')}
                      className="p-1 text-text-secondary hover:text-primary transition-colors"
                      aria-label="Copy CVV"
                    >
                      {copiedField === 'cvv' ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-lg text-text-primary">•••</p>
                </div>
              )}
            </div>

            {/* Cardholder Name */}
            {card.cardholderName && (
              <div className="bg-background rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-secondary">Cardholder Name</label>
                  <button
                    onClick={() => handleCopyToClipboard(card.cardholderName!, 'name')}
                    className="p-1 text-text-secondary hover:text-primary transition-colors"
                    aria-label="Copy cardholder name"
                  >
                    {copiedField === 'name' ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-lg text-text-primary">{card.cardholderName}</p>
              </div>
            )}

            {/* Notes */}
            {card.notes && (
              <div className="bg-background rounded-lg p-4">
                <label className="text-sm font-medium text-text-secondary mb-2 block">Notes</label>
                <p className="text-text-primary whitespace-pre-wrap">{card.notes}</p>
              </div>
            )}

            {/* Card Image */}
            {card.imageUrl && (
              <div className="bg-background rounded-lg p-4">
                <label className="text-sm font-medium text-text-secondary mb-2 block">Card Image</label>
                <div className="relative group">
                  <img
                    src={card.imageUrl}
                    alt={`${card.nickname} card`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                    onClick={() => onImageView?.(card.imageUrl!)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors order-2 sm:order-1"
            >
              Close
            </button>
            
            <div className="flex gap-3 order-1 sm:order-2">
              <button
                onClick={handleEdit}
                className="flex-1 sm:flex-initial px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit</span>
              </button>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={handleDelete}
                  className="flex-1 sm:flex-initial px-6 py-2 text-red-400 border border-red-400 rounded-lg hover:bg-red-400 hover:text-white transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex-1 sm:flex-initial px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium animate-pulse"
                >
                  Confirm Delete?
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
