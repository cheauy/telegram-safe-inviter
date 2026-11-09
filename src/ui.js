export const UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Tenh Gram · Telegram Safe Inviter</title>
<meta name="theme-color" content="#16537e" />
<meta name="application-name" content="Tenh Gram" />
<meta name="apple-mobile-web-app-title" content="Tenh Gram" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="256x256" href="/logo.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root{
    --bg:#ffffff;
    --canvas:#f4f6f9;
    --line:#e3e8ef;
    --line-strong:#c9d2de;
    --text:#0b1220;
    --text-2:#4b5a6e;
    --muted:#7a8aa0;
    --text-3:#94a3b8;
    --brand:#16537e;
    --brand-hover:#0e4568;
    --brand-600:#0f4a73;
    --brand-700:#0d3f61;
    --brand-50:#eef5fa;
    --brand-100:#d6e6f3;
    --brand-strong:#0e4568;
    --brand-soft:#e8f0f6;
    --brand-line:#c7dbe9;
    --surface:#ffffff;
    --surface-2:#f8fafc;
    --ok:#0f7a4d;
    --ok-bg:#e6f4ec;
    --warn:#9a6206;
    --warn-bg:#fdf3e0;
    --bad:#b42318;
    --bad-bg:#fdecea;
    --amber-dot:#d97706;
    --radius:10px;
    --radius-lg:14px;
    --green:#12805c;
    --green-50:#eaf7f2;
    --green-100:#c4ead9;
    --amber:#a8680a;
    --amber-50:#fef6e6;
    --amber-100:#f5dfae;
    --red:#c23b4b;
    --red-50:#fff1f2;
    --red-100:#f7ced3;
    --shadow-sm:0 1px 2px rgba(11,18,32,.05);
    --shadow:0 1px 3px rgba(11,18,32,.06),0 8px 24px rgba(11,18,32,.06);
    --ease:cubic-bezier(.22,.72,.22,1);
    --side-w:250px;
    --side-collapsed-w:76px;
    --footer-h:42px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:var(--canvas);color:var(--text);font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  button,input,select,textarea{font:inherit}
  button{cursor:pointer}
  svg{flex-shrink:0}

  /* Keyframes */
  @keyframes fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  @keyframes rowSlide{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
  @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(18,128,92,.45)}70%{box-shadow:0 0 0 8px rgba(18,128,92,0)}100%{box-shadow:0 0 0 0 rgba(18,128,92,0)}}
  @keyframes arrowFloat{0%,100%{transform:translateX(0);opacity:.6}50%{transform:translateX(3px);opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes toastPop{from{opacity:0;transform:translateY(14px) scale(.95)}to{opacity:1;transform:none}}

  .panel-anim{animation:fadeSlide .26s var(--ease)}
  .row-anim{animation:rowSlide .22s var(--ease) both}

  /* Auth Gate Screen */
  .auth-gate{
    min-height:100vh;
    display:none;
    align-items:center;
    justify-content:center;
    padding:28px 18px 72px;
    background:var(--canvas);
  }
  .auth-card{
    width:100%;max-width:440px;
    background:var(--bg);
    border:1px solid var(--line);
    border-radius:16px;
    box-shadow:var(--shadow);
    overflow:hidden;
    animation:fadeSlide .3s var(--ease);
  }
  .auth-head{
    padding:24px 24px 16px;
    border-bottom:1px solid var(--line);
    text-align:center;
  }
  .auth-logo{
    width:48px;height:48px;border-radius:12px;
    background:transparent;overflow:hidden;
    display:grid;place-items:center;
    margin:0 auto 12px;
    box-shadow:0 10px 24px rgba(15,23,42,.15);
  }
  .auth-logo img{width:100%;height:100%;object-fit:cover;display:block}
  .auth-head h1{font-size:20px;font-weight:700;letter-spacing:-.02em}
  .auth-head p{font-size:13px;color:var(--text-2);margin-top:4px}
  .auth-switch{
    display:grid;grid-template-columns:1fr 1fr;gap:6px;
    margin:18px 26px 0;
    padding:4px;border-radius:11px;
    background:var(--canvas);border:1px solid var(--line);
  }
  .auth-tab{
    padding:8px 12px;border-radius:8px;border:none;background:transparent;
    font-size:13px;font-weight:600;color:var(--text-2);
    transition:all .16s var(--ease);
  }
  .auth-tab.active{background:#fff;color:var(--brand);box-shadow:var(--shadow-sm)}
  .auth-body{padding:18px 24px 24px;display:grid;gap:12px}
  .auth-note{
    display:flex;align-items:flex-start;gap:9px;
    padding:10px 12px;border-radius:10px;
    background:var(--brand-50);border:1px solid var(--brand-100);
    font-size:12px;color:var(--text-2);
  }

  /* App Shell */
  .shell{display:none;min-height:100vh}

  /* Left Collapsible Sidebar (Clean single-line menu + toggle icon-only) */
  .sidebar{
    width:var(--side-w);
    flex-shrink:0;
    background:var(--bg);
    border-right:1px solid var(--line);
    display:flex;
    flex-direction:column;
    position:sticky;
    top:0;
    height:calc(100vh - var(--footer-h));
    z-index:40;
    transition:width .24s var(--ease);
    overflow:visible;
  }
  body.side-collapsed .sidebar{width:var(--side-collapsed-w)}

  .side-top{
    padding:14px 14px;
    border-bottom:1px solid var(--line);
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    min-height:64px;
  }
  body.side-collapsed .side-top{flex-direction:column;justify-content:center;gap:10px;padding:12px 10px}

  .brand{display:flex;align-items:center;gap:11px;min-width:0;text-decoration:none;color:var(--text)}
  .brand-mark{
    width:38px;height:38px;border-radius:10px;
    background:transparent;overflow:hidden;
    display:grid;place-items:center;
    box-shadow:0 4px 12px rgba(15,23,42,.12);
    transition:transform .2s var(--ease);
    flex-shrink:0;
  }
  .brand-mark img{width:100%;height:100%;object-fit:cover;display:block}
  .brand:hover .brand-mark{transform:scale(1.05) rotate(-4deg)}
  .brand-name{font-size:16px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}
  body.side-collapsed .brand-name{display:none}

  .toggle-btn{
    width:34px;height:34px;border-radius:9px;
    border:1px solid var(--line);
    background:#fff;color:var(--text-2);
    display:grid;place-items:center;
    transition:all .18s var(--ease);
    flex-shrink:0;
  }
  .toggle-btn:hover{background:var(--brand);border-color:var(--brand);color:#fff;box-shadow:0 4px 12px rgba(22,83,126,.2)}
  .toggle-btn svg{transition:transform .24s var(--ease)}
  body.side-collapsed .toggle-btn svg{transform:rotate(180deg)}

  .side-nav{padding:14px 10px;flex:1;overflow-y:auto;overflow-x:visible;display:flex;flex-direction:column;gap:5px}
  body.side-collapsed .side-nav{padding:14px 12px;align-items:center}

  .nav-group-label{
    font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
    color:var(--muted);padding:10px 10px 4px;white-space:nowrap;
  }
  body.side-collapsed .nav-group-label{
    width:24px;height:1px;padding:0;margin:8px 0 6px;
    background:var(--line);color:transparent;overflow:hidden;
  }

  .nav-btn{
    position:relative;
    width:100%;
    display:flex;align-items:center;gap:11px;
    padding:9px 10px;
    border-radius:10px;
    border:1px solid transparent;
    background:transparent;
    color:var(--text-2);
    text-align:left;
    font-size:13.5px;font-weight:600;
    transition:all .18s var(--ease);
  }
  .nav-ico{
    width:32px;height:32px;border-radius:9px;
    display:grid;place-items:center;
    background:var(--canvas);color:var(--text-2);
    border:1px solid var(--line);
    transition:all .18s var(--ease);
    flex-shrink:0;
  }
  .nav-btn:hover{background:var(--brand-50);color:var(--brand)}
  .nav-btn:hover .nav-ico{background:#fff;border-color:var(--brand-100);color:var(--brand)}
  .nav-btn.active{
    background:var(--brand-50);
    border-color:var(--brand-100);
    color:var(--brand);
    box-shadow:var(--shadow-sm);
  }
  .nav-btn.active .nav-ico{background:var(--brand);border-color:var(--brand);color:#fff}

  .nav-title{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nav-badge{
    font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;
    background:#fff;border:1px solid var(--line);color:var(--brand);flex-shrink:0;
  }
  .nav-dot{width:8px;height:8px;border-radius:50%;background:var(--amber);flex-shrink:0}
  .nav-dot.ok{background:var(--green)}

  /* Icon-only collapsed menu styles + hover tooltip */
  body.side-collapsed .nav-btn{width:48px;height:48px;padding:0;justify-content:center}
  body.side-collapsed .nav-title{display:none}
  body.side-collapsed .nav-ico{width:38px;height:38px;border-radius:10px}
  body.side-collapsed .nav-badge{
    position:absolute;top:2px;right:2px;padding:0 5px;font-size:10px;line-height:15px;min-width:16px;text-align:center;
  }
  body.side-collapsed .nav-dot{
    position:absolute;top:7px;right:7px;box-shadow:0 0 0 2px #fff;
  }
  body.side-collapsed .nav-btn::after,
  body.side-collapsed .logout-btn::after{
    content:attr(data-tip);
    position:absolute;left:calc(100% + 12px);top:50%;
    transform:translateY(-50%) translateX(-4px);
    background:#0f172a;color:#fff;font-size:12px;font-weight:600;
    padding:6px 11px;border-radius:8px;white-space:nowrap;
    opacity:0;pointer-events:none;
    box-shadow:0 8px 20px rgba(15,23,42,.2);
    transition:opacity .15s,transform .15s;
    z-index:60;
  }
  body.side-collapsed .nav-btn:hover::after,
  body.side-collapsed .logout-btn:hover::after{opacity:1;transform:translateY(-50%) translateX(0)}

  .side-foot{
    padding:12px 10px 14px;
    border-top:1px solid var(--line);
    display:grid;gap:8px;
  }
  body.side-collapsed .side-foot{padding:12px;justify-items:center}

  .user-box{
    display:flex;align-items:center;gap:10px;
    padding:9px 10px;border-radius:10px;
    background:var(--canvas);border:1px solid var(--line);
  }
  .user-av{
    width:32px;height:32px;border-radius:9px;
    background:var(--brand);color:#fff;
    font-size:12px;font-weight:700;
    display:grid;place-items:center;flex-shrink:0;
  }
  .user-meta{min-width:0;flex:1}
  .user-name{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .user-email{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  body.side-collapsed .user-box{padding:5px;border-radius:11px}
  body.side-collapsed .user-meta{display:none}
  body.side-collapsed .logout-btn{position:relative;width:46px;height:40px;padding:0}
  body.side-collapsed .logout-btn span.lbl{display:none}

  /* Main Area */
  .main-col{flex:1;min-width:0;display:flex;flex-direction:column}

  .topbar{
    background:rgba(255,255,255,.92);backdrop-filter:blur(10px);
    border-bottom:1px solid var(--line);
    padding:12px 24px;
    display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;
    position:sticky;top:0;z-index:20;
  }
  .top-left{display:flex;align-items:center;gap:12px;min-width:0}
  .top-title{font-size:16.5px;font-weight:800;letter-spacing:-.015em}
  .top-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}

  .sync-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:12px;font-weight:600;color:var(--text-2)}
  .sync-pill.live{background:var(--green-50);border-color:var(--green-100);color:var(--green)}
  .live-dot{width:8px;height:8px;border-radius:50%;background:#b4becb;display:inline-block;flex-shrink:0}
  .live-dot.pulsing{background:var(--green);animation:pulseRing 2s infinite}
  .live-dot.ok{background:var(--green)}
  .live-dot.warn{background:var(--amber)}
  .live-dot.err{background:var(--red)}

  /* Buttons — Primary White + #16537e Hover */
  .btn{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    height:38px;padding:0 15px;border-radius:8px;
    font-weight:600;font-size:13px;
    border:1px solid var(--line-strong);
    background:#fff;color:var(--text);
    box-shadow:var(--shadow-sm);
    transition:background .18s var(--ease),color .18s var(--ease),border-color .18s var(--ease),box-shadow .18s var(--ease),transform .12s var(--ease);
    white-space:nowrap;
  }
  .btn:hover:not(:disabled){background:var(--brand-hover);border-color:var(--brand-hover);color:#fff;box-shadow:0 6px 16px rgba(22,83,126,.22);transform:translateY(-1px)}
  .btn:active:not(:disabled){transform:translateY(0)}
  .btn:disabled{opacity:.5;cursor:not-allowed}
  .btn-primary{border-color:var(--brand);color:var(--brand);background:#fff}
  .btn-sm{height:32px;padding:0 12px;font-size:12px;border-radius:8px}
  .btn-lg{height:44px;padding:0 20px;font-size:13.5px}
  .btn-full{width:100%}

  .workspace{max-width:1180px;width:100%;margin:0 auto;padding:20px 24px 88px}

  /* Clickable 4 KPI Cards */
  .kpi-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:22px}
  .kpi{
    background:var(--bg);border:1px solid var(--line);border-radius:12px;
    padding:14px 16px;text-align:left;
    box-shadow:var(--shadow-sm);
    transition:all .18s var(--ease);
    display:flex;align-items:center;gap:13px;
  }
  .kpi:hover{border-color:var(--brand);transform:translateY(-2px);box-shadow:var(--shadow)}
  .kpi-ico{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
  .kpi-ico.blue{background:var(--brand-50);color:var(--brand)}
  .kpi-ico.green{background:var(--green-50);color:var(--green)}
  .kpi-ico.red{background:var(--red-50);color:var(--red)}
  .kpi-ico.amber{background:var(--amber-50);color:var(--amber)}
  .kpi-label{font-size:12px;font-weight:600;color:var(--text-2)}
  .kpi-val{font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1.15;margin-top:2px}
  .kpi-arrow{margin-left:auto;color:var(--muted);opacity:.55;transition:transform .16s}
  .kpi:hover .kpi-arrow{opacity:1;color:var(--brand);transform:translateX(2px)}

  /* Single Focused Feature Layout */
  .focus-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr);gap:16px;align-items:start}
  .grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}

  .card{background:var(--bg);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);overflow:hidden}
  .card-head{padding:16px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:13px}
  .card-ico{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
  .card-ico.brand{background:var(--brand-50);color:var(--brand)}
  .card-ico.green{background:var(--green-50);color:var(--green)}
  .card-ico.amber{background:var(--amber-50);color:var(--amber)}
  .card-title{font-size:15px;font-weight:700;letter-spacing:-.02em}
  .pill{margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:4px 11px;border-radius:999px;white-space:nowrap}
  .pill-green{background:var(--green-50);color:var(--green);border:1px solid var(--green-100)}
  .pill-amber{background:var(--amber-50);color:var(--amber);border:1px solid var(--amber-100)}
  .pill-red{background:var(--red-50);color:var(--red);border:1px solid var(--red-100)}
  .card-body{padding:20px;display:grid;gap:14px}

  /* Visual Stepper */
  .stepper{
    display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:8px;align-items:center;
    padding:12px 14px;border-radius:12px;background:var(--canvas);border:1px solid var(--line);
  }
  .step-node{display:flex;align-items:center;gap:9px;min-width:0}
  .step-ico{width:28px;height:28px;border-radius:8px;background:#fff;border:1px solid var(--brand-100);color:var(--brand);display:grid;place-items:center;flex-shrink:0}
  .step-node b{display:block;font-size:12px;line-height:1.2}
  .step-node small{display:block;font-size:11px;color:var(--muted)}
  .step-sep{color:var(--brand);animation:arrowFloat 1.8s ease-in-out infinite}

  /* Icon Inputs */
  label.field{display:block;font-size:12.5px;font-weight:600;color:var(--text)}
  label.field span.hint{font-weight:400;color:var(--muted);margin-left:4px}
  .in-wrap{position:relative;margin-top:6px}
  .in-wrap .in-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;transition:color .15s}
  .in-wrap input{
    width:100%;padding:10px 12px 10px 38px;
    border:1px solid var(--line-strong);border-radius:8px;
    background:#fff;color:var(--text);outline:none;transition:border-color .15s,box-shadow .15s;
  }
  .in-wrap input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-100)}
  .in-wrap:focus-within .in-ico{color:var(--brand)}
  .pw-eye{
    position:absolute;right:8px;top:50%;transform:translateY(-50%);
    width:28px;height:28px;border:none;background:transparent;color:var(--muted);
    display:grid;place-items:center;border-radius:6px;
  }
  .pw-eye:hover{color:var(--brand);background:var(--brand-50)}
  select.plain-select{
    width:100%;margin-top:6px;padding:10px 12px;
    border:1px solid var(--line-strong);border-radius:8px;background:#fff;color:var(--text);outline:none;
  }
  select.plain-select:focus,textarea.bulk-area:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-100)}
  textarea.bulk-area{
    width:100%;min-height:132px;margin-top:6px;padding:11px 13px;resize:vertical;
    border:1px solid var(--line-strong);border-radius:8px;background:#fff;color:var(--text);
    outline:none;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.5;
    transition:border-color .15s,box-shadow .15s;
  }
  .file-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 13px;border:1px dashed var(--line-strong);border-radius:10px;background:var(--canvas)}
  .bulk-stats{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}

  /* Visual Mode Cards */
  .mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
  .mode-opt{
    padding:11px 13px;border-radius:11px;border:1.5px solid var(--line);
    background:#fff;text-align:left;display:flex;align-items:center;gap:10px;
    transition:all .16s var(--ease);
  }
  .mode-opt:hover{border-color:var(--brand);background:var(--brand-50)}
  .mode-opt.active{border-color:var(--brand);background:var(--brand-50);box-shadow:0 0 0 3px var(--brand-100)}
  .mode-opt-ico{width:28px;height:28px;border-radius:8px;background:#fff;border:1px solid var(--line);color:var(--brand);display:grid;place-items:center;flex-shrink:0}
  .mode-opt.active .mode-opt-ico{background:var(--brand);border-color:var(--brand);color:#fff}
  .mode-opt b{display:block;font-size:12.5px}
  .mode-opt small{display:block;font-size:11px;color:var(--text-2);margin-top:1px}

  /* Companion Feature List */
  .feat-list{display:grid;gap:11px}
  .feat-item{display:flex;align-items:flex-start;gap:11px;padding:11px 13px;border-radius:11px;background:var(--canvas);border:1px solid var(--line)}
  .feat-ico{width:32px;height:32px;border-radius:9px;background:#fff;border:1px solid var(--line);color:var(--brand);display:grid;place-items:center;flex-shrink:0}
  .feat-item.ok .feat-ico{color:var(--green);border-color:var(--green-100);background:var(--green-50)}
  .feat-item b{display:block;font-size:13px}
  .feat-item p{font-size:12px;color:var(--text-2);margin-top:1px}

  /* Safety Quota Cards */
  .meters{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .meter{padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--canvas)}
  .meter-top{display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:var(--text-2);margin-bottom:7px}
  .meter-top span{display:inline-flex;align-items:center;gap:5px}
  .meter-top b{font-size:13px;color:var(--text)}
  .bar{height:6px;background:#e4ebf2;border-radius:999px;overflow:hidden}
  .bar i{display:block;height:100%;background:var(--brand);border-radius:999px;transition:width .4s var(--ease)}
  .bar i.warn{background:var(--amber)}
  .bar i.danger{background:var(--red)}

  .result-box{padding:13px 14px;border-radius:11px;border:1px solid var(--brand-100);background:var(--brand-50);font-size:13px;display:none;animation:fadeSlide .2s var(--ease)}
  .result-box.show{display:block}
  .result-box.ok{background:var(--green-50);border-color:var(--green-100);color:#0f5c43}
  .result-box.err{background:var(--red-50);border-color:var(--red-100);color:var(--red)}
  .link-row{display:flex;align-items:center;gap:8px;margin-top:9px;background:#fff;padding:7px 10px;border-radius:9px;border:1px solid var(--green-100)}
  .link-row code{font-family:ui-monospace,Consolas,monospace;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}

  /* UNIFIED STATUS & ACTIVITY MENU */
  .status-tabs{display:flex;align-items:center;gap:8px;padding:16px 20px;border-bottom:1px solid var(--line);background:#fff;flex-wrap:wrap}
  .stab{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--text-2);font-size:12.5px;font-weight:600;transition:all .16s var(--ease)}
  .stab:hover{background:var(--brand);border-color:var(--brand);color:#fff}
  .stab.active{background:var(--brand);border-color:var(--brand);color:#fff;box-shadow:0 4px 12px rgba(22,83,126,.18)}
  .stab .cnt{font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;background:var(--canvas);color:var(--text)}
  .stab.active .cnt,.stab:hover .cnt{background:rgba(255,255,255,.22);color:#fff}

  .toolbar{display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--line);background:var(--canvas);flex-wrap:wrap}
  .search-box{position:relative;flex:1;min-width:220px}
  .search-box svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}
  .search-box input{width:100%;padding:0 12px 0 34px;height:36px;border:1px solid var(--line-strong);border-radius:9px;background:#fff;font-size:13px;outline:none}
  .search-box input:focus{border-color:var(--brand)}
  .table-wrap{overflow-x:auto;max-height:560px}
  thead th{position:sticky;top:0;z-index:1}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{padding:11px 18px;background:#fafbfd;border-bottom:1px solid var(--line);text-align:left;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
  td{padding:13px 18px;border-bottom:1px solid var(--line);vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#fafcfe}

  .who{display:flex;align-items:center;gap:10px}
  .av{width:34px;height:34px;border-radius:9px;background:var(--brand-50);color:var(--brand);font-weight:700;font-size:12px;display:grid;place-items:center;flex-shrink:0}
  .av.green{background:var(--green-50);color:var(--green)}
  .av.red{background:var(--red-50);color:var(--red)}
  .av.amber{background:var(--amber-50);color:var(--amber)}
  .who-name{font-weight:600}
  .who-sub{font-size:11.5px;color:var(--muted)}

  .tag{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap}
  .tag-green{background:var(--green-50);color:var(--green);border:1px solid var(--green-100)}
  .tag-red{background:var(--red-50);color:var(--red);border:1px solid var(--red-100)}
  .tag-amber{background:var(--amber-50);color:var(--amber);border:1px solid var(--amber-100)}
  .tag-brand{background:var(--brand-50);color:var(--brand);border:1px solid var(--brand-100)}

  .empty{padding:46px 24px;text-align:center;color:var(--text-2)}
  .empty-ico{width:58px;height:58px;border-radius:15px;background:var(--brand-50);color:var(--brand);display:grid;place-items:center;margin:0 auto 12px}
  .empty h3{font-size:15.5px;color:var(--text);margin-bottom:4px}
  .empty p{font-size:13px;max-width:430px;margin:0 auto 16px}

  .check-row{display:flex;align-items:center;gap:12px;padding:11px 13px;border:1px solid var(--line);border-radius:10px;background:var(--canvas)}
  .check-row b{display:block;font-size:13px}
  .guide-note{padding:11px 13px;border-radius:10px;background:var(--brand-50);border:1px solid var(--brand-100);font-size:12.5px;color:var(--text-2);display:flex;gap:9px;align-items:center}
  .guide-note b{color:var(--brand)}
  .divider{height:1px;background:var(--line)}

  /* Clean Switchable Integrate Hub — mockup-matched (Integrate Telegram only) */
  .int-layout{display:grid;grid-template-columns:minmax(0,1fr) 318px;gap:14px;max-width:1240px;align-items:start}
  .int-main{display:grid;gap:14px;min-width:0}
  .int-rail{display:grid;gap:14px;align-content:start;min-width:0}
  #intRailBot{display:grid;gap:14px;align-content:start}
  .int-switch{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .int-tab{
    display:flex;align-items:center;gap:12px;padding:12px 14px;
    border-radius:var(--radius-lg);border:1.5px solid var(--line);
    background:#fff;text-align:left;box-shadow:var(--shadow-sm);
    transition:all .18s var(--ease);
  }
  .int-tab:hover{border-color:var(--brand);transform:translateY(-1px)}
  .int-tab.active{border-color:var(--brand);background:var(--brand-soft);box-shadow:inset 0 0 0 1px var(--brand)}
  .int-tab-ico{width:36px;height:36px;border-radius:10px;background:var(--canvas);border:1px solid var(--line);color:var(--text-2);display:grid;place-items:center;flex-shrink:0}
  .int-tab.active .int-tab-ico{background:var(--brand);border-color:var(--brand);color:#fff}
  .int-tab-title{font-size:14px;font-weight:700;color:var(--text)}
  .int-tab-tag{margin-left:auto;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap}
  .status-strip{display:flex;gap:10px;flex-wrap:wrap}
  .status-chip{
    flex:1;min-width:190px;display:flex;align-items:center;gap:9px;
    padding:9px 12px;border-radius:10px;border:1px solid var(--line);
    background:var(--canvas);font-size:12.5px;font-weight:600;color:var(--text);
  }
  /* Integrate setup stepper + permission checklist + listener choice */
.stepper-4{grid-template-columns:1fr auto 1fr auto 1fr auto 1fr}
.step-node.step-cta{background:none;border:none;padding:0;font:inherit;color:var(--text);text-align:left;cursor:pointer;border-radius:8px}
.step-node.step-cta:hover .step-ico{background:var(--brand);color:#fff;border-color:var(--brand)}
.step-node.current .step-ico{background:var(--brand);border-color:var(--brand);color:#fff}
.step-node.done .step-ico{background:var(--ok-bg);border-color:var(--ok-bg);color:var(--ok)}
#menu-integrate .card-title{font-size:14.5px}
#menu-integrate .btn{font-size:13.5px}
#menu-integrate .btn-sm{font-size:12px}
#menu-integrate .btn-primary{font-weight:800}
#menu-integrate input,#menu-integrate select,#menu-integrate textarea{border-radius:9px}
#menu-integrate .in-wrap input:focus,#menu-integrate textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-soft)}
#menu-integrate .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
#menu-integrate .pw-eye{width:auto;height:28px;padding:0 9px;font-size:12px;font-weight:700}
#menu-integrate #cfgBotToken{padding-right:66px}
#menu-integrate textarea{width:100%;min-height:74px;margin-top:6px;padding:10px 12px;resize:vertical;border:1px solid var(--line-strong);background:#fff;color:var(--text);outline:none;line-height:1.5;transition:border-color .15s,box-shadow .15s}
.int-step{display:grid;gap:10px;padding-top:14px;border-top:1px solid var(--line)}
.int-step:first-child{padding-top:0;border-top:none}
.int-step-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.int-step-head h4{font-size:13.5px;font-weight:700;letter-spacing:-.01em}
.int-state{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--canvas);border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.int-state.ok{background:var(--ok-bg);border-color:var(--ok-bg);color:var(--ok)}
.int-state.locked{background:var(--warn-bg);border-color:var(--warn-bg);color:var(--warn)}
.int-step.locked{opacity:.55}
.int-hint{font-size:12px;color:var(--muted)}
.int-checks{display:grid;gap:8px}
.int-check-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.int-check-head b{font-size:12.5px}
.int-check{display:flex;align-items:center;gap:11px;padding:10px 13px;border:1px solid var(--line);border-radius:10px;background:var(--canvas)}
.int-check b{display:block;font-size:13px}
.int-check span{display:block;font-size:12px;color:var(--text-2);margin-top:1px}
.int-check.ok{border-color:var(--green-100);background:var(--green-50)}
.int-check.ok span{color:#0f5c43}
.int-check.warn{border-color:var(--amber-100);background:var(--amber-50)}
.int-check.warn span{color:var(--amber)}
.int-check.err{border-color:var(--red-100);background:var(--red-50)}
.int-check.err span{color:var(--red)}
.int-check .perm-tag{display:inline-block;margin-left:auto;font-size:10.5px;font-weight:800;letter-spacing:.04em;color:var(--muted);white-space:nowrap}
.int-check .perm-tag.req{color:var(--warn)}
.int-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mode-btn{display:grid;gap:2px;width:100%;text-align:left;padding:11px 12px;border:1.5px solid var(--line);border-radius:11px;background:#fff;font-size:13px;font-weight:700;color:var(--text);transition:all .16s var(--ease)}
.mode-btn small{font-size:11.5px;font-weight:600;color:var(--text-2)}
.mode-btn:hover:not(:disabled){border-color:var(--brand)}
.mode-btn:disabled{opacity:.55;cursor:not-allowed}
#listenerPollCard.active .mode-btn,#listenerHookCard.active .mode-btn{border-color:var(--brand);background:var(--brand-soft);box-shadow:0 0 0 3px var(--brand-soft)}
.callout-amber{padding:10px 12px;border-radius:10px;background:var(--warn-bg);border:1px solid var(--amber-100);font-size:12.5px;font-weight:600;color:#7a4d05}
.callout-neutral{padding:10px 12px;border-radius:10px;background:var(--canvas);border:1px solid var(--line);font-size:12.5px;color:var(--text-2)}
.listener-note{font-size:12px;color:var(--text-2)}
.int-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.int-actions .note{margin-left:auto;font-size:12px;color:var(--muted)}
.adv-details{border:1px solid var(--line);border-radius:11px;background:var(--canvas);padding:10px 14px}
  .adv-details summary{cursor:pointer;font-size:12.5px;font-weight:600;color:var(--brand);list-style:none;display:flex;align-items:center;gap:7px}
  .adv-details summary::-webkit-details-marker{display:none}
  .adv-details[open] summary{margin-bottom:12px}
.flow-list{list-style:none;display:grid}
.flow-list li{display:flex;align-items:center;gap:11px;padding:9px 2px}
.flow-list li + li{border-top:1px solid var(--line)}
.flow-num{width:24px;height:24px;border-radius:50%;background:var(--brand-soft);color:var(--brand);font-size:12px;font-weight:800;display:grid;place-items:center;flex-shrink:0}
.flow-list b{font-size:13px;font-weight:600}
.vs-row{display:grid;gap:3px;padding:10px 2px}
.vs-row + .vs-row{border-top:1px solid var(--line)}
.vs-row b{font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--brand)}
.vs-row span{font-size:13px;color:var(--text-2)}

  /* Saved Group Profile Bar */
  .group-bar{
    background:var(--bg);border:1px solid var(--line);border-radius:14px;
    padding:12px 16px;margin-bottom:18px;box-shadow:var(--shadow-sm);
    display:flex;align-items:center;gap:14px;flex-wrap:wrap;
  }
  .group-profile{display:flex;align-items:center;gap:12px;min-width:220px;flex:1}
  .group-avatar{
    width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0;
    background:var(--brand-50);border:1.5px solid var(--brand-100);color:var(--brand);
    display:grid;place-items:center;font-size:15px;font-weight:700;
  }
  .group-avatar img{width:100%;height:100%;object-fit:cover;display:block}
  .group-meta{min-width:0}
  .group-name-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .group-name{font-size:13.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
  .group-handle{font-size:12px;color:var(--text-2);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px}
  .group-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .group-select{
    height:34px;padding:0 10px;border-radius:9px;border:1px solid var(--line-strong);
    background:#fff;color:var(--text);font-size:12.5px;font-weight:600;min-width:190px;max-width:280px;outline:none;
  }
  .group-select:focus{border-color:var(--brand)}
  .group-add-drawer{
    width:100%;display:none;padding-top:12px;margin-top:2px;border-top:1px solid var(--line);
    gap:8px;align-items:center;flex-wrap:wrap;
  }
  .group-add-drawer.open{display:flex;animation:fadeSlide .18s var(--ease)}
  /* Group bar moved into the left menu: vertical card, full-width controls */
  .side-group{padding:0 12px 12px}
  .sidebar .group-bar{flex-direction:column;align-items:stretch;margin:0;padding:12px;gap:10px;box-shadow:none}
  .sidebar .group-profile{min-width:0;flex:none}
  .sidebar .group-name{max-width:170px}
  .sidebar .group-controls{flex-direction:column;align-items:stretch}
  .sidebar .group-select{min-width:0;max-width:none;width:100%}
  .sidebar .group-add-drawer{padding-top:10px}
  body.side-collapsed .side-group{display:none}

  /* VIP Expiry Controls */
  .vip-box{
    padding:12px 14px;border-radius:12px;border:1px solid var(--brand-100);
    background:var(--brand-50);display:grid;gap:10px;
  }
  .vip-head{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:var(--brand)}
  .vip-toggle{
    display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--text);
    padding:9px 11px;border-radius:9px;background:#fff;border:1px solid var(--line-strong);margin-top:6px;cursor:pointer;
  }
  .vip-toggle input{width:15px;height:15px;accent-color:var(--brand);cursor:pointer}

  /* Multi-Account Pool List */
  .pool-list{display:grid;gap:9px}
  .pool-row{
    display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:11px;
    border:1px solid var(--line);background:var(--canvas);flex-wrap:wrap;
  }
  .pool-info{flex:1;min-width:160px}
  .pool-info b{display:block;font-size:13px;color:var(--text)}
  .pool-info span{display:block;font-size:11.5px;color:var(--text-2)}
  .pool-banner{
    display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
    padding:9px 12px;border-radius:10px;border:1px solid var(--brand-100);background:var(--brand-50);
    font-size:12.5px;font-weight:600;color:var(--brand);
  }

  /* Fixed Footer & Legal Dialog */
  .site-footer{
    position:fixed;bottom:0;left:0;right:0;z-index:45;
    min-height:var(--footer-h);padding:0 24px;
    background:rgba(255,255,255,.94);backdrop-filter:blur(10px);
    border-top:1px solid var(--line);
    display:flex;align-items:center;justify-content:space-between;gap:14px;
    font-size:12px;color:var(--text-2);
  }
  .footer-copy{font-weight:500;display:flex;align-items:center;gap:6px;white-space:nowrap}
  .footer-links{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .footer-link{
    border:none;background:transparent;padding:4px 8px;border-radius:7px;
    font-size:12px;font-weight:600;color:var(--text-2);
    transition:all .15s var(--ease);
  }
  .footer-link:hover{background:var(--brand-50);color:var(--brand)}
  .footer-sep{color:var(--line-strong);user-select:none}

  .legal-overlay{
    position:fixed;inset:0;z-index:80;
    background:rgba(15,23,42,.45);backdrop-filter:blur(3px);
    display:none;align-items:center;justify-content:center;padding:20px;
  }
  .legal-overlay.open{display:flex;animation:fadeSlide .18s var(--ease)}
  .legal-card{
    width:100%;max-width:540px;background:#fff;border:1px solid var(--line);
    border-radius:16px;box-shadow:0 22px 54px rgba(15,23,42,.22);overflow:hidden;
  }
  .legal-head{
    padding:16px 20px;border-bottom:1px solid var(--line);
    display:flex;align-items:center;justify-content:space-between;gap:12px;
  }
  .legal-head h2{font-size:15.5px;font-weight:700;color:var(--text)}
  .legal-close{
    width:32px;height:32px;border-radius:8px;border:1px solid var(--line);
    background:#fff;color:var(--text-2);display:grid;place-items:center;
    transition:all .15s var(--ease);
  }
  .legal-close:hover{background:var(--brand);border-color:var(--brand);color:#fff}
  .legal-body{padding:20px;display:grid;gap:12px;font-size:13px;color:var(--text-2);line-height:1.6;max-height:65vh;overflow-y:auto}
  .legal-body p b{color:var(--text)}
  .legal-foot{padding:13px 20px;border-top:1px solid var(--line);background:var(--canvas);display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--muted)}
  .help-steps{margin:0;padding-left:20px;display:grid;gap:10px;font-size:13px;color:var(--text-2);line-height:1.55}
  .help-steps li b{color:var(--text)}

  .toasts{position:fixed;bottom:56px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:70;max-width:360px}
  .toast{padding:11px 15px;border-radius:10px;background:#0f172a;color:#fff;font-size:13px;font-weight:500;box-shadow:0 10px 28px rgba(15,23,42,.22);animation:toastPop .2s var(--ease)}
  .toast.ok{background:var(--green)}
  .toast.err{background:var(--red)}

  @media(max-width:1060px){.kpi-strip{grid-template-columns:repeat(2,1fr)}.focus-grid,.grid-2{grid-template-columns:1fr}}
  @media(max-width:680px){
    .kpi-strip,.two,.mode-grid,.meters,.int-switch,.listener-grid{grid-template-columns:1fr}
    .stepper{grid-template-columns:1fr;gap:6px}
    .step-sep{display:none}
    .workspace{padding:16px 14px 92px}
    .topbar{padding:10px 14px}
    .sidebar{width:var(--side-collapsed-w)}
    .sidebar .brand-name,.sidebar .nav-title,.sidebar .nav-group-label{display:none}
    .sidebar .side-top{flex-direction:column;justify-content:center;gap:10px;padding:12px 10px}
    .sidebar .side-nav{padding:14px 12px;align-items:center}
    .sidebar .nav-btn{width:48px;height:48px;padding:0;justify-content:center}
    .sidebar .nav-ico{width:38px;height:38px;border-radius:10px}
    .sidebar .nav-badge{position:absolute;top:2px;right:2px;padding:0 5px;font-size:10px;line-height:15px;min-width:16px;text-align:center}
    .sidebar .nav-dot{position:absolute;top:7px;right:7px;box-shadow:0 0 0 2px #fff}
    .sidebar .side-foot{padding:12px;justify-items:center}
    .sidebar .user-box{padding:5px;border-radius:11px}
    .sidebar .user-meta{display:none}
    .sidebar .logout-btn{position:relative;width:46px;height:40px;padding:0}
    .sidebar .logout-btn span.lbl{display:none}
    .sidebar .side-group{display:none}
    .site-footer{padding:8px 14px;flex-wrap:wrap;justify-content:center;gap:4px 12px}
    .toasts{bottom:74px}
  }
  @media(max-width:1020px){
    #menu-integrate .int-layout{grid-template-columns:1fr}
    #menu-integrate .stepper-4{grid-template-columns:1fr 1fr;gap:10px}
    #menu-integrate .step-sep{display:none}
  }
  @media(max-width:760px){
    #menu-integrate .int-switch,#menu-integrate .int-modes{grid-template-columns:1fr}
    #menu-integrate .int-actions{flex-direction:column;align-items:stretch}
    #menu-integrate .int-actions .note{margin-left:0}
  }
  @media (prefers-reduced-motion: reduce){
    *{animation-duration:.01ms !important;transition-duration:.01ms !important}
  }
</style>
</head>
<body>
<!-- ============ AUTH GATE (SIGN IN / CREATE ACCOUNT FOR SAVED HISTORY) ============ -->
<section class="auth-gate" id="authGate">
  <div class="auth-card">
    <div class="auth-head">
      <div class="auth-logo">
        <img src="/logo.png" alt="Tenh Gram" />
      </div>
      <h1>Tenh Gram</h1>
      <p>Sign in or create an account to save your invite history &amp; Telegram workspace.</p>
    </div>

    <div class="auth-switch">
      <button class="auth-tab active" id="tabLogin" type="button" onclick="switchAuthTab('login')">Sign In</button>
      <button class="auth-tab" id="tabSignup" type="button" onclick="switchAuthTab('signup')">Create Account</button>
    </div>

    <form class="auth-body" id="authForm" onsubmit="submitAuth(event)">
      <div id="authNameWrap" style="display:none">
        <label class="field">Your Name
          <div class="in-wrap">
            <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input id="authName" placeholder="e.g. Sokha Store" autocomplete="name" />
          </div>
        </label>
      </div>

      <label class="field">Email Address
        <div class="in-wrap">
          <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          <input id="authEmail" type="email" placeholder="you@store.com" required autocomplete="email" />
        </div>
      </label>

      <label class="field">Password <span class="hint" id="pwHint"></span>
        <div class="in-wrap">
          <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input id="authPassword" type="password" placeholder="Enter your password" required autocomplete="current-password" style="padding-right:38px" />
          <button class="pw-eye" type="button" onclick="toggleAuthPw()" aria-label="Show password">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </label>

      <div id="authError" class="result-box err" aria-live="polite"></div>

      <button class="btn btn-primary btn-lg btn-full" id="authSubmitBtn" type="submit">Sign In &amp; Open Workspace</button>

      <div class="auth-note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" style="margin-top:2px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Every invite link, success log, failed block, and <b>Customer Leaved</b> event stays saved under your account for next time.</span>
      </div>
    </form>
  </div>
</section>

<!-- ============ AUTHENTICATED WORKSPACE ============ -->
<div class="shell" id="appShell">
  <aside class="sidebar" aria-label="Left menu">
    <div class="side-top">
      <a class="brand" href="#" onclick="openMenu('option1');return false;">
        <div class="brand-mark">
          <img src="/logo.png" alt="Tenh Gram" />
        </div>
        <div class="brand-name">Tenh Gram</div>
      </a>
      <button class="toggle-btn" id="sidebarToggle" type="button" onclick="toggleSidebar()" title="Collapse / Expand Left Menu" aria-label="Toggle Left Menu">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>
      </button>
    </div>

    <nav class="side-nav">
      <div class="nav-group-label">Invite Methods</div>

      <button class="nav-btn active" data-menu="option1" data-tip="Option 1 · Safe Link" onclick="openMenu('option1')">
        <span class="nav-ico">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </span>
        <span class="nav-title">Option 1 · Safe Link</span>
      </button>

      <button class="nav-btn" data-menu="option2" data-tip="Option 2 · Direct Invite" onclick="openMenu('option2')">
        <span class="nav-ico">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        </span>
        <span class="nav-title">Option 2 · Direct Invite</span>
      </button>

      <button class="nav-btn" data-menu="bulk" data-tip="Bulk CSV Queue" onclick="openMenu('bulk')">
        <span class="nav-ico">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </span>
        <span class="nav-title">Bulk CSV Queue</span>
        <span class="nav-badge" id="navQueueCount">0</span>
      </button>

      <div class="nav-group-label">Tracking &amp; Setup</div>

      <button class="nav-btn" data-menu="status" data-tip="Activity &amp; Status" onclick="openMenu('status')">
        <span class="nav-ico">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </span>
        <span class="nav-title">Activity &amp; Status</span>
        <span class="nav-badge" id="navTotalCount">0</span>
      </button>

      <button class="nav-btn" data-menu="integrate" data-tip="Integrate Telegram" onclick="openMenu('integrate')">
        <span class="nav-ico">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>
        </span>
        <span class="nav-title">Integrate Telegram</span>
        <span class="nav-dot" id="navIntDot"></span>
      </button>
    </nav>

    <div class="side-group" id="sideGroupWrap">
      <div class="nav-group-label">Group</div>
      <!-- ============ SAVED GROUPS / CHANNELS PROFILE DROPDOWN ============ -->
      <div class="group-bar" id="groupProfileBar">
        <div class="group-profile">
          <div class="group-avatar" id="groupAvatarWrap">TG</div>
          <div class="group-meta">
            <div class="group-name-row">
              <span class="group-name" id="groupProfileName">No Group Selected</span>
              <span class="tag tag-brand" id="groupProfileMembers">0 members</span>
              <span class="tag tag-green" id="groupProfileStatus" style="display:none">Admin Ready</span>
            </div>
            <div class="group-handle">
              <span id="groupProfileHandle">Select or save a Telegram group / channel</span>
            </div>
          </div>
        </div>
        <div class="group-controls">
          <select id="savedGroupSelect" class="group-select" onchange="selectSavedGroup(this.value)" aria-label="Saved Groups and Channels">
            <option value="">-- Select Saved Group --</option>
          </select>
          <button type="button" class="btn btn-sm" onclick="refreshActiveGroup()" title="Refresh member count &amp; photo">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            Refresh
          </button>
          <button type="button" class="btn btn-sm btn-primary" onclick="toggleAddGroupDrawer()">+ Save Group</button>
          <button type="button" class="btn btn-sm" id="removeGroupBtn" onclick="removeCurrentGroup()" style="display:none">Remove</button>
        </div>
        <div class="group-add-drawer" id="groupAddDrawer">
          <div class="in-wrap" style="margin-top:0;flex:1;min-width:220px">
            <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <input id="newGroupChatId" placeholder="-1001234567890 or @channel_username" />
          </div>
          <button type="button" class="btn btn-sm btn-primary" id="saveGroupBtn" onclick="saveNewGroup()">Fetch &amp; Save Profile</button>
          <button type="button" class="btn btn-sm" onclick="toggleAddGroupDrawer()">Cancel</button>
        </div>
      </div>

    </div>
    <div class="side-foot">
      <div class="user-box" id="userBox">
        <div class="user-av" id="userAvatar">U</div>
        <div class="user-meta">
          <div class="user-name" id="userNameLabel">Account</div>
          <div class="user-email" id="userEmailLabel">Saved workspace</div>
        </div>
      </div>
      <button class="btn btn-sm btn-full logout-btn" id="logoutBtn" type="button" data-tip="Sign Out" onclick="logout()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span class="lbl">Sign Out</span>
      </button>
    </div>
  </aside>

  <!-- RIGHT MAIN CONTENT -->
  <div class="main-col">
    <header class="topbar">
      <div class="top-left">
        <h2 class="top-title" id="topMenuTitle">Option 1 · Safe Invite Link</h2>
      </div>
      <div class="top-actions">
        <div class="sync-pill" id="syncPill">
          <span class="live-dot" id="syncDot"></span>
          <span id="syncLabel">Listener Off</span>
        </div>
        <button class="btn btn-sm" id="syncBtn" type="button" onclick="syncNow()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          Sync Events
        </button>
        <button class="btn btn-sm btn-primary" id="setupBtn" type="button" onclick="openMenu('integrate')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Telegram Setup
        </button>
      </div>
    </header>

    <main class="workspace">
      <!-- ============ PAGE 1: OPTION 1 ONLY ============ -->
      <section id="menu-option1" class="panel-anim">
        <div class="focus-grid">
          <article class="card">
            <div class="card-head">
              <div class="card-ico green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div class="card-title">Generate Bot Safe Invite Link</div>
              <span class="pill pill-green">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                100% Ban-Proof
              </span>
            </div>

            <form class="card-body" onsubmit="submitOption1(event)">
              <div class="stepper">
                <div class="step-node">
                  <span class="step-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
                  <b>1. Create Link</b>
                </div>
                <svg class="step-sep" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                <div class="step-node">
                  <span class="step-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></span>
                  <b>2. Customer Taps</b>
                </div>
                <svg class="step-sep" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                <div class="step-node">
                  <span class="step-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></span>
                  <b>3. Auto-Approved</b>
                </div>
              </div>

              <label class="field">Customer or Order Label
                <div class="in-wrap">
                  <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  <input id="o1Label" placeholder="e.g. Order #1049 or VIP Sokha" value="VIP Customer" required />
                </div>
              </label>

              <div>
                <label class="field">Link Mode</label>
                <input type="hidden" id="o1Mode" value="join_request" />
                <div class="mode-grid">
                  <button type="button" class="mode-opt active" data-mode="join_request" onclick="pickO1Mode('join_request')">
                    <span class="mode-opt-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
                    <b>Auto-Approve (Safest)</b>
                  </button>
                  <button type="button" class="mode-opt" data-mode="single_use" onclick="pickO1Mode('single_use')">
                    <span class="mode-opt-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="m9 11 3-3 3 3"/></svg></span>
                    <b>Single-Use Direct</b>
                  </button>
                </div>
              </div>

              <div class="two">
                <label class="field">Link Valid (Hours)
                  <div class="in-wrap">
                    <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <input id="o1Hours" type="number" min="1" max="720" value="168" />
                  </div>
                </label>
                <label class="field">Group or Channel ID <span class="hint">(optional)</span>
                  <div class="in-wrap">
                    <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <input id="o1Chat" placeholder="Uses active saved group" />
                  </div>
                </label>
              </div>

              <div class="vip-box">
                <div class="vip-head">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Paid / VIP Expiry Timer
                </div>
                <div class="two">
                  <label class="field">Membership Duration
                    <select id="o1VipDays" class="plain-select">
                      <option value="0">Permanent (No Expiry)</option>
                      <option value="7">7 Days VIP</option>
                      <option value="14">14 Days VIP</option>
                      <option value="30">30 Days VIP (1 Month)</option>
                      <option value="90">90 Days VIP (3 Months)</option>
                      <option value="180">180 Days VIP (6 Months)</option>
                      <option value="365">365 Days VIP (1 Year)</option>
                    </select>
                  </label>
                  <label class="field">On Expiry Action
                    <label class="vip-toggle">
                      <input type="checkbox" id="o1AutoRemove" checked />
                      Auto-remove expired member
                    </label>
                  </label>
                </div>
              </div>

              <button class="btn btn-primary btn-lg btn-full" id="o1Btn" type="submit">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Generate Safe Invite Link
              </button>

              <div id="o1Result" class="result-box" aria-live="polite"></div>
            </form>
          </article>

          <aside class="card">
            <div class="card-head">
              <div class="card-ico brand">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </div>
              <div class="card-title">Why Option 1 Is Safest</div>
            </div>
            <div class="card-body">
              <div class="feat-list">
                <div class="feat-item ok">
                  <span class="feat-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></span>
                  <div><b>Zero PEER_FLOOD Ban Risk</b><p>Telegram never flags your personal account when customers click Bot invite links.</p></div>
                </div>
                <div class="feat-item">
                  <span class="feat-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                  <div><b>Tracks Joins &amp; Customer Leaved</b><p>With your Bot as Admin + Listener enabled, every join and leave saves to your history.</p></div>
                </div>
                <div class="feat-item">
                  <span class="feat-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                  <div><b>Paid / VIP Expiry Manager</b><p>Tracks customer renewal dates and cleanly removes expired members until they renew.</p></div>
                </div>
              </div>
              <button class="btn btn-full" type="button" onclick="openStatusFilter('vip')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Open VIP Expiry &amp; Activity
              </button>
            </div>
          </aside>
        </div>
      </section>

      <!-- ============ PAGE 2: OPTION 2 ONLY ============ -->
      <section id="menu-option2" style="display:none">
        <div class="focus-grid">
          <article class="card">
            <div class="card-head">
              <div class="card-ico brand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </div>
              <div class="card-title">Add Contact &amp; Direct Invite</div>
              <span class="pill pill-amber">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Rate-Guarded
              </span>
            </div>

            <form class="card-body" onsubmit="submitOption2(event)">
              <div class="stepper">
                <div class="step-node">
                  <span class="step-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></span>
                  <b>1. Add Contact</b>
                </div>
                <svg class="step-sep" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                <div class="step-node">
                  <span class="step-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></span>
                  <b>2. Direct Invite</b>
                </div>
                <svg class="step-sep" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                <div class="step-node">
                  <span class="step-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
                  <b>3. DM Fallback</b>
                </div>
              </div>

              <div class="pool-banner" id="o2PoolBanner">
                <span id="o2PoolText">Account Pool: Not linked</span>
                <button type="button" class="btn btn-sm" onclick="openMenu('integrate');openIntegrateTab('mtproto')">Manage Pool</button>
              </div>

              <div class="meters">
                <div class="meter">
                  <div class="meter-top"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>1h Invites</span><b id="mHourText">0/4</b></div>
                  <div class="bar"><i id="mHourBar" style="width:0%"></i></div>
                </div>
                <div class="meter">
                  <div class="meter-top"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>24h Invites</span><b id="mDayText">0/15</b></div>
                  <div class="bar"><i id="mDayBar" style="width:0%"></i></div>
                </div>
                <div class="meter">
                  <div class="meter-top"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Contacts</span><b id="mConText">0/12</b></div>
                  <div class="bar"><i id="mConBar" style="width:0%"></i></div>
                </div>
              </div>

              <div class="two">
                <label class="field">Customer Phone <span class="hint">(+country code)</span>
                  <div class="in-wrap">
                    <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <input id="o2Phone" placeholder="+85512345678" />
                  </div>
                </label>
                <label class="field">Or @Username
                  <div class="in-wrap">
                    <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
                    <input id="o2User" placeholder="@username" />
                  </div>
                </label>
              </div>

              <div class="two">
                <label class="field">Customer First Name
                  <div class="in-wrap">
                    <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input id="o2First" placeholder="Sokha" value="Customer" />
                  </div>
                </label>
                <label class="field">Fallback Link <span class="hint">(if user blocks invites)</span>
                  <div style="display:flex;gap:6px;margin-top:6px;align-items:stretch">
                    <div class="in-wrap" style="margin-top:0;flex:1">
                      <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      <input id="o2Fallback" placeholder="https://t.me/+..." />
                    </div>
                    <button class="btn btn-sm" type="button" style="height:auto;padding:0 14px" onclick="autoFillFallback()" title="Auto-create Option 1 link">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                      Auto
                    </button>
                  </div>
                </label>
              </div>

              <div class="vip-box">
                <div class="vip-head">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Paid / VIP Expiry Timer
                </div>
                <div class="two">
                  <label class="field">Membership Duration
                    <select id="o2VipDays" class="plain-select">
                      <option value="0">Permanent (No Expiry)</option>
                      <option value="7">7 Days VIP</option>
                      <option value="14">14 Days VIP</option>
                      <option value="30">30 Days VIP (1 Month)</option>
                      <option value="90">90 Days VIP (3 Months)</option>
                      <option value="180">180 Days VIP (6 Months)</option>
                      <option value="365">365 Days VIP (1 Year)</option>
                    </select>
                  </label>
                  <label class="field">On Expiry Action
                    <label class="vip-toggle">
                      <input type="checkbox" id="o2AutoRemove" checked />
                      Auto-remove expired member
                    </label>
                  </label>
                </div>
              </div>

              <button class="btn btn-primary btn-lg btn-full" id="o2Btn" type="submit">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Add Contact &amp; Safe Invite
              </button>

              <div id="o2Result" class="result-box" aria-live="polite"></div>
            </form>
          </article>

          <aside class="card">
            <div class="card-head">
              <div class="card-ico amber">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div class="card-title">Active Account Protections</div>
            </div>
            <div class="card-body">
              <div class="feat-list">
                <div class="feat-item ok">
                  <span class="feat-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                  <div><b>Multi-Account Pool Rotation</b><p>Rotates across 2–3 linked phone accounts automatically when one hits hourly/daily caps.</p></div>
                </div>
                <div class="feat-item">
                  <span class="feat-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
                  <div><b>Smart Privacy DM Fallback</b><p>When Telegram returns USER_PRIVACY_RESTRICTED, automatically DMs your Fallback Link.</p></div>
                </div>
                <div class="feat-item">
                  <span class="feat-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
                  <div><b>24h PEER_FLOOD Circuit Breaker</b><p>Pauses any flagged account immediately and isolates per-account cooldowns cleanly.</p></div>
                </div>
              </div>
              <button class="btn btn-full" type="button" onclick="openStatusFilter('failed')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                Check Failed / Privacy Blocks
              </button>
            </div>
          </aside>
        </div>
      </section>

      <!-- ============ PAGE 2B: BULK CSV QUEUE ============ -->
      <section id="menu-bulk" style="display:none">
        <div class="focus-grid">
          <article class="card">
            <div class="card-head">
              <div class="card-ico brand">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div class="card-title">CSV / Bulk Customer Queue</div>
              <span class="pill pill-amber">Pool + Safe Drip</span>
            </div>

            <form class="card-body" onsubmit="submitBulkEnqueue(event)">
              <div class="file-bar">
                <div style="font-size:12.5px;color:var(--text-2)">
                  <b>Upload .csv / .txt</b> or paste customers below (auto-skips duplicates &amp; members)
                </div>
                <label class="btn btn-sm" style="cursor:pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Choose CSV File
                  <input id="bulkCsvFile" type="file" accept=".csv,.txt" style="display:none" onchange="handleCsvUpload(this)" />
                </label>
              </div>

              <label class="field">Customer List <span class="hint">(Name, Phone, @Username — 1 per line)</span>
                <textarea id="bulkInput" class="bulk-area" placeholder="name,phone,username&#10;Sokha,+85512345678,&#10;Dara,,@dara_kh"></textarea>
              </label>

              <label class="field">Option 1 Fallback Link <span class="hint">(auto-DM if privacy blocks direct add)</span>
                <div style="display:flex;gap:6px;margin-top:6px;align-items:stretch">
                  <div class="in-wrap" style="margin-top:0;flex:1">
                    <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <input id="bulkFallback" placeholder="https://t.me/+..." />
                  </div>
                  <button class="btn btn-sm" type="button" style="height:auto;padding:0 14px" onclick="autoFillBulkFallback()">Auto</button>
                </div>
              </label>

              <div class="vip-box">
                <div class="vip-head">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Paid / VIP Expiry for Queued Customers
                </div>
                <div class="two">
                  <label class="field">Membership Duration
                    <select id="bulkVipDays" class="plain-select">
                      <option value="0">Permanent (No Expiry)</option>
                      <option value="7">7 Days VIP</option>
                      <option value="30">30 Days VIP (1 Month)</option>
                      <option value="90">90 Days VIP (3 Months)</option>
                      <option value="365">365 Days VIP (1 Year)</option>
                    </select>
                  </label>
                  <label class="field">On Expiry Action
                    <label class="vip-toggle">
                      <input type="checkbox" id="bulkAutoRemove" checked />
                      Auto-remove expired
                    </label>
                  </label>
                </div>
              </div>

              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn btn-primary" style="flex:1;min-width:210px" id="bulkAddBtn" type="submit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  Queue Customers &amp; Start Drip
                </button>
                <button class="btn" type="button" onclick="enqueueBulkOnly()">Add Only (Paused)</button>
              </div>

              <div id="bulkEnqueueResult" class="result-box"></div>
            </form>
          </article>

          <article class="card">
            <div class="card-head">
              <div class="card-ico green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="card-title">Drip Queue Monitor</div>
              <span class="tag tag-brand" id="bulkStateBadge">Idle</span>
            </div>
            <div class="card-body">
              <div class="bulk-stats">
                <span class="tag tag-brand">Pending: <b id="bqPending">0</b></span>
                <span class="tag tag-green">Done: <b id="bqDone">0</b></span>
                <span class="tag tag-amber">Skipped: <b id="bqSkipped">0</b></span>
                <span class="tag tag-red">Failed: <b id="bqFailed">0</b></span>
              </div>

              <div id="bulkPausedBanner" class="guide-note" style="display:none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span id="bulkPausedText"></span>
              </div>

              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-sm btn-primary" type="button" id="bulkToggleRunBtn" onclick="toggleBulkRun()">Start Drip</button>
                <button class="btn btn-sm" type="button" id="bulkStepBtn" onclick="runNextBulkNow()">Run Next Safe Step</button>
                <button class="btn btn-sm" type="button" onclick="bulkAction('clear_done')">Clear Finished</button>
                <button class="btn btn-sm" type="button" onclick="bulkAction('clear_all')">Clear All</button>
              </div>

              <div id="bulkTableWrap"></div>
            </div>
          </article>
        </div>
      </section>

      <!-- ============ PAGE 3: UNIFIED ACTIVITY & STATUS (ALL 4 + VIP EXPIRY) ============ -->
      <section id="menu-status" style="display:none">
        <!-- 4 CLICKABLE STATUS CARDS (Shown only in Activity & Status) -->
        <div class="kpi-strip" aria-label="Invite and member counts">
          <button class="kpi" type="button" onclick="setStatusFilter('link')">
            <span class="kpi-ico blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
            <div><div class="kpi-label">Invites / Links</div><div class="kpi-val" id="kpiLinks">0</div></div>
            <svg class="kpi-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button class="kpi" type="button" onclick="setStatusFilter('success')">
            <span class="kpi-ico green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></span>
            <div><div class="kpi-label">Invited Success</div><div class="kpi-val" id="kpiSuccess">0</div></div>
            <svg class="kpi-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button class="kpi" type="button" onclick="setStatusFilter('failed')">
            <span class="kpi-ico red"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></span>
            <div><div class="kpi-label">Failed</div><div class="kpi-val" id="kpiFailed">0</div></div>
            <svg class="kpi-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button class="kpi" type="button" onclick="setStatusFilter('left')">
            <span class="kpi-ico amber"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg></span>
            <div><div class="kpi-label">Customer Leaved</div><div class="kpi-val" id="kpiLeft">0</div></div>
            <svg class="kpi-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <article class="card">
          <div class="status-tabs" role="tablist" aria-label="Status filter">
            <button class="stab active" data-filter="all" type="button" onclick="setStatusFilter('all')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              All <span class="cnt" id="cntAll">0</span>
            </button>
            <button class="stab" data-filter="link" type="button" onclick="setStatusFilter('link')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Invites / Links <span class="cnt" id="cntLink">0</span>
            </button>
            <button class="stab" data-filter="success" type="button" onclick="setStatusFilter('success')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              Invited Success <span class="cnt" id="cntSuccess">0</span>
            </button>
            <button class="stab" data-filter="failed" type="button" onclick="setStatusFilter('failed')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              Failed <span class="cnt" id="cntFailed">0</span>
            </button>
            <button class="stab" data-filter="left" type="button" onclick="setStatusFilter('left')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Customer Leaved <span class="cnt" id="cntLeft">0</span>
            </button>
            <button class="stab" data-filter="vip" type="button" onclick="setStatusFilter('vip')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              VIP Expiry <span class="cnt" id="cntVip">0</span>
            </button>
          </div>

          <div class="toolbar">
            <div class="search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input id="statusSearch" placeholder="Search customer name, @username, phone, link, or reason…" oninput="renderStatusTable()" />
            </div>
            <select id="statusMethod" class="plain-select" style="width:auto;margin-top:0;height:36px;padding:0 12px" onchange="renderStatusTable()">
              <option value="all">Option 1 &amp; Option 2</option>
              <option value="OPTION_1">Option 1 (Bot API)</option>
              <option value="OPTION_2">Option 2 (MTProto)</option>
            </select>
            <div style="display:flex;gap:8px;margin-left:auto;flex-wrap:wrap">
              <button type="button" class="btn btn-sm" id="sweepExpiredBtn" style="display:none" onclick="sweepAllExpired()">Remove All Expired</button>
              <button type="button" class="btn btn-sm" onclick="exportActivity('csv')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
              <button type="button" class="btn btn-sm btn-primary" onclick="exportActivity('excel')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                Export Excel
              </button>
            </div>
          </div>

          <div id="statusTableWrap" aria-live="polite"><div class="empty"><div class="empty-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><h3>No activity recorded yet</h3><p>Use Option 1 or Option 2 from the left menu to send invites. Everything saves to your account.</p><button type="button" class="btn btn-primary" data-go="option1" onclick="openMenu(this.dataset.go)">Open Option 1 · Safe Link</button></div></div>
        </article>
      </section>

      <!-- ============ PAGE 4: INTEGRATE TELEGRAM (CLEAN SWITCHER — 1 AT A TIME) ============ -->
      <section id="menu-integrate" style="display:none">
        <div class="int-layout">
          <div class="int-main">
            <div class="stepper stepper-4" aria-label="Setup steps">
              <div class="step-node current" id="intStep1">
                <span class="step-ico">1</span>
                <span><b>Bot token</b></span>
              </div>
              <svg class="step-sep" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              <div class="step-node" id="intStep2">
                <span class="step-ico">2</span>
                <span><b>Group / Channel</b></span>
              </div>
              <svg class="step-sep" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              <div class="step-node" id="intStep3">
                <span class="step-ico">3</span>
                <span><b>Admin rights</b></span>
              </div>
              <svg class="step-sep" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              <button type="button" class="step-node step-cta" id="intStep4" onclick="openMenu('option1')">
                <span class="step-ico">4</span>
                <span><b>Event tracking</b></span>
              </button>
            </div>
            <!-- Choose WHICH Integration you want -->
            <div class="int-switch" role="tablist" aria-label="Choose Telegram Integration">
              <button type="button" class="int-tab active" id="intTabBot" onclick="openIntegrateTab('bot')">
                <span class="int-tab-ico">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>
                </span>
                <span class="int-tab-title">Option 1 · Bot Setup</span>
                <span class="int-tab-tag pill-green">Recommended</span>
              </button>

              <button type="button" class="int-tab" id="intTabMt" onclick="openIntegrateTab('mtproto')">
                <span class="int-tab-ico">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                </span>
                <span class="int-tab-title">Option 2 · Phone Account</span>
                <span class="int-tab-tag pill-amber">Optional</span>
              </button>
            </div>

            <!-- PANEL A: BOT SETUP (DEFAULT — NEEDED FOR OPTION 1 + LEAVE TRACKING) -->
            <article class="card" id="intPanelBot">
              <div class="card-head">
                <div class="card-ico brand">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>
                </div>
                <h3 class="card-title">Bot &amp; Group Connection</h3>
                <span class="pill pill-amber" id="intConnPill">Not connected</span>
                <button class="btn btn-sm" type="button" id="intHelpBtn" onclick="openIntHelp()" style="margin-left:auto" aria-label="Help: how to set up your bot and group">? Help</button>
              </div>
              <form class="card-body" onsubmit="saveBotConfig(event)">

                <section class="int-step" aria-label="Step 1 Bot token">
                  <div class="int-step-head"><h4>Bot token</h4><span class="int-state" id="intStep1State">Not set</span></div>
                  <label class="field">Bot Token <span class="hint" id="botTokenHint"></span>
                    <div class="in-wrap">
                      <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                      <input id="cfgBotToken" class="mono" type="password" placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxx" autocomplete="off" />
                      <button type="button" class="pw-eye" id="cfgTokenToggle" onclick="toggleBotToken()" aria-label="Show bot token">Show</button>
                    </div>
                  </label>
                </section>

                <section class="int-step" aria-label="Step 2 Group or Channel">
                  <div class="int-step-head"><h4>Group or Channel</h4><span class="int-state" id="intStep2State">Not set</span></div>
                  <label class="field">Group / Channel ID
                    <div class="in-wrap">
                      <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <input id="cfgChatId" class="mono" placeholder="-1001234567890 or @channel" />
                    </div>
                  </label>
                  <p class="int-hint">Saving sets this as the active group.</p>
                </section>

                <section class="int-step" aria-label="Step 3 Admin rights in the group">
                  <div class="int-step-head"><h4>Admin rights in the group</h4><span class="int-state" id="intStep3State">Not checked</span></div>
                  <div class="int-checks">
                    <div class="int-check" id="diagInviteRow"><span class="live-dot" id="diagInviteDot"></span><div><b>Invite users via link</b><span id="diagInviteTitle">Not checked</span></div><span class="perm-tag req">REQUIRED</span></div>
                    <!-- Ban / restrict + Delete are never auto-checked: /api/telegram/inspect returns no can_restrict_members / can_delete_messages field. -->
                    <div class="int-check" id="diagBanRow"><span class="live-dot" id="diagBanDot"></span><div><b>Ban / restrict members</b><span id="diagBanTitle">Not checked</span></div><span class="perm-tag req">REQUIRED</span></div>
                    <div class="int-check" id="diagDeleteRow"><span class="live-dot" id="diagDeleteDot"></span><div><b>Delete messages</b><span id="diagDeleteTitle">–</span></div><span class="perm-tag">OPTIONAL</span></div>
                    <!-- Kept from PR #2: extra honest row; inspect has no removal-rights field, so it stays Not checked. -->
                    <div class="int-check" id="diagRemoveRow"><span class="live-dot" id="diagRemoveDot"></span><div><b>Can remove expired members</b><span id="diagRemoveTitle">Not checked</span></div><span class="perm-tag req">REQUIRED</span></div>
                  </div>
                </section>

                <section class="int-step locked" id="intStep4Block" aria-label="Step 4 Event tracking">
                  <div class="int-step-head"><h4>Event tracking</h4><span class="int-state locked" id="intStep4State">Locked until verified</span></div>
                  <div class="int-modes">
                    <div id="listenerPollCard">
                      <button class="mode-btn" type="button" id="togglePollBtn" onclick="togglePolling()" disabled><b>Local Listener (polling)</b><small>For localhost</small></button>
                    </div>
                    <div id="listenerHookCard">
                      <button class="mode-btn" type="button" id="setWebhookBtn" onclick="setWebhook()" disabled><b>Webhook</b><small>For a deployed server</small></button>
                      <div id="webhookUrlWrap" hidden style="margin-top:10px">
                        <label class="field">Webhook URL
                          <div class="in-wrap">
                            <svg class="in-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                            <input id="cfgWebhookUrl" class="mono" aria-label="HTTPS Webhook URL" placeholder="https://your-domain.com/telegram/webhook" />
                          </div>
                        </label>
                        <button class="btn btn-sm" type="button" style="margin-top:8px" onclick="setWebhook()">Set Webhook</button>
                      </div>
                    </div>
                  </div>
                  <p class="callout-amber">Only one can run at a time.</p>
                  <p class="listener-note" id="listenerModeNote">No listener active yet — enable Local Listener or set a Webhook to receive join requests.</p>
                </section>

                <div class="int-actions">
                  <button class="btn btn-primary" type="submit" id="intSaveBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                    Save &amp; Verify Bot
                  </button>
                  <button class="btn" type="button" id="intTestBtn" onclick="sendTestInvite()" disabled>Send Test Invite Link</button>
                  <button class="btn" type="button" id="intEnableBtn" onclick="togglePolling()" disabled>Enable Listener</button>
                  <span class="note">Unlocks after verification.</span>
                </div>
                <div class="result-box" id="intTestOut"></div>

              </form>
            </article>

            <!-- PANEL B: PHONE ACCOUNT / MTPROTO (OPTIONAL — OPTION 2 ONLY) -->
            <article class="card" id="intPanelMt" style="display:none">
              <div class="card-head">
                <div class="card-ico amber">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                </div>
                <h3 class="card-title">Phone Account (MTProto)</h3>
                <button class="btn btn-sm" type="button" onclick="testConnections()" style="margin-left:auto">Check Status</button>
              </div>
              <div class="card-body">

                <div class="status-strip">
                  <div class="status-chip"><span class="live-dot" id="diagMtDot"></span><span id="diagMtTitle">Account: Not signed in</span></div>
                </div>

                <div class="pool-list" id="mtPoolList"></div>

                <section class="int-step" aria-label="Step 1 Telegram app credentials">
                  <div class="int-step-head"><h4>Telegram app credentials</h4><span class="int-state">Step 1</span></div>
                  <div class="two">
                    <label class="field">API ID
                      <div class="in-wrap">
                        <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h6"/></svg>
                        <input id="cfgApiId" class="mono" placeholder="12345678" />
                      </div>
                    </label>
                    <label class="field">API Hash <span class="hint" id="apiHashHint"></span>
                      <div class="in-wrap">
                        <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <input id="cfgApiHash" class="mono" type="password" placeholder="abcdef0123456789…" />
                      </div>
                    </label>
                  </div>
                </section>

                <section class="int-step" aria-label="Step 2 Sign in with your number">
                  <div class="int-step-head"><h4>Sign in with your number</h4><span class="int-state">Step 2</span></div>
                  <div class="two">
                    <label class="field">Helper Account Label
                      <div class="in-wrap">
                        <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <input id="mtLabel" placeholder="e.g. Helper 1 or Sales SIM" />
                      </div>
                    </label>
                    <label class="field">Telegram Phone (+code)
                      <div class="in-wrap">
                        <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <input id="mtPhone" class="mono" placeholder="+855 12 345 678" />
                      </div>
                    </label>
                  </div>
                  <p class="callout-neutral">For direct invites only — the bot still handles links &amp; tracking.</p>
                  <button class="btn btn-primary btn-full" type="button" onclick="mtSendCode()">Send Login Code</button>
                </section>

                <div id="mtOtpArea" style="display:none;gap:12px" class="two">
                  <label class="field">Verification Code
                    <div class="in-wrap">
                      <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778"/></svg>
                      <input id="mtCode" placeholder="12345" />
                    </div>
                  </label>
                  <label class="field">2FA Password
                    <div class="in-wrap">
                      <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/></svg>
                      <input id="mtPass" type="password" placeholder="Optional" />
                    </div>
                  </label>
                  <button class="btn btn-primary btn-full" style="grid-column:1 / -1" type="button" onclick="mtCompleteLogin()">Verify &amp; Save Session</button>
                </div>
                <div id="mtLoginOut" class="result-box"></div>

                <details class="adv-details">
                  <summary>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Advanced: Safety Caps
                  </summary>
                  <form style="display:grid;gap:12px" onsubmit="saveMtprotoConfig(event)">
                    <div class="two">
                      <label class="field">Safe Limit / Hour
                        <div class="in-wrap">
                          <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <input id="cfgMaxHour" type="number" min="1" max="20" value="4" />
                        </div>
                      </label>
                      <label class="field">Safe Limit / Day
                        <div class="in-wrap">
                          <svg class="in-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                          <input id="cfgMaxDay" type="number" min="1" max="40" value="15" />
                        </div>
                      </label>
                    </div>
                    <button class="btn btn-sm" type="submit">Save Safety Caps</button>
                  </form>
                </details>
              </div>
            </article>
          </div>
          <aside class="int-rail">
            <div id="intRailBot">
              <div class="card">
                <div class="card-head">
                  <h3 class="card-title">Connection health</h3>
                  <button class="btn btn-sm" type="button" onclick="testConnections()" style="margin-left:auto">Re-check</button>
                </div>
                <div class="card-body" style="gap:8px">
                  <div class="int-check" id="diagBotRow"><span class="live-dot" id="diagBotDot"></span><div><b>Bot identity</b><span id="diagBotTitle">NOT CHECKED</span></div></div>
                  <div class="int-check" id="diagChatRow"><span class="live-dot" id="diagChatDot"></span><div><b>Group reachable</b><span id="diagChatTitle">NOT CHECKED</span></div></div>
                  <div class="int-check" id="diagAdminRow"><span class="live-dot" id="diagAdminDot"></span><div><b>Bot is admin</b><span id="diagAdminTitle">NOT CHECKED</span></div></div>
                  <div class="int-check" id="healthEventsRow"><span class="live-dot" id="healthEventsDot"></span><div><b>Events flowing</b><span id="healthEventsTitle">—</span></div></div>
                </div>
              </div>
              <div class="card">
                <div class="card-head">
                  <h3 class="card-title">How the flow works</h3>
                </div>
                <div class="card-body" style="gap:0">
                  <ol class="flow-list">
                    <li><span class="flow-num">1</span><b>You create a safe link</b></li>
                    <li><span class="flow-num">2</span><b>Customer taps the link</b></li>
                    <li><span class="flow-num">3</span><b>Bot approves &amp; logs it</b></li>
                    <li><span class="flow-num">4</span><b>Leave or expiry</b></li>
                  </ol>
                </div>
              </div>
            </div>
            <div class="card" id="intRailMt" style="display:none">
              <div class="card-head">
                <h3 class="card-title">Bot vs Phone — which does what</h3>
              </div>
              <div class="card-body" style="gap:0">
                <div class="vs-row"><b>BOT</b><span>Safe links, approvals, tracking, VIP removal</span></div>
                <div class="vs-row"><b>PHONE</b><span>Direct invites only (Option 2 &amp; bulk)</span></div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  </div>
</div>

<!-- ============ FIXED FOOTER ============ -->
<footer class="site-footer" id="siteFooter" role="contentinfo">
  <div class="footer-copy">
    <img src="/favicon-32.png" alt="Tenh Gram" width="16" height="16" style="border-radius:4px;display:block" />
    <span>Copyright &copy; 2026 Tenh. All rights reserved.</span>
  </div>
  <nav class="footer-links" aria-label="Legal links">
    <button type="button" class="footer-link" onclick="openLegalModal('privacy')">Privacy</button>
    <span class="footer-sep" aria-hidden="true">&middot;</span>
    <button type="button" class="footer-link" onclick="openLegalModal('policy')">Policy</button>
    <span class="footer-sep" aria-hidden="true">&middot;</span>
    <button type="button" class="footer-link" onclick="openLegalModal('terms')">Terms of Service</button>
  </nav>
</footer>

<!-- ============ LEGAL MODAL ============ -->
<div class="legal-overlay" id="legalModal" onclick="if(event.target===this)closeLegalModal()">
  <div class="legal-card" role="dialog" aria-modal="true" aria-labelledby="legalModalTitle">
    <div class="legal-head">
      <h2 id="legalModalTitle">Privacy Policy</h2>
      <button type="button" class="legal-close" onclick="closeLegalModal()" aria-label="Close dialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="legal-body" id="legalModalBody"></div>
    <div class="legal-foot">
      <span>Copyright &copy; 2026 Tenh</span>
      <button type="button" class="btn btn-sm btn-primary" onclick="closeLegalModal()">Close</button>
    </div>
  </div>
</div>

<!-- ============ INTEGRATE HELP MODAL ============ -->
<div class="legal-overlay" id="intHelpModal" onclick="if(event.target===this)closeIntHelp()">
  <div class="legal-card" role="dialog" aria-modal="true" aria-labelledby="intHelpTitle">
    <div class="legal-head">
      <h2 id="intHelpTitle">Bot &amp; Group Setup</h2>
      <button type="button" class="legal-close" onclick="closeIntHelp()" aria-label="Close help">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="legal-body">
      <ol class="help-steps">
        <li><b>Make a bot</b> — @BotFather &rarr; /newbot &rarr; copy the Bot Token</li>
        <li><b>Make a group</b> — New Group, add the bot + 1 friend, make the bot Admin (Invite Users on)</li>
        <li><b>Get the Group ID</b> — add @userinfobot to the group, send hi, copy the -100... number</li>
        <li><b>Verify</b> — paste Bot Token + Group ID here &rarr; Save &amp; Verify Bot &rarr; checks turn green</li>
        <li><b>Test</b> — Send Test Invite Link &rarr; open it with a second account &rarr; join request auto-approves</li>
      </ol>
    </div>
    <div class="legal-foot">
      <span>Bot Token is secret — never share it.</span>
      <button type="button" class="btn btn-sm btn-primary" onclick="closeIntHelp()">Close</button>
    </div>
  </div>
</div>

<div class="toasts" id="toasts" role="status" aria-live="polite"></div>

<script>
const $ = id => document.getElementById(id);
let authMode = 'login';
let currentUser = null;
let activeMenu = 'option1';
let statusFilter = 'all';
let appData = null;
let activeLoginId = null;
let lastWebhookUrl = '';
let botVerified = false;

const MENU_META = {
  option1: 'Option 1 · Safe Invite Link',
  option2: 'Option 2 · Direct Invite',
  bulk: 'Bulk CSV Queue',
  status: 'Activity & Status',
  integrate: 'Integrate Telegram',
};

function openIntegrateTab(tab) {
  const isBot = tab === 'bot';
  $('intTabBot').classList.toggle('active', isBot);
  $('intTabMt').classList.toggle('active', !isBot);
  $('intPanelBot').style.display = isBot ? 'block' : 'none';
  $('intPanelMt').style.display = isBot ? 'none' : 'block';
  $('intRailBot').style.display = isBot ? 'grid' : 'none';
  $('intRailMt').style.display = isBot ? 'none' : 'block';
}

function toast(msg, kind) {
  const cls = 'toast ' + (kind || 'ok');
  // Never show the same alert twice: if an identical toast is already
  // visible, just restart its timer instead of stacking a duplicate.
  const box = $('toasts');
  for (const old of box.querySelectorAll('.toast')) {
    if (old.textContent === msg && old.className === cls) {
      clearTimeout(old._toastTimer);
      old.style.opacity = '1'; old.style.transition = '';
      old._toastTimer = setTimeout(() => { old.style.opacity = '0'; old.style.transition = 'opacity .25s'; setTimeout(() => old.remove(), 260); }, 3400);
      return;
    }
  }
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  el._toastTimer = setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; setTimeout(() => el.remove(), 260); }, 3400);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

function switchAuthTab(mode) {
  authMode = mode;
  $('tabLogin').classList.toggle('active', mode === 'login');
  $('tabSignup').classList.toggle('active', mode === 'signup');
  $('authNameWrap').style.display = mode === 'signup' ? 'block' : 'none';
  $('authName').required = mode === 'signup';
  $('pwHint').textContent = mode === 'signup' ? '(min 6 chars)' : '';
  $('authPassword').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  $('authSubmitBtn').textContent = mode === 'signup' ? 'Create Account & Save History' : 'Sign In & Open Workspace';
  $('authError').className = 'result-box err';
  $('authError').style.display = 'none';
}

function toggleAuthPw() {
  const pw = $('authPassword');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

async function submitAuth(e) {
  e.preventDefault();
  const btn = $('authSubmitBtn');
  const errBox = $('authError');
  btn.disabled = true;
  errBox.style.display = 'none';
  try {
    const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload = {
      email: $('authEmail').value.trim(),
      password: $('authPassword').value,
    };
    if (authMode === 'signup') payload.name = $('authName').value.trim();

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');
    $('authPassword').value = '';
    enterWorkspace(data.user);
    toast(authMode === 'signup' ? 'Account created! History will save automatically.' : 'Welcome back, ' + data.user.name + '!', 'ok');
  } catch (err) {
    errBox.className = 'result-box show err';
    errBox.style.display = 'block';
    errBox.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
}

function showAuthGate() {
  currentUser = null;
  appData = null;
  $('appShell').style.display = 'none';
  $('authGate').style.display = 'flex';
}

function enterWorkspace(user) {
  currentUser = user;
  $('authGate').style.display = 'none';
  $('appShell').style.display = 'flex';
  const initials = String(user.name || user.email || 'U').trim().slice(0, 2).toUpperCase();
  $('userAvatar').textContent = initials;
  $('userNameLabel').textContent = user.name || 'User';
  $('userEmailLabel').textContent = user.email || '';
  refreshStatus(true);
}

async function initAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.authenticated && data.user) {
      enterWorkspace(data.user);
    } else {
      showAuthGate();
    }
  } catch {
    showAuthGate();
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  showAuthGate();
  toast('Signed out. Your history stays saved for next login!', 'ok');
}

function applySidebarState(collapsed) {
  document.body.classList.toggle('side-collapsed', collapsed);
  $('sidebarToggle').title = collapsed ? 'Expand Left Menu' : 'Collapse to Icon-Only Menu';
}

function toggleSidebar() {
  const next = !document.body.classList.contains('side-collapsed');
  applySidebarState(next);
  try { localStorage.setItem('tenhgram_side_collapsed', next ? '1' : '0'); } catch {}
}

function pickO1Mode(mode) {
  $('o1Mode').value = mode;
  document.querySelectorAll('.mode-opt').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

function openMenu(name) {
  activeMenu = name;
  ['option1', 'option2', 'bulk', 'status', 'integrate'].forEach(m => {
    const el = $('menu-' + m);
    el.style.display = m === name ? 'block' : 'none';
    if (m === name) {
      el.classList.remove('panel-anim');
      void el.offsetWidth;
      el.classList.add('panel-anim');
    }
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.menu === name);
  });
  $('topMenuTitle').textContent = MENU_META[name] || MENU_META.option1;
  // The two topbar buttons live in the shared topbar: hide them on this
  // page only (the setup button just re-opens this page); other views keep them.
  const onIntegrate = name === 'integrate';
  if ($('syncBtn')) $('syncBtn').style.display = onIntegrate ? 'none' : '';
  if ($('setupBtn')) $('setupBtn').style.display = onIntegrate ? 'none' : '';
}

function openStatusFilter(filter) {
  openMenu('status');
  setStatusFilter(filter);
}

function setStatusFilter(filter) {
  statusFilter = filter;
  document.querySelectorAll('.stab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderStatusTable();
  renderBulkQueue();
}

function getRows() {
  return (appData && appData.history) || [];
}

function getVipRows() {
  return (appData && appData.memberships) || [];
}

function computeCounts(rows) {
  let link = 0, success = 0, failed = 0, left = 0;
  for (const r of rows) {
    if (r.outcome === 'success') success++;
    else if (r.outcome === 'failed') failed++;
    else if (r.outcome === 'left') left++;
    else link++;
  }
  return { all: rows.length, link, success, failed, left };
}

function renderGroupProfileBar() {
  if (!appData) return;
  const groups = appData.savedGroups || [];
  const activeId = (appData.config && appData.config.chatId) || '';
  const sel = $('savedGroupSelect');
  sel.innerHTML = '<option value="">-- Select Saved Group (' + groups.length + ') --</option>' +
    groups.map(g => {
      const mTxt = (g.memberCount !== null && g.memberCount !== undefined) ? ' · ' + Number(g.memberCount).toLocaleString() + ' members' : '';
      const uTxt = g.username ? ' (@' + g.username + ')' : '';
      return '<option value="' + esc(g.id) + '">' + esc(g.title + uTxt + mTxt) + '</option>';
    }).join('');

  const match = groups.find(g => g.id === activeId || (g.username && '@' + g.username === activeId) || g.inputRef === activeId) || groups[0] || null;
  if (match) sel.value = match.id;

  if (match) {
    $('groupProfileName').textContent = match.title || match.id;
    $('groupProfileHandle').textContent = (match.username ? '@' + match.username + ' · ' : '') + 'ID ' + match.id + (match.type ? ' · ' + match.type : '');
    if (match.memberCount !== null && match.memberCount !== undefined) {
      $('groupProfileMembers').style.display = 'inline-flex';
      $('groupProfileMembers').textContent = Number(match.memberCount).toLocaleString() + ' members';
    } else {
      $('groupProfileMembers').style.display = 'none';
    }
    const statusBadge = $('groupProfileStatus');
    statusBadge.style.display = 'inline-flex';
    if (match.canInvite) {
      statusBadge.className = 'tag tag-green';
      statusBadge.textContent = 'Admin Ready';
    } else if (match.isAdmin) {
      statusBadge.className = 'tag tag-amber';
      statusBadge.textContent = 'Need Invite Right';
    } else {
      statusBadge.className = 'tag tag-amber';
      statusBadge.textContent = 'Check Bot Admin';
    }
    if (match.photoDataUrl) {
      $('groupAvatarWrap').innerHTML = '<img src="' + esc(match.photoDataUrl) + '" alt="" />';
    } else {
      $('groupAvatarWrap').textContent = String(match.title || 'TG').trim().slice(0, 2).toUpperCase();
    }
    $('removeGroupBtn').style.display = 'inline-flex';
    $('o1Chat').placeholder = 'Using: ' + match.title;
  } else {
    $('groupAvatarWrap').textContent = 'TG';
    $('groupProfileName').textContent = activeId ? ('Group ' + activeId) : 'No Group Selected';
    $('groupProfileHandle').textContent = activeId ? 'Click Save Group or Verify Bot to load photo & member count' : 'Save a Group / Channel to see photo, @username & member count';
    $('groupProfileMembers').style.display = 'none';
    $('groupProfileStatus').style.display = 'none';
    $('removeGroupBtn').style.display = 'none';
    $('o1Chat').placeholder = 'Uses active saved group';
  }
}

function renderMtprotoPool() {
  if (!appData) return;
  const stats = appData.accountSafetyStats || [];
  const ps = appData.poolSummary || { size: stats.length, activeAccountLabel: null };

  if (!stats.length) {
    $('o2PoolText').textContent = 'Account Pool: No helper phone linked yet';
    $('mtPoolList').innerHTML = '<div class="guide-note" style="background:var(--canvas);border-color:var(--line)"><span>No Option 2 accounts linked yet. Sign in below to add your first account (you can add 2–3 for automatic rotation).</span></div>';
    return;
  }

  if (appData.safety && !appData.safety.allowed) {
    $('o2PoolText').textContent = 'Pool (' + stats.length + ' accounts): ' + appData.safety.message;
  } else {
    $('o2PoolText').textContent = 'Pool Active: ' + stats.length + ' account(s) · Next rotation: ' + (ps.activeAccountLabel || stats[0].label);
  }

  $('mtPoolList').innerHTML = stats.map(acc => {
    const dotCls = acc.allowed ? 'live-dot ok' : (acc.code === 'CIRCUIT_BREAKER_ACTIVE' ? 'live-dot' : 'live-dot warn');
    const tagCls = acc.allowed ? 'tag tag-green' : (acc.code === 'CIRCUIT_BREAKER_ACTIVE' ? 'tag tag-red' : 'tag tag-amber');
    const tagTxt = acc.allowed ? 'Ready' : (acc.code === 'CIRCUIT_BREAKER_ACTIVE' ? 'PEER_FLOOD 24h' : acc.code === 'JITTER_COOLDOWN' ? 'Cooldown' : 'Cap Reached');
    const subParts = [acc.phone, acc.username ? '@' + acc.username : ''].filter(Boolean).join(' · ') || acc.id;
    const quota = acc.stats ? (acc.stats.invitesLastHour + '/' + acc.stats.limits.maxInvitesPerHour + ' hr · ' + acc.stats.invitesLastDay + '/' + acc.stats.limits.maxInvitesPerDay + ' day') : '';
    return '<div class="pool-row">' +
      '<span class="' + dotCls + '" style="' + (acc.code === 'CIRCUIT_BREAKER_ACTIVE' ? 'background:var(--red)' : '') + '"></span>' +
      '<div class="pool-info"><b>' + esc(acc.label) + '</b><span>' + esc(subParts) + '</span></div>' +
      '<span class="tag tag-brand">' + esc(quota) + '</span>' +
      '<span class="' + tagCls + '">' + esc(tagTxt) + '</span>' +
      '<button type="button" class="btn btn-sm" data-accid="' + esc(acc.id) + '" onclick="removeMtAccountBtn(this)">Remove</button>' +
    '</div>';
  }).join('');
}

function renderAll() {
  const rows = getRows();
  const c = computeCounts(rows);
  const vips = getVipRows();
  const activeVips = vips.filter(v => v.status === 'active' || v.status === 'expired').length;

  $('kpiLinks').textContent = c.link;
  $('kpiSuccess').textContent = c.success;
  $('kpiFailed').textContent = c.failed;
  $('kpiLeft').textContent = c.left;
  $('navTotalCount').textContent = c.all;

  $('cntAll').textContent = c.all;
  $('cntLink').textContent = c.link;
  $('cntSuccess').textContent = c.success;
  $('cntFailed').textContent = c.failed;
  $('cntLeft').textContent = c.left;
  $('cntVip').textContent = activeVips;

  if (appData) {
    const st = appData.safety.stats;
    const pctH = Math.min(100, Math.round((st.invitesLastHour / Math.max(1, st.limits.maxInvitesPerHour)) * 100));
    const pctD = Math.min(100, Math.round((st.invitesLastDay / Math.max(1, st.limits.maxInvitesPerDay)) * 100));
    const pctC = Math.min(100, Math.round((st.contactsLastDay / Math.max(1, st.limits.maxContactsPerDay)) * 100));

    $('mHourText').textContent = st.invitesLastHour + '/' + st.limits.maxInvitesPerHour;
    $('mDayText').textContent = st.invitesLastDay + '/' + st.limits.maxInvitesPerDay;
    $('mConText').textContent = st.contactsLastDay + '/' + st.limits.maxContactsPerDay;

    $('mHourBar').style.width = pctH + '%';
    $('mHourBar').className = pctH >= 100 ? 'danger' : pctH >= 75 ? 'warn' : '';
    $('mDayBar').style.width = pctD + '%';
    $('mDayBar').className = pctD >= 100 ? 'danger' : pctD >= 75 ? 'warn' : '';
    $('mConBar').style.width = pctC + '%';
    $('mConBar').className = pctC >= 100 ? 'danger' : pctC >= 75 ? 'warn' : '';

    const cfg = appData.config;
    $('navIntDot').className = 'nav-dot ' + (cfg.botConfigured ? 'ok' : '');

    if (appData.pollingEnabled) {
      $('syncPill').className = 'sync-pill live';
      $('syncDot').className = 'live-dot pulsing';
      $('syncLabel').textContent = 'Live Listener';
      $('togglePollBtn').textContent = 'Pause Local Listener';
    } else {
      $('syncPill').className = 'sync-pill';
      $('syncDot').className = 'live-dot';
      $('syncLabel').textContent = 'Listener Off';
      $('togglePollBtn').textContent = 'Enable Local Listener';
    }
    $('listenerPollCard').classList.toggle('active', Boolean(appData.pollingEnabled));
    $('listenerHookCard').classList.toggle('active', !appData.pollingEnabled && Boolean(lastWebhookUrl));
    $('togglePollBtn').disabled = !botVerified && !appData.pollingEnabled;
    $('setWebhookBtn').disabled = !botVerified;
    $('intTestBtn').disabled = !botVerified;
    $('intEnableBtn').disabled = !botVerified && !appData.pollingEnabled;
    $('intEnableBtn').textContent = appData.pollingEnabled ? 'Pause Listener' : 'Enable Listener';
    $('syncBtn').disabled = !botVerified;
    $('healthEventsTitle').textContent = appData.pollingEnabled ? 'Live' : (lastWebhookUrl ? 'Webhook' : '—');
    $('healthEventsDot').className = 'live-dot' + ((appData.pollingEnabled || lastWebhookUrl) ? ' ok' : '');
    $('listenerModeNote').textContent = appData.pollingEnabled
      ? 'Active: Local Listener — join requests arrive while this server runs.'
      : !botVerified
        ? 'Verify your bot first — Save & Verify Bot (or Re-check) unlocks the listener.'
        : lastWebhookUrl
          ? 'Active: Webhook — join requests go to your public URL.'
          : 'No listener active yet — enable Local Listener or set a Webhook to receive join requests.';
  }

  renderGroupProfileBar();
  renderMtprotoPool();
  renderStatusTable();
  renderBulkQueue();
}

function statusPillHtml(r) {
  if (r.outcome === 'success') return '<span class="tag tag-green">' + esc(r.status) + '</span>';
  if (r.outcome === 'failed') return '<span class="tag tag-red">' + esc(r.status) + '</span>';
  if (r.outcome === 'left') {
    const lbl = r.status === 'REMOVED_EXPIRED' ? 'Removed (VIP Expired)' : (r.status === 'REMOVED' ? 'Removed' : 'Customer Leaved');
    return '<span class="tag tag-amber">' + lbl + '</span>';
  }
  return '<span class="tag tag-brand">' + esc(r.status) + '</span>';
}

function avatarTone(outcome) {
  if (outcome === 'success') return 'green';
  if (outcome === 'failed') return 'red';
  if (outcome === 'left') return 'amber';
  return '';
}

function actionCellHtml(r) {
  if (r.outcome === 'link' && r.inviteLink) {
    return '<div style="display:flex;gap:6px"><button type="button" class="btn btn-sm" data-copy="' + esc(r.inviteLink) + '" onclick="copyFromBtn(this)">Copy Link</button><button type="button" class="btn btn-sm" data-copy="' + esc(r.inviteLink) + '" onclick="useAsFallback(this)">Set Fallback</button></div>';
  }
  if (r.outcome === 'failed') {
    return '<button type="button" class="btn btn-sm" data-label="' + esc(r.name || r.target || 'Customer') + '" onclick="recoverFromBtn(this)">Create Safe Link</button>';
  }
  if (r.outcome === 'left') {
    return '<button type="button" class="btn btn-sm" data-label="' + esc('Re-invite ' + (r.name || 'Customer')) + '" onclick="recoverFromBtn(this)">Re-invite Link</button>';
  }
  if (r.inviteLink) {
    return '<button type="button" class="btn btn-sm" data-copy="' + esc(r.inviteLink) + '" onclick="copyFromBtn(this)">Copy Link</button>';
  }
  return '<span style="color:var(--muted);font-size:12px">Joined</span>';
}

function renderVipTable() {
  const vips = getVipRows();
  const q = ($('statusSearch').value || '').toLowerCase();
  const filtered = vips.filter(m => {
    if (!q) return true;
    return [m.name, m.username, m.phone, m.chatTitle, m.inviteName, m.status]
      .some(x => String(x || '').toLowerCase().includes(q));
  });

  const now = Date.now();
  const hasDue = filtered.some(m => (m.status === 'active' || m.status === 'expired') && Date.parse(m.expiresAt || '') <= now);
  $('sweepExpiredBtn').style.display = hasDue ? 'inline-flex' : 'none';

  if (!filtered.length) {
    $('statusTableWrap').innerHTML = '<div class="empty"><div class="empty-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><h3>No Paid / VIP memberships tracked yet</h3><p>Select a duration (e.g. 30 Days VIP) in Option 1, Option 2, or Bulk Queue to track renewal dates automatically.</p><button type="button" class="btn btn-primary" data-go="option1" onclick="openMenu(this.dataset.go)">Open Option 1 · Safe Link</button></div>';
    return;
  }

  $('statusTableWrap').innerHTML = '<div class="table-wrap"><table><thead><tr><th>Member</th><th>Group / Plan</th><th>Expiry Status</th><th>Renewal Date</th><th>Actions</th></tr></thead><tbody>' +
    filtered.map(m => {
      const expMs = Date.parse(m.expiresAt || '');
      const diffHrs = Math.round((expMs - now) / 3600_000);
      const isPast = Number.isFinite(expMs) && expMs <= now;
      let stTag = '';
      if (m.status === 'removed') {
        stTag = '<span class="tag tag-amber">Auto-Removed (Expired)</span>';
      } else if (m.status === 'left') {
        stTag = '<span class="tag tag-amber">Left Group</span>';
      } else if (isPast || m.status === 'expired') {
        stTag = '<span class="tag tag-red">Expired</span>';
      } else if (diffHrs <= 48) {
        stTag = '<span class="tag tag-amber">Due in ' + Math.max(1, diffHrs) + 'h</span>';
      } else {
        stTag = '<span class="tag tag-green">Active · ' + Math.ceil(diffHrs / 24) + 'd left</span>';
      }
      const modeBadge = m.autoRemove ? 'Auto-remove ON' : 'Reminder Only';
      return '<tr>' +
        '<td><div class="who"><span class="av ' + (isPast || m.status === 'removed' ? 'amber' : 'green') + '">' + esc((m.name || '?').slice(0,2).toUpperCase()) + '</span><div><div class="who-name">' + esc(m.name) + '</div><div class="who-sub">' + esc(m.username ? '@' + m.username : (m.phone || ('ID ' + (m.telegramUserId || 'pending')))) + '</div></div></div></td>' +
        '<td><div>' + esc(m.chatTitle || m.chatId || 'Group') + '</div><div class="who-sub">' + esc((m.vipDays ? m.vipDays + 'd plan' : 'VIP') + ' · ' + modeBadge) + (m.lastError ? ' · ' + esc(m.lastError) : '') + '</div></td>' +
        '<td>' + stTag + '</td>' +
        '<td style="white-space:nowrap;color:var(--text-2)">' + esc(fmtTime(m.expiresAt)) + '</td>' +
        '<td><div style="display:flex;gap:6px;flex-wrap:wrap">' +
          '<button type="button" class="btn btn-sm btn-primary" data-vipid="' + esc(m.id) + '" onclick="renewVipBtn(this)">+30d Renew</button>' +
          (m.status !== 'removed' && m.status !== 'left' && m.telegramUserId
            ? '<button type="button" class="btn btn-sm" data-vipid="' + esc(m.id) + '" onclick="removeVipBtn(this)">Remove Now</button>'
            : '') +
        '</div></td>' +
      '</tr>';
    }).join('') +
  '</tbody></table></div>';
}

function renderStatusTable() {
  if (statusFilter === 'vip') {
    renderVipTable();
    return;
  }
  $('sweepExpiredBtn').style.display = 'none';

  const rows = getRows();
  const q = ($('statusSearch').value || '').toLowerCase();
  const method = $('statusMethod').value;

  const filtered = rows.filter(r => {
    if (statusFilter !== 'all' && r.outcome !== statusFilter) return false;
    if (method !== 'all' && !String(r.option).startsWith(method)) return false;
    if (!q) return true;
    return [r.name, r.target, r.username, r.phone, r.inviteName, r.status, r.reason, r.chatTitle, r.accountLabel]
      .some(x => String(x || '').toLowerCase().includes(q));
  });

  if (!filtered.length) {
    const emptyMsgs = {
      all: ['No activity recorded yet', 'Use Option 1 or Option 2 from the left menu to send invites. Everything saves to your account.'],
      link: ['No invite links created yet', 'Generate a ban-proof link in Option 1 · Safe Link.'],
      success: ['No successful invites yet', 'Approved joins, direct invites, and DM fallback links appear here.'],
      failed: ['Zero failed invites', 'Any privacy restriction, missing account, or rate limit appears here with a 1-click Safe Link recovery button.'],
      left: ['No customer leave events yet', 'Enable Local Real-Time Listener in Integrate Telegram (with Bot as Admin) to capture members leaving.'],
    };
    const msg = emptyMsgs[statusFilter] || emptyMsgs.all;
    $('statusTableWrap').innerHTML = '<div class="empty"><div class="empty-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><h3>' + msg[0] + '</h3><p>' + msg[1] + '</p><button type="button" class="btn btn-primary" data-go="option1" onclick="openMenu(this.dataset.go)">Open Option 1 · Safe Link</button></div>';
    return;
  }

  $('statusTableWrap').innerHTML = '<div class="table-wrap"><table><thead><tr><th>Target / Customer</th><th>Method</th><th>Status</th><th>Details / Reason</th><th>Time</th><th>Action</th></tr></thead><tbody>' +
    filtered.map((r, i) => '<tr class="row-anim" style="animation-delay:' + (i * 20) + 'ms">' +
      '<td><div class="who"><span class="av ' + avatarTone(r.outcome) + '">' + esc((r.name || r.target || '?').slice(0,2).toUpperCase()) + '</span><div><div class="who-name">' + esc(r.name || r.target) + '</div><div class="who-sub">' + esc(r.username ? '@' + r.username : (r.phone || (r.userId ? 'ID ' + r.userId : r.target || ''))) + '</div></div></div></td>' +
      '<td><span class="tag tag-brand">' + (String(r.option).includes('OPTION_2') ? ('Option 2' + (r.accountLabel ? ' · ' + esc(r.accountLabel) : ' · MTProto')) : 'Option 1 · Bot API') + '</span></td>' +
      '<td>' + statusPillHtml(r) + '</td>' +
      '<td style="max-width:340px;color:var(--text-2)">' + esc(r.reason || r.inviteName || r.inviteLink || r.chatTitle || '—') + '</td>' +
      '<td style="color:var(--muted);white-space:nowrap">' + esc(fmtTime(r.at)) + '</td>' +
      '<td>' + actionCellHtml(r) + '</td>' +
    '</tr>').join('') +
  '</tbody></table></div>';
}

function hydrateConfigForm() {
  if (!appData || !appData.config) return;
  const c = appData.config;
  $('cfgChatId').value = c.chatId || '';
  $('botTokenHint').textContent = c.botTokenSet ? '(Saved: ' + c.botTokenPreview + ')' : '(Not set)';
  $('cfgApiId').value = c.apiId || '';
  $('apiHashHint').textContent = c.apiHashSet ? '(Saved: ' + c.apiHashPreview + ')' : '(Not set)';
  $('cfgMaxHour').value = c.limits.maxInvitesPerHour;
  $('cfgMaxDay').value = c.limits.maxInvitesPerDay;
  if (currentUser && !$('cfgWebhookUrl').value) {
    $('cfgWebhookUrl').placeholder = 'https://your-domain.com/api/option1/webhook?u=' + currentUser.id;
  }
  if (appData.bulkQueue) {
    if (appData.bulkQueue.fallbackInviteLink && !$('bulkFallback').value) {
      $('bulkFallback').value = appData.bulkQueue.fallbackInviteLink;
    }
    if (Number(appData.bulkQueue.vipDays) > 0) {
      $('bulkVipDays').value = String(appData.bulkQueue.vipDays);
      $('bulkAutoRemove').checked = Boolean(appData.bulkQueue.autoRemove);
    }
  }
}

function toggleAddGroupDrawer() {
  const drawer = $('groupAddDrawer');
  const open = !drawer.classList.contains('open');
  drawer.classList.toggle('open', open);
  if (open) {
    const active = ($('cfgChatId') && $('cfgChatId').value.trim()) || '';
    if (!$('newGroupChatId').value.trim() && active && (!(appData && appData.savedGroups && appData.savedGroups.length))) {
      $('newGroupChatId').value = active;
    }
    $('newGroupChatId').focus();
  }
}

async function saveNewGroup() {
  const chatId = $('newGroupChatId').value.trim();
  if (!chatId) return toast('Enter a Telegram Group ID (-100...) or @username', 'err');
  const btn = $('saveGroupBtn');
  btn.disabled = true;
  try {
    const res = await fetch('/api/groups/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, select: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save group profile');
    $('newGroupChatId').value = '';
    $('groupAddDrawer').classList.remove('open');
    const membersTxt = (data.group && data.group.memberCount !== null && data.group.memberCount !== undefined)
      ? ' (' + Number(data.group.memberCount).toLocaleString() + ' members)'
      : '';
    toast('Saved ' + (data.group ? data.group.title : chatId) + membersTxt, 'ok');
    await refreshStatus(true);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
  }
}

async function selectSavedGroup(chatId) {
  if (!chatId) return;
  try {
    const res = await fetch('/api/groups/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to switch group');
    $('cfgChatId').value = chatId;
    toast('Active group switched!', 'ok');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function refreshActiveGroup() {
  const chatId = $('savedGroupSelect').value || (appData && appData.config && appData.config.chatId) || '';
  if (!chatId) {
    toggleAddGroupDrawer();
    return;
  }
  try {
    const res = await fetch('/api/groups/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to refresh group');
    const membersTxt = (data.group && data.group.memberCount !== null && data.group.memberCount !== undefined)
      ? ' · ' + Number(data.group.memberCount).toLocaleString() + ' members'
      : '';
    toast('Refreshed: ' + (data.group ? data.group.title : chatId) + membersTxt, 'ok');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function removeCurrentGroup() {
  const chatId = $('savedGroupSelect').value || '';
  if (!chatId) return;
  try {
    const res = await fetch('/api/groups/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove saved group');
    toast('Group removed from saved list', 'ok');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function renewVipBtn(btn) {
  const membershipId = btn.dataset.vipid || '';
  if (!membershipId) return;
  btn.disabled = true;
  try {
    const res = await fetch('/api/memberships/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId, addDays: 30 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to renew VIP');
    toast('VIP extended by +30 days!', 'ok');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
  }
}

async function removeVipBtn(btn) {
  const membershipId = btn.dataset.vipid || '';
  if (!membershipId) return;
  btn.disabled = true;
  try {
    const res = await fetch('/api/memberships/remove-expired', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove member');
    if (data.errors && data.errors.length) {
      throw new Error(data.errors[0].error || 'Telegram removal failed');
    }
    toast(data.removed > 0 ? 'Member removed cleanly (can rejoin on renewal)' : 'No removal executed', data.removed > 0 ? 'ok' : 'err');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
  }
}

async function sweepAllExpired() {
  const btn = $('sweepExpiredBtn');
  btn.disabled = true;
  try {
    const res = await fetch('/api/memberships/remove-expired', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sweep failed');
    const msg = data.removed > 0
      ? ('Removed ' + data.removed + ' expired member(s)')
      : (data.errors && data.errors.length ? data.errors[0].error : 'No auto-remove expired members due');
    toast(msg, data.removed > 0 ? 'ok' : 'err');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
  }
}

async function removeMtAccountBtn(btn) {
  const accountId = btn.dataset.accid || '';
  if (!accountId) return;
  btn.disabled = true;
  try {
    const res = await fetch('/api/telegram/mtproto/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove account');
    toast('Account removed from pool', 'ok');
    await refreshStatus(false);
    await testConnections();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
  }
}

function exportActivity(format) {
  const q = encodeURIComponent($('statusSearch').value || '');
  const method = encodeURIComponent($('statusMethod').value || 'all');
  const outcome = encodeURIComponent(statusFilter || 'all');
  const fmt = encodeURIComponent(format === 'excel' ? 'excel' : 'csv');
  const url = '/api/status/export?format=' + fmt + '&outcome=' + outcome + '&method=' + method + '&q=' + q;
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast(format === 'excel' ? 'Downloading Excel report…' : 'Downloading CSV report…', 'ok');
}

function handleCsvUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const existing = $('bulkInput').value.trim();
    const loaded = String(reader.result || '').trim();
    $('bulkInput').value = existing ? (existing + String.fromCharCode(10) + loaded) : loaded;
    toast('Loaded ' + file.name, 'ok');
    input.value = '';
  };
  reader.readAsText(file);
}

async function autoFillBulkFallback() {
  try {
    const res = await fetch('/api/option1/create-link', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        label: 'Bulk Queue Fallback',
        mode: 'join_request',
        expireHours: 168,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connect Bot in Integrate Telegram first');
    $('bulkFallback').value = data.inviteLink;
    toast('Created & filled Option 1 fallback link!', 'ok');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function enqueueBulkRequest(autoStart) {
  const text = $('bulkInput').value.trim();
  const box = $('bulkEnqueueResult');
  if (!text) return toast('Paste or upload at least one customer first', 'err');
  $('bulkAddBtn').disabled = true;
  try {
    const res = await fetch('/api/bulk/enqueue', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        text,
        autoStart: Boolean(autoStart),
        fallbackInviteLink: $('bulkFallback').value.trim(),
        vipDays: Number($('bulkVipDays').value || 0),
        autoRemove: $('bulkAutoRemove').checked,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to enqueue customers');
    box.className = 'result-box show ' + (data.added > 0 ? 'ok' : '');
    box.innerHTML = '<b>Added ' + data.added + ' customer(s)</b> · Skipped ' + data.skippedDuplicates + ' duplicate(s) · Skipped ' + data.skippedAlreadyInGroup + ' already in group' +
      (data.invalidRows && data.invalidRows.length ? ' · ' + data.invalidRows.length + ' invalid line(s)' : '');
    if (data.added > 0) $('bulkInput').value = '';
    toast('Queue updated (' + data.added + ' added)', 'ok');
    refreshStatus(false);
  } catch (err) {
    box.className = 'result-box show err';
    box.textContent = err.message;
    toast(err.message, 'err');
  } finally {
    $('bulkAddBtn').disabled = false;
  }
}

function submitBulkEnqueue(e) {
  e.preventDefault();
  enqueueBulkRequest(true);
}

function enqueueBulkOnly() {
  enqueueBulkRequest(false);
}

async function bulkAction(action, itemId) {
  try {
    const payload = {
      action,
      itemId: itemId || '',
      fallbackInviteLink: $('bulkFallback').value.trim(),
    };
    if (action === 'start') {
      payload.vipDays = Number($('bulkVipDays').value || 0);
      payload.autoRemove = $('bulkAutoRemove').checked;
    }
    const res = await fetch('/api/bulk/control', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Queue update failed');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  }
}

function removeBulkItem(btn) {
  bulkAction('remove_item', btn.dataset.id);
}

function toggleBulkRun() {
  const isRunning = Boolean(appData && appData.bulkQueue && appData.bulkQueue.running);
  bulkAction(isRunning ? 'pause' : 'start');
}

async function runNextBulkNow() {
  $('bulkStepBtn').disabled = true;
  try {
    const res = await fetch('/api/bulk/step', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Step failed');
    const sr = data.stepResult || {};
    if (sr.blocked) {
      toast(sr.message || 'Safety pause active', 'err');
    } else if (sr.processed) {
      toast('Processed ' + (sr.item && sr.item.target ? sr.item.target : 'customer'), 'ok');
    } else {
      toast('No pending items in queue', 'ok');
    }
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    $('bulkStepBtn').disabled = false;
  }
}

function bulkPillHtml(item) {
  if (item.status === 'done') return '<span class="tag tag-green">' + esc(item.resultStatus || 'DONE') + '</span>';
  if (item.status === 'failed') return '<span class="tag tag-red">' + esc(item.resultStatus || 'FAILED') + '</span>';
  if (item.status === 'skipped') return '<span class="tag tag-amber">' + esc(item.resultStatus || 'SKIPPED') + '</span>';
  return '<span class="tag tag-brand">Pending</span>';
}

function renderBulkQueue() {
  const q = (appData && appData.bulkQueue) || { running: false, pausedReason: '', items: [] };
  const items = q.items || [];
  let pending = 0, done = 0, skipped = 0, failed = 0;
  for (const it of items) {
    if (it.status === 'done') done++;
    else if (it.status === 'skipped') skipped++;
    else if (it.status === 'failed') failed++;
    else pending++;
  }

  $('navQueueCount').textContent = pending;
  $('bqPending').textContent = pending;
  $('bqDone').textContent = done;
  $('bqSkipped').textContent = skipped;
  $('bqFailed').textContent = failed;

  $('bulkToggleRunBtn').textContent = q.running ? 'Pause Drip' : 'Start Drip';
  const badge = $('bulkStateBadge');
  if (q.running) {
    badge.className = 'tag tag-green';
    badge.textContent = 'Running Drip';
  } else if (pending > 0) {
    badge.className = 'tag tag-amber';
    badge.textContent = 'Paused';
  } else {
    badge.className = 'tag tag-brand';
    badge.textContent = 'Idle';
  }

  const banner = $('bulkPausedBanner');
  if (q.pausedReason) {
    banner.style.display = 'flex';
    $('bulkPausedText').textContent = q.pausedReason;
  } else {
    banner.style.display = 'none';
  }

  if (!items.length) {
    $('bulkTableWrap').innerHTML = '<div class="empty" style="padding:28px 16px"><p style="margin-bottom:0">Queue is empty. Paste or upload a CSV customer list on the left.</p></div>';
    return;
  }

  $('bulkTableWrap').innerHTML = '<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Target</th><th>Queue Status</th><th>Details</th><th></th></tr></thead><tbody>' +
    items.slice(0, 100).map(it => '<tr>' +
      '<td><b>' + esc(it.name || 'Customer') + '</b></td>' +
      '<td style="color:var(--text-2)">' + esc(it.phone || (it.username ? '@' + it.username : it.target)) + '</td>' +
      '<td>' + bulkPillHtml(it) + '</td>' +
      '<td style="max-width:220px;color:var(--text-2);font-size:12px">' + esc(it.reason || 'Waiting safe slot') + '</td>' +
      '<td><button type="button" class="btn btn-sm" data-id="' + esc(it.id) + '" onclick="removeBulkItem(this)">Remove</button></td>' +
    '</tr>').join('') +
  '</tbody></table></div>';
}

async function refreshStatus(initForm) {
  if (!currentUser) return;
  const res = await fetch('/api/status');
  if (res.status === 401) {
    showAuthGate();
    return;
  }
  appData = await res.json();
  if (initForm) hydrateConfigForm();
  renderAll();
}

async function submitOption1(e) {
  e.preventDefault();
  const btn = $('o1Btn');
  const box = $('o1Result');
  btn.disabled = true;
  box.className = 'result-box show';
  box.textContent = 'Generating ban-proof Telegram link…';
  try {
    const vipDays = Number($('o1VipDays').value || 0);
    const autoRemove = $('o1AutoRemove').checked;
    const res = await fetch('/api/option1/create-link', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        label: $('o1Label').value,
        mode: $('o1Mode').value,
        expireHours: Number($('o1Hours').value),
        chatId: $('o1Chat').value || undefined,
        vipDays,
        autoRemove,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create invite link');
    const vipTag = data.vipDays > 0 ? (' · VIP ' + data.vipDays + 'd' + (data.autoRemove ? ' auto-remove' : '')) : '';
    box.className = 'result-box show ok';
    box.innerHTML = '<b>Safe Invite Link Ready</b> (' + (data.createsJoinRequest ? 'Auto-Approve enabled' : 'Single-use') + vipTag + ')' +
      '<div class="link-row"><code>' + esc(data.inviteLink) + '</code>' +
      '<button type="button" class="btn btn-sm" data-copy="' + esc(data.inviteLink) + '" onclick="copyFromBtn(this)">Copy</button></div>';
    $('o2Fallback').value = data.inviteLink;
    toast('Safe invite link created & saved!', 'ok');
    refreshStatus(false);
  } catch (err) {
    box.className = 'result-box show err';
    box.textContent = err.message;
    toast(err.message, 'err');
    refreshStatus(false);
  } finally {
    btn.disabled = false;
  }
}

async function autoFillFallback() {
  try {
    const res = await fetch('/api/option1/create-link', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        label: ('Fallback ' + ($('o2First').value || 'Customer')).slice(0, 32),
        mode: 'join_request',
        expireHours: 168,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connect Bot in Integrate Telegram first');
    $('o2Fallback').value = data.inviteLink;
    toast('Created & filled Option 1 fallback link!', 'ok');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function submitOption2(e) {
  e.preventDefault();
  const btn = $('o2Btn');
  const box = $('o2Result');
  btn.disabled = true;
  box.className = 'result-box show';
  box.textContent = 'Running safety checks & inviting…';
  try {
    const res = await fetch('/api/option2/contact-invite', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        phone: $('o2Phone').value,
        username: $('o2User').value,
        firstName: $('o2First').value,
        fallbackInviteLink: $('o2Fallback').value,
        vipDays: Number($('o2VipDays').value || 0),
        autoRemove: $('o2AutoRemove').checked,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invite failed');
    const isOk = data.outcome === 'success';
    box.className = 'result-box show ' + (isOk ? 'ok' : 'err');
    box.innerHTML = '<b>' + esc(data.status) + ':</b> ' + esc(data.message || ('Invited ' + data.target));
    toast(isOk ? 'Success: ' + data.status : 'Logged in Failed tab: ' + data.status, isOk ? 'ok' : 'err');
    refreshStatus(false);
  } catch (err) {
    box.className = 'result-box show err';
    box.textContent = err.message;
    toast(err.message, 'err');
    refreshStatus(false);
  } finally {
    btn.disabled = false;
  }
}

function recoverFromBtn(btn) {
  openMenu('option1');
  $('o1Label').value = String(btn.getAttribute('data-label') || 'Customer').slice(0, 32);
  $('o1Label').focus();
  toast('Pre-filled Option 1 label — click Generate Safe Invite Link', 'ok');
}

function copyFromBtn(btn) {
  const txt = btn.getAttribute('data-copy') || '';
  navigator.clipboard.writeText(txt).then(() => toast('Link copied!', 'ok')).catch(() => toast('Copy manually', 'err'));
}

function useAsFallback(btn) {
  $('o2Fallback').value = btn.getAttribute('data-copy') || '';
  openMenu('option2');
  toast('Set as Option 2 fallback link!', 'ok');
}

let saveBotInFlight = false;
async function saveBotConfig(e) {
  e.preventDefault();
  if (saveBotInFlight) return;
  saveBotInFlight = true;
  const saveBtn = $('intSaveBtn');
  if (saveBtn) saveBtn.disabled = true;
  try {
  const body = { chatId: $('cfgChatId').value.trim() };
  if ($('cfgBotToken').value.trim()) body.botToken = $('cfgBotToken').value.trim();
  const res = await fetch('/api/telegram/config', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) return toast(data.error, 'err');
  $('cfgBotToken').value = '';
  toast('Bot & Group settings saved to your account!', 'ok');
  await refreshStatus(true);
  await testConnections();
  } finally {
    saveBotInFlight = false;
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function saveMtprotoConfig(e) {
  e.preventDefault();
  const body = { apiId: $('cfgApiId').value.trim(), maxInvitesPerHour: Number($('cfgMaxHour').value), maxInvitesPerDay: Number($('cfgMaxDay').value) };
  if ($('cfgApiHash').value.trim()) body.apiHash = $('cfgApiHash').value.trim();
  const res = await fetch('/api/telegram/config', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) return toast(data.error, 'err');
  $('cfgApiHash').value = '';
  toast('MTProto settings saved to your account!', 'ok');
  await refreshStatus(true);
}

let verifyInFlight = false;
async function testConnections() {
  if (verifyInFlight) return;
  verifyInFlight = true;
  try {
  toast('Verifying Telegram connection…', 'ok');
  const res = await fetch('/api/telegram/inspect');
  const d = await res.json();

  lastWebhookUrl = (d.bot && d.bot.webhook && d.bot.webhook.url) ? d.bot.webhook.url : '';
  botVerified = Boolean(d.bot && d.bot.connected && d.bot.chat && d.bot.chat.isAdmin);
  const setCheck = (rowId, dotId, titleId, state, text) => {
    $(rowId).className = 'int-check' + (state === 'ok' ? ' ok' : state === 'warn' ? ' warn' : state === 'err' ? ' err' : '');
    $(dotId).className = 'live-dot' + (state === 'ok' ? ' ok' : state === 'warn' ? ' warn' : state === 'err' ? ' err' : '');
    $(titleId).textContent = text;
  };
  if (d.bot && d.bot.connected) {
    setCheck('diagBotRow', 'diagBotDot', 'diagBotTitle', 'ok', '@' + d.bot.bot.username);
    if (d.bot.chat) {
      setCheck('diagChatRow', 'diagChatDot', 'diagChatTitle', 'ok', d.bot.chat.title + (d.bot.chat.type ? ' · ' + d.bot.chat.type : ''));
      setCheck('diagAdminRow', 'diagAdminDot', 'diagAdminTitle', d.bot.chat.isAdmin ? 'ok' : 'warn', d.bot.chat.isAdmin ? 'Admin (' + (d.bot.chat.botStatus || 'administrator') + ')' : 'Not Admin — add the bot as Admin in the group');
      setCheck('diagInviteRow', 'diagInviteDot', 'diagInviteTitle', d.bot.chat.canInvite ? 'ok' : 'warn', d.bot.chat.canInvite ? 'Can invite users' : 'No invite rights — give the bot “Invite Users” permission');
    } else {
      setCheck('diagChatRow', 'diagChatDot', 'diagChatTitle', 'err', d.bot.chatError || 'Group not found — check the Group ID');
      setCheck('diagAdminRow', 'diagAdminDot', 'diagAdminTitle', '', 'Not checked');
      setCheck('diagInviteRow', 'diagInviteDot', 'diagInviteTitle', '', 'Not checked');
    }
  } else {
    setCheck('diagBotRow', 'diagBotDot', 'diagBotTitle', (d.bot && d.bot.error) ? 'err' : 'warn', (d.bot && d.bot.error) ? d.bot.error : 'Not connected');
    setCheck('diagChatRow', 'diagChatDot', 'diagChatTitle', '', 'Not checked');
    setCheck('diagAdminRow', 'diagAdminDot', 'diagAdminTitle', '', 'Not checked');
    setCheck('diagInviteRow', 'diagInviteDot', 'diagInviteTitle', '', 'Not checked');
  }

  const intConnError = Boolean((d.bot && d.bot.error) || (d.bot && d.bot.connected && !d.bot.chat));
  $('intConnPill').textContent = botVerified ? 'Connected' : intConnError ? 'Error' : 'Not connected';
  $('intConnPill').className = 'pill ' + (botVerified ? 'pill-green' : intConnError ? 'pill-red' : 'pill-amber');
  $('intStep1State').textContent = (d.bot && d.bot.connected) ? 'Set' : 'Not set';
  $('intStep1State').className = 'int-state' + ((d.bot && d.bot.connected) ? ' ok' : '');
  $('intStep2State').textContent = (d.bot && d.bot.chat) ? d.bot.chat.title : 'Not set';
  $('intStep2State').className = 'int-state' + ((d.bot && d.bot.chat) ? ' ok' : '');
  $('intStep3State').textContent = (d.bot && d.bot.chat) ? 'Checked' : 'Not checked';
  $('intStep3State').className = 'int-state' + ((d.bot && d.bot.chat) ? ' ok' : '');
  $('intStep4State').textContent = botVerified ? 'Ready' : 'Locked until verified';
  $('intStep4State').className = 'int-state' + (botVerified ? ' ok' : ' locked');
  $('intStep4Block').classList.toggle('locked', !botVerified);
  updateIntStepper(d);

  if (d.mtproto && d.mtproto.connected) {
    if (d.mtproto.accounts && d.mtproto.accounts.length > 1) {
      const okCount = d.mtproto.accounts.filter(a => a.connected).length;
      $('diagMtDot').className = okCount > 0 ? 'live-dot ok' : 'live-dot';
      $('diagMtTitle').textContent = 'Pool: ' + okCount + '/' + d.mtproto.accounts.length + ' accounts connected';
    } else {
      $('diagMtDot').className = 'live-dot ok';
      $('diagMtTitle').textContent = 'Signed in: ' + d.mtproto.user.firstName + (d.mtproto.user.phone ? ' (' + d.mtproto.user.phone + ')' : '');
    }
  } else {
    $('diagMtDot').className = 'live-dot';
    $('diagMtTitle').textContent = (d.mtproto && d.mtproto.error) ? d.mtproto.error : 'Account: Not signed in';
  }
  refreshStatus(false);
  } finally { verifyInFlight = false; }
}

function updateIntStepper(d) {
  const botOk = Boolean(d.bot && d.bot.connected);
  const chatOk = Boolean(d.bot && d.bot.chat);
  const adminOk = Boolean(d.bot && d.bot.chat && d.bot.chat.isAdmin);
  const steps = [
    { id: 'intStep1', done: botOk, current: !botOk },
    { id: 'intStep2', done: chatOk, current: botOk && !chatOk },
    { id: 'intStep3', done: adminOk, current: chatOk && !adminOk },
    { id: 'intStep4', done: false, current: botVerified },
  ];
  steps.forEach((s, i) => {
    const el = $(s.id);
    el.classList.toggle('done', s.done);
    el.classList.toggle('current', s.current);
    const ico = el.querySelector('.step-ico');
    if (ico) ico.textContent = s.done ? '✓' : String(i + 1);
  });
}

async function togglePolling() {
  const enable = !(appData && appData.pollingEnabled);
  const res = await fetch('/api/telegram/polling', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ enabled: enable }) });
  const data = await res.json();
  if (!res.ok) return toast(data.error, 'err');
  toast(data.pollingEnabled ? 'Local Listener enabled!' : 'Local Listener paused', 'ok');
  if (data.pollingEnabled) lastWebhookUrl = '';
  refreshStatus(false);
}

async function syncNow() {
  const btn = $('syncBtn');
  btn.disabled = true;
  try {
    const res = await fetch('/api/telegram/sync', { method:'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    toast('Synced ' + data.processed + ' Telegram event(s)', 'ok');
    refreshStatus(false);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = !botVerified;
  }
}

async function setWebhook() {
  // First click reveals the URL field inside the Webhook card; second click (or Set Webhook) submits it.
  const wrap = $('webhookUrlWrap');
  if (wrap.hidden) {
    wrap.hidden = false;
    $('cfgWebhookUrl').focus();
    return;
  }
  const url = $('cfgWebhookUrl').value.trim();
  if (!url) {
    $('cfgWebhookUrl').focus();
    return toast('Add your webhook URL first', 'err');
  }
  const res = await fetch('/api/telegram/webhook-setup', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ url }) });
  const data = await res.json();
  if (!res.ok) return toast(data.error, 'err');
  toast('Webhook configured!', 'ok');
  testConnections();
}

function toggleBotToken() {
  const input = $('cfgBotToken');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  $('cfgTokenToggle').textContent = show ? 'Hide' : 'Show';
}

async function sendTestInvite() {
  const btn = $('intTestBtn');
  const box = $('intTestOut');
  btn.disabled = true;
  box.className = 'result-box show';
  box.textContent = 'Creating a real test invite link…';
  try {
    const res = await fetch('/api/option1/create-link', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ label: 'Test Invite', mode: 'join_request', expireHours: 168 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connect Bot in Integrate Telegram first');
    box.className = 'result-box show ok';
    box.innerHTML = '<b>Test invite link ready:</b> <span style="word-break:break-all">' + esc(data.inviteLink) + '</span> <button type="button" class="btn btn-sm" data-copy="' + esc(data.inviteLink) + '" onclick="copyFromBtn(this)">Copy Link</button>';
    toast('Test invite link created!', 'ok');
    refreshStatus(false);
  } catch (err) {
    box.className = 'result-box show err';
    box.textContent = err.message;
    toast(err.message, 'err');
  } finally {
    btn.disabled = !botVerified;
  }
}

async function mtSendCode() {
  const out = $('mtLoginOut'); out.className = 'result-box show'; out.textContent = 'Sending login code…';
  try {
    const res = await fetch('/api/telegram/mtproto/send-code', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ apiId: $('cfgApiId').value.trim(), apiHash: $('cfgApiHash').value.trim(), phoneNumber: $('mtPhone').value.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    activeLoginId = data.loginId;
    $('mtOtpArea').style.display = 'grid';
    out.className = 'result-box show ok';
    out.textContent = data.message;
  } catch (err) {
    out.className = 'result-box show err';
    out.textContent = err.message;
  }
}

async function mtCompleteLogin() {
  const out = $('mtLoginOut'); out.className = 'result-box show'; out.textContent = 'Verifying code…';
  try {
    const res = await fetch('/api/telegram/mtproto/verify-code', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        loginId: activeLoginId,
        phoneCode: $('mtCode').value.trim(),
        password: $('mtPass').value,
        label: $('mtLabel').value.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.status === 'NEEDS_2FA_PASSWORD') {
      out.className = 'result-box show';
      out.textContent = data.message;
      return;
    }
    $('mtOtpArea').style.display = 'none';
    $('mtPhone').value = '';
    $('mtLabel').value = '';
    $('mtCode').value = '';
    $('mtPass').value = '';
    out.className = 'result-box show ok';
    out.textContent = 'Signed in and saved session to your account pool!';
    toast('Option 2 account added to pool!', 'ok');
    await refreshStatus(true);
    await testConnections();
  } catch (err) {
    out.className = 'result-box show err';
    out.textContent = err.message;
  }
}

const LEGAL_DOCS = {
  privacy: {
    title: 'Privacy Policy',
    paragraphs: [
      '<b>Account &amp; Workspace Data:</b> Tenh stores your workspace account details (name, email, scrypt-hashed password), Telegram invite history, and per-account settings strictly within your local server data storage.',
      '<b>Credentials Security:</b> Bot tokens, Telegram API hashes, and MTProto session strings are kept server-side per user and masked before any status response is returned to the browser.',
      '<b>Zero Third-Party Sharing:</b> Your customer contact details, phone numbers, invite links, and leave tracking logs are never sold, rented, or shared with outside services.',
    ],
  },
  policy: {
    title: 'Safe Inviter & Usage Policy',
    paragraphs: [
      '<b>Option 1 Recommended:</b> Bot invite links with auto-approval carry zero personal-account spam risk and are the primary method supported by Tenh Gram.',
      '<b>Rate Protection for Option 2:</b> Direct contact imports and invites enforce strict hourly and daily caps, randomized human delays, and an automatic 24-hour circuit breaker if Telegram returns PEER_FLOOD.',
      '<b>Permitted Contacts Only:</b> You may only invite customers and contacts who opted in or purchased from your business.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    paragraphs: [
      '<b>Acceptance of Terms:</b> By signing in or using Tenh Gram (Copyright 2026 Tenh), you agree to operate this tool lawfully and in full compliance with Telegram Terms of Service.',
      '<b>User Responsibility:</b> Account owners are responsible for keeping bot tokens, API hashes, and login passwords secure, and for obtaining customer consent before sending group invites or messages.',
      '<b>Service Availability:</b> Tenh provides built-in rate guards to reduce account risk, though final enforcement decisions rest with Telegram.',
    ],
  },
};

function openLegalModal(key) {
  const doc = LEGAL_DOCS[key] || LEGAL_DOCS.privacy;
  $('legalModalTitle').textContent = doc.title;
  $('legalModalBody').innerHTML = doc.paragraphs.map(p => '<p>' + p + '</p>').join('');
  $('legalModal').classList.add('open');
}

function closeLegalModal() {
  $('legalModal').classList.remove('open');
}

function openIntHelp() {
  $('intHelpModal').classList.add('open');
}

function closeIntHelp() {
  $('intHelpModal').classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('legalModal').classList.contains('open')) closeLegalModal();
  if (e.key === 'Escape' && $('intHelpModal').classList.contains('open')) closeIntHelp();
});

try {
  if (localStorage.getItem('tenhgram_side_collapsed') === '1') applySidebarState(true);
} catch {}
initAuth();
setInterval(() => { if (currentUser && document.visibilityState === 'visible') refreshStatus(false); }, 5000);
</script>
</body>
</html>`;
