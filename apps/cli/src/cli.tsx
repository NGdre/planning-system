#!/usr/bin/env node
import { render } from 'ink'
import App from './app.js'
import { CLIAdapter } from '@planning-system/cli-adapter'

export const cliAdapter = await CLIAdapter.create()

render(<App />)
