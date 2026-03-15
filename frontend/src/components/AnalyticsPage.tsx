import { useEffect, useRef } from 'react'
import type { Lead } from '../types/index.ts'

interface Props { leads: Lead[] }

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
    return (
        <div style={{ background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--grey-400)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontSize: '30px', fontWeight: 800, color: 'var(--black)', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '12px', color: 'var(--grey-400)', marginTop: '6px' }}>{sub}</p>
        </div>
    )
}

function DonutChart({ hot, warm, cold, unscored, total }: { hot: number; warm: number; cold: number; unscored: number; total: number }) {
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
                    backgroundColor: total === 0 ? ['#f0f0f0'] : ['#dc2626', '#d97706', '#2563eb', '#e5e7eb'],
                    borderColor: total === 0 ? ['#e4e4e4'] : ['#dc2626', '#d97706', '#2563eb', '#d1d5db'],
                    borderWidth: 1.5,
                    hoverOffset: 6,
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '72%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: total > 0,
                        backgroundColor: '#111', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.7)',
                        padding: 10, cornerRadius: 8,
                        callbacks: { label: (ctx: any) => ` ${ctx.parsed} leads · ${Math.round((ctx.parsed / total) * 100)}%` },
                    },
                },
                animation: { animateRotate: true, duration: 800 },
            },
        })
    }, [hot, warm, cold, unscored, total])

    const legendItems = [
        { label: 'Hot', count: hot, color: '#dc2626' },
        { label: 'Warm', count: warm, color: '#d97706' },
        { label: 'Cold', count: cold, color: '#2563eb' },
        { label: 'Unscored', count: unscored, color: '#9ca3af' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                <canvas ref={canvasRef} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '34px', fontWeight: 800, color: 'var(--black)', letterSpacing: '-2px', lineHeight: 1 }}>{total}</span>
                    <span style={{ fontSize: '11px', color: 'var(--grey-400)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '3px' }}>leads</span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 28px', width: '100%' }}>
                {legendItems.map(item => {
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                    return (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'var(--grey-600)', flex: 1 }}>{item.label}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--black)' }}>{item.count}</span>
                            <span style={{ fontSize: '12px', color: 'var(--grey-400)', minWidth: '34px', textAlign: 'right' }}>{pct}%</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function TrapezoidFunnel({ stages }: { stages: { label: string; count: number; color: string; textColor: string }[] }) {
    const max = Math.max(stages[0]?.count ?? 1, 1)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {stages.map((stage, i) => {
                const widthPct = Math.round(35 + (stage.count / max) * 60)
                const prev = i > 0 ? stages[i - 1].count : null
                const drop = prev !== null && prev > 0 ? Math.round((1 - stage.count / prev) * 100) : null
                return (
                    <div key={stage.label}>
                        {drop !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', justifyContent: 'center' }}>
                                <div style={{ height: '1px', width: '36px', background: 'var(--grey-200)' }} />
                                <span style={{ fontSize: '10px', color: 'var(--grey-400)', fontWeight: 600 }}>{drop > 0 ? `▼ ${drop}% drop-off` : '▶ no drop-off'}</span>
                                <div style={{ height: '1px', width: '36px', background: 'var(--grey-200)' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: `${widthPct}%`, background: stage.color, borderRadius: i === 0 ? '10px 10px 4px 4px' : i === stages.length - 1 ? '4px 4px 10px 10px' : '4px', padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'width 0.5s ease', minWidth: '130px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: stage.textColor, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.9 }}>{stage.label}</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 800, color: stage.textColor }}>{stage.count}</span>
                                    <span style={{ fontSize: '11px', color: stage.textColor, opacity: 0.65 }}>{max > 0 ? Math.round((stage.count / max) * 100) : 0}%</span>
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

    return (
        <div style={{ padding: '2rem', overflowY: 'auto', height: '100%' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.5px' }}>Analytics</h2>
                <p style={{ fontSize: '13px', color: 'var(--grey-400)', marginTop: '4px' }}>Pipeline performance and conversion insights</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '2rem' }}>
                <StatCard label="Total leads" value={total} sub="in pipeline" />
                <StatCard label="Conversion rate" value={`${convRate}%`} sub="leads closed" />
                <StatCard label="Qualification rate" value={`${qualRate}%`} sub="scored by agents" />
                <StatCard label="Hot leads" value={hot} sub="high value" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--black)', marginBottom: '1.5rem' }}>Score breakdown</h3>
                    {total === 0 ? <p style={{ color: 'var(--grey-300)', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>No leads yet</p>
                        : <DonutChart hot={hot} warm={warm} cold={cold} unscored={unscored} total={total} />}
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--black)', marginBottom: '1.5rem' }}>Conversion funnel</h3>
                    {total === 0 ? <p style={{ color: 'var(--grey-300)', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>No leads yet</p>
                        : <TrapezoidFunnel stages={[
                            { label: 'New', count: newLeads, color: '#e5e7eb', textColor: '#374151' },
                            { label: 'Qualified', count: qualified, color: '#dbeafe', textColor: '#1e40af' },
                            { label: 'Contacted', count: contacted, color: '#fef3c7', textColor: '#92400e' },
                            { label: 'Closed', count: closed, color: '#d1fae5', textColor: '#065f46' },
                        ]} />
                    }
                </div>
            </div>
        </div>
    )
}