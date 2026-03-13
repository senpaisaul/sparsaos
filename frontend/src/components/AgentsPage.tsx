import type { Lead } from '../types/index.ts'

interface Props { leads: Lead[] }

const scoreColor: Record<string, string> = {
    hot: '#dc2626', warm: '#d97706', cold: '#4f46e5', unscored: '#64748b',
}

const recIcon: Record<string, string> = {
    schedule_call: '📞', send_demo: '🎬', offer_discount: '💰', drop_lead: '🚫',
}

interface StatCardProps { label: string; value: string | number; sub: string; color: string }

function StatCard({ label, value, sub, color }: StatCardProps) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 'var(--border-radius-lg)', padding: '16px 18px', boxShadow: '0 2px 16px rgba(31,38,135,0.07), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ margin: '0 0 2px', fontSize: '28px', fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1 }}>{value}</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</p>
        </div>
    )
}

export default function AgentsPage({ leads }: Props) {
    const processed = leads.filter(l => l.score !== 'unscored')
    const hotCount = leads.filter(l => l.score === 'hot').length
    const warmCount = leads.filter(l => l.score === 'warm').length
    const coldCount = leads.filter(l => l.score === 'cold').length

    return (
        <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Agent runs</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>History of all agent pipeline executions</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                <StatCard label="Leads processed" value={processed.length} sub="pipelines run" color="#4f46e5" />
                <StatCard label="Hot leads" value={hotCount} sub="high-value signals" color="#dc2626" />
                <StatCard label="Warm leads" value={warmCount} sub="nurture pipeline" color="#d97706" />
                <StatCard label="Cold leads" value={coldCount} sub="low priority" color="#64748b" />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 'var(--border-radius-xl)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(31,38,135,0.08)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)', display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 2fr 0.8fr', gap: '12px' }}>
                    {['Lead', 'Score', 'Recommendation', 'Reasoning', 'Status'].map(h => (
                        <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                    ))}
                </div>

                {processed.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No agent runs yet — add a lead and click Run agents</p>
                    </div>
                ) : (
                    processed.map((lead, i) => (
                        <div key={lead.id} style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 2fr 0.8fr', gap: '12px', alignItems: 'center', borderBottom: i < processed.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.08)', animation: 'fade-up 0.3s ease' }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{lead.name}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{lead.company}</p>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor[lead.score] ?? '#64748b', textTransform: 'uppercase' }}>{lead.score}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '13px' }}>{lead.advisor_recommendation ? (recIcon[lead.advisor_recommendation] ?? '—') : '—'}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lead.advisor_recommendation?.replace(/_/g, ' ') ?? '—'}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {lead.advisor_reasoning ?? '—'}
                            </p>
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', background: lead.status === 'closed' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.1)', color: lead.status === 'closed' ? '#059669' : '#4f46e5', border: `1px solid ${lead.status === 'closed' ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.2)'}`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                {lead.status}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}