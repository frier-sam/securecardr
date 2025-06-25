/**
 * Card Category System
 * Utilities and components for managing card categories
 */

import React from 'react';
import { Card } from '../../types';

// Card category definitions with metadata
export const CARD_CATEGORIES = {
  credit: {
    id: 'credit',
    label: 'Credit Card',
    icon: '💳',
    color: 'blue',
    description: 'Credit cards, charge cards, and store credit cards',
    fields: ['number', 'expiryDate', 'cvv', 'issuer'],
    commonBrands: ['Visa', 'Mastercard', 'American Express', 'Discover'],
  },
  debit: {
    id: 'debit',
    label: 'Debit Card',
    icon: '💰',
    color: 'green',
    description: 'Debit cards and bank cards',
    fields: ['number', 'expiryDate', 'pin', 'bank'],
    commonBrands: ['Visa Debit', 'Mastercard Debit', 'Local Bank'],
  },
  loyalty: {
    id: 'loyalty',
    label: 'Loyalty Card',
    icon: '🏆',
    color: 'purple',
    description: 'Reward cards, membership cards, and loyalty programs',
    fields: ['number', 'barcode', 'points', 'tier'],
    commonBrands: ['Airline Miles', 'Store Rewards', 'Hotel Points'],
  },
  id: {
    id: 'id',
    label: 'ID Card',
    icon: '🆔',
    color: 'orange',
    description: 'Identity cards, licenses, and official documents',
    fields: ['number', 'issueDate', 'expiryDate', 'authority'],
    commonBrands: ['Driver License', 'ID Card', 'Passport', 'Work ID'],
  },
  other: {
    id: 'other',
    label: 'Other',
    icon: '📄',
    color: 'gray',
    description: 'Gift cards, transit cards, and other cards',
    fields: ['number', 'balance', 'expiryDate'],
    commonBrands: ['Gift Card', 'Transit Card', 'Library Card'],
  },
} as const;

export type CardCategory = keyof typeof CARD_CATEGORIES;

/**
 * Get category metadata
 */
export function getCategoryInfo(category: CardCategory) {
  return CARD_CATEGORIES[category];
}

/**
 * Get all categories as array
 */
export function getAllCategories() {
  return Object.values(CARD_CATEGORIES);
}

/**
 * Get category color classes for Tailwind
 */
export function getCategoryColorClasses(category: CardCategory, variant: 'bg' | 'text' | 'border' = 'bg') {
  const colorMap = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-900/20',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-800',
    },
  };

  const categoryInfo = getCategoryInfo(category);
  return colorMap[categoryInfo.color][variant];
}

/**
 * Card Category Badge Component
 */
interface CategoryBadgeProps {
  category: CardCategory;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function CategoryBadge({ 
  category, 
  size = 'md', 
  showIcon = true, 
  showLabel = true,
  className = '' 
}: CategoryBadgeProps) {
  const categoryInfo = getCategoryInfo(category);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${getCategoryColorClasses(category, 'bg')}
      ${getCategoryColorClasses(category, 'text')}
      ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && <span className="mr-1">{categoryInfo.icon}</span>}
      {showLabel && categoryInfo.label}
    </span>
  );
}

/**
 * Category Filter Component
 */
interface CategoryFilterProps {
  selectedCategories: CardCategory[];
  onCategoryToggle: (category: CardCategory) => void;
  className?: string;
}

