# SecureCardr Project Instructions
## For LLM Task Workers

### Project Context & Mission
You are working on **SecureCardr**, a zero-knowledge card vault web application. This is a security-critical project where users store sensitive card information (credit cards, IDs, etc.) encrypted client-side in their own Google Drive folders.

**CRITICAL PRINCIPLE**: We NEVER see, store, or have access to unencrypted user data. Everything is encrypted in the browser before leaving the user's device.

---

## Essential Project Information

### What SecureCardr Does
- Users authenticate with Google and grant Drive access
- Users set a strong passphrase for client-side encryption
- Users can add cards manually or by taking photos
- All card data is encrypted in the browser using Web Crypto API
- Encrypted data is stored in the user's Google Drive folder
- Users can browse, view, edit, and delete their encrypted cards
- Optional OCR extracts text from card photos for convenience

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth (Google provider)
- **Storage**: Google Drive REST API
- **Encryption**: Web Crypto API (AES-GCM + PBKDF2/HKDF)
- **Image Processing**: Cropper.js
- **OCR**: Tesseract.js

---

## Working Instructions

### Before Starting Any Task

1. **Read the PROJECT_PLAN.md file** to understand the current project status
2. **Check which phase/task you're assigned** in the plan
3. **Review any previous task completion notes** in the plan
4. **Understand the dependencies** - some tasks require others to be completed first

### While Working on a Task

1. **Follow security principles strictly** - never store unencrypted sensitive data
2. **Write clean, documented TypeScript code**
3. **Use Tailwind CSS for all styling**
4. **Implement proper error handling**
5. **Make components mobile-responsive**
6. **Test your implementation thoroughly**

### After Completing a Task

1. **Update PROJECT_PLAN.md** - mark your task as completed with checkmark [x]
2. **Add completion notes** including any important decisions or changes
3. **Update the "Notes and Decisions Log"** section if you made significant choices
4. **Leave clear handoff notes** for the next task if there are dependencies

---

## Security Requirements (CRITICAL)

### Encryption Standards
- **NEVER** store unencrypted sensitive data anywhere
- Use AES-GCM with 256-bit keys
- Derive keys using PBKDF2 (100,000+ iterations) + HKDF
- Include proper initialization vectors (IV) and authentication tags
- Clear sensitive data from memory after use

### Data Handling
- All card numbers, names, and sensitive fields must be encrypted
- Metadata can be encrypted or plaintext (user preference)
- No sensitive data in console.log statements
- No sensitive data in error messages
- Use secure random number generation

### Authentication & Authorization
- Only Google OAuth 2.0 authentication
- Request minimal Drive permissions (drive.file scope)
- Handle token expiry gracefully
- Implement proper session management
- No server-side session storage

---

## Code Standards & Conventions

### File Structure
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

### Component Guidelines
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Include JSDoc comments for complex functions
- Use proper error boundaries
- Implement loading and error states
- Make all components responsive

### Naming Conventions
- Components: PascalCase (e.g., `CardListView`)
- Files: kebab-case (e.g., `card-list-view.tsx`)
- Functions: camelCase (e.g., `encryptCardData`)
- Constants: UPPER_SNAKE_CASE (e.g., `ENCRYPTION_KEY_LENGTH`)
- Types/Interfaces: PascalCase (e.g., `CardData`)

---

## API Integration Guidelines

### Firebase Authentication
```typescript
// Example initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  // Config from environment variables
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### Google Drive API
```typescript
// Always use the drive.file scope
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Example API call structure
async function createFile(name: string, content: Blob, parentId: string) {
  const metadata = {
    name,
    parents: [parentId],
  };
  
  // Use fetch or gapi.client for Drive API calls
}
```

### Encryption Implementation
```typescript
// Example encryption function signature
async function encryptData(
  data: string | ArrayBuffer,
  passphrase: string,
  salt: Uint8Array
): Promise<{
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  authTag: Uint8Array;
}> {
  // Implementation using Web Crypto API
}
```

---

## UI/UX Guidelines

### Design Principles
- **Mobile-first**: Design for mobile, enhance for desktop
- **Minimalist**: Clean, uncluttered interface
- **Accessible**: WCAG 2.1 AA compliance
- **Security-focused**: Clear security messaging
- **User-friendly**: Intuitive navigation and workflows

### Tailwind CSS Usage
- Use Tailwind utility classes consistently
- Implement dark mode support with `dark:` variants
- Use responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- Create custom components for repeated patterns
- Use Tailwind's color palette for consistency

### Component Patterns
```typescript
// Example component structure
interface CardFormProps {
  onSubmit: (card: CardData) => void;
  initialData?: Partial<CardData>;
  isLoading?: boolean;
}

