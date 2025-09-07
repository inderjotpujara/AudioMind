# Audio Journal PWA 🎙️

A privacy-first Progressive Web App that transforms daily audio recordings into structured insights through AI-powered transcription, summarization, and task extraction.

![Audio Journal Screenshot](./docs/screenshots/dashboard.png)

## ✨ Features

### 🎯 Core Functionality
- **Audio Upload & Processing** - Drag-and-drop interface with support for MP3, WAV, WebM, M4A, AAC, and FLAC files
- **AI-Powered Transcription** - Google Cloud Speech-to-Text with speaker diarization and word-level timestamps
- **Smart Summarization** - Google Cloud Natural Language API for intelligent content analysis
- **Task Extraction** - Automatically identify and extract actionable items from conversations
- **Real-time Progress** - Live updates during audio processing with detailed progress indicators

### 🔒 Privacy-First Design
- **Local-First Storage** - All data stored locally using IndexedDB with optional cloud backup
- **Zero-Knowledge Architecture** - Audio processing happens client-side when possible
- **Complete Data Control** - Easy export, import, and deletion of all user data
- **Minimal Permissions** - Only requests essential device permissions

### 📱 Progressive Web App
- **Offline Support** - Service worker enables offline access to cached content
- **Install Prompts** - Native app-like installation on desktop and mobile
- **Background Sync** - Queue operations when offline, sync when reconnected
- **Push Notifications** - Get notified when processing completes

### 🎨 Modern UX/UI
- **Responsive Design** - Mobile-first approach with seamless desktop experience
- **Dark Mode Support** - Automatic system theme detection with manual override
- **Smooth Animations** - Framer Motion powered transitions and micro-interactions
- **Accessibility First** - WCAG 2.1 AA compliant with keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Cloud API key with Speech-to-Text and Natural Language APIs enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/audio-journal-pwa.git
   cd audio-journal-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

5. **Configure API Keys**
   - Go to Settings → API Keys
   - Add your Google Cloud API key
   - Start uploading and processing audio files!

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview

# Deploy to your hosting platform
npm run deploy
```

## 🏗️ Architecture

### Technology Stack

**Frontend Framework**
- React 18 with TypeScript
- Vite for fast development and optimized builds
- React Router for client-side routing

**State Management**
- Zustand for global state management
- TanStack React Query for server state and caching
- IndexedDB via Dexie.js for local storage

**UI & Styling**
- TailwindCSS for utility-first styling
- HeadlessUI for accessible component primitives
- Framer Motion for smooth animations
- Heroicons for consistent iconography

**Audio Processing**
- WaveSurfer.js for audio visualization and playback
- Google Cloud Speech-to-Text API for transcription
- Google Cloud Natural Language API for summarization
- Web Audio API for client-side audio processing

**PWA Features**
- Workbox for service worker and offline support
- Web App Manifest for installation
- Background Sync for offline operations

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives (Button, Input, etc.)
│   ├── features/       # Feature-specific components
│   └── layout/         # Layout components (Header, Sidebar)
├── pages/              # Route-level page components
├── hooks/              # Custom React hooks
├── stores/             # Zustand state stores
├── lib/                # Utility functions and API clients
├── types/              # TypeScript type definitions
└── workers/            # Web Workers for heavy processing
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Cloud API Configuration
VITE_GOOGLE_CLOUD_API_KEY=your_api_key_here

# Application Configuration
VITE_APP_NAME="Audio Journal"
VITE_APP_VERSION="1.0.0"

# Development
VITE_DEBUG_MODE=true
```

### Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Required APIs**
   ```bash
   # Enable Speech-to-Text API
   gcloud services enable speech.googleapis.com
   
   # Enable Natural Language API
   gcloud services enable language.googleapis.com
   ```

3. **Create API Key**
   - Go to Credentials → Create Credentials → API Key
   - Restrict the key to Speech-to-Text and Natural Language APIs
   - Add the key to your environment variables

### PWA Configuration

The app includes a comprehensive PWA setup:

- **Manifest**: `/public/manifest.json` - App metadata and installation config
- **Service Worker**: `/public/sw.js` - Offline support and caching strategies
- **Icons**: `/public/icons/` - Various sizes for different platforms

## 📊 Usage Examples

### Basic Audio Processing

```typescript
import { AudioProcessingService } from '@/lib/audio-processing'

const processingService = new AudioProcessingService(apiKey)

const result = await processingService.processAudio(audioFile, {
  language: 'en-US',
  enableSpeakerDiarization: true,
  generateSummary: true,
  extractTasks: true
})

console.log('Transcript:', result.transcription?.transcript)
console.log('Summary:', result.summary?.summary)
console.log('Tasks:', result.tasks)
```

### Custom Hooks

```typescript
import { useAudioProcessing } from '@/hooks/useAudioProcessing'

function MyComponent() {
  const { processAudio, isProcessing, progress } = useAudioProcessing()
  
  const handleFileUpload = async (file: File) => {
    const result = await processAudio(file, {
      generateSummary: true,
      extractTasks: true
    })
    
    if (result.success) {
      console.log('Processing complete!', result)
    }
  }
  
  return (
    <div>
      {isProcessing && <ProgressBar value={progress} />}
      <FileUpload onFileSelect={handleFileUpload} />
    </div>
  )
}
```

## 🧪 Testing

### Running Tests

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Structure

- **Unit Tests**: `src/**/*.test.ts` - Component and utility testing
- **Integration Tests**: `src/**/*.integration.test.ts` - Feature testing
- **E2E Tests**: `tests/e2e/` - Full user journey testing

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Build the app
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured with React and accessibility rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for linting and testing

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Cloud](https://cloud.google.com/) for Speech-to-Text and Natural Language APIs
- [React](https://reactjs.org/) and the amazing React ecosystem
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [WaveSurfer.js](https://wavesurfer-js.org/) for audio visualization

## 📞 Support

- **Documentation**: [https://docs.audiojournal.app](https://docs.audiojournal.app)
- **Issues**: [GitHub Issues](https://github.com/yourusername/audio-journal-pwa/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/audio-journal-pwa/discussions)
- **Email**: support@audiojournal.app

---

<div align="center">
  <strong>Transform your audio into actionable insights with Audio Journal PWA</strong>
  <br />
  <a href="https://audiojournal.app">Try it now</a> •
  <a href="./docs">Documentation</a> •
  <a href="https://github.com/yourusername/audio-journal-pwa/issues">Report Bug</a>
</div>