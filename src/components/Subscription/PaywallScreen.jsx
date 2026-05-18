import { supabase } from '../../supabaseClient'

// ── YOUR PAYMENT DETAILS — update these ─────────────────────────
const UPI_ID    = 'yourname@upi'        // e.g. mayank@okicici
const UPI_NAME  = 'Mayank'              // your name
const AMOUNT    = '499'                 // price in ₹
const WHATSAPP  = '919999999999'        // your WhatsApp number with country code
// ────────────────────────────────────────────────────────────────

export default function PaywallScreen({ user }) {
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${AMOUNT}&cu=INR`
  const whatsappMsg = encodeURIComponent(
    `Hi, I have paid ₹${AMOUNT} for Goa Roulette Tracker.\nMy email: ${user?.email}\nPlease activate my account.`
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'#1a1a1a', border:'2px solid #d4af37', borderRadius:'14px', padding:'28px 24px', maxWidth:'380px', width:'100%', textAlign:'center' }}>

        {/* Header */}
        <div style={{ fontSize:'2rem', marginBottom:'8px' }}>🎰</div>
        <div style={{ fontSize:'1.2rem', fontWeight:900, color:'#d4af37', marginBottom:'6px' }}>
          Activate Your Account
        </div>
        <div style={{ fontSize:'0.75rem', color:'#888', marginBottom:'24px', lineHeight:1.7 }}>
          Pay <strong style={{ color:'#fff' }}>₹{AMOUNT}/month</strong> to get full access.<br/>
          Send payment screenshot on WhatsApp to activate.
        </div>

        {/* Price box */}
        <div style={{ background:'#111', border:'1px solid #333', borderRadius:'10px', padding:'16px', marginBottom:'20px' }}>
          <div style={{ fontSize:'2rem', fontWeight:900, color:'#d4af37' }}>₹{AMOUNT}</div>
          <div style={{ fontSize:'0.7rem', color:'#888', marginTop:'2px' }}>per month — full access</div>
          <div style={{ marginTop:'12px', fontSize:'0.75rem', color:'#aaa', lineHeight:1.8 }}>
            ✅ Unlimited sessions<br/>
            ✅ Cloud sync<br/>
            ✅ All pattern analysis<br/>
            ✅ One device lock
          </div>
        </div>

        {/* UPI ID */}
        <div style={{ background:'#111', border:'1px solid #444', borderRadius:'8px', padding:'12px', marginBottom:'12px' }}>
          <div style={{ fontSize:'0.65rem', color:'#888', marginBottom:'4px' }}>PAY TO UPI ID</div>
          <div style={{ fontSize:'1rem', fontWeight:900, color:'#fff', letterSpacing:'0.5px' }}>{UPI_ID}</div>
          <div style={{ fontSize:'0.7rem', color:'#d4af37', marginTop:'2px' }}>{UPI_NAME}</div>
        </div>

        {/* Pay via UPI app button */}
        <a href={upiLink}
          style={{ display:'block', background:'#d4af37', color:'#000', borderRadius:'8px', padding:'14px', fontWeight:900, fontSize:'1rem', textDecoration:'none', marginBottom:'10px' }}>
          💳 Pay ₹{AMOUNT} via UPI App
        </a>

        {/* WhatsApp button */}
        <a href={`https://wa.me/${WHATSAPP}?text=${whatsappMsg}`} target="_blank" rel="noreferrer"
          style={{ display:'block', background:'#25D366', color:'#fff', borderRadius:'8px', padding:'14px', fontWeight:900, fontSize:'0.9rem', textDecoration:'none', marginBottom:'20px' }}>
          📲 Send Payment Screenshot on WhatsApp
        </a>

        {/* User email */}
        <div style={{ fontSize:'0.65rem', color:'#555', marginBottom:'16px' }}>
          Logged in as: {user?.email}
        </div>

        {/* Steps */}
        <div style={{ background:'#111', borderRadius:'8px', padding:'12px', textAlign:'left', fontSize:'0.72rem', color:'#888', lineHeight:2 }}>
          <div>1️⃣ Pay ₹{AMOUNT} to UPI ID above</div>
          <div>2️⃣ Click WhatsApp button above</div>
          <div>3️⃣ Send payment screenshot</div>
          <div>4️⃣ Get activated within 1 hour</div>
          <div>5️⃣ Refresh this page to access app</div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ background:'none', border:'none', color:'#444', fontSize:'0.65rem', cursor:'pointer', marginTop:'16px' }}>
          Sign out
        </button>

      </div>
    </div>
  )
}
