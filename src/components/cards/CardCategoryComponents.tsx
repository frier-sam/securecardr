/**
 * Card Category Components
 * React components for category management and display
 */

import React from 'react';
import { Card } from '../../types';
import {
  CardCategory,
  getCategoryInfo,
  getAllCategories,
  getCategoryColorClasses,
  groupCardsByCategory,
} from '../../utils/cardCategories';

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
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
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
                      className={`h-2 rounded-full transition-all duration-300 ${
                        category.color === 'blue' ? 'bg-blue-500' :
                        category.color === 'green' ? 'bg-green-500' :
                        category.color === 'purple' ? 'bg-purple-500' :
                        category.color === 'orange' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}
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
            p-4 rounded-lg border-2 transition-all duration-200 text-center hover:scale-105 transform
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
 * Category Summary Component
 */
interface CategorySummaryProps {
  cards: Card[];
  onCategoryClick?: (category: CardCategory) => void;
  className?: string;
}

export function CategorySummary({ cards, onCategoryClick, className = '' }: CategorySummaryProps) {
  const grouped = groupCardsByCategory(cards);
  const totalCards = cards.length;

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Your Cards ({totalCards})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {getAllCategories().map(category => {
          const count = grouped[category.id as CardCategory]?.length || 0;
          const percentage = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick?.(category.id as CardCategory)}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {category.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {count} cards ({percentage}%)
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Category Quick Actions Component
 */
interface CategoryQuickActionsProps {
  cards: Card[];
  onAddCard: (category: CardCategory) => void;
  className?: string;
}

export function CategoryQuickActions({ cards, onAddCard, className = '' }: CategoryQuickActionsProps) {
  const grouped = groupCardsByCategory(cards);
  
  return (
    <div className={`${className}`}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Quick Add
      </h3>
      <div className="flex flex-wrap gap-2">
        {getAllCategories().map(category => {
          const count = grouped[category.id as CardCategory]?.length || 0;
          
          return (
            <button
              key={category.id}
              onClick={() => onAddCard(category.id as CardCategory)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${getCategoryColorClasses(category.id as CardCategory, 'bg')}
                ${getCategoryColorClasses(category.id as CardCategory, 'text')}
                hover:scale-105 transform
              `}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
              {count > 0 && (
                <span className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
