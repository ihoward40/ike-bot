import { Express } from 'express'
import beneficiariesRouter from './beneficiaries'
import disputesRouter from './disputes'
import healthRouter from './misc'

export const registerRoutes = (app: Express) => {
  app.use('/api/beneficiaries', beneficiariesRouter)
  app.use('/api/disputes', disputesRouter)
  app.use('/api', healthRouter)
}
