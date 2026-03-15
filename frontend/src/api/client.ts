import type { Lead } from '../types/index.ts'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const get = (url: string) => fetch(BASE + url).then(r => r.json())
const post = (url: string, data: any) => fetch(BASE + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json())
const del = (url: string) => fetch(BASE + url, { method: 'DELETE' })
const patch = (url: string, data: any) => fetch(BASE + url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json())

export const getLeads = (): Promise<Lead[]> => get('/leads/')
export const createLead = (data: { name: string; company: string; email: string; message: string }): Promise<Lead> => post('/leads/', data)
export const deleteLead = (id: number) => del(`/leads/${id}`)
export const updateLeadStatus = (id: number, status: string): Promise<Lead> => patch(`/leads/${id}`, { status })

export const streamAgentPipeline = (leadId: number): EventSource => {
    return new EventSource(`${BASE}/pipeline/run/${leadId}`)
}