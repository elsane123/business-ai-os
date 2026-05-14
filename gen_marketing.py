# -*- coding: utf-8 -*-
output = open('/a0/usr/projects/business_ai_os/marketing.html', 'w', encoding='utf-8')
output.write("""<!DOCTYPE html>
<html lang=\"fr\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>Business AI OS — L'IA qui pilote votre entreprise</title>
  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">
  <style>
    :root {
      --bg:#0a0a0f; --bg2:#111118; --bg3:#16161f; --card:#1a1a28;
      --border:#2a2a40; --indigo:#6366f1; --violet:#8b5cf6;
      --indigo-light:#818cf8; --violet-light:#a78bfa;
      --text:#e2e8f0; --muted:#94a3b8;
      --green:#10b981; --amber:#f59e0b; --red:#ef4444;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
    nav{position:sticky;top:0;z-index:100;background:rgba(10,10,15,.9);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);padding:0 2.5rem;display:flex;align-items:center;justify-content:space-between;height:66px}
    .logo{font-size:1.15rem;font-weight:800;background:linear-gradient(135deg,var(--indigo-light),var(--violet-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .nav-links{display:flex;gap:2rem;align-items:center}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:.88rem;transition:color .2s}
    .nav-links a:hover{color:var(--text)}
    .btn-nav{background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;border:none;padding:.5rem 1.25rem;border-radius:8px;font-size:.88rem;font-weight:600;cursor:pointer;text-decoration:none}
    @media(max-width:640px){.nav-links .hide-sm{display:none}}
    .hero{text-align:center;padding:8rem 2rem 5rem;position:relative;overflow:hidden}
    .glow{position:absolute;top:-180px;left:50%;transform:translateX(-50%);width:900px;height:600px;background:radial-gradient(ellipse,rgba(99,102,241,.2) 0%,transparent 68%);pointer-events:none}
    .badge{display:inline-block;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.4);color:var(--indigo-light);padding:.3rem 1rem;border-radius:999px;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:1.5rem}
    .hero h1{font-size:clamp(2.6rem,5.5vw,4.2rem);font-weight:800;letter-spacing:-.035em;line-height:1.08;margin-bottom:1.5rem}
    .grad{background:linear-gradient(135deg,var(--indigo-light),var(--violet-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .hero>p{font-size:1.15rem;color:var(--muted);max-width:580px;margin:0 auto 2.5rem}
    .hero-cta{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:4rem}
    .btn-primary{background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;border:none;padding:.85rem 2rem;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;text-decoration:none;box-shadow:0 4px 24px rgba(99,102,241,.35);transition:transform .2s,box-shadow .2s;display:inline-block}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(99,102,241,.5)}
    .btn-secondary{background:transparent;color:var(--text);border:1px solid var(--border);padding:.85rem 2rem;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;text-decoration:none;transition:border-color .2s,background .2s;display:inline-block}
    .btn-secondary:hover{border-color:var(--indigo);background:rgba(99,102,241,.07)}
    .focus-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;max-width:390px;margin:0 auto;text-align:left;box-shadow:0 24px 64px rgba(0,0,0,.55);position:relative;z-index:1}
    .fc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;font-size:.8rem;color:var(--muted)}
    .pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    .fc-title{font-weight:700;font-size:.92rem;margin-bottom:.9rem}
    .fc-stat{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.22);border-radius:8px;padding:.6rem .9rem;margin-bottom:.85rem;font-size:.87rem}
    .fc-stat strong{color:var(--indigo-light)}
    .fc-item{display:flex;gap:.7rem;align-items:flex-start;padding:.65rem .75rem;border-radius:8px;background:var(--bg3);border:1px solid var(--border);font-size:.83rem;margin-bottom:.45rem}
    .dot{width:9px;height:9px;border-radius:50%;margin-top:3px;flex-shrink:0}
    .d-r{background:var(--red)}.d-a{background:var(--amber)}.d-g{background:var(--green)}
    section{padding:6rem 2rem}
    .s-alt{background:var(--bg2)}
    .container{max-width:1100px;margin:0 auto}
    .stag{font-size:.73rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--indigo-light);margin-bottom:.65rem}
    .stitle{font-size:clamp(1.75rem,3vw,2.6rem);font-weight:800;letter-spacing:-.025em;line-height:1.12;margin-bottom:.9rem}
    .ssub{color:var(--muted);font-size:.98rem;max-width:540px;margin-bottom:3.5rem}
    .grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:1.4rem}
    .fcard{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.85rem;transition:border-color .25s,transform .25s}
    .fcard:hover{border-color:var(--indigo);transform:translateY(-3px)}
    .ficon{width:46px;height:46px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:1.35rem;margin-bottom:1.15rem}
    .bi{background:rgba(99,102,241,.14)}.bv{background:rgba(139,92,246,.14)}.be{background:rgba(16,185,129,.14)}.ba{background:rgba(245,158,11,.14)}.br{background:rgba(244,63,94,.14)}.bs{background:rgba(14,165,233,.14)}
    .fcard h3{font-size:1rem;font-weight:700;margin-bottom:.45rem}
    .fcard p{color:var(--muted);font-size:.86rem;line-height:1.65}
    .flist{list-style:none;margin-top:1rem;display:flex;flex-direction:column;gap:.38rem}
    .flist li{font-size:.82rem;color:var(--muted);display:flex;align-items:flex-start;gap:.45rem}
    .flist li::before{content:'\u2713';color:var(--green);font-weight:700;flex-shrink:0}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}
    @media(max-width:780px){.g2,.agents-grid,.flows{grid-template-columns:1fr}}
    .code-block{background:var(--bg3);border:1px solid var(--border);border-radius:13px;padding:1.4rem;font-family:'JetBrains Mono','Fira Code',monospace;font-size:.78rem;line-height:1.85;overflow-x:auto}
    .cp{color:var(--indigo-light)}.ck{color:var(--violet-light)}.cv{color:var(--green)}.cm{color:var(--muted)}.cw{color:var(--amber)}
    .pill-list{display:flex;flex-direction:column;gap:.9rem;margin-top:1.75rem}
    .pill{display:flex;gap:1rem;align-items:flex-start;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:.9rem 1.15rem}
    .picon{font-size:1.2rem;flex-shrink:0;margin-top:1px}
    .pill h4{font-size:.9rem;font-weight:700;margin-bottom:.18rem}
    .pill p{font-size:.81rem;color:var(--muted)}
    .agents-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem;margin-bottom:2rem}
    .acard{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:1.5rem;text-align:center;transition:border-color .2s}
    .acard:hover{border-color:var(--violet)}
    .aicon{font-size:2rem;margin-bottom:.65rem}
    .acard h3{font-size:.92rem;font-weight:700;margin-bottom:.35rem}
    .acard p{font-size:.8rem;color:var(--muted)}
    .flows{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem}
    .flow-item{background:rgba(99,102,241,.07);border:1px solid rgba(99,102,241,.2);border-radius:10px;padding:1rem;font-size:.82rem;color:var(--muted)}
    .flow-item strong{color:var(--indigo-light);display:block;margin-bottom:.25rem;font-size:.8rem}
    .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.2rem}
    .pcard{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.75rem;display:flex;flex-direction:column;gap:.9rem;transition:transform .25s,border-color .25s;position:relative}
    .pcard:hover{transform:translateY(-3px);border-color:var(--indigo)}
    .pcard.featured{border-color:var(--indigo);background:linear-gradient(160deg,rgba(99,102,241,.1),rgba(139,92,246,.07))}
    .pop-tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;font-size:.68rem;font-weight:700;padding:.2rem .85rem;border-radius:999px;white-space:nowrap}
    .plan-name{font-size:.82rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em}
    .plan-price{font-size:2.1rem;font-weight:800;letter-spacing:-.03em;line-height:1.1}
    .plan-price sup{font-size:1rem;vertical-align:super;font-weight:600}
    .plan-price .mo{font-size:.82rem;font-weight:500;color:var(--muted)}
    .plan-desc{font-size:.8rem;color:var(--muted)}
    .plan-feats{list-style:none;display:flex;flex-direction:column;gap:.42rem;flex:1}
    .plan-feats li{font-size:.8rem;color:var(--muted);display:flex;align-items:flex-start;gap:.4rem}
    .plan-feats li::before{content:'\u2713';color:var(--green);font-weight:700;flex-shrink:0}
    .plan-feats li.no{opacity:.45}
    .plan-feats li.no::before{content:'\u2715';color:var(--border)}
    .btn-plan{background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;border:none;padding:.65rem 1rem;border-radius:9px;font-size:.85rem;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;transition:opacity .2s;display:block}
    .btn-plan:hover{opacity:.85}