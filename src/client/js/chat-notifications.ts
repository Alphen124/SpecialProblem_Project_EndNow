/**
 * chat-notifications.ts
 * Global floating chat-notification bell widget (Messenger / LINE style).
 * Polls /api/chat/notifications/unread every 30 s and shows a dropdown with
 * the latest notifications. Add <script src="/js/chat-notifications.js"></script>
 * to any page that should show the bell.
 *
 * Real-time integration: other scripts can fire
 *   window.dispatchEvent(new CustomEvent('chatNewNotif', { detail: { count: N } }))
 * to instantly bump the badge without waiting for the next poll.
 */
(function () {
  'use strict';

  const API = 'http://localhost:3001';
  const POLL_INTERVAL = 30_000;

  /* ── Auth ──────────────────────────────────────────────────── */
  function getToken(): string | null {
    const t = localStorage.getItem('access_token');
    if (!t) return null;
    try {
      const p = JSON.parse(atob(t.split('.')[1])) as { exp: number };
      return p.exp * 1000 > Date.now() ? t : null;
    } catch {
      return null;
    }
  }

  /* ── Utility ────────────────────────────────────────────────── */
  function escHtml(s: string | undefined | null): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initials(name: string | undefined | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name[0].toUpperCase();
  }

  function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'เมื่อกี้';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  }

  function chatLink(n: ChatNotification): string {
    const p = new URLSearchParams({
      room: n.roomName ?? '',
      deviceId: String(n.deviceId ?? ''),
      deviceName: n.deviceName ?? '',
      skipModal: '1',
    });
    return `/features/chat/rental-chat.html?${p.toString()}`;
  }

  /* ── Styles (injected once) ─────────────────────────────────── */
  function injectStyles(): void {
    if (document.getElementById('_cn_styles')) return;
    const s = document.createElement('style');
    s.id = '_cn_styles';
    s.textContent = `
#_cnWidget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9998;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Bell button */
#_cnBell {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: linear-gradient(135deg, #043873 0%, #0a5ba8 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 22px rgba(4,56,115,0.45);
  position: relative;
  transition: transform .2s, box-shadow .2s;
  outline: none;
}
#_cnBell:hover {
  transform: scale(1.09);
  box-shadow: 0 6px 30px rgba(4,56,115,0.55);
}
#_cnBell:active { transform: scale(.95); }

/* Badge */
#_cnBadge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  padding: 0 4px;
  display: none;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  animation: _cn_pulse 2s ease-in-out infinite;
}
#_cnBadge.on { display: flex; }
@keyframes _cn_pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.55); }
  50%      { box-shadow: 0 0 0 7px rgba(239,68,68,0); }
}

/* Dropdown */
#_cnDrop {
  position: absolute;
  bottom: 62px;
  right: 0;
  width: 340px;
  max-height: 500px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 14px 52px rgba(4,56,115,0.22), 0 2px 10px rgba(0,0,0,.08);
  border: 1px solid rgba(4,56,115,0.1);
  display: none;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
}
#_cnDrop.open {
  display: flex;
  animation: _cn_slideup .22s cubic-bezier(.34,1.56,.64,1);
}
@keyframes _cn_slideup {
  from { opacity:0; transform: translateY(16px) scale(.95); }
  to   { opacity:1; transform: translateY(0)  scale(1);    }
}

/* Header */
._cn_head {
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(4,56,115,0.09);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
._cn_head h3 {
  font-size: 14px;
  font-weight: 800;
  color: #043873;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
._cn_markall {
  font-size: 11px;
  color: #4F9CF9;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background .15s;
  font-family: inherit;
}
._cn_markall:hover { background: rgba(79,156,249,.1); }

/* List */
._cn_list {
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(4,56,115,.18) transparent;
}
._cn_list::-webkit-scrollbar { width: 4px; }
._cn_list::-webkit-scrollbar-thumb { background: rgba(4,56,115,.18); border-radius: 10px; }

/* Each row */
._cn_item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 15px;
  cursor: pointer;
  transition: background .15s;
  border-bottom: 1px solid rgba(4,56,115,.05);
  text-decoration: none;
  color: inherit;
}
._cn_item:hover       { background: rgba(4,56,115,.04); }
._cn_item.unread      { background: rgba(79,156,249,.07); }
._cn_item.unread:hover{ background: rgba(79,156,249,.13); }

._cn_av {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #043873, #0a5ba8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
._cn_body  { flex:1; min-width:0; }
._cn_title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
._cn_prev {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}
._cn_time {
  font-size: 11px;
  color: #9ca3af;
}
._cn_dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #4F9CF9;
  flex-shrink: 0;
  margin-top: 6px;
}

/* Empty state */
._cn_empty {
  padding: 44px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
._cn_empty_icon { font-size: 36px; margin-bottom: 10px; }

/* Footer */
._cn_foot {
  padding: 10px 16px;
  border-top: 1px solid rgba(4,56,115,.07);
  text-align: center;
  flex-shrink: 0;
}
._cn_foot a {
  font-size: 12px;
  color: #4F9CF9;
  text-decoration: none;
  font-weight: 600;
}
._cn_foot a:hover { text-decoration: underline; }
    `;
    document.head.appendChild(s);
  }

  /* ── DOM ───────────────────────────────────────────────────── */
  function injectWidget(): void {
    if (document.getElementById('_cnWidget')) return;
    const w = document.createElement('div');
    w.id = '_cnWidget';
    w.innerHTML = `
      <div id="_cnDrop">
        <div class="_cn_head">
          <h3>🔔 การแจ้งเตือนแชท</h3>
          <button class="_cn_markall" id="_cnMarkAll">อ่านทั้งหมด</button>
        </div>
        <div class="_cn_list" id="_cnList">
          <div class="_cn_empty">
            <div class="_cn_empty_icon">💬</div>
            <div>ยังไม่มีการแจ้งเตือน</div>
          </div>
        </div>
        <div class="_cn_foot">
          <a href="/features/devices/rentout.html?tab=chats">ดูแชทที่เข้ามาทั้งหมด →</a>
        </div>
      </div>
      <button id="_cnBell" title="การแจ้งเตือนแชท" aria-label="การแจ้งเตือนแชท">
        🔔
        <span id="_cnBadge"></span>
      </button>
    `;
    document.body.appendChild(w);

    document.getElementById('_cnBell')!.addEventListener('click', function (e: Event) {
      e.stopPropagation();
      toggleDrop();
    });
    document.getElementById('_cnMarkAll')!.addEventListener('click', function (e: Event) {
      e.stopPropagation();
      markAllRead();
    });
    document.addEventListener('click', function (e: MouseEvent) {
      const widget = document.getElementById('_cnWidget');
      if (widget && !widget.contains(e.target as Node)) closeDrop();
    });
  }

  let _open = false;

  function toggleDrop(): void {
    _open = !_open;
    const d = document.getElementById('_cnDrop');
    if (!d) return;
    if (_open) {
      d.classList.add('open');
      loadNotifications();
    } else {
      d.classList.remove('open');
    }
  }

  function closeDrop(): void {
    _open = false;
    const d = document.getElementById('_cnDrop');
    if (d) d.classList.remove('open');
  }

  /* ── Badge ─────────────────────────────────────────────────── */
  function setBadge(n: number): void {
    const b = document.getElementById('_cnBadge');
    if (!b) return;
    if (n > 0) {
      b.textContent = n > 99 ? '99+' : String(n);
      b.classList.add('on');
      const bell = document.getElementById('_cnBell');
      if (bell) {
        bell.style.animation = 'none';
        setTimeout(() => { bell.style.animation = ''; }, 10);
      }
    } else {
      b.classList.remove('on');
    }
  }

  /* ── API calls ─────────────────────────────────────────────── */
  async function fetchCount(): Promise<void> {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/chat/notifications/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { unread?: number };
      setBadge(data.unread ?? 0);
    } catch { /* silent */ }
  }

  async function loadNotifications(): Promise<void> {
    const token = getToken();
    if (!token) return;
    const list = document.getElementById('_cnList');
    if (!list) return;
    list.innerHTML = `<div class="_cn_empty"><div class="_cn_empty_icon">⏳</div><div>กำลังโหลด...</div></div>`;
    try {
      const res = await fetch(`${API}/api/chat/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('err');
      const data = await res.json() as NotificationsResponse;
      renderList(data.notifications ?? [], list);
      setBadge(data.unread ?? 0);
    } catch {
      list.innerHTML = `<div class="_cn_empty"><div class="_cn_empty_icon">⚠️</div><div>โหลดไม่สำเร็จ</div></div>`;
    }
  }

  function renderList(items: ChatNotification[], container: HTMLElement): void {
    if (!items.length) {
      container.innerHTML = `<div class="_cn_empty"><div class="_cn_empty_icon">💬</div><div>ยังไม่มีการแจ้งเตือน</div></div>`;
      return;
    }
    container.innerHTML = items.map(n => `
      <a class="_cn_item ${n.isRead ? '' : 'unread'}"
         href="${escHtml(chatLink(n))}"
         data-nid="${n.notifId}"
         onclick="window._cnClick(${n.notifId})">
        <div class="_cn_av">${escHtml(initials(n.senderName))}</div>
        <div class="_cn_body">
          <div class="_cn_title">${escHtml(n.senderName)} · ${escHtml(n.deviceName)}</div>
          <div class="_cn_prev">${escHtml(n.preview ?? 'ส่งข้อความใหม่')}</div>
          <div class="_cn_time">🕐 ${timeAgo(n.createdAt)}</div>
        </div>
        ${n.isRead ? '' : '<div class="_cn_dot"></div>'}
      </a>
    `).join('');
  }

  /* ── Click handler (global so inline onclick works) ─────────── */
  window._cnClick = function (notifId: number): void {
    const token = getToken();
    if (token && notifId) {
      fetch(`${API}/api/chat/notifications/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notifId }),
      }).catch(() => {});
    }
    const el = document.querySelector(`[data-nid="${notifId}"]`);
    if (el) {
      el.classList.remove('unread');
      const dot = el.querySelector('._cn_dot');
      if (dot) dot.remove();
    }
    const b = document.getElementById('_cnBadge');
    if (b && b.classList.contains('on')) {
      const cur = parseInt(b.textContent ?? '1') || 1;
      setBadge(Math.max(0, cur - 1));
    }
  };

  async function markAllRead(): Promise<void> {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API}/api/chat/notifications/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: '{}',
      });
    } catch { /* silent */ }
    setBadge(0);
    document.querySelectorAll('#_cnList ._cn_item').forEach(el => {
      el.classList.remove('unread');
      const dot = el.querySelector('._cn_dot');
      if (dot) dot.remove();
    });
  }

  /* ── Real-time hook ─────────────────────────────────────────── */
  window.addEventListener('chatNewNotif', function (e: Event) {
    const detail = (e as CustomEvent<{ count?: number }>).detail;
    const cnt = detail && typeof detail.count === 'number' ? detail.count : null;
    if (cnt !== null) {
      setBadge(cnt);
    } else {
      fetchCount();
    }
  });

  /* ── Bootstrap ──────────────────────────────────────────────── */
  function init(): void {
    if (!getToken()) return;
    injectStyles();
    injectWidget();
    fetchCount();
    setInterval(fetchCount, POLL_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
