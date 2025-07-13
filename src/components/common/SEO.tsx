import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  canonicalUrl?: string;
}

const DEFAULT_SEO = {
  title: 'SecureCardr - Zero-Knowledge Card Vault',
  description: 'SecureCardr is a zero-knowledge card vault that encrypts your credit cards, IDs, and loyalty cards in your browser before storing them securely in your Google Drive. Your data, your encryption, your control.',
  keywords: 'secure card storage, zero knowledge encryption, card vault, credit card security, privacy, encrypted storage, Google Drive, client-side encryption, AES-256, secure wallet',
  image: 'https://securecardr.com/og-image.png',
  url: 'https://securecardr.com',
  type: 'website' as const
};

export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noIndex = false,
  canonicalUrl
}: SEOProps) {
  const seoTitle = title ? `${title} | SecureCardr` : DEFAULT_SEO.title;
  const seoDescription = description || DEFAULT_SEO.description;
  const seoKeywords = keywords || DEFAULT_SEO.keywords;
  const seoImage = image || DEFAULT_SEO.image;
  const seoUrl = url || DEFAULT_SEO.url;
  const seoCanonical = canonicalUrl || seoUrl;

  useEffect(() => {
    // Update document title
    document.title = seoTitle;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update link tags
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      
      link.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', seoDescription);
    updateMetaTag('keywords', seoKeywords);
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph meta tags
    updateMetaTag('og:title', seoTitle, true);
    updateMetaTag('og:description', seoDescription, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', seoUrl, true);
    updateMetaTag('og:image', seoImage, true);
    updateMetaTag('og:site_name', 'SecureCardr', true);

    // Twitter meta tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', seoTitle, true);
    updateMetaTag('twitter:description', seoDescription, true);
    updateMetaTag('twitter:image', seoImage, true);
    updateMetaTag('twitter:url', seoUrl, true);

    // Canonical URL
    updateLinkTag('canonical', seoCanonical);

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = DEFAULT_SEO.title;
      updateMetaTag('description', DEFAULT_SEO.description);
      updateMetaTag('keywords', DEFAULT_SEO.keywords);
      updateMetaTag('robots', 'index, follow');
      updateMetaTag('og:title', DEFAULT_SEO.title, true);
      updateMetaTag('og:description', DEFAULT_SEO.description, true);
      updateMetaTag('og:type', DEFAULT_SEO.type, true);
      updateMetaTag('og:url', DEFAULT_SEO.url, true);
      updateMetaTag('og:image', DEFAULT_SEO.image, true);
      updateMetaTag('twitter:title', DEFAULT_SEO.title, true);
      updateMetaTag('twitter:description', DEFAULT_SEO.description, true);
      updateMetaTag('twitter:image', DEFAULT_SEO.image, true);
      updateMetaTag('twitter:url', DEFAULT_SEO.url, true);
      updateLinkTag('canonical', DEFAULT_SEO.url);
    };
  }, [seoTitle, seoDescription, seoKeywords, seoImage, seoUrl, seoCanonical, type, noIndex]);

  return null; // This component doesn't render anything
}

// Hook for programmatic SEO updates
export function useSEO(seoProps: SEOProps) {
  useEffect(() => {
    const seoComponent = document.createElement('div');
    document.body.appendChild(seoComponent);

    // Create a temporary SEO component
    const tempSEO = React.createElement(SEO, seoProps);
    
    // Cleanup
    return () => {
      if (document.body.contains(seoComponent)) {
        document.body.removeChild(seoComponent);
      }
    };
  }, [seoProps]);
}

// Predefined SEO configurations for common pages
export const SEO_CONFIGS = {
  landing: {
    title: 'Secure Card Storage with Zero-Knowledge Encryption',
    description: 'Store your credit cards, IDs, and loyalty cards securely with client-side encryption. Your data stays private - we never see your unencrypted information.',
    keywords: 'secure card storage, zero knowledge encryption, privacy, credit card security, encrypted wallet, Google Drive storage'
  },
  
  dashboard: {
    title: 'Your Secure Card Vault',
    description: 'Access your encrypted card vault. Manage your credit cards, IDs, and loyalty cards with complete privacy and security.',
    keywords: 'card vault, secure storage, encrypted cards, privacy dashboard',
    noIndex: true // User-specific content
  },
  
  privacy: {
    title: 'Privacy Policy - Your Data Security',
    description: 'Learn how SecureCardr protects your privacy with zero-knowledge encryption. We never see your unencrypted data.',
    keywords: 'privacy policy, data protection, zero knowledge, encryption, security'
  },
  
  security: {
    title: 'Security Features - AES-256 Encryption',
    description: 'SecureCardr uses military-grade AES-256 encryption with client-side key derivation. Learn about our security architecture.',
    keywords: 'AES-256 encryption, security features, client-side encryption, PBKDF2, secure storage'
  },
  
  help: {
    title: 'Help & Support - Getting Started',
    description: 'Get help with SecureCardr. Learn how to set up your vault, add cards, and manage your secure storage.',
    keywords: 'help, support, getting started, tutorial, card vault setup'
  },
  
  contact: {
    title: 'Contact Support',
    description: 'Need help with SecureCardr? Contact our support team for assistance with your secure card vault.',
    keywords: 'contact, support, help, customer service'
  }
};

// Analytics tracking for SEO
export function trackPageView(page: string, title?: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: title || document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      custom_map: {
        page_name: page
      }
    });
  }
}

// Structured data for rich snippets
export function addStructuredData(data: Record<string, any>) {
  if (typeof window === 'undefined') return;

  // Remove existing structured data
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-dynamic="true"]');
  existingScripts.forEach(script => script.remove());

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-dynamic', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

// SEO utility functions
export const seoUtils = {
  // Generate meta description from content
  generateDescription: (content: string, maxLength = 160) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength - 3) + '...'
      : content;
  },

  // Generate keywords from content
  generateKeywords: (content: string, additionalKeywords: string[] = []) => {
    const words = content.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const uniqueWords = [...new Set(words)];
    return [...additionalKeywords, ...uniqueWords.slice(0, 10)].join(', ');
  },

  // Validate SEO requirements
  validateSEO: (props: SEOProps) => {
    const issues: string[] = [];
    
    if (!props.title || props.title.length < 10) {
      issues.push('Title should be at least 10 characters long');
    }
    
    if (!props.description || props.description.length < 120) {
      issues.push('Description should be at least 120 characters long');
    }
    
    if (props.title && props.title.length > 60) {
      issues.push('Title should not exceed 60 characters');
    }
    
    if (props.description && props.description.length > 160) {
      issues.push('Description should not exceed 160 characters');
    }
    
    return issues;
  }
};