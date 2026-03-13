import axios from 'axios'
import type { Lead } from '../types/index.ts'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

export const getLeads = () =>
    api.get<Lead[]>('/leads/').then(r => r.data)

export const createLead = (data: {
    name: string; company: string; email: string; message: string
}) => api.post<Lead>('/leads/', data).then(r => r.data)

export const deleteLead = (id: number) =>
    api.delete(`/leads/${id}`)

export const updateLeadStatus = (id: number, status: string) =>
    api.patch<Lead>(`/leads/${id}`, { status }).then(r => r.data)

export const streamAgentPipeline = (leadId: number): EventSource => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return new EventSource(`${base}/pipeline/run/${leadId}`)
}