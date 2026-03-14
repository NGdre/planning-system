import { Box } from 'ink'
import { ErrorMessage } from '../ui/ErrorMessage.js'
import { useErrors } from './ErrorsContext.js'

export const ErrorDisplay: React.FC = () => {
  const { error } = useErrors()

  if (!error) return null

  return (
    <Box marginTop={1}>
      <ErrorMessage>{error}</ErrorMessage>
    </Box>
  )
}
