import React from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

interface PromptWithHintsProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  hints?: string[]
  label?: string
  placeholder?: string
  showHints?: boolean
  colors?: {
    label?: string
    hint?: string
  }
}

const PromptWithHints: React.FC<PromptWithHintsProps> = ({
  value,
  onChange,
  onSubmit,
  hints = [],
  label,
  placeholder = '',
  showHints = true,
  colors = {},
}) => {
  return (
    <Box flexDirection="column">
      {showHints && (
        <Box flexDirection="column" marginBottom={1}>
          {hints.length > 0 &&
            hints.map((hint, idx) => (
              <Text key={idx} color={colors.hint || 'gray'} dimColor>
                • {hint}
              </Text>
            ))}
        </Box>
      )}

      <Box>
        {label && <Text color={colors.label || 'white'}>{label}</Text>}
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
        />
      </Box>
    </Box>
  )
}

export default PromptWithHints
