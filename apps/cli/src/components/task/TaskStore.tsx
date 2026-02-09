import { useState, createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react'

interface ITaskContext {
  selectedTaskId: string | null
  setSelectedTaskId: Dispatch<SetStateAction<string | null>>
}

export const TaskContext = createContext<ITaskContext | null>(null)

export function TaskStore({ children }: { children: ReactNode }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  return (
    <TaskContext.Provider value={{ selectedTaskId, setSelectedTaskId }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskStore(): ITaskContext {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTaskStore must be used within a TaskStore')
  }
  return context
}
