import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import 'dotenv/config'
import colors from 'colors'
import { connectDB } from './db/index.js'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

const app = new Hono()
connectDB()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`.green.bold)
})