export function CategoryFilter({ selectedCategories, onCategoryToggle, className = '' }: CategoryFilterProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter by Category</h3>
      <div className="space-y-2">
        {getAllCategories().map(category => {
          const isSelected = selectedCategories.includes(category.id as CardCategory);
          
          return (
            <label
              key={category.id}
              className="flex items-center cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onCategoryToggle(category.id as CardCategory)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-3 flex items-center">
                <span className="text-lg mr-2">{category.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {category.label}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Category Stats Component
 */
interface CategoryStatsProps {
  cards: Card[];
  className?: string;
}

export function CategoryStats({ cards, className = '' }: CategoryStatsProps) {
  const categoryStats = getAllCategories().map(category => {
    const count = cards.filter(card => card.category === category.id).length;
    return {
      ...category,
      count,
    };
  });

  const totalCards = cards.length;

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Category Overview</h3>
      <div className="space-y-3">
        {categoryStats.map(category => {
          const percentage = totalCards > 0 ? Math.round((category.count / totalCards) * 100) : 0;
          
          return (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">{category.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {category.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {category.count}
                </div>
                {totalCards > 0 && (
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCategoryColorClasses(category.id as CardCategory, 'bg').replace('dark:bg-', 'dark:bg-').replace('/20', '')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                  {percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Category Selector Component
 */
interface CategorySelectorProps {
  selectedCategory: CardCategory;
  onCategorySelect: (category: CardCategory) => void;
  layout?: 'grid' | 'list';
  className?: string;
}

export function CategorySelector({ 
  selectedCategory, 
  onCategorySelect, 
  layout = 'grid', 
  className = '' 
}: CategorySelectorProps) {
  if (layout === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {getAllCategories().map(category => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id as CardCategory)}
            className={`
              w-full p-3 rounded-lg border-2 transition-all duration-200 text-left flex items-center space-x-3
              ${selectedCategory === category.id
                ? `${getCategoryColorClasses(category.id as CardCategory, 'border')} ${getCategoryColorClasses(category.id as CardCategory, 'bg')}`
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            <span className="text-2xl">{category.icon}</span>
            <div>
              <div className={`font-medium ${selectedCategory === category.id ? getCategoryColorClasses(category.id as CardCategory, 'text') : 'text-gray-900 dark:text-white'}`}>
                {category.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {category.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 ${className}`}>
      {getAllCategories().map(category => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.id as CardCategory)}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 text-center
            ${selectedCategory === category.id
              ? `${getCategoryColorClasses(category.id as CardCategory, 'border')} ${getCategoryColorClasses(category.id as CardCategory, 'bg')}`
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
        >
          <div className="text-3xl mb-2">{category.icon}</div>
          <div className={`text-sm font-medium ${selectedCategory === category.id ? getCategoryColorClasses(category.id as CardCategory, 'text') : 'text-gray-900 dark:text-white'}`}>
            {category.label}
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Detect card category from card number (basic heuristics)
 */
export function detectCardCategory(cardNumber: string): CardCategory {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Credit card patterns (basic detection)
  if (cleanNumber.match(/^4/)) return 'credit'; // Visa
  if (cleanNumber.match(/^5[1-5]/) || cleanNumber.match(/^2[2-7]/)) return 'credit'; // Mastercard
  if (cleanNumber.match(/^3[47]/)) return 'credit'; // American Express
  if (cleanNumber.match(/^6/)) return 'credit'; // Discover
  
  // If it looks like a card number but doesn't match credit patterns
  if (cleanNumber.length >= 13 && cleanNumber.length <= 19) {
    return 'debit'; // Assume debit if it's card-like but not credit
  }
  
  // If it's shorter, might be loyalty or ID
  if (cleanNumber.length <= 12) {
    return 'loyalty';
  }
  
  return 'other';
}

/**
 * Get recommended fields for a category
 */
export function getRecommendedFields(category: CardCategory): string[] {
  return getCategoryInfo(category).fields;
}

/**
 * Get common brands/issuers for a category
 */
export function getCommonBrands(category: CardCategory): string[] {
  return getCategoryInfo(category).commonBrands;
}

/**
 * Group cards by category
 */
export function groupCardsByCategory(cards: Card[]): Record<CardCategory, Card[]> {
  const grouped = getAllCategories().reduce((acc, category) => {
    acc[category.id as CardCategory] = [];
    return acc;
  }, {} as Record<CardCategory, Card[]>);

  cards.forEach(card => {
    if (grouped[card.category]) {
      grouped[card.category].push(card);
    }
  });

  return grouped;
}

/**
 * Sort categories by card count
 */
export function sortCategoriesByCount(cards: Card[]): Array<{ category: CardCategory; count: number }> {
  const grouped = groupCardsByCategory(cards);
  
  return Object.entries(grouped)
    .map(([category, cards]) => ({
      category: category as CardCategory,
      count: cards.length,
    }))
    .sort((a, b) => b.count - a.count);
}
