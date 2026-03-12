import SelectInput from 'ink-select-input'
import { Text } from 'ink'
import { cliAdapter } from '../../cli.js'
import { useNavigation } from '../navigation/NavigationContext.js'

const items = [
  {
    label: 'Новая задача',
    value: 'NEW_TASK',
  },
  {
    label: 'Начать свободную сессию',
    value: 'FREE_SESSION',
  },
  {
    label: 'Показать все задачи',
    value: 'ALL_TASKS',
  },
  {
    label: 'Показать все сессии',
    value: 'ALL_SESSIONS',
  },
  {
    label: 'Выход',
    value: 'EXIT',
  },
]

export function MainMenu() {
  const { push } = useNavigation()

  async function handleSelect(item: (typeof items)[number]) {
    if (item.value === 'NEW_TASK') push({ name: 'NewTaskMenu' })
    if (item.value === 'ALL_TASKS') push({ name: 'TaskList' })
    if (item.value === 'ALL_SESSIONS') push({ name: 'SessionList' })
    if (item.value === 'FREE_SESSION') {
      const result = await cliAdapter.startFreeSession()

      if (result.success) push({ name: 'Session', params: {} })
    }
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
