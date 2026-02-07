import { useRef, useState } from 'react'
import SelectInput from 'ink-select-input'
import { Text } from 'ink'
import { TextInputContainer } from '../TextInputContainer.js'
import { useRouter } from '../router/Router.js'
import { useTaskStore } from '../task/TaskStore.js'

const newTaskMenu = [
  {
    label: 'Название задачи',
    value: 'TASK_TITLE',
    fieldName: 'title',
    textInputLabel: 'Введите название задачи',
  },
  {
    label: 'Описание задачи',
    value: 'TASK_DESCRIPTION',
    fieldName: 'description',
    textInputLabel: 'Введите описание задачи',
  },
  {
    label: 'Готово!',
    value: 'DONE',
  },
]

export type TaskFields = {
  title: string
  description?: string
  deadline?: string
  scheduledAt?: string
}

export default function NewTaskMenu() {
  const newTaskFields = useRef<TaskFields | null>(null)
  const { setTasks } = useTaskStore()

  const [menuItem, setMenuItem] = useState<{
    label: string
    value: string
    fieldName?: string
    textInputLabel?: string
  } | null>(null)

  const { goBack } = useRouter()

  const handleSelect = (item: { label: string; value: string }) => {
    if (item.value === 'DONE') {
      if (newTaskFields.current) setTasks((prev) => [...prev, newTaskFields.current!])

      newTaskFields.current = null
      goBack()
      return
    }

    setMenuItem(item)
  }

  return (
    <>
      {menuItem ? (
        <TextInputContainer
          label={menuItem.textInputLabel}
          onSubmit={(inputValue) => {
            newTaskFields.current = Object.assign({}, newTaskFields.current, {
              [menuItem.fieldName!]: inputValue,
            })

            setMenuItem(null)
          }}
          hideOnSumbit
        />
      ) : (
        <>
          <Text>Новая Задача</Text>
          <SelectInput items={newTaskMenu} onSelect={handleSelect} />
        </>
      )}
    </>
  )
}
