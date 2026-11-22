import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cookieParser from 'cookie-parser'
import { authRoutes } from './routes/auth.js'
import { readingRoutes } from './routes/readings.js'
import { reportRoutes } from './routes/reports.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(here, '..', '..', 'client', 'dist')

export function createApp(pool) {
  const app = express()
  app.use(express.json({ limit: '10kb' }))
  app.use(cookieParser())

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
  app.use('/api/auth', authRoutes(pool))
  app.use('/api/readings', readingRoutes(pool))
  app.use('/api/reports', reportRoutes(pool))
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }))

  // In production the built React app is served from the same origin.
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist))
    app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')))
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' })
    }
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  })

  return app
}
