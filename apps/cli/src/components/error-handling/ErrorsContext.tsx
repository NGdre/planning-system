import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

interface ErrorsContextValue {
  error: string | null
  addError: (message: string) => void
  clearError: () => void
}

const ErrorsContext = createContext<ErrorsContextValue | null>(null)

export const ErrorsProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<string | null>(null)

  const addError = useCallback((message: string) => {
    setError(message)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <ErrorsContext.Provider value={{ error, addError, clearError }}>
      {children}
    </ErrorsContext.Provider>
  )
}

export const useErrors = () => {
  const ctx = useContext(ErrorsContext)
  if (!ctx) throw new Error('useErrors must be used within ErrorsProvider')
  return ctx
}
