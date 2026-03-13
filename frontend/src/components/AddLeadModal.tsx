import { useState } from 'react'
import { createLead } from '../api/client.ts'
import type { Lead } from '../types/index.ts'

interface Props {
    onClose: () => void
    onLeadCreated: (lead: Lead) => void
}

export default function AddLeadModal({ onClose, onLeadCreated }: Props) {
    const [form, setForm] = useState({ name: '', company: '', email: '', message: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (!form.name || !form.company || !form.email || !form.message) {
            setError('All fields are required')
            return
        }
        setLoading(true)
        try {
            const lead = await createLead(form)
            onLeadCreated(lead)
        } catch {
            setError('Failed to create lead. Is the backend running?')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderRadius: 'var(--border-radius-xl)', border: '1px solid rgba(255,255,255,0.65)', padding: '1.75rem', width: '100%', maxWidth: '460px', boxShadow: '0 24px 64px rgba(31,38,135,0.2), inset 0 1px 0 rgba(255,255,255,0.8)', animation: 'fade-up 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Add new lead</h2>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Agents will qualify and score automatically</p>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)', padding: '5px 10px', color: 'var(--text-secondary)' }}>✕</button>
            </div>

            {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--border-radius-md)', padding: '10px 14px', marginBottom: '1rem' }}>
                    <p style={{ margin: 0, color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{error}</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                {(['name', 'company'] as const).map(f => (
                    <div key={f}>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, textTransform: 'capitalize' }}>{f}</label>
                        <input type="text" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} placeholder={`Enter ${f}`} />
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@company.com" />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600 }}>Message</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4} style={{ resize: 'vertical' }} placeholder="What's their pain point? Who are they? What's the urgency?" />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '9px 16px' }}>Cancel</button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none', padding: '9px 22px', fontWeight: 700, minWidth: '120px', boxShadow: '0 4px 16px rgba(139,92,246,0.35)', borderRadius: 'var(--border-radius-md)', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                    {loading ? 'Creating...' : 'Create lead'}
                </button>
            </div>
        </div>
    )
}