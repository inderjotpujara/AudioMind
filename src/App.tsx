import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Layout from './components/layout/Layout'
import { LoadingSpinner } from './components/ui'
import { ErrorBoundary } from './components/ui/error-boundary'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Upload = lazy(() => import('./pages/Upload'))
const History = lazy(() => import('./pages/History'))
const Settings = lazy(() => import('./pages/Settings'))
const Session = lazy(() => import('./pages/Session'))
const ProcessingQueue = lazy(() => import('./pages/ProcessingQueue'))
const SimpleTest = lazy(() => import('./pages/SimpleTest'))
const EnhancedUpload = lazy(() => import('./pages/EnhancedUpload'))

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Helmet>
          <title>Audio Journal</title>
          <meta
            name="description"
            content="Transform your audio recordings into structured insights with AI-powered transcription and summarization"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
        </Helmet>

        <Layout>
          <Suspense 
            fallback={
              <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<EnhancedUpload />} />
              <Route path="/upload-old" element={<Upload />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/session/:id" element={<Session />} />
              <Route path="/processing-queue" element={<ProcessingQueue />} />
              <Route path="/test" element={<SimpleTest />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ErrorBoundary>
  )
}

export default App
