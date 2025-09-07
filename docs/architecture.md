# Architecture Documentation

## System Overview

Audio Journal PWA is a privacy-first Progressive Web App built with modern web technologies to provide seamless audio processing and journaling capabilities.

## Architecture Principles

### Privacy-First Design
- **Local-First**: All user data stored locally by default
- **Zero-Knowledge**: Audio processing happens client-side when possible
- **User Control**: Complete data ownership and easy export/deletion
- **Minimal Permissions**: Request only essential device permissions

### Performance-First Approach
- **Progressive Loading**: Code splitting and lazy loading
- **Optimized Bundles**: Tree shaking and modern build tools
- **Efficient Storage**: IndexedDB with proper indexing
- **Background Processing**: Web Workers for heavy computations

### Accessibility-First Implementation
- **WCAG 2.1 AA**: Full compliance with accessibility standards
- **Keyboard Navigation**: Complete keyboard-only operation
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Responsive Design**: Mobile-first approach across all devices

## Technology Stack

### Frontend Framework
```
React 18 + TypeScript + Vite
├── React 18: Latest features with concurrent rendering
├── TypeScript: Strict type checking and IDE support
└── Vite: Fast development and optimized production builds
```

### State Management
```
Zustand + TanStack React Query
├── Zustand: Lightweight global state management
├── React Query: Server state management and caching
└── Optimistic Updates: Better UX with instant feedback
```

### UI & Styling
```
TailwindCSS + Headless UI + Framer Motion
├── TailwindCSS: Utility-first CSS framework
├── Headless UI: Accessible component primitives
└── Framer Motion: Smooth animations and transitions
```

### Audio Processing
```
WaveSurfer.js + Google Cloud Speech-to-Text
├── WaveSurfer.js: Audio visualization and playback
├── Google Speech API: High-accuracy transcription
└── Web Audio API: Client-side audio processing
```

### Local Storage
```
Dexie.js + IndexedDB
├── Dexie.js: IndexedDB wrapper with query API
├── Full-text Search: Efficient content searching
└── File Storage: Audio blob storage and management
```

## Component Architecture

### Component Hierarchy
```
App (Root)
├── Layout
│   ├── Header
│   ├── Navigation
│   └── Main Content
├── Feature Components
│   ├── AudioUpload
│   ├── TranscriptionView
│   ├── SummaryDisplay
│   └── TaskManager
└── Shared Components
    ├── Button
    ├── Input
    ├── Modal
    └── LoadingSpinner
```

### Component Patterns
- **Composition over Inheritance**: Build complex components from simpler ones
- **Render Props**: For reusable behavior logic
- **Compound Components**: For related component groups
- **Custom Hooks**: Extract reusable logic

## Data Flow Architecture

### State Management Strategy
```typescript
// Global State (Zustand)
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  settings: UserSettings;
}

// Server State (React Query)
interface Queries {
  audioSessions: AudioSession[];
  transcription: TranscriptionResult;
  summary: string;
}

// Local State (useState/useReducer)
interface ComponentState {
  isLoading: boolean;
  error: Error | null;
  formData: FormValues;
}
```

### Data Processing Pipeline
```
Audio Upload → Validation → Storage → Processing → Results
     ↓            ↓         ↓         ↓          ↓
File System  → IndexedDB → Web Worker → API Calls → UI Update
```

## API Integration Architecture

### Google Cloud Speech-to-Text
```typescript
interface SpeechAPI {
  // Configuration
  config: SpeechConfig;

  // Methods
  transcribe(audio: Blob): Promise<TranscriptionResult>;
  getSupportedLanguages(): Promise<string[]>;
  estimateCost(audio: Blob): Promise<number>;
}
```

### OpenAI Integration
```typescript
interface OpenAIAPI {
  // Summarization
  summarize(text: string): Promise<string>;

  // Task Extraction
  extractTasks(text: string): Promise<Task[]>;

  // Smart Categorization
  categorize(text: string): Promise<string[]>;
}
```

## Storage Architecture

### IndexedDB Schema
```typescript
// Main database structure
interface AudioJournalDB {
  audioSessions: {
    key: string;
    value: AudioSession;
    indexes: {
      uploadDate: Date;
      fileName: string;
      tags: string[];
    };
  };

  tasks: {
    key: string;
    value: Task;
    indexes: {
      sessionId: string;
      completed: boolean;
      dueDate: Date;
    };
  };

  settings: {
    key: string;
    value: AppSettings;
  };
}
```

### File Storage Strategy
- **Audio Files**: Stored as Blobs in IndexedDB
- **Cache Strategy**: LRU cache with size limits
- **Cleanup Policy**: Automatic deletion after retention period
- **Export Format**: JSON + audio files in ZIP

## Security Architecture

### Client-Side Security
- **Content Security Policy**: Strict CSP headers
- **API Key Protection**: Environment variables only
- **Input Sanitization**: XSS prevention
- **Secure Storage**: Encrypted sensitive data

### Privacy Protection
- **Local Processing**: Audio stays on device
- **No Telemetry**: User data never sent to our servers
- **Clear Consent**: Explicit permission requests
- **Easy Deletion**: One-click data removal

## Performance Architecture

### Bundle Optimization
```typescript
// Dynamic imports for code splitting
const AudioUpload = lazy(() => import('./components/AudioUpload'));
const TranscriptionView = lazy(() => import('./components/TranscriptionView'));

// Route-based splitting
const routes = {
  '/': () => import('./pages/Dashboard'),
  '/upload': () => import('./pages/Upload'),
  '/history': () => import('./pages/History'),
};
```

### Caching Strategy
- **Static Assets**: Service Worker caching
- **API Responses**: React Query caching
- **Computed Data**: Memoization with useMemo
- **Heavy Computations**: Web Worker processing

### Core Web Vitals Optimization
- **FCP < 1.5s**: Optimize initial bundle
- **LCP < 2.5s**: Lazy load above-the-fold content
- **CLS < 0.1**: Reserve space for dynamic content
- **FID < 100ms**: Minimize JavaScript execution

## Error Handling Architecture

### Error Boundaries
```typescript
class ErrorBoundary extends Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Error Types
```typescript
// Custom error classes
class AudioProcessingError extends Error {
  constructor(message: string, public audioFile: string) {
    super(message);
    this.name = 'AudioProcessingError';
  }
}

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

## Testing Architecture

### Testing Pyramid
```
End-to-End Tests (Playwright)
    ↓
Integration Tests (React Testing Library)
    ↓
Unit Tests (Vitest)
```

### Test Organization
```
__tests__/
├── unit/           # Unit tests for utilities and hooks
├── integration/    # Component integration tests
├── e2e/           # End-to-end user journey tests
└── mocks/         # API and service mocks
```

## Deployment Architecture

### Build Pipeline
```yaml
# CI/CD Pipeline
stages:
  - lint
  - test
  - build
  - deploy

# Build Configuration
vite.config.ts:
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', 'framer-motion'],
          audio: ['wavesurfer.js'],
        }
      }
    }
  }
```

### PWA Configuration
```typescript
// Service Worker for offline support
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('audio-journal-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json'
      ]);
    })
  );
});
```

## Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals**: Automated tracking
- **Error Tracking**: Sentry integration
- **User Analytics**: Privacy-compliant metrics
- **Performance Budgets**: Build-time checks

### Logging Strategy
```typescript
// Structured logging
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}
```

This architecture ensures scalability, maintainability, and excellent user experience while maintaining the highest standards of privacy and performance.
