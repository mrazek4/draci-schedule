import { kv } from '@vercel/kv'

const KEY = 'draci-schedule-v6'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await kv.get(KEY)
    return res.json(data ?? null)
  }
  if (req.method === 'POST') {
    await kv.set(KEY, req.body)
    return res.json({ ok: true })
  }
  res.status(405).end()
}
