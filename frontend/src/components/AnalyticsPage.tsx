import { useEffect, useRef } from 'react'
import type { Lead } from '../types/index.ts'

interface Props { leads: Lead[] }

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

function DonutChart({ hot, warm, cold, unscored, total }: {
    hot: number; warm: number; cold: number; unscored: number; total: number
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const Chart = (window as any).Chart
        if (!Chart) return

        const existing = Chart.getChart(canvas)
        if (existing) existing.destroy()

        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Hot', 'Warm', 'Cold', 'Unscored'],
                datasets: [{
                    data: total === 0 ? [1, 0, 0, 0] : [hot, warm, cold, unscored],
                    backgroundColor: total === 0
                        ? ['rgba(255,255,255,0.12)']
                        : [
                            'rgba(220,38,38,0.75)',
                            'rgba(217,119,6,0.75)',
                            'rgba(79,70,229,0.75)',
                            'rgba(148,163,184,0.45)',
                        ],
                    borderColor: total === 0
                        ? ['rgba(255,255,255,0.2)']
                        : [
                            'rgba(220,38,38,0.95)',
                            'rgba(217,119,6,0.95)',
                            'rgba(79,70,229,0.95)',
                            'rgba(148,163,184,0.8)',
                        ],
                    borderWidth: 1.5,
                    hoverOffset: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: total > 0,
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        titleColor: '#1a1035',
                        bodyColor: '#5a5475',
                        borderColor: 'rgba(255,255,255,0.7)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 10,
                        callbacks: {
                            label: (ctx: any) => {
                                const pct = Math.round((ctx.parsed / total) * 100)
                                return ` ${ctx.parsed} leads · ${pct}%`
                            },
                        },
                    },
                },
                animation: { animateRotate: true, duration: 900, easing: 'easeInOutQuart' },
            },
        })
    }, [hot, warm, cold, unscored, total])

    const legendItems = [
        { label: 'Hot', count: hot, color: '#dc2626' },
        { label: 'Warm', count: warm, color: '#d97706' },
        { label: 'Cold', count: cold, color: '#4f46e5' },
        { label: 'Unscored', count: unscored, color: '#94a3b8' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', width: '190px', height: '190px' }}>
                <canvas ref={canvasRef} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-2px', lineHeight: 1 }}>{total}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '3px' }}>leads</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', width: '100%' }}>
                {legendItems.map(item => {
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                    return (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, flex: 1 }}>{item.label}</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: item.color }}>{item.count}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

interface FunnelStage { label: string; count: number; color: string }

function TrapezoidFunnel({ stages }: { stages: FunnelStage[] }) {
    const max = Math.max(stages[0]?.count ?? 1, 1)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0 }}>
            {stages.map((stage, i) => {
                const widthPct = Math.round(40 + (stage.count / max) * 56)
                const prevCount = i > 0 ? stages[i - 1].count : null
                const dropPct = prevCount !== null && prevCount > 0
                    ? Math.round((1 - stage.count / prevCount) * 100)
                    : null
                const isFirst = i === 0
                const isLast = i === stages.length - 1

                return (
                    <div key={stage.label}>
                        {dropPct !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', justifyContent: 'center' }}>
                                <div style={{ height: '1px', width: '40px', background: 'rgba(255,255,255,0.2)' }} />
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {dropPct > 0 ? `▼ ${dropPct}% drop-off` : '▶ no drop-off'}
                                </span>
                                <div style={{ height: '1px', width: '40px', background: 'rgba(255,255,255,0.2)' }} />
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                                width: `${widthPct}%`,
                                background: stage.color,
                                borderRadius: isFirst
                                    ? '12px 12px 4px 4px'
                                    : isLast
                                        ? '4px 4px 12px 12px'
                                        : '4px',
                                padding: '11px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid rgba(255,255,255,0.35)',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 8px rgba(31,38,135,0.08)',
                                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                                minWidth: '140px',
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.9 }}>
                                    {stage.label}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                    <span style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                                        {stage.count}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                        {max > 0 ? Math.round((stage.count / max) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function AnalyticsPage({ leads }: Props) {
    const total = leads.length
    const hot = leads.filter(l => l.score === 'hot').length
    const warm = leads.filter(l => l.score === 'warm').length
    const cold = leads.filter(l => l.score === 'cold').length
    const unscored = leads.filter(l => l.score === 'unscored').length
    const newLeads = leads.filter(l => l.status === 'new').length
    const qualified = leads.filter(l => l.status === 'qualified').length
    const contacted = leads.filter(l => l.status === 'contacted').length
    const closed = leads.filter(l => l.status === 'closed').length
    const convRate = total > 0 ? Math.round((closed / total) * 100) : 0
    const qualRate = total > 0 ? Math.round(((total - unscored) / total) * 100) : 0
    const hotPct = total > 0 ? Math.round((hot / total) * 100) : 0

    const funnelStages: FunnelStage[] = [
        { label: 'New', count: newLeads, color: 'rgba(139,148,163,0.65)' },
        { label: 'Qualified', count: qualified, color: 'rgba(99,102,241,0.75)' },
        { label: 'Contacted', count: contacted, color: 'rgba(245,158,11,0.78)' },
        { label: 'Closed', count: closed, color: 'rgba(16,185,129,0.82)' },
    ]

    return (
        <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Analytics</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Pipeline performance and lead conversion insights</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                <StatCard label="Total leads" value={total} sub="in pipeline" color="#4f46e5" />
                <StatCard label="Conversion rate" value={`${convRate}%`} sub="leads closed" color="#059669" />
                <StatCard label="Qualification rate" value={`${qualRate}%`} sub="scored by agents" color="#d97706" />
                <StatCard label="Hot leads" value={hot} sub={`${hotPct}% of pipeline`} color="#dc2626" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 'var(--border-radius-xl)', padding: '1.25rem 1.25rem 1.5rem', boxShadow: '0 4px 24px rgba(31,38,135,0.08)' }}>
                    <h3 style={{ margin: '0 0 1.25rem', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Lead score breakdown</h3>
                    {total === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No leads yet — add your first lead</p>
                        </div>
                    ) : (
                        <DonutChart hot={hot} warm={warm} cold={cold} unscored={unscored} total={total} />
                    )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 'var(--border-radius-xl)', padding: '1.25rem', boxShadow: '0 4px 24px rgba(31,38,135,0.08)' }}>
                    <h3 style={{ margin: '0 0 1.25rem', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Conversion funnel</h3>
                    {total === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No leads yet — add your first lead</p>
                        </div>
                    ) : (
                        <TrapezoidFunnel stages={funnelStages} />
                    )}
                </div>
            </div>
        </div>
    )
}