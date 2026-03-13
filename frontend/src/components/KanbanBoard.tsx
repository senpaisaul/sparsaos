import type { Lead } from '../types/index.ts'
import LeadCard from './LeadCard'

interface Props {
    leads: Lead[]
    onRunAgents: (lead: Lead) => void
    onDelete: (id: number) => void
    onStatusChange: (id: number, status: string) => void
}

const columns = [
    { key: 'new', label: 'New', dot: '#94a3b8' },
    { key: 'qualified', label: 'Qualified', dot: '#6366f1' },
    { key: 'contacted', label: 'Contacted', dot: '#f59e0b' },
    { key: 'closed', label: 'Closed', dot: '#10b981' },
]

export default function KanbanBoard({ leads, onRunAgents, onDelete, onStatusChange }: Props) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', height: '100%' }}>
            {columns.map(col => {
                const colLeads = leads.filter(l => l.status === col.key)
                const hasLeads = colLeads.length > 0
                return (
                    <div
                        key={col.key}
                        style={{
                            background: hasLeads ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.22)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.5)',
                            borderRadius: 'var(--border-radius-xl)',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 2px 16px rgba(31,38,135,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
                            transition: 'background 0.3s ease',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.dot, boxShadow: `0 0 8px ${col.dot}80` }} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{col.label}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.5)' }}>{colLeads.length}</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            {colLeads.length === 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', border: '1.5px dashed rgba(255,255,255,0.3)', borderRadius: 'var(--border-radius-lg)' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Drop leads here</p>
                                </div>
                            ) : (
                                colLeads.map(lead => (
                                    <LeadCard key={lead.id} lead={lead} onRunAgents={onRunAgents} onDelete={onDelete} onStatusChange={onStatusChange} />
                                ))
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}