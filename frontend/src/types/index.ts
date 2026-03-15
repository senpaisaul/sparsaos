export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'closed' | 'dropped'
export type LeadScore = 'hot' | 'warm' | 'cold' | 'unscored'

export interface Lead {
    id: number
    name: string
    company: string
    email: string
    message: string
    status: LeadStatus
    score: LeadScore
    qualification_reasoning: string | null
    followup_email: string | null
    followup_subject: string | null
    advisor_recommendation: string | null
    advisor_reasoning: string | null
    created_at: string
    updated_at: string | null
}

export interface AgentEvent {
    event: 'started' | 'agent_start' | 'agent_done' | 'complete' | 'error'
    agent?: 'qualifier' | 'drafter' | 'advisor'
    lead_id?: number
    message?: string
    data?: any
    total_tokens?: number
}