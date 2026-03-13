import { useState } from 'react'
import type { Lead } from '../types/index.ts'

interface Props {
    lead: Lead
    onRunAgents: (lead: Lead) => void
    onDelete: (id: number) => void
    onStatusChange: (id: number, status: string) => void
}

const scoreBadge: Record<string, { bg: string; color: string; glow: string }> = {
    hot: { bg: 'rgba(239,68,68,0.15)', color: '#dc2626', glow: '0 0 10px rgba(239,68,68,0.3)' },
    warm: { bg: 'rgba(245,158,11,0.15)', color: '#d97706', glow: '0 0 10px rgba(245,158,11,0.3)' },
    cold: { bg: 'rgba(99,102,241,0.15)', color: '#4f46e5', glow: '0 0 10px rgba(99,102,241,0.3)' },
    unscored: { bg: 'rgba(148,163,184,0.12)', color: '#64748b', glow: 'none' },
}

const nextStatus: Record<string, string> = {
    new: 'contacted', qualified: 'contacted', contacted: 'closed', closed: 'closed', dropped: 'dropped',
}

const recLabel: Record<string, string> = {
    schedule_call: 'Response mail',
    send_demo: 'Send demo',
    offer_discount: 'Offer discount',
    drop_lead: 'Drop lead',
}

const recIcon: Record<string, string> = {
    schedule_call: '✉',
    send_demo: '🎬',
    offer_discount: '💰',
    drop_lead: '🚫',
}

export default function LeadCard({ lead, onRunAgents, onDelete, onStatusChange }: Props) {
    const badge = scoreBadge[lead.score] ?? scoreBadge.unscored
    const [copied, setCopied] = useState(false)

    const isResponseMail = lead.advisor_recommendation === 'schedule_call'

    const handleResponseMail = () => {
        if (!lead.followup_email) return
        navigator.clipboard.writeText(lead.followup_email)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '12px 14px',
                marginBottom: '8px',
                animation: 'fade-up 0.3s ease',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 12px rgba(31,38,135,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
                position: 'relative',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.65)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(31,38,135,0.14), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.45)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(31,38,135,0.06), inset 0 1px 0 rgba(255,255,255,0.7)'
            }}
        >
            {copied && (
                <div style={{
                    position: 'absolute', top: '-38px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(16,185,129,0.92)', backdropFilter: 'blur(12px)',
                    color: 'white', fontSize: '12px', fontWeight: 600,
                    padding: '6px 14px', borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    whiteSpace: 'nowrap', zIndex: 10,
                    animation: 'fade-up 0.2s ease',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                }}>
                    ✓ Response email copied to clipboard
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px' }}>
                <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{lead.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{lead.company}</p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: badge.bg, color: badge.color, border: `1px solid ${badge.color}40`, boxShadow: badge.glow, letterSpacing: '0.3px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    {lead.score}
                </span>
            </div>

            <p style={{ margin: '0 0 9px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {lead.message}
            </p>

            {lead.advisor_recommendation && (
                <div
                    onClick={isResponseMail && lead.followup_email ? handleResponseMail : undefined}
                    style={{
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '10px',
                        padding: '5px 10px',
                        marginBottom: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: isResponseMail && lead.followup_email ? 'pointer' : 'default',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                        if (isResponseMail && lead.followup_email)
                            e.currentTarget.style.background = 'rgba(99,102,241,0.16)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                    }}
                >
                    <span style={{ fontSize: '13px' }}>{recIcon[lead.advisor_recommendation] ?? '→'}</span>
                    <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600 }}>
                        {recLabel[lead.advisor_recommendation] ?? lead.advisor_recommendation.replace(/_/g, ' ')}
                    </span>
                    {isResponseMail && lead.followup_email && (
                        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#6366f1', fontWeight: 600, opacity: 0.65 }}>
                            click to copy
                        </span>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    onClick={() => onRunAgents(lead)}
                    style={{ flex: 1, fontSize: '12px', padding: '7px', background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))', color: '#4f46e5', borderColor: 'rgba(139,92,246,0.35)', fontWeight: 700 }}
                >
                    Run agents
                </button>
                {lead.status !== 'closed' && lead.status !== 'dropped' && (
                    <button
                        onClick={() => onStatusChange(lead.id, nextStatus[lead.status])}
                        style={{ fontSize: '13px', padding: '7px 12px', color: 'var(--text-secondary)' }}
                    >
                        →
                    </button>
                )}
                <button
                    onClick={() => onDelete(lead.id)}
                    style={{ fontSize: '12px', padding: '7px 12px', color: '#dc2626', borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}
                >
                    ✕
                </button>
            </div>
        </div>
    )
}