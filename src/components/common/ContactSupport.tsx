import React, { useState } from 'react';
import { Logo } from './Logo';
import { SEO } from './SEO';

interface ContactSupportProps {
  isModal?: boolean;
  onClose?: () => void;
  context?: 'general' | 'technical' | 'security' | 'account';
}

export function ContactSupport({ isModal = false, onClose, context = 'general' }: ContactSupportProps) {
  const [selectedTopic, setSelectedTopic] = useState(context);
  const [showEmailCopied, setShowEmailCopied] = useState(false);

  const supportEmail = 'shop2local@gmail.com';

  const topics = {
    general: {
      title: 'General Support',
      description: 'Questions about SecureCardr features, usage, or general inquiries',
      icon: '❓'
    },
    technical: {
      title: 'Technical Issues',
      description: 'App not working, login problems, or technical difficulties',
      icon: '🔧'
    },
    security: {
      title: 'Security & Privacy',
      description: 'Questions about encryption, data security, or privacy concerns',
      icon: '🔒'
    },
    account: {
      title: 'Account & Data',
      description: 'Account access, data recovery, or passphrase issues',
      icon: '👤'
    }
  };

  const handleEmailCopy = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setShowEmailCopied(true);
      setTimeout(() => setShowEmailCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = supportEmail;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowEmailCopied(true);
      setTimeout(() => setShowEmailCopied(false), 2000);
    }
  };

  const generateEmailSubject = () => {
    const topicTitle = topics[selectedTopic as keyof typeof topics].title;
    return `SecureCardr Support - ${topicTitle}`;
  };

  const generateEmailBody = () => {
    const topicTitle = topics[selectedTopic as keyof typeof topics].title;
    
    return `Hi SecureCardr Support Team,

I need help with: ${topicTitle}

Please describe your issue or question below:
[Describe your issue here]

Technical Information (if applicable):
- Browser: ${navigator.userAgent}
- Platform: ${navigator.platform}
- Screen Resolution: ${window.screen.width}x${window.screen.height}
- Date/Time: ${new Date().toLocaleString()}

Thank you for your assistance.

Best regards,
[Your name]`;
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent(generateEmailSubject());
    const body = encodeURIComponent(generateEmailBody());
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  const commonIssues = [
    {
      question: 'I forgot my passphrase, can you help me recover it?',
      answer: 'Unfortunately, no. SecureCardr uses zero-knowledge encryption, which means your passphrase is never sent to our servers. We cannot recover or reset your passphrase. You\'ll need to delete your vault and start fresh.'
    },
    {
      question: 'Is my data safe with SecureCardr?',
      answer: 'Yes. All your data is encrypted in your browser using AES-256 encryption before being stored in your Google Drive. We never see your unencrypted data - only you have the key to decrypt it.'
    },
    {
      question: 'Can I use SecureCardr on multiple devices?',
      answer: 'Yes, as long as you sign in with the same Google account and remember your passphrase. Your encrypted data is stored in your Google Drive, so it\'s accessible from any device.'
    },
    {
      question: 'What happens if I lose access to my Google account?',
      answer: 'You would lose access to your encrypted data since it\'s stored in your Google Drive. We recommend keeping your Google account secure and having recovery options set up.'
    }
  ];

  const Component = (
    <div className={`${isModal ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50' : 'min-h-screen bg-background'}`}>
      <div className={`${isModal ? 'bg-surface rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto' : 'w-full'}`}>
        {/* Header */}
        <div className={`${isModal ? 'p-6 border-b border-slate-700' : 'bg-surface border-b border-slate-700'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Logo size={32} className="text-primary" />
                <h1 className="text-2xl font-bold text-text-primary">Contact Support</h1>
              </div>
              {isModal && onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`${isModal ? 'p-6' : 'max-w-7xl mx-auto px-4 sm:px-6 py-12'}`}>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-4">Get Help</h2>
                <p className="text-text-secondary mb-6">
                  Choose a topic that best describes your issue, and we'll help you get started.
                </p>
              </div>

              {/* Topic Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">What can we help you with?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(topics).map(([key, topic]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTopic(key)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedTopic === key
                          ? 'border-primary bg-primary/10 text-text-primary'
                          : 'border-slate-600 bg-background hover:border-slate-500 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{topic.icon}</span>
                        <div>
                          <h3 className="font-medium">{topic.title}</h3>
                          <p className="text-xs opacity-80">{topic.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Options */}
              <div className="bg-background rounded-lg p-6 border border-slate-600">
                <h3 className="text-lg font-medium text-text-primary mb-4">Contact Options</h3>
                
                {/* Email Option */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">Email Support</h4>
                        <p className="text-sm text-text-secondary">
                          Get help via email • Response within 24 hours
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleEmailCopy}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-700 rounded transition-colors"
                        title="Copy email address"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleEmailClick}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Send Email
                      </button>
                    </div>
                  </div>

                  {/* Email Address Display */}
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-text-secondary">Email:</span>
                    <code className="bg-slate-800 px-2 py-1 rounded text-text-primary font-mono">
                      {supportEmail}
                    </code>
                    {showEmailCopied && (
                      <span className="text-secondary text-xs animate-fade-in">
                        ✓ Copied!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">
                    <strong>Response Time:</strong> We typically respond within 24 hours during business days.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-4">Common Questions</h2>
                <p className="text-text-secondary mb-6">
                  Find quick answers to frequently asked questions about SecureCardr.
                </p>
              </div>

              <div className="space-y-4">
                {commonIssues.map((issue, index) => (
                  <details key={index} className="bg-surface rounded-lg border border-slate-600">
                    <summary className="p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                      <span className="font-medium text-text-primary">{issue.question}</span>
                    </summary>
                    <div className="px-4 pb-4">
                      <p className="text-text-secondary text-sm leading-relaxed">{issue.answer}</p>
                    </div>
                  </details>
                ))}
              </div>

              {/* Security Notice */}
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-red-400 mt-0.5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-red-200 mb-1">Security Notice</h3>
                    <p className="text-red-300 text-sm">
                      SecureCardr support will never ask for your passphrase or card details. 
                      We use zero-knowledge encryption, so we cannot see your encrypted data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isModal && (
        <SEO
          title="Contact Support"
          description="Get help with SecureCardr. Contact our support team for assistance with your secure card vault, technical issues, or general questions."
          keywords="contact support, help, customer service, SecureCardr support, technical assistance"
        />
      )}
      {Component}
    </>
  );
}

// Quick contact component for embedding in other parts of the app
export function QuickContact({ className = '' }: { className?: string }) {
  const [showCopied, setShowCopied] = useState(false);
  const supportEmail = 'shop2local@gmail.com';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = supportEmail;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-surface rounded-lg border border-slate-600 p-4 ${className}`}>
      <h3 className="font-medium text-text-primary mb-2">Need Help?</h3>
      <p className="text-text-secondary text-sm mb-3">
        Contact our support team for assistance
      </p>
      <div className="flex items-center space-x-2">
        <a 
          href={`mailto:${supportEmail}`}
          className="text-primary hover:text-blue-300 text-sm font-medium transition-colors"
        >
          {supportEmail}
        </a>
        <button
          onClick={handleCopy}
          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          title="Copy email address"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        {showCopied && (
          <span className="text-secondary text-xs animate-fade-in">
            ✓ Copied!
          </span>
        )}
      </div>
    </div>
  );
}