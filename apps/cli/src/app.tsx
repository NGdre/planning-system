import { Router, Route } from './components/router/Router.js'
import { NewMainMenu } from './components/menu/MainMenu.js'
import NewTaskMenu from './components/menu/NewTaskMenu.js'
import { TaskStore } from './components/task/TaskStore.js'
import { TaskList } from './components/task/TaskList.js'

export default function App() {
  return (
    <TaskStore>
      <Router initialRoute="main">
        <Route route="main" component={<NewMainMenu />} />
        <Route route="new-task" component={<NewTaskMenu />} />
        <Route route="all-tasks" component={<TaskList />} />
      </Router>
    </TaskStore>
  )
}
