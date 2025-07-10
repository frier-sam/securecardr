/**
 * Card Category System - Utilities Only
 * Types, utilities, and helper functions for managing card categories
 */

import { Card } from '../types';

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

/**
 * Get category icon
 */
export function getCategoryIcon(category: CardCategory): string {
  return getCategoryInfo(category).icon;
}

/**
 * Get category label
 */
export function getCategoryLabel(category: CardCategory): string {
  return getCategoryInfo(category).label;
}

/**
 * Get category description
 */
export function getCategoryDescription(category: CardCategory): string {
  return getCategoryInfo(category).description;
}

/**
 * Check if category is valid
 */
export function isValidCategory(category: string): category is CardCategory {
  return Object.keys(CARD_CATEGORIES).includes(category);
}

/**
 * Get category statistics
 */
export function getCategoryStats(cards: Card[]) {
  const stats = getAllCategories().map(category => {
    const count = cards.filter(card => card.category === category.id).length;
    return {
      category: category.id as CardCategory,
      label: category.label,
      icon: category.icon,
      count,
      percentage: cards.length > 0 ? Math.round((count / cards.length) * 100) : 0,
    };
  });

  return {
    total: cards.length,
    categories: stats,
    mostUsed: stats.reduce((max, current) => current.count > max.count ? current : max, stats[0]),
    leastUsed: stats.reduce((min, current) => current.count < min.count ? current : min, stats[0]),
  };
}