export function CardForm({ onSubmit, initialData, isLoading }: CardFormProps) {
  // Implementation with proper error handling and validation
  return (
    <form className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
      {/* Form fields */}
    </form>
  );
}
```

---

## Testing Requirements

### Unit Testing
- Test all encryption/decryption functions
- Test form validation logic
- Test utility functions
- Test error handling scenarios

### Integration Testing
- Test Google Drive API integration
- Test authentication flows
- Test end-to-end encryption workflow
- Test offline/online state transitions

### Manual Testing Checklist
- [ ] Authentication flow works correctly
- [ ] Cards can be created, viewed, edited, deleted
- [ ] Encryption/decryption works properly
- [ ] Mobile responsive design
- [ ] Error handling displays appropriate messages
- [ ] Performance is acceptable on mobile devices

---

## Common Pitfalls to Avoid

### Security Issues
- ❌ Don't log sensitive data to console
- ❌ Don't store unencrypted data in localStorage
- ❌ Don't send sensitive data to external APIs
- ❌ Don't use weak encryption parameters
- ❌ Don't ignore certificate validation

### Performance Issues
- ❌ Don't load all cards at once
- ❌ Don't perform encryption on the main thread for large data
- ❌ Don't make unnecessary API calls
- ❌ Don't ignore loading states
- ❌ Don't forget to clean up resources

### UX Issues
- ❌ Don't hide error messages
- ❌ Don't skip loading indicators
- ❌ Don't forget mobile optimization
- ❌ Don't ignore accessibility
- ❌ Don't make the onboarding too complex

---

## Environment Setup

### Development Environment
```bash
# Clone and setup
cd securecardr
npm install
npm run dev

# Environment variables needed
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
```

### Required Credentials
1. **Firebase Project**: Create at https://console.firebase.google.com
2. **Google Cloud Project**: Enable Drive API
3. **OAuth 2.0 Credentials**: For Drive API access

---

## Task Handoff Protocol

### When Receiving a Task
1. Review the specific task requirements in PROJECT_PLAN.md
2. Check what previous tasks were completed
3. Understand any dependencies or prerequisites
4. Read any handoff notes from previous workers

### When Completing a Task
1. Test your implementation thoroughly
2. Update PROJECT_PLAN.md with completion status
3. Add detailed notes about your implementation
4. Document any issues or decisions for future reference
5. Prepare clear handoff notes for dependent tasks

### Documentation Updates
Always update these sections when completing tasks:
- Mark task as completed: `- [x] Task X.X: Description`
- Add completion date and notes
- Update overall progress percentage
- Log any important decisions

---

## Emergency Protocols

### If You Encounter Blocking Issues
1. Document the issue clearly in PROJECT_PLAN.md
2. Mark the task as "BLOCKED" with reason
3. Suggest alternative approaches if possible
4. Update the risk assessment section if needed

### If You Need to Make Major Changes
1. Document the proposed change and reasoning
2. Update the technical specifications
3. Consider impact on other tasks
4. Update the change log with detailed notes

---

## Quality Assurance Checklist

Before marking any task as complete, verify:
- [ ] Code follows TypeScript best practices
- [ ] Security requirements are met
- [ ] Error handling is implemented
- [ ] Components are mobile-responsive
- [ ] Code is properly documented
- [ ] Testing has been performed
- [ ] PROJECT_PLAN.md is updated
- [ ] No sensitive data is exposed or logged

---

## Getting Help

### Resources
- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Web Crypto API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **Google Drive API**: https://developers.google.com/drive/api/v3/reference
- **Firebase Auth**: https://firebase.google.com/docs/auth

### When You Need Clarification
- Check PROJECT_PLAN.md for context
- Review this instructions file
- Look at completed tasks for patterns
- Ask specific questions about requirements

---

Remember: This is a security-critical application. When in doubt, choose the more secure option. User trust and data protection are paramount.
