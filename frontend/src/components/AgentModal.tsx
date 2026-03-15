import { useEffect, useState } from 'react'
import type { AgentEvent, Lead } from '../types/index.ts'
import { streamAgentPipeline } from '../api/client.ts'

interface Props {
    lead: Lead
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

const agentConfig = [
    { key: 'qualifier', label: 'Lead qualifier', description: 'Scoring lead quality and signals' },
    { key: 'drafter', label: 'Email drafter', description: 'Writing personalised response' },
    { key: 'advisor', label: 'Deal advisor', description: 'Recommending next best action' },
]

export default function AgentModal({ lead, onClose, onComplete }: Props) {
    const [agents, setAgents] = useState<Record<string, AgentState>>(defaultAgents())
    const [running, setRunning] = useState(false)
    const [tokens, setTokens] = useState<number | null>(null)
    const [done, setDone] = useState(false)

    const runAgents = () => {
        setTokens(null)
        setDone(false)
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
                setDone(true)
                es.close()
                onComplete()
            }
            if (ev.event === 'error') { setRunning(false); es.close() }
        }
        es.onerror = () => { setRunning(false); es.close() }
    }

    useEffect(() => { setTimeout(runAgents, 120) }, [])

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', animation: 'fade-in 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--white)', letterSpacing: '-0.3px' }}>Agent pipeline — {lead.name}</h2>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{lead.company}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {tokens !== null && (
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{tokens.toLocaleString()} tokens</span>
                    )}
                    {running && (
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-dot 1s infinite' }} />
                            Running
                        </span>
                    )}
                    {done && (
                        <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>✓ Complete</span>
                    )}
                    <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, overflow: 'hidden' }}>
                {agentConfig.map(({ key, label, description }, i) => {
                    const s = agents[key]
                    const isRunning = s.status === 'running'
                    const isDone = s.status === 'done'

                    return (
                        <div key={key} style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: s.status === 'idle' ? 'rgba(255,255,255,0.15)' : isRunning ? '#f59e0b' : isDone ? '#22c55e' : '#ef4444', transition: 'background 0.3s', animation: isRunning ? 'pulse-dot 1s infinite' : 'none' }} />
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.2px' }}>{label}</p>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>{description}</p>
                                </div>
                                {isRunning && (
                                    <div style={{ marginLeft: 'auto', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.6)', animation: 'spin 0.8s linear infinite' }} />
                                )}
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
                                {s.status === 'idle' && (
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Waiting...</p>
                                )}
                                {isRunning && (
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', animation: 'pulse-dot 1.2s infinite' }}>Thinking...</p>
                                )}
                                {isDone && s.data && (
                                    <div style={{ animation: 'stream-in 0.3s ease' }}>
                                        {key === 'qualifier' && <QualifierResult data={s.data} />}
                                        {key === 'drafter' && <DrafterResult data={s.data} />}
                                        {key === 'advisor' && <AdvisorResult data={s.data} />}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div style={{ padding: '1rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={runAgents} disabled={running} style={{ padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.12)' }}>
                    {running ? 'Running...' : 'Re-run agents'}
                </button>
                <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--white)', color: 'var(--black)', fontSize: '13px', fontWeight: 600 }}>
                    Done
                </button>
            </div>
        </div>
    )
}

function Label({ text }: { text: string }) {
    return <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: '6px', marginTop: '14px' }}>{text}</p>
}

function QualifierResult({ data }: { data: any }) {
    const scoreColor = data.score === 'hot' ? '#ef4444' : data.score === 'warm' ? '#f59e0b' : '#60a5fa'
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: scoreColor, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{data.score}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                    {Math.round(data.confidence * 100)}% confidence
                </span>
            </div>
            <Label text="Reasoning" />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>{data.reasoning}</p>
            {Array.isArray(data.key_signals) && data.key_signals.length > 0 && (
                <>
                    <Label text="Key signals" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {data.key_signals.map((sig: string, i: number) => (
                            <span key={i} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}>{sig}</span>
                        ))}
                    </div>
                </>
            )}
        </>
    )
}

function DrafterResult({ data }: { data: any }) {
    return (
        <>
            <Label text="Subject" />
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{data.subject}</p>
            <Label text="Email body" />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{data.body}</p>
        </>
    )
}

function AdvisorResult({ data }: { data: any }) {
    const recLabel: Record<string, string> = {
        schedule_call: 'Response mail', send_demo: 'Send demo', offer_discount: 'Offer discount', drop_lead: 'Drop lead',
    }
    const urgencyColor = data.urgency === 'high' ? '#ef4444' : data.urgency === 'medium' ? '#f59e0b' : '#60a5fa'
    return (
        <>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {recLabel[data.recommendation] ?? data.recommendation?.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: urgencyColor, border: `1px solid ${urgencyColor}30` }}>
                    {data.urgency} urgency
                </span>
            </div>
            <Label text="Reasoning" />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>{data.reasoning}</p>
            {Array.isArray(data.next_steps) && data.next_steps.length > 0 && (
                <>
                    <Label text="Next steps" />
                    <ol style={{ paddingLeft: '16px', margin: 0 }}>
                        {data.next_steps.map((step: string, i: number) => (
                            <li key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: '4px' }}>{step}</li>
                        ))}
                    </ol>
                </>
            )}
        </>
    )
}