import { Result, VoidResult } from '@planning-system/core'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

export interface Action {
  id: string
  label: string
  queryFn: () => (Result<unknown> | VoidResult) | Promise<Result<unknown> | VoidResult>
}

interface UseDataManagerProps<T extends { availableActionIds: string[] }> {
  fetchData: () => Promise<Result<T>>
  allActions: Action[]
}

interface UseDataManagerReturn<T> {
  data: T | null
  actions: Action[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  performAction: (actionId: string) => Promise<void>
}

export function useDataWithActions<T extends { availableActionIds: string[] }>({
  fetchData,
  allActions,
}: UseDataManagerProps<T>): UseDataManagerReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const isFetchingRef = useRef<boolean>(false)
  const mountedRef = useRef<boolean>(true)

  const actionsMapRef = useRef<Map<string, Action>>(new Map())
  useEffect(() => {
    allActions.forEach((action) => actionsMapRef.current.set(action.id, action))
  }, [allActions])

  const fetchDataInternal = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return
    setError(null)
    try {
      const result = await fetchData()
      if (!mountedRef.current) return

      if (result.success) {
        setData(result.value)
      } else {
        setError(new Error(result.error))
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }, [fetchData])

  const refresh = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    setIsLoading(true)

    try {
      await fetchDataInternal()
    } finally {
      if (mountedRef.current) {
        isFetchingRef.current = false
        setIsLoading(false)
      }
    }
  }, [fetchDataInternal])

  const performAction = useCallback(
    async (actionId: string): Promise<void> => {
      const action = actionsMapRef.current.get(actionId)
      if (!action) {
        setError(new Error(`Action with id "${actionId}" not found`))
        return
      }

      if (isFetchingRef.current) {
        setError(new Error('Another request is in progress'))
        return
      }

      isFetchingRef.current = true
      setIsLoading(true)
      setError(null)

      try {
        let rawResult = action.queryFn()
        if (!(rawResult instanceof Promise)) {
          rawResult = Promise.resolve(rawResult)
        }

        const actionResult = await rawResult
        if (!actionResult || typeof actionResult !== 'object' || !('success' in actionResult)) {
          throw new Error('Invalid result from action.queryFn: expected Result or VoidResult')
        }

        if (!actionResult.success) {
          setError(new Error(actionResult.error || 'Action failed'))
          return
        }

        await fetchDataInternal()
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (mountedRef.current) {
          isFetchingRef.current = false
          setIsLoading(false)
        }
      }
    },
    [fetchDataInternal]
  )

  useEffect(() => {
    mountedRef.current = true
    refresh()

    return () => {
      mountedRef.current = false
    }
  }, [refresh])

  const availableActions = useMemo(() => {
    if (!data) return []
    return allActions.filter((action) => data.availableActionIds.includes(action.id))
  }, [data, allActions])

  return {
    data,
    actions: availableActions,
    isLoading,
    error,
    refresh,
    performAction,
  }
}
