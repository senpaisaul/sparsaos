import { useEffect, useState } from 'react'
import type { Lead } from './types/index.ts'
import { getLeads, deleteLead, updateLeadStatus } from './api/client.ts'
import LeadsTable from './components/LeadsTable'
import AgentModal from './components/AgentModal'
import AddLeadModal from './components/AddLeadModal'
import AgentsPage from './components/AgentsPage'
import AnalyticsPage from './components/AnalyticsPage'

type Tab = 'pipeline' | 'agents' | 'analytics'

function SparsaLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#111" />
      <circle cx="14" cy="9" r="2.5" fill="white" opacity="0.95" />
      <circle cx="8" cy="20" r="2.2" fill="white" opacity="0.8" />
      <circle cx="20" cy="20" r="2.2" fill="white" opacity="0.8" />
      <line x1="14" y1="11.5" x2="8" y2="17.8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="14" y1="11.5" x2="20" y2="17.8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8" y1="20" x2="20" y2="20" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  )
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [agentLead, setAgentLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('pipeline')

  const fetchLeads = async () => {
    try { setLeads(await getLeads()) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLeads() }, [])

  const handleDelete = async (id: number) => {
    await deleteLead(id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  const handleStatusChange = async (id: number, status: string) => {
    const updated = await updateLeadStatus(id, status)
    setLeads(prev => prev.map(l => l.id === id ? updated : l))
  }

  const hot = leads.filter(l => l.score === 'hot').length
  const closed = leads.filter(l => l.status === 'closed').length
  const convRate = leads.length > 0 ? Math.round((closed / leads.length) * 100) : 0

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--grey-50)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--grey-200)', padding: '0 2rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <SparsaLogo />
              <div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.4px' }}>SparsaOS</span>
                <span style={{ fontSize: '10px', color: 'var(--grey-400)', letterSpacing: '0.5px', textTransform: 'uppercase', marginLeft: '7px' }}>Agentic CRM</span>
              </div>
            </div>
            <div style={{ width: '1px', height: '22px', background: 'var(--grey-200)', margin: '0 4px' }} />
            {(['pipeline', 'agents', 'analytics'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: activeTab === tab ? 600 : 400, background: activeTab === tab ? 'var(--black)' : 'transparent', color: activeTab === tab ? 'var(--white)' : 'var(--grey-500)', border: 'none', textTransform: 'capitalize' }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {[
              { label: 'Total', value: leads.length },
              { label: 'Hot leads', value: hot },
              { label: 'Conversion', value: `${convRate}%` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.8px', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--grey-400)', marginTop: '2px', letterSpacing: '0.3px' }}>{s.label}</div>
              </div>
            ))}
            <button
              onClick={() => setShowAddModal(true)}
              style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--black)', color: 'var(--white)', fontSize: '13px', fontWeight: 600 }}
            >
              + Add lead
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'pipeline' && (
          loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2.5px solid var(--grey-200)', borderTopColor: 'var(--black)', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: 'var(--grey-400)' }}>Loading leads...</p>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
              <LeadsTable leads={leads} onRunAgents={setAgentLead} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            </div>
          )
        )}
        {activeTab === 'agents' && <AgentsPage leads={leads} />}
        {activeTab === 'analytics' && <AnalyticsPage leads={leads} />}
      </main>

      {agentLead && (
        <AgentModal
          lead={agentLead}
          onClose={() => setAgentLead(null)}
          onComplete={fetchLeads}
        />
      )}

      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onLeadCreated={lead => { setLeads(prev => [lead, ...prev]); setShowAddModal(false) }}
        />
      )}
    </div>
  )
}