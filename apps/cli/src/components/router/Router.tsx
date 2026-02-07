import { useInput } from 'ink'
import { useState, createContext, useContext, ReactNode } from 'react'

interface IRouterContext {
  currentRoute: string
  navigate: (to: string) => void
  goBack: () => void
  goTop: () => void
}

interface IRoute {
  route: string
}

const RouterContext = createContext<IRouterContext | null>(null)

export function Router({ initialRoute, children }: { initialRoute: string; children: ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState(initialRoute)
  const [history, setHistory] = useState<IRoute[]>([])

  const navigate = (route: string) => {
    setHistory((prev) => [...prev, { route: currentRoute }])
    setCurrentRoute(route)
  }

  const goBack = () => {
    if (history.length > 0) {
      const lastRoute = history[history.length - 1] as IRoute
      setHistory((prev) => prev.slice(0, -1))
      setCurrentRoute(lastRoute.route)
    }
  }

  const goTop = () => {
    if (history.length > 0) {
      setCurrentRoute(history[0]!.route)
      setHistory([])
    }
  }

  return (
    <RouterContext.Provider value={{ currentRoute, navigate, goBack, goTop }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within a Router')
  }
  return context
}

export function Route({ route, component: Component }: IRoute & { component: ReactNode }) {
  const { currentRoute } = useRouter()

  if (currentRoute !== route) return null
  return Component
}

export function WithNavigationKeys({ children }: { children: ReactNode }) {
  const { goBack, goTop } = useRouter()

  useInput((input) => {
    if (input === 'm') goTop()
    if (input === 'b') goBack()
  })

  return children
}
