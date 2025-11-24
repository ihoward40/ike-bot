import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/supabase'

const router = Router()

const BeneficiarySchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional()
})

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('beneficiaries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const parse = BeneficiarySchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() })
  }

  const { data, error } = await supabase
    .from('beneficiaries')
    .insert(parse.data)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

export default router
