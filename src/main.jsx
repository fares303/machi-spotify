import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ui/ErrorBoundary'
import './styles/globals.css'

// Apply persisted theme before render
try {
  const saved = JSON.parse(localStorage.getItem('machi-spotify-v3') || '{}')
  if (saved?.state?.theme) {
    document.documentElement.setAttribute('data-theme', saved.state.theme)
  }
} catch {}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      gcTime: 10 * 60 * 1000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--color-surface-2)',
              color: 'var(--color-on-surface)',
              border: '1px solid var(--glass-border)',
              fontSize: '13px',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-surface)',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)
