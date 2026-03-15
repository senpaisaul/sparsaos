import type { Lead } from '../types/index.ts'

interface Props {
    lead: Lead
    onClose: () => void
    onRunAgents: (lead: Lead) => void
    onDelete: (id: number) => void
    onStatusChange: (id: number, status: string) => void
}

const statusColors: Record<string, { bg: string; color: string }> = {
    new: { bg: '#f0f0f0', color: '#3a3a3a' },
    qualified: { bg: '#eff6ff', color: '#1d4ed8' },
    contacted: { bg: '#fffbeb', color: '#b45309' },
    closed: { bg: '#f0fdf4', color: '#15803d' },
    dropped: { bg: '#fef2f2', color: '#b91c1c' },
}

const scoreColors: Record<string, { bg: string; color: string }> = {
    hot: { bg: '#fef2f2', color: '#dc2626' },
    warm: { bg: '#fffbeb', color: '#d97706' },
    cold: { bg: '#eff6ff', color: '#2563eb' },
    unscored: { bg: '#f5f5f5', color: '#6b6b6b' },
}

const nextStatus: Record<string, string> = {
    new: 'qualified', qualified: 'contacted', contacted: 'closed', closed: 'closed', dropped: 'dropped',
}

const nextLabel: Record<string, string> = {
    new: 'Mark qualified', qualified: 'Mark contacted', contacted: 'Mark closed', closed: 'Closed', dropped: 'Dropped',
}

const recLabel: Record<string, string> = {
    schedule_call: 'Response mail',
    send_demo: 'Send demo',
    offer_discount: 'Offer discount',
    drop_lead: 'Drop lead',
}

export default function LeadDetailModal({ lead, onClose, onRunAgents, onDelete, onStatusChange }: Props) {
    const sc = statusColors[lead.status] ?? statusColors.new
    const sq = scoreColors[lead.score] ?? scoreColors.unscored

    const handleResponseMail = () => {
        if (!lead.followup_email) return
        const subject = encodeURIComponent(lead.followup_subject ?? `Following up — ${lead.company}`)
        const body = encodeURIComponent(lead.followup_email)
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${subject}&body=${body}`, '_blank')
    }

    const isResponseMail = lead.advisor_recommendation === 'schedule_call'

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fade-in 0.15s ease' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)', animation: 'slide-up 0.2s ease' }}>

                <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--grey-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--grey-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: 'var(--grey-700)', flexShrink: 0 }}>
                            {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.3px' }}>{lead.name}</h2>
                            <p style={{ fontSize: '13px', color: 'var(--grey-500)', marginTop: '1px' }}>{lead.company} · {lead.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--grey-100)', color: 'var(--grey-700)', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                </div>

                <div style={{ padding: '1.5rem 1.75rem' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', background: sq.bg, color: sq.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lead.score}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', background: sc.bg, color: sc.color, textTransform: 'capitalize', letterSpacing: '0.2px' }}>{lead.status}</span>
                        {lead.advisor_recommendation && (
                            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', background: 'var(--grey-100)', color: 'var(--grey-700)' }}>
                                {recLabel[lead.advisor_recommendation] ?? lead.advisor_recommendation.replace(/_/g, ' ')}
                            </span>
                        )}
                    </div>

                    <Section label="Message">
                        <p style={{ fontSize: '14px', color: 'var(--grey-700)', lineHeight: 1.65 }}>{lead.message}</p>
                    </Section>

                    {lead.qualification_reasoning && (
                        <Section label="Qualification reasoning">
                            <p style={{ fontSize: '14px', color: 'var(--grey-700)', lineHeight: 1.65 }}>{lead.qualification_reasoning}</p>
                        </Section>
                    )}

                    {lead.followup_email && (
                        <Section label="Drafted response email">
                            {lead.followup_subject && (
                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--black)', marginBottom: '8px' }}>Subject: {lead.followup_subject}</p>
                            )}
                            <p style={{ fontSize: '13px', color: 'var(--grey-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'var(--grey-50)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--grey-200)' }}>{lead.followup_email}</p>
                        </Section>
                    )}

                    {lead.advisor_reasoning && (
                        <Section label="Advisor reasoning">
                            <p style={{ fontSize: '14px', color: 'var(--grey-700)', lineHeight: 1.65 }}>{lead.advisor_reasoning}</p>
                        </Section>
                    )}
                </div>

                <div style={{ padding: '1rem 1.75rem 1.5rem', borderTop: '1px solid var(--grey-200)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => { onRunAgents(lead); onClose() }}
                        style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--black)', color: 'var(--white)', fontSize: '13px', fontWeight: 600 }}
                    >
                        Run agents
                    </button>

                    {isResponseMail && lead.followup_email && (
                        <button
                            onClick={handleResponseMail}
                            style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--grey-100)', color: 'var(--grey-800)', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <span style={{ fontSize: '14px' }}>✉</span> Open in Gmail
                        </button>
                    )}

                    {lead.status !== 'closed' && lead.status !== 'dropped' && (
                        <button
                            onClick={() => { onStatusChange(lead.id, nextStatus[lead.status]); onClose() }}
                            style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--grey-100)', color: 'var(--grey-800)', fontSize: '13px', fontWeight: 500 }}
                        >
                            {nextLabel[lead.status]}
                        </button>
                    )}

                    <button
                        onClick={() => { onDelete(lead.id); onClose() }}
                        style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: 'var(--hot)', fontSize: '13px', fontWeight: 500, marginLeft: 'auto' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--grey-400)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</p>
            {children}
        </div>
    )
}