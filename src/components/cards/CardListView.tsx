/**
 * Card List/Grid View Component with Batch Operations
 * Displays cards in list or grid layout with filtering, sorting, and batch operations
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../../types';
import { CategoryBadge, CategoryFilter } from './CardCategoryComponents';
import { maskCardNumber } from '../../utils/cardValidation';
import { CardCategory } from '../../utils/cardCategories';

interface CardListViewProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  onCardEdit: (card: Card) => void;
  onCardDelete: (card: Card) => void;
  onBatchDelete?: (cardIds: string[]) => void;
  isLoading?: boolean;
  layout?: 'grid' | 'list';
  onLayoutChange?: (layout: 'grid' | 'list') => void;
}

type SortOption = 'nickname' | 'category' | 'dateAdded' | 'dateUpdated';
type SortDirection = 'asc' | 'desc';

export function CardListView({
  cards,
  onCardClick,
  onCardEdit,
  onCardDelete,
  onBatchDelete,
  isLoading = false,
  layout = 'grid',
  onLayoutChange,
}: CardListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CardCategory[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card =>
        card.nickname.toLowerCase().includes(query) ||
        (card.notes && card.notes.toLowerCase().includes(query)) ||
        (card.last4 && card.last4.includes(query))
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(card => selectedCategories.includes(card.category));
    }

    // Sort cards
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'nickname':
          aValue = a.nickname.toLowerCase();
          bValue = b.nickname.toLowerCase();
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'dateAdded':
          aValue = a.addedAt.getTime();
          bValue = b.addedAt.getTime();
          break;
        case 'dateUpdated':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [cards, searchQuery, selectedCategories, sortBy, sortDirection]);

  const handleCategoryToggle = useCallback((category: CardCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSortBy('dateAdded');
    setSortDirection('desc');
  }, []);

  // Batch selection handlers
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    setSelectedCards(new Set());
  }, []);

  const toggleCardSelection = useCallback((cardId: string) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCards(new Set(filteredAndSortedCards.map(card => card.id)));
  }, [filteredAndSortedCards]);

  const selectNone = useCallback(() => {
    setSelectedCards(new Set());
  }, []);

  const handleBatchDelete = useCallback(() => {
    if (selectedCards.size === 0) return;
    
    const message = selectedCards.size === 1
      ? 'Are you sure you want to delete this card?'
      : `Are you sure you want to delete ${selectedCards.size} cards?`;
    
    if (confirm(message)) {
      if (onBatchDelete) {
        onBatchDelete(Array.from(selectedCards));
      } else {
        // Fallback to individual deletion
        selectedCards.forEach(cardId => {
          const card = cards.find(c => c.id === cardId);
          if (card) onCardDelete(card);
        });
      }
      setSelectedCards(new Set());
      setIsSelectionMode(false);
    }
  }, [selectedCards, cards, onCardDelete, onBatchDelete]);

  const handleCardClick = useCallback((card: Card) => {
    if (isSelectionMode) {
      toggleCardSelection(card.id);
    } else {
      onCardClick(card);
    }
  }, [isSelectionMode, onCardClick, toggleCardSelection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading cards...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Batch Actions Bar */}
      {isSelectionMode && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {selectedCards.size} of {filteredAndSortedCards.length} selected
              </span>
              <button
                onClick={selectAll}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Select All
              </button>
              <button
                onClick={selectNone}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Select None
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchDelete}
                disabled={selectedCards.size === 0}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedCards.size === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                    : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedCards(new Set());
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Batch Select Toggle */}
          {!isSelectionMode && cards.length > 0 && (
            <button
              onClick={toggleSelectionMode}
              className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Select
            </button>
          )}

          {/* Sort Dropdown */}
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [newSortBy, newDirection] = e.target.value.split('-') as [SortOption, SortDirection];
              setSortBy(newSortBy);
              setSortDirection(newDirection);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="dateAdded-desc">Newest First</option>
            <option value="dateAdded-asc">Oldest First</option>
            <option value="nickname-asc">Name A-Z</option>
            <option value="nickname-desc">Name Z-A</option>
            <option value="category-asc">Category A-Z</option>
            <option value="dateUpdated-desc">Recently Updated</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || selectedCategories.length > 0
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filter
            {selectedCategories.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                {selectedCategories.length}
              </span>
            )}
          </button>

          {/* Layout Toggle */}
          {onLayoutChange && !isSelectionMode && (
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => onLayoutChange('grid')}
                className={`px-3 py-2 text-sm ${
                  layout === 'grid'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onLayoutChange('list')}
                className={`px-3 py-2 text-sm ${
                  layout === 'list'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <CategoryFilter
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              className="flex-1"
            />
            
            {(selectedCategories.length > 0 || searchQuery) && (
              <div className="flex flex-col justify-between">
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {filteredAndSortedCards.length === cards.length
            ? `${cards.length} cards`
            : `${filteredAndSortedCards.length} of ${cards.length} cards`
          }
        </span>
        
        {(searchQuery || selectedCategories.length > 0) && (
          <span>
            Filtered by: {searchQuery && `"${searchQuery}"`}
            {searchQuery && selectedCategories.length > 0 && ', '}
            {selectedCategories.length > 0 && `${selectedCategories.length} categories`}
          </span>
        )}
      </div>

      {/* Cards Display */}
      {filteredAndSortedCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {cards.length === 0 ? 'No cards yet' : 'No cards match your filters'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {cards.length === 0
              ? 'Add your first card to get started'
              : 'Try adjusting your search or filters'
            }
          </p>
          {(searchQuery || selectedCategories.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={
          layout === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        }>
          {filteredAndSortedCards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              layout={layout}
              isSelectionMode={isSelectionMode}
              isSelected={selectedCards.has(card.id)}
              onCardClick={handleCardClick}
              onCardEdit={onCardEdit}
              onCardDelete={onCardDelete}
              onToggleSelection={toggleCardSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CardItemProps {
  card: Card;
  layout: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onCardClick: (card: Card) => void;
  onCardEdit: (card: Card) => void;
  onCardDelete: (card: Card) => void;
  onToggleSelection: (cardId: string) => void;
}

function CardItem({ 
  card, 
  layout, 
  isSelectionMode,
  isSelected,
  onCardClick, 
  onCardEdit, 
  onCardDelete,
  onToggleSelection 
}: CardItemProps) {
  const [showActions, setShowActions] = useState(false);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${card.nickname}"?`)) {
      onCardDelete(card);
    }
  }, [card, onCardDelete]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCardEdit(card);
  }, [card, onCardEdit]);

  const handleCheckboxChange = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(card.id);
  }, [card.id, onToggleSelection]);

  if (layout === 'list') {
    return (
      <div
        onClick={() => onCardClick(card)}
        className={`bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
          isSelected 
            ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-200 dark:ring-primary-800' 
            : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {isSelectionMode && (
              <div onClick={handleCheckboxChange} className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            )}
            <CategoryBadge category={card.category} size="sm" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {card.nickname}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                {card.last4 && (
                  <span className="font-mono">****{card.last4}</span>
                )}
                {card.expiryDate && (
                  <span>Exp: {card.expiryDate}</span>
                )}
                <span>Added {card.addedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          {!isSelectionMode && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEdit}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onCardClick(card)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer relative group ${
        isSelected 
          ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-200 dark:ring-primary-800' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div 
          onClick={handleCheckboxChange}
          className="absolute top-2 left-2 z-10"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      )}

      <div className={`flex items-start justify-between mb-3 ${isSelectionMode ? 'ml-8' : ''}`}>
        <CategoryBadge category={card.category} size="sm" />
        
        {/* Action buttons */}
        {!isSelectionMode && (
          <div className={`flex items-center space-x-1 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <button
              onClick={handleEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className={`space-y-2 ${isSelectionMode ? 'ml-8' : ''}`}>
        <h3 className="font-medium text-gray-900 dark:text-white truncate">
          {card.nickname}
        </h3>
        
        {card.number && (
          <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {card.last4 ? `****${card.last4}` : maskCardNumber(card.number)}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {card.expiryDate && (
            <span>Exp: {card.expiryDate}</span>
          )}
          <span>Added {card.addedAt.toLocaleDateString()}</span>
        </div>
        
        {card.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {card.notes}
          </p>
        )}
      </div>
    </div>
  );
}