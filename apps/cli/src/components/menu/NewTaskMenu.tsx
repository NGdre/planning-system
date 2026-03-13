import { CreateTaskInput } from '@planning-system/core'
import { Text } from 'ink'
import SelectInput from 'ink-select-input'
import { useRef, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { useNavigation } from '../navigation/NavigationContext.js'
import { TextInputContainer } from '../TextInputContainer.js'

export default function NewTaskMenu() {
  const newTaskFields = useRef<CreateTaskInput | null>(null)

  const [menuItem, setMenuItem] = useState<{
    label: string
    value: string
    fieldName?: string
    textInputLabel?: string
  } | null>(null)

  const { push } = useNavigation()

  const handleSelect = async (item: { label: string; value: string }) => {
    if (item.value === 'DONE') {
      if (newTaskFields.current) {
        const task = await cliAdapter.createTask(newTaskFields.current)

        if (task?.id) push({ name: 'TaskMenu', params: { taskId: task.id, allowBack: false } })

        newTaskFields.current = null
      }

      return
    }

    if (item.value === 'HOME') push({ name: 'MainMenu' })

    setMenuItem(item)
  }

  // TODO: more sophisticated validation is needed
  const isValidTask = (() => {
    return newTaskFields.current?.title !== undefined
  })()

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
    ...(isValidTask
      ? [
          {
            label: 'Готово!',
            value: 'DONE',
          },
        ]
      : []),
    {
      label: 'В главное меню',
      value: 'HOME',
    },
  ]

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
