import { supabase } from '../../supabaseClient'

export default function PaywallScreen({ user, onSubscribed }) {
  async function openRazorpay(planLabel, amount) {
    const options = {
      key:         'rzp_live_YOUR_KEY_HERE',
      amount:      amount * 100,
      currency:    'INR',
      name:        'Goa Roulette Tracker',
      description: planLabel,
      prefill:     { email: user?.email },
      theme:       { color: '#d4af37' },
      handler: async (response) => {
        await supabase.from('subscriptions').upsert({
          user_id:    user.id,
          plan:       planLabel,
          payment_id: response.razorpay_payment_id,
          active:     true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        onSubscribed()
      },
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1a1a1a', border:'2px solid #d4af37', borderRadius:'14px', padding:'32px 24px', maxWidth:'360px', width:'90%', textAlign:'center' }}>
        <div style={{ fontSize:'2rem', marginBottom:'8px' }}>🎰</div>
        <div style={{ fontSize:'1.2rem', fontWeight:900, color:'#d4af37', marginBottom:'6px' }}>Subscribe to Continue</div>
        <div style={{ fontSize:'0.75rem', color:'#888', marginBottom:'24px', lineHeight:1.6 }}>Your free trial has ended. Choose a plan to keep tracking.</div>
        {[
          { label:'Basic',      amount:299, desc:'Web only · 30 sessions' },
          { label:'Pro',        amount:599, desc:'Web + Mobile · Unlimited' },
          { label:'Casino Pro', amount:999, desc:'Everything + PDF export' },
        ].map(plan => (
          <button key={plan.label} onClick={() => openRazorpay(plan.label, plan.amount)}
            style={{ width:'100%', background:'#1a1a1a', border:'1px solid #d4af37', borderRadius:'8px', color:'#fff', padding:'14px', marginBottom:'10px', cursor:'pointer', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:800, color:'#d4af37' }}>{plan.label}</div>
              <div style={{ fontSize:'0.7rem', color:'#888' }}>{plan.desc}</div>
            </div>
            <div style={{ fontWeight:900, fontSize:'1.1rem' }}>₹{plan.amount}<span style={{ fontSize:'0.65rem', color:'#888' }}>/mo</span></div>
          </button>
        ))}
        <button onClick={() => supabase.auth.signOut()} style={{ background:'none', border:'none', color:'#555', fontSize:'0.7rem', cursor:'pointer', marginTop:'8px' }}>Sign out</button>
      </div>
    </div>
  )
}
