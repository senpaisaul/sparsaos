import { useState } from 'react'
import type { Lead } from '../types/index.ts'
import LeadDetailModal from './LeadDetailModal'

interface Props {
    leads: Lead[]
    onRunAgents: (lead: Lead) => void
    onDelete: (id: number) => void
    onStatusChange: (id: number, status: string) => void
}

const scoreColors: Record<string, { bg: string; color: string }> = {
    hot: { bg: '#fef2f2', color: '#dc2626' },
    warm: { bg: '#fffbeb', color: '#d97706' },
    cold: { bg: '#eff6ff', color: '#2563eb' },
    unscored: { bg: '#f5f5f5', color: '#6b6b6b' },
}

const statusColors: Record<string, { bg: string; color: string }> = {
    new: { bg: '#f0f0f0', color: '#3a3a3a' },
    qualified: { bg: '#eff6ff', color: '#1d4ed8' },
    contacted: { bg: '#fffbeb', color: '#b45309' },
    closed: { bg: '#f0fdf4', color: '#15803d' },
    dropped: { bg: '#fef2f2', color: '#b91c1c' },
}

const recLabel: Record<string, string> = {
    schedule_call: 'Response mail',
    send_demo: 'Send demo',
    offer_discount: 'Offer discount',
    drop_lead: 'Drop lead',
}

const filters = ['all', 'new', 'qualified', 'contacted', 'closed', 'hot', 'warm', 'cold'] as const

export default function LeadsTable({ leads, onRunAgents, onDelete, onStatusChange }: Props) {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [sortKey, setSortKey] = useState<keyof Lead>('created_at')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
    const [filter, setFilter] = useState<string>('all')

    const toggleSort = (key: keyof Lead) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('asc') }
    }

    const filtered = leads.filter(l =>
        filter === 'all' || l.status === filter || l.score === filter
    )

    const sorted = [...filtered].sort((a, b) => {
        const av = a[sortKey] ?? ''
        const bv = b[sortKey] ?? ''
        const cmp = String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
    })

    const thBase: React.CSSProperties = {
        padding: '10px 14px',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--grey-500)',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        textAlign: 'left',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid var(--grey-200)',
        background: 'var(--white)',
    }

    const headers: { label: string; col: keyof Lead }[] = [
        { label: 'Name', col: 'name' },
        { label: 'Company', col: 'company' },
        { label: 'Email', col: 'email' },
        { label: 'Score', col: 'score' },
        { label: 'Status', col: 'status' },
        { label: 'Recommendation', col: 'advisor_recommendation' },
        { label: 'Message', col: 'message' },
    ]

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '5px 12px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: filter === f ? 'var(--black)' : 'var(--white)',
                            color: filter === f ? 'var(--white)' : 'var(--grey-500)',
                            border: `1px solid ${filter === f ? 'var(--black)' : 'var(--grey-200)'}`,
                            textTransform: 'capitalize',
                        }}
                    >
                        {f}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--grey-400)' }}>
                    {sorted.length} lead{sorted.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--grey-200)', overflow: 'hidden' }}>
                {sorted.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '15px', color: 'var(--grey-400)' }}>No leads yet</p>
                        <p style={{ fontSize: '13px', color: 'var(--grey-300)', marginTop: '6px' }}>Click "+ Add lead" to get started</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '900px' }}>
                            <colgroup>
                                <col style={{ width: '150px' }} />
                                <col style={{ width: '140px' }} />
                                <col style={{ width: '180px' }} />
                                <col style={{ width: '85px' }} />
                                <col style={{ width: '105px' }} />
                                <col style={{ width: '140px' }} />
                                <col style={{ width: '100%' }} />
                                <col style={{ width: '105px' }} />
                            </colgroup>

                            <thead>
                                <tr>
                                    {headers.map(({ label, col }) => (
                                        <th
                                            key={label}
                                            style={thBase}
                                            onClick={() => toggleSort(col)}
                                        >
                                            {label}
                                            <span style={{ marginLeft: '4px', fontSize: '10px', color: sortKey === col ? 'var(--black)' : 'var(--grey-300)' }}>
                                                {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                                            </span>
                                        </th>
                                    ))}
                                    <th style={{ ...thBase, cursor: 'default' }}>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sorted.map((lead, i) => {
                                    const sq = scoreColors[lead.score] ?? scoreColors.unscored
                                    const sc = statusColors[lead.status] ?? statusColors.new

                                    return (
                                        <tr
                                            key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            style={{
                                                borderBottom: i < sorted.length - 1 ? '1px solid var(--grey-100)' : 'none',
                                                cursor: 'pointer',
                                                transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--grey-50)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '13px 14px', fontSize: '14px', fontWeight: 600, color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {lead.name}
                                            </td>
                                            <td style={{ padding: '13px 14px', fontSize: '13px', color: 'var(--grey-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {lead.company}
                                            </td>
                                            <td style={{ padding: '13px 14px', fontSize: '13px', color: 'var(--grey-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {lead.email}
                                            </td>
                                            <td style={{ padding: '13px 14px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: sq.bg, color: sq.color, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                                    {lead.score}
                                                </span>
                                            </td>
                                            <td style={{ padding: '13px 14px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', background: sc.bg, color: sc.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '13px 14px', fontSize: '12px', color: 'var(--grey-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {lead.advisor_recommendation
                                                    ? (recLabel[lead.advisor_recommendation] ?? lead.advisor_recommendation.replace(/_/g, ' '))
                                                    : '—'}
                                            </td>
                                            <td style={{ padding: '13px 14px', fontSize: '13px', color: 'var(--grey-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {lead.message}
                                            </td>
                                            <td
                                                style={{ padding: '13px 14px' }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button
                                                        onClick={() => onRunAgents(lead)}
                                                        style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--black)', color: 'var(--white)', fontSize: '11px', fontWeight: 600 }}
                                                    >
                                                        Agents
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(lead.id)}
                                                        style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 600 }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onRunAgents={lead => { onRunAgents(lead); setSelectedLead(null) }}
                    onDelete={id => { onDelete(id); setSelectedLead(null) }}
                    onStatusChange={(id, status) => { onStatusChange(id, status); setSelectedLead(null) }}
                />
            )}
        </>
    )
}