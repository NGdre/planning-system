import SelectInput from 'ink-select-input'
import { Text } from 'ink'
import { useRouter } from '../router/Router.js'

const items = [
  {
    label: 'Новая задача',
    value: 'NEW_TASK',
  },
  {
    label: 'Показать все задачи',
    value: 'ALL_TASKS',
  },
  {
    label: 'Выход',
    value: 'EXIT',
  },
]

export function NewMainMenu() {
  const { navigate } = useRouter()

  function handleSelect(item: (typeof items)[number]) {
    if (item.value === 'NEW_TASK') navigate('new-task')
    if (item.value === 'ALL_TASKS') navigate('all-tasks')
    if (item.value === 'EXIT') process.exit(0)
  }

  return (
    <>
      <Text>Главное меню</Text>
      <SelectInput
        items={items}
        onSelect={handleSelect}
        itemComponent={({ label }) => <Text>{label}</Text>}
      />
    </>
  )
}
