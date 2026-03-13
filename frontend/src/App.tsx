import { useEffect, useRef, useState } from 'react'
import type { Lead } from './types/index.ts'
import { getLeads, deleteLead, updateLeadStatus } from './api/client.ts'
import KanbanBoard from './components/KanbanBoard'
import AgentDrawer from './components/AgentDrawer'
import AddLeadModal from './components/AddLeadModal'
import AgentsPage from './components/AgentsPage'
import AnalyticsPage from './components/AnalyticsPage'

type Tab = 'pipeline' | 'agents' | 'analytics'

function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const vs = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0,1);}`

    const fs = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;

vec3 palette(float t){
  vec3 a=vec3(0.85,0.82,0.95);
  vec3 b=vec3(0.25,0.20,0.35);
  vec3 c=vec3(0.90,0.85,1.00);
  vec3 d=vec3(0.00,0.15,0.40);
  return a+b*cos(6.28318*(c*t+d));
}

float sdS(vec3 p,float r){return length(p)-r;}

float scene(vec3 p){
  float t=u_time*0.18;
  float s1=sdS(p-vec3(sin(t)*1.2,cos(t*0.7)*0.8,cos(t)*1.0),0.55);
  float s2=sdS(p-vec3(cos(t*0.8)*1.4,sin(t*1.1)*0.6,sin(t*0.5)*1.2),0.42);
  float s3=sdS(p-vec3(sin(t*1.3+2.0)*1.0,cos(t*0.6+1.0)*1.1,sin(t*0.9)*0.9),0.38);
  float s4=sdS(p-vec3(cos(t*0.5+3.0)*1.6,sin(t*1.4)*0.5,cos(t*1.1+2.0)*0.7),0.30);
  float s5=sdS(p-vec3(sin(t*0.9+1.5)*0.8,cos(t*1.2+0.8)*1.3,sin(t*0.7+2.5)*1.1),0.25);
  return min(min(min(min(s1,s2),s3),s4),s5);
}

vec3 normal(vec3 p){
  float e=0.001;
  return normalize(vec3(
    scene(p+vec3(e,0,0))-scene(p-vec3(e,0,0)),
    scene(p+vec3(0,e,0))-scene(p-vec3(0,e,0)),
    scene(p+vec3(0,0,e))-scene(p-vec3(0,0,e))
  ));
}

void main(){
  vec2 uv=(gl_FragCoord.xy-u_res*0.5)/min(u_res.x,u_res.y);
  vec3 ro=vec3(0,0,3.5);
  vec3 rd=normalize(vec3(uv,-1.2));
  vec3 col=vec3(0.94,0.92,0.97);
  float d=0.0;
  for(int i=0;i<64;i++){
    vec3 p=ro+rd*d;
    float h=scene(p);
    if(h<0.001){
      vec3 n=normal(p);
      vec3 light=normalize(vec3(sin(u_time*0.3)*2.0,2.0+cos(u_time*0.2),2.0));
      float diff=max(dot(n,light),0.0);
      vec3 refl=reflect(-light,n);
      float spec=pow(max(dot(refl,-rd),0.0),48.0);
      float fresnel=pow(1.0-max(dot(n,-rd),0.0),3.0);
      vec3 baseCol=palette(length(p)*0.4+u_time*0.08);
      col=baseCol*(0.15+diff*0.5)+vec3(1.0)*spec*0.9+vec3(0.85,0.80,1.0)*fresnel*0.6;
      float ao=1.0-float(i)/64.0;
      col*=0.6+0.4*ao;
      break;
    }
    d+=h;
    if(d>8.0)break;
  }
  col=mix(col,vec3(0.93,0.91,0.97),0.35);
  gl_FragColor=vec4(col,1.0);
}`

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const timeLoc = gl.getUniformLocation(prog, 'u_time')
    const resLoc = gl.getUniformLocation(prog, 'u_res')

    let raf: number
    const start = performance.now()
    const render = () => {
      gl.uniform1f(timeLoc, (performance.now() - start) / 1000)
      gl.uniform2f(resLoc, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    render()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} id="bg-canvas" />
}

function SparsaLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#logoGrad)" opacity="0.9" />
      <rect x="0.5" y="0.5" width="35" height="35" rx="9.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
      <circle cx="18" cy="11" r="3.5" fill="white" opacity="0.95" />
      <circle cx="10.5" cy="24" r="3" fill="white" opacity="0.85" />
      <circle cx="25.5" cy="24" r="3" fill="white" opacity="0.85" />
      <line x1="18" y1="14.5" x2="10.5" y2="21" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="14.5" x2="25.5" y2="21" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10.5" y1="24" x2="25.5" y2="24" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  )
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('pipeline')

  const fetchLeads = async () => {
    try { setLeads(await getLeads()) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLeads() }, [])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'pipeline') setSelectedLead(null)
  }

  const handleDelete = async (id: number) => {
    await deleteLead(id)
    setLeads(prev => prev.filter(l => l.id !== id))
    if (selectedLead?.id === id) setSelectedLead(null)
  }

  const handleStatusChange = async (id: number, status: string) => {
    const updated = await updateLeadStatus(id, status)
    setLeads(prev => prev.map(l => l.id === id ? updated : l))
  }

  const hotLeads = leads.filter(l => l.score === 'hot').length
  const closed = leads.filter(l => l.status === 'closed').length
  const convRate = leads.length > 0 ? Math.round((closed / leads.length) * 100) : 0

  const headerStyle: React.CSSProperties = {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    background: 'rgba(255,255,255,0.22)',
    borderBottom: '1px solid rgba(255,255,255,0.4)',
    padding: '0 1.5rem',
    flexShrink: 0,
    boxShadow: '0 1px 24px rgba(31,38,135,0.08)',
  }

  return (
    <>
      <ThreeBackground />
      <div id="app-root">
        <header style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <SparsaLogo />
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', letterSpacing: '-0.4px', lineHeight: 1 }}>SparsaOS</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '1px' }}>Agentic CRM</div>
              </div>
              <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.3)', margin: '0 6px' }} />
              {(['pipeline', 'agents', 'analytics'] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  style={{
                    fontSize: '12px', padding: '5px 12px', boxShadow: 'none',
                    fontWeight: activeTab === tab ? 600 : 400,
                    background: activeTab === tab ? 'rgba(139,92,246,0.15)' : 'transparent',
                    color: activeTab === tab ? '#7c3aed' : 'var(--text-muted)',
                    border: activeTab === tab ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              {[
                { label: 'Total leads', value: leads.length, color: 'var(--text-primary)' },
                { label: 'Hot leads', value: hotLeads, color: '#dc2626' },
                { label: 'Conversion', value: `${convRate}%`, color: '#059669' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.4px', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
              <button
                onClick={() => setShowModal(true)}
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none', fontWeight: 700, fontSize: '13px', padding: '10px 20px', letterSpacing: '0.1px', boxShadow: '0 4px 20px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.25)', borderRadius: 'var(--border-radius-md)' }}
              >
                + Add lead
              </button>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'pipeline' && (
              loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading leads...</p>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, padding: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <KanbanBoard leads={leads} onRunAgents={setSelectedLead} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                </div>
              )
            )}
            {activeTab === 'agents' && <AgentsPage leads={leads} />}
            {activeTab === 'analytics' && <AnalyticsPage leads={leads} />}
          </div>

          {activeTab === 'pipeline' && selectedLead && (
            <AgentDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onComplete={fetchLeads} />
          )}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,10,30,0.45)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <AddLeadModal onClose={() => setShowModal(false)} onLeadCreated={lead => { setLeads(prev => [lead, ...prev]); setShowModal(false) }} />
          </div>
        )}
      </div>
    </>
  )
}