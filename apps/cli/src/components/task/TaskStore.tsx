import { useState, createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react'
import { TaskFields } from '../menu/NewTaskMenu.js'

interface ITaskContext {
  tasks: TaskFields[]
  setTasks: Dispatch<SetStateAction<TaskFields[]>>
}

export const TaskContext = createContext<ITaskContext | null>(null)

export function TaskStore({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskFields[]>([])

  return <TaskContext.Provider value={{ tasks, setTasks }}>{children}</TaskContext.Provider>
}

export function useTaskStore(): ITaskContext {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTaskStore must be used within a TaskStore')
  }
  return context
}
