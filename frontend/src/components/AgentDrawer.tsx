import { useEffect, useState } from 'react'
import type { AgentEvent, Lead } from '../types/index.ts'
import { streamAgentPipeline } from '../api/client.ts'

interface Props {
    lead: Lead | null
    onClose: () => void
    onComplete: () => void
}

interface AgentState {
    status: 'idle' | 'running' | 'done' | 'error'
    data: any
}

const defaultAgents = (): Record<string, AgentState> => ({
    qualifier: { status: 'idle', data: null },
    drafter: { status: 'idle', data: null },
    advisor: { status: 'idle', data: null },
})

export default function AgentDrawer({ lead, onClose, onComplete }: Props) {
    const [agents, setAgents] = useState<Record<string, AgentState>>(defaultAgents())
    const [running, setRunning] = useState(false)
    const [tokens, setTokens] = useState<number | null>(null)

    const runAgents = () => {
        if (!lead) return
        setTokens(null)
        setAgents(defaultAgents())
        setRunning(true)
        const es = streamAgentPipeline(lead.id)
        es.onmessage = (e) => {
            const ev: AgentEvent = JSON.parse(e.data)
            if (ev.event === 'agent_start' && ev.agent)
                setAgents(p => ({ ...p, [ev.agent!]: { status: 'running', data: null } }))
            if (ev.event === 'agent_done' && ev.agent)
                setAgents(p => ({ ...p, [ev.agent!]: { status: 'done', data: ev.data } }))
            if (ev.event === 'complete') {
                setTokens(ev.total_tokens ?? null)
                setRunning(false)
                es.close()
                onComplete()
            }
            if (ev.event === 'error') { setRunning(false); es.close() }
        }
        es.onerror = () => { setRunning(false); es.close() }
    }

    useEffect(() => {
        if (lead) setTimeout(runAgents, 100)
    }, [lead?.id])

    if (!lead) return null

    const agentConfig = [
        { key: 'qualifier', label: 'Lead qualifier', icon: '◎' },
        { key: 'drafter', label: 'Email drafter', icon: '✉' },
        { key: 'advisor', label: 'Deal advisor', icon: '◈' },
    ]

    const dotColor: Record<string, string> = {
        idle: 'rgba(255,255,255,0.3)', running: '#f59e0b', done: '#10b981', error: '#ef4444',
    }
    const dotGlow: Record<string, string> = {
        idle: 'none', running: '0 0 8px rgba(245,158,11,0.7)', done: '0 0 8px rgba(16,185,129,0.7)', error: '0 0 8px rgba(239,68,68,0.7)',
    }
    const cardBorder: Record<string, string> = {
        idle: 'rgba(255,255,255,0.45)', running: 'rgba(245,158,11,0.35)', done: 'rgba(16,185,129,0.3)', error: 'rgba(239,68,68,0.3)',
    }

    return (
        <div style={{ width: '400px', minWidth: '400px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255,255,255,0.45)', display: 'flex', flexDirection: 'column', animation: 'slide-in-right 0.25s ease', boxShadow: '-8px 0 40px rgba(31,38,135,0.1)' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>{lead.name}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{lead.company} · Agent analysis</p>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)', padding: '5px 10px', color: 'var(--text-secondary)', fontSize: '14px' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {agentConfig.map(({ key, label, icon }) => {
                    const s = agents[key]
                    return (
                        <div key={key} style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder[s.status]}`, borderRadius: 'var(--border-radius-lg)', marginBottom: '10px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.2)' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{icon}</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {s.status === 'running' && (
                                        <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, animation: 'thinking 1s infinite' }}>thinking...</span>
                                    )}
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor[s.status], transition: 'all 0.3s', boxShadow: dotGlow[s.status] }} />
                                </div>
                            </div>

                            {s.data && (
                                <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                    {key === 'qualifier' && (
                                        <>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', textTransform: 'uppercase' }}>{s.data.score}</span>
                                                <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.12)', color: '#059669', padding: '2px 9px', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 700 }}>
                                                    {Math.round(s.data.confidence * 100)}% confidence
                                                </span>
                                            </div>
                                            <p style={{ margin: '0 0 8px' }}>{s.data.reasoning}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {Array.isArray(s.data.key_signals) && s.data.key_signals.map((sig: string, i: number) => (
                                                    <span key={i} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)', color: 'var(--text-secondary)', fontWeight: 500 }}>{sig}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {key === 'drafter' && (
                                        <>
                                            <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.4 }}>{s.data.subject}</p>
                                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{s.data.body}</p>
                                        </>
                                    )}
                                    {key === 'advisor' && (
                                        <>
                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.12)', color: '#4f46e5', padding: '3px 9px', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.25)', fontWeight: 700 }}>
                                                    {s.data.recommendation === 'schedule_call' ? 'Response mail' : s.data.recommendation?.replace(/_/g, ' ')}
                                                </span>
                                                <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', padding: '3px 9px', borderRadius: '999px', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 600 }}>
                                                    {s.data.urgency} urgency
                                                </span>
                                            </div>
                                            <p style={{ margin: '0 0 8px' }}>{s.data.reasoning}</p>
                                            <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                                {Array.isArray(s.data.next_steps) && s.data.next_steps.map((step: string, i: number) => (
                                                    <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)' }}>
                {tokens !== null && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>
                        {tokens.toLocaleString()} tokens used
                    </p>
                )}
                <button
                    onClick={runAgents}
                    disabled={running}
                    style={{ width: '100%', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))', color: '#4f46e5', borderColor: 'rgba(139,92,246,0.35)', fontWeight: 700, padding: '10px' }}
                >
                    {running ? 'Agents running...' : 'Re-run agents'}
                </button>
            </div>
        </div>
    )
}