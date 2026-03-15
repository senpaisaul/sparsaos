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
            onLeadCreated(await createLead(form))
        } catch {
            setError('Failed to create lead. Is the backend running?')
        } finally {
            setLoading(false)
        }
    }

    const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--grey-500)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
            <input
                type={type}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', color: 'var(--black)' }}
                onFocus={e => e.target.style.borderColor = 'var(--black)'}
                onBlur={e => e.target.style.borderColor = 'var(--grey-200)'}
            />
        </div>
    )

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fade-in 0.15s ease' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'slide-up 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.4px' }}>Add new lead</h2>
                        <p style={{ fontSize: '13px', color: 'var(--grey-500)', marginTop: '3px' }}>Agents will qualify and score automatically</p>
                    </div>
                    <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--grey-100)', color: 'var(--grey-700)', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '16px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--hot)', fontWeight: 500 }}>{error}</p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    {field('Name', 'name', 'text', 'Jane Smith')}
                    {field('Company', 'company', 'text', 'Acme Corp')}
                </div>
                {field('Email', 'email', 'email', 'jane@acme.com')}

                <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--grey-500)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '6px' }}>Message</label>
                    <textarea
                        value={form.message}
                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        rows={4}
                        placeholder="What's their pain point, urgency, context?"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', color: 'var(--black)', resize: 'vertical' }}
                        onFocus={e => e.target.style.borderColor = 'var(--black)'}
                        onBlur={e => e.target.style.borderColor = 'var(--grey-200)'}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--grey-100)', color: 'var(--grey-700)', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', background: 'var(--black)', color: 'var(--white)', fontSize: '13px', fontWeight: 600 }}>
                        {loading ? 'Creating...' : 'Create lead'}
                    </button>
                </div>
            </div>
        </div>
    )
}