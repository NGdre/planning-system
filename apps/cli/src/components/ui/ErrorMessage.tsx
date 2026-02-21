import { Text } from 'ink'

interface ErrorMessageProps {
  children: React.ReactNode
}

export function ErrorMessage({ children }: ErrorMessageProps) {
  return <Text color={'red'}>{children}</Text>
}
