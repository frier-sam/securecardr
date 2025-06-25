# SecureCardr

A zero-knowledge card vault web application that lets users securely store, organize, and retrieve arbitrary "cards" (credit, debit, ID, loyalty, membership, etc.) with client-side encryption and Google Drive storage.

## 🔐 Core Security Principle

**Zero-Knowledge Architecture**: We never see, store, or have access to your unencrypted data. Everything is encrypted in your browser before leaving your device.

## ✨ Features

- **Client-Side Encryption**: All sensitive data encrypted using Web Crypto API (AES-GCM + PBKDF2/HKDF)
- **Google Drive Storage**: Your encrypted data stored in your own Google Drive folder
- **Manual Entry**: Add cards by typing in details
- **Photo Capture**: Snap photos of cards with automatic cropping
- **OCR Integration**: Extract text from card photos using Tesseract.js
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Dark Mode**: Beautiful dark/light theme support

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth (Google provider)
- **Storage**: Google Drive REST API
- **Encryption**: Web Crypto API
- **Image Processing**: Cropper.js
- **OCR**: Tesseract.js

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Google Authentication enabled
- Google Cloud project with Drive API enabled

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd securecardr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your Firebase and Google Drive API credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Drive API Configuration
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_drive_client_id.apps.googleusercontent.com
```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── cards/           # Card management components
│   ├── common/          # Reusable UI components
│   └── modals/          # Modal dialogs
├── hooks/               # Custom React hooks
├── services/            # API and external service integrations
│   ├── auth.ts          # Firebase authentication
│   ├── drive.ts         # Google Drive API
│   ├── crypto.ts        # Encryption utilities
│   └── ocr.ts           # OCR functionality
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── context/             # React context providers
└── styles/              # Global styles and Tailwind config
```

## 🔒 Security Features

### Encryption
- **Algorithm**: AES-GCM with 256-bit keys
- **Key Derivation**: PBKDF2 (100,000+ iterations) + HKDF
- **Security**: Each encrypted payload includes IV, salt, and authentication tag
- **Memory Safety**: Sensitive data cleared from memory after use

### Data Storage
- **Location**: User's own Google Drive folder
- **Format**: Encrypted JSON files
- **Access**: Only accessible by the user who created them
- **Metadata**: Optional encryption of metadata

### Authentication
- **Provider**: Google OAuth 2.0 only
- **Permissions**: Minimal Drive permissions (drive.file scope)
- **Session**: Secure token management with refresh handling

## 🎯 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Standards

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **Naming**: PascalCase for components, camelCase for functions
- **Documentation**: JSDoc comments for complex functions

## 🧪 Testing

### Manual Testing Checklist

- [ ] Authentication flow works correctly
- [ ] Cards can be created, viewed, edited, deleted
- [ ] Encryption/decryption works properly
- [ ] Mobile responsive design
- [ ] Error handling displays appropriate messages
- [ ] Performance is acceptable on mobile devices

## 📋 Roadmap

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed development roadmap and task tracking.

### Current Status: Phase 1 Complete ✅
- [x] Project setup and foundation
- [x] React + Vite + TypeScript configuration
- [x] Tailwind CSS setup
- [x] Basic project structure

### Next: Phase 2 - Authentication & Drive Integration

## 🤝 Contributing

This is a security-critical application. Please ensure all contributions:

1. Follow security best practices
2. Never log or expose sensitive data
3. Include proper error handling
4. Are mobile-responsive
5. Include TypeScript types
6. Follow the established code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This application handles sensitive financial and personal information. While we implement strong security measures:

- Use at your own risk
- Always backup your passphrase securely
- Test thoroughly before storing important data
- Keep your passphrase secure and never share it

## 🆘 Support

For issues and questions:

1. Check the [PROJECT_PLAN.md](PROJECT_PLAN.md) for current status
2. Review this README for setup instructions
3. Check the code documentation for implementation details

---

**Your data, your control. Zero-knowledge security.**
