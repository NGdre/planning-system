import { cliAdapter } from '../../cli.js'
import { FormatedSessionDetails } from '@planning-system/cli-adapter'
import { Box, Text } from 'ink'
import { Action, useDataWithActions } from '../../hooks/useDataWithActions.js'
import { SessionAction } from '@planning-system/core'
import SelectInput from 'ink-select-input'
import { useCallback, useMemo } from 'react'

export interface SessionProps {
  params: { sessionId?: string }
}

export function Session({ params }: SessionProps) {
  const allActions: Action[] = useMemo(
    () => [
      {
        id: SessionAction.PAUSE,
        label: 'приостановить сессию',
        // keep the context with arrow functions
        queryFn: () => cliAdapter.pauseSession(),
      },
      {
        id: SessionAction.RESUME,
        label: 'возобновить сессию',
        queryFn: () => cliAdapter.resumeSession(),
      },
      {
        id: SessionAction.STOP,
        label: 'остановить сессию',
        queryFn: () => cliAdapter.stopSession(),
      },
    ],
    []
  )

  const fetchData = useCallback(async () => {
    return await cliAdapter.fetchSessionDetails(params.sessionId)
  }, [params.sessionId])

  const {
    data: sessionDetails,
    actions,
    performAction,
  } = useDataWithActions<FormatedSessionDetails>({
    fetchData,
    allActions,
  })

  if (!sessionDetails) return null

  return (
    <Box flexDirection="column">
      {sessionDetails.taskTitle && <Text>Название задачи: {sessionDetails.taskTitle}</Text>}

      {sessionDetails.formated.timeBlock && (
        <Box flexDirection="column" marginY={1}>
          {sessionDetails.formated.scheduledDay && (
            <Text>Запланированный день: {sessionDetails.formated.scheduledDay}</Text>
          )}

          <Text>Запланированное время: {sessionDetails.formated.timeBlock}</Text>
        </Box>
      )}

      <Text>Статус: {sessionDetails.status}</Text>

      <Box flexDirection="column" marginY={1}>
        <Text>{sessionDetails.formated.startDay}</Text>
        <Text>Начало сессии: {sessionDetails.formated.startTime}</Text>
        {sessionDetails.formated.endTime && (
          <Text>Конец сессии: {sessionDetails.formated.endTime}</Text>
        )}
      </Box>

      <Text>Общее время работы: {sessionDetails.totalWorkTime} мин</Text>

      <Box flexDirection="column" marginY={1}>
        <Text>Рабочие интервалы:</Text>

        {sessionDetails.formated.intervals.map((interval) => (
          <Text key={interval}>{interval}</Text>
        ))}
      </Box>

      <SelectInput
        items={actions.map((item) => ({ ...item, value: item.id.toString() }))}
        onSelect={(action) => performAction(action.value)}
      />
    </Box>
  )
}
