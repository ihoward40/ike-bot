import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { registerRoutes } from './routes'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

registerRoutes(app)

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Howard Trust Navigator API listening on port ${port}`)
})
