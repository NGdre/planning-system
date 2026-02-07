import { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

export type TextInputContainerProps = {
  label?: string
  onSubmit?: (value: string) => void
  hideOnSumbit?: boolean
}

export const TextInputContainer = ({
  label,
  onSubmit,
  hideOnSumbit = false,
}: TextInputContainerProps) => {
  const [query, setQuery] = useState('')
  const [show, setShow] = useState(true)

  if (!show && hideOnSumbit) return null

  const handleSubmit = (value: string) => {
    setShow(false)
    onSubmit?.(value)
  }

  return (
    <Box>
      {label && (
        <Box marginRight={1}>
          <Text>{label}</Text>
        </Box>
      )}

      <TextInput value={query} onChange={setQuery} onSubmit={handleSubmit} />
    </Box>
  )
}
