import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import 'dotenv/config'
import colors from 'colors'
import { connectDB } from './config/db/index.js'
import { errorHandler } from './middleware/error.middleware.js'
import authRoutes from './routes/auth.routes.js'
import articleRoutes from "./routes/article.routes.js"
import commentRoutes from "./routes/comment.routes.js"

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

const app = new Hono()
connectDB()

// Middlewares
app.use('*', logger())
app.use('*', cors())
app.use('*', errorHandler)

// Base route
app.route('/auth', authRoutes)
app.route('/articles', articleRoutes)
app.route('/comments', commentRoutes)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`.green.bold)
})
