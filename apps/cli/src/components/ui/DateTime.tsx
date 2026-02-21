import { Text } from 'ink'

interface DateTimeProps {
  children: React.ReactNode
}

export function DateTime({ children }: DateTimeProps) {
  return <Text color={'green'}>{children}</Text>
}
