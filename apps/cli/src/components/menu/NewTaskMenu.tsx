import { useRef, useState } from 'react'
import SelectInput from 'ink-select-input'
import { Text } from 'ink'
import { TextInputContainer } from '../TextInputContainer.js'
import { CreateTaskInput } from '@planning-system/core'
import { cliAdapter } from '../../cli.js'
import { useNavigation } from '../navigation/NavigationContext.js'

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

export default function NewTaskMenu() {
  const newTaskFields = useRef<CreateTaskInput | null>(null)

  const [menuItem, setMenuItem] = useState<{
    label: string
    value: string
    fieldName?: string
    textInputLabel?: string
  } | null>(null)

  const { pop } = useNavigation()

  const handleSelect = async (item: { label: string; value: string }) => {
    if (item.value === 'DONE') {
      if (newTaskFields.current) {
        await cliAdapter.createTask(newTaskFields.current)
      }

      newTaskFields.current = null
      pop()
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
