import React, { useEffect, useState } from 'react'
import { Box, Text, useStdout, TextProps } from 'ink'
import stringWidth from 'string-width'

export interface CommandItem {
  /** Key combination, e.g. "↑↓" */
  keys: string
  /** Action description, e.g. "Navigation" */
  description: string
}

export interface CommandHelpProps {
  /** Array of commands to display */
  items: CommandItem[]
  /** Separator between commands in horizontal mode (default " | ") */
  separator?: string
  /** Prefix for each command in vertical mode (default "• ") */
  verticalPrefix?: string

  /** Styling props applied to the keys part */
  keyProps?: Partial<TextProps>
  /** Styling props applied to the description part */
  descriptionProps?: Partial<TextProps>
}

/**
 * Displays command hints.
 * Automatically switches between horizontal and vertical layout based on terminal width.
 */
export const CommandHelp: React.FC<CommandHelpProps> = ({
  items,
  separator = ' | ',
  verticalPrefix = '• ',
  keyProps,
  descriptionProps,
}) => {
  const { stdout } = useStdout()
  const [columns, setColumns] = useState(stdout?.columns ?? 80)

  useEffect(() => {
    const handleResize = () => {
      if (stdout) {
        setColumns(stdout.columns)
      }
    }

    stdout?.on('resize', handleResize)
    return () => {
      stdout?.off('resize', handleResize)
    }
  }, [stdout])

  if (!items.length) {
    return null
  }

  const itemStrings = items.map((item) => `${item.keys} - ${item.description}`)
  const horizontalString = itemStrings.join(separator)
  const horizontalWidth = stringWidth(horizontalString)
  const isHorizontal = horizontalWidth <= columns

  if (isHorizontal) {
    return (
      <Box>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Text>{separator}</Text>}
            <Text {...keyProps}>{item.keys}</Text>
            <Text {...descriptionProps}> - {item.description}</Text>
          </React.Fragment>
        ))}
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={index}>
          <Text>{verticalPrefix}</Text>
          <Text {...keyProps}>{item.keys}</Text>
          <Text {...descriptionProps}> - {item.description}</Text>
        </Box>
      ))}
    </Box>
  )
}
