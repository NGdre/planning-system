import SelectInput from 'ink-select-input'
import { Text } from 'ink'
import { useRouter } from '../router/Router.js'
import { cliAdapter } from '../../cli.js'

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
  const { navigate } = useRouter()

  async function handleSelect(item: (typeof items)[number]) {
    if (item.value === 'NEW_TASK') navigate('new-task')
    if (item.value === 'ALL_TASKS') navigate('all-tasks')
    if (item.value === 'ALL_SESSIONS') navigate('all-sessions')
    if (item.value === 'FREE_SESSION') {
      const result = await cliAdapter.startFreeSession()

      if (result.success) navigate('session')
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
