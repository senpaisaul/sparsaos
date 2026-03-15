import type { Lead } from '../types/index.ts'

interface Props { leads: Lead[] }

const scoreColors: Record<string, string> = {
    hot: '#dc2626', warm: '#d97706', cold: '#2563eb', unscored: '#9ca3af',
}

const recLabel: Record<string, string> = {
    schedule_call: 'Response mail', send_demo: 'Send demo',
    offer_discount: 'Offer discount', drop_lead: 'Drop lead',
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div style={{ background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--grey-400)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontSize: '30px', fontWeight: 800, color, letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</p>
        </div>
    )
}

export default function AgentsPage({ leads }: Props) {
    const processed = leads.filter(l => l.score !== 'unscored')
    const hot = leads.filter(l => l.score === 'hot').length
    const warm = leads.filter(l => l.score === 'warm').length
    const cold = leads.filter(l => l.score === 'cold').length

    return (
        <div style={{ padding: '2rem', overflowY: 'auto', height: '100%' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.5px' }}>Agent runs</h2>
                <p style={{ fontSize: '13px', color: 'var(--grey-400)', marginTop: '4px' }}>All pipeline executions and their results</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '2rem' }}>
                <StatCard label="Processed" value={processed.length} color="var(--black)" />
                <StatCard label="Hot leads" value={hot} color="#dc2626" />
                <StatCard label="Warm leads" value={warm} color="#d97706" />
                <StatCard label="Cold leads" value={cold} color="#2563eb" />
            </div>

            <div style={{ background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {processed.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: 'var(--grey-400)' }}>No agent runs yet — add a lead and click Agents</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--grey-200)' }}>
                                {['Lead', 'Company', 'Score', 'Recommendation', 'Reasoning', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '11px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--grey-400)', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {processed.map((lead, i) => (
                                <tr key={lead.id} style={{ borderBottom: i < processed.length - 1 ? '1px solid var(--grey-100)' : 'none' }}>
                                    <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--black)', whiteSpace: 'nowrap' }}>{lead.name}</td>
                                    <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--grey-500)', whiteSpace: 'nowrap' }}>{lead.company}</td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: scoreColors[lead.score] ?? '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lead.score}</span>
                                    </td>
                                    <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--grey-600)', whiteSpace: 'nowrap' }}>
                                        {lead.advisor_recommendation ? (recLabel[lead.advisor_recommendation] ?? lead.advisor_recommendation.replace(/_/g, ' ')) : '—'}
                                    </td>
                                    <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--grey-500)', maxWidth: '320px' }}>
                                        <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.advisor_reasoning ?? '—'}</p>
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', background: lead.status === 'closed' ? '#f0fdf4' : 'var(--grey-100)', color: lead.status === 'closed' ? '#15803d' : 'var(--grey-600)', textTransform: 'capitalize' }}>
                                            {lead.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}