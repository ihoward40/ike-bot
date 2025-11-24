import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/supabase'

const router = Router()

const DisputeSchema = z.object({
  beneficiary_id: z.string().uuid().optional(),
  creditor_name: z.string(),
  bureau: z.string().optional(),
  account_number: z.string().optional(),
  dispute_type: z.string().optional(),
  amount: z.number().optional()
})

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('credit_disputes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const parsed = DisputeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const payload = {
    ...parsed.data,
    amount: parsed.data.amount ?? null
  }

  const { data, error } = await supabase
    .from('credit_disputes')
    .insert(payload)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

export default router
