import React, { useEffect, useRef, useState } from 'react';
import { Logo } from './common/Logo';

interface LandingPageProps {
  onStartGoogle: () => void;
  onShowDemo: () => void;
}

export function LandingPage({ onStartGoogle, onShowDemo }: LandingPageProps) {
  const particleNetworkRef = useRef<HTMLDivElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    // Create particle network
    if (particleNetworkRef.current) {
      const particleCount = window.innerWidth > 768 ? 50 : 25;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particleNetworkRef.current.appendChild(particle);
      }
    }
  }, []);

  const features = [
    {
      icon: '🔒',
      title: 'Client-Side Encryption',
      description: 'Your data is encrypted in your browser using AES-256 before it ever leaves your device',
      color: 'text-primary',
      borderColor: 'border-primary',
      glowColor: 'shadow-primary-glow'
    },
    {
      icon: '☁️',
      title: 'Your Google Drive',
      description: 'Encrypted data is stored securely in your personal Google Drive folder that only you control',
      color: 'text-secondary',
      borderColor: 'border-secondary',
      glowColor: 'shadow-secondary-glow'
    },
    {
      icon: '🔐',
      title: 'Zero Knowledge',
      description: 'We never see your unencrypted data - you hold the only key to decrypt your information',
      color: 'text-accent',
      borderColor: 'border-accent',
      glowColor: 'shadow-accent-glow'
    }
  ];

  const steps = [
    {
      icon: '🔐',
      title: 'Encrypt',
      description: 'Your card data is encrypted in your browser'
    },
    {
      icon: '☁️',
      title: 'Upload',
      description: 'Encrypted data goes to your Google Drive'
    },
    {
      icon: '🔓',
      title: 'Decrypt',
      description: 'Only you can decrypt with your passphrase'
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header with Logo */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <Logo size={36} className="text-primary" />
              <div>
                <h1 className="text-xl font-bold text-text-primary">SecureCardr</h1>
                <p className="text-xs text-text-secondary hidden sm:block">Zero-Knowledge Card Vault</p>
              </div>
            </div>
            <button
              onClick={onShowDemo}
              className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
            >
              Try Demo
            </button>
          </div>
        </div>
      </header>

      {/* Animated Particle Network */}
      <div 
        ref={particleNetworkRef} 
        className="fixed inset-0 z-0 opacity-30"
        style={{ pointerEvents: 'none' }}
      />

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 z-10">
        <div className="text-center max-w-6xl w-full">
          {/* 3D Card Stack Animation */}
          <div className="vault-animation w-52 h-52 mx-auto mb-12 relative preserve-3d">
            <div className="card-3d absolute w-32 h-20 rounded-lg shadow-2xl transform translate-z-10 translate-x-10 rotate-y-20 bg-gradient-to-br from-primary to-secondary">
              <div className="absolute inset-0 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="card-3d absolute w-32 h-20 rounded-lg shadow-2xl transform translate-z-0 translate-x-5 rotate-y-10 bg-gradient-to-br from-secondary to-accent">
              <div className="absolute inset-0 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="card-3d absolute w-32 h-20 rounded-lg shadow-2xl transform -translate-z-10 bg-gradient-to-br from-accent to-primary">
              <div className="absolute inset-0 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Glassmorphism Panel */}
          <div className="glass-panel bg-surface/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-text-primary to-primary bg-clip-text text-transparent">
              Zero-Knowledge Card Vault
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Client-side AES-256 encryption. Stored in your own Google Drive.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onStartGoogle}
                className="group relative px-8 py-4 bg-primary text-white rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/50 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Start with Google</span>
                <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-glow" />
              </button>
              
              <button
                onClick={onShowDemo}
                className="px-8 py-4 bg-transparent border-2 border-secondary text-secondary rounded-lg font-semibold transition-all duration-300 hover:bg-secondary hover:text-white hover:transform hover:-translate-y-1"
              >
                Try the Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive "How It Works" Strip */}
      <section className="relative py-16 px-4 z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-text-primary mb-12">
          How It Works
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex-1 text-center relative animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 bg-surface border-2 border-primary rounded-full flex items-center justify-center text-3xl transition-all duration-300 hover:scale-110 hover:border-accent hover:shadow-lg hover:shadow-accent/50">
                    {step.icon}
                  </div>
                  
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent">
                      <div className="absolute inset-0 h-1.5 bg-accent blur-sm animate-flow" />
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="relative py-16 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-surface border border-white/10 rounded-xl p-8 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden ${
                  hoveredFeature === index ? feature.borderColor : ''
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {/* Animated border effect */}
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent transform transition-transform duration-600 ${
                  hoveredFeature === index ? 'translate-x-full' : '-translate-x-full'
                }`} />
                
                <div className={`text-5xl mb-4 ${feature.color} animate-bounce`} style={{ animationDelay: `${index * 300}ms` }}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      {/* <section className="relative py-12 bg-surface z-10">
        <div className="text-center">
          <p className="text-text-secondary text-sm uppercase tracking-wider mb-6">
            As Featured In
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {['Security Weekly', 'CryptoNews', 'Privacy Times', 'Tech Secure'].map((name, index) => (
              <span
                key={index}
                className="text-text-secondary opacity-40 hover:opacity-100 hover:text-text-primary transition-all duration-300 cursor-pointer"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section> */}

      {/* Final Call to Action */}
      <section className="relative py-24 px-4 text-center z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">
          Ready to Secure Your Cards?
        </h2>
        <button
          onClick={onStartGoogle}
          className="group relative px-8 py-4 bg-primary text-white rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/50 inline-flex items-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Start with Google</span>
        </button>
        <p className="mt-4 text-sm text-text-secondary">
          <a href="#" className="hover:text-text-primary transition-colors">
            See Privacy Policy
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer className="relative py-8 text-center border-t border-slate-700 z-10">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Logo size={24} className="text-text-secondary" />
          <p className="text-text-secondary text-sm">© 2025 SecureCardr</p>
        </div>
        {/* <div className="flex justify-center gap-6">
          <a
            href="#"
            className="text-text-primary hover:text-primary transition-all duration-300 hover:transform hover:-translate-y-1"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a
            href="#"
            className="text-text-primary hover:text-primary transition-all duration-300 hover:transform hover:-translate-y-1"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
        </div> */}
      </footer>
    </div>
  );
}