"use strict";
(function () {
    const CART_KEY = 'notelet_cart_v1';
    const FAV_KEY = 'notelet_favs_v1';
    const HISTORY_KEY = 'notelet_history_v1';
    function getJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw)
                return fallback;
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        }
        catch {
            return fallback;
        }
    }
    function setJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function inferSource(item) {
        if (item?.source)
            return item.source;
        const price = item?.price;
        const total = item?.total;
        if ((price === '' || price == null) && typeof total === 'number' && total === 0)
            return 'borrow';
        return 'rent';
    }
    function addCartToHistory(items) {
        const history = getJson(HISTORY_KEY, []);
        const now = new Date().toISOString();
        (items ?? []).forEach(it => {
            const source = inferSource(it);
            history.push({
                ...it,
                source,
                status: it?.status ?? 'Completed',
                location: it?.location ?? 'Pick up or return Location',
                lessor: it?.lessor ?? (source === 'borrow' ? 'ComSci, KMITL' : 'Lessor Name'),
                completedAt: now,
            });
        });
        setJson(HISTORY_KEY, history);
    }
    function ensurePopups() {
        if (!document.getElementById('miniCartPopup')) {
            const div = document.createElement('div');
            div.id = 'miniCartPopup';
            div.className = 'mini-cart hidden';
            div.setAttribute('aria-hidden', 'true');
            div.innerHTML = [
                '<div class="mini-cart-inner">',
                '<button id="miniCartClose" class="mini-cart-close" aria-label="Close">×</button>',
                '<div id="miniCartItems"></div>',
                '<div class="mini-cart-footer">',
                '<div id="miniCartTotal" class="mini-cart-total"></div>',
                '<button id="miniCartCheckout" class="btn btn-cta">Check out</button>',
                '</div>',
                '</div>',
            ].join('');
            document.body.appendChild(div);
        }
        if (!document.getElementById('miniFavPopup')) {
            const div = document.createElement('div');
            div.id = 'miniFavPopup';
            div.className = 'mini-cart hidden';
            div.setAttribute('aria-hidden', 'true');
            div.innerHTML = [
                '<div class="mini-cart-inner">',
                '<button id="miniFavClose" class="mini-cart-close" aria-label="Close">×</button>',
                '<div id="miniFavItems"></div>',
                '<div class="mini-cart-footer">',
                '<div id="miniFavCount" class="mini-cart-total"></div>',
                '</div>',
                '</div>',
            ].join('');
            document.body.appendChild(div);
        }
        if (!document.getElementById('confirmDialog')) {
            const div = document.createElement('div');
            div.id = 'confirmDialog';
            div.className = 'mini-cart hidden';
            div.setAttribute('aria-hidden', 'true');
            div.style.cssText =
                'position:fixed;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);z-index:10000;';
            div.innerHTML = [
                '<div class="mini-cart-inner" style="width:360px;">',
                '<div style="display:flex;justify-content:space-between;align-items:center;">',
                '<strong>Confirm checkout</strong>',
                '<button id="confirmClose" class="mini-cart-close" aria-label="Close">×</button>',
                '</div>',
                '<div style="margin-top:12px;">Are you sure you want to checkout these items?</div>',
                '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">',
                '<button id="confirmNo" class="btn btn-ghost">Cancel</button>',
                '<button id="confirmYes" class="btn btn-cta">Confirm</button>',
                '</div>',
                '</div>',
            ].join('');
            document.body.appendChild(div);
        }
    }
    function buildCartMeta(it) {
        try {
            const dates = String(it?.date ?? '').split(' - ').map(s => s.trim()).filter(Boolean);
            if (dates.length === 1)
                return `${dates[0]} ${it?.pickup ?? ''} - ${it?.returnt ?? ''}`.trim();
            if (dates.length >= 2)
                return `${dates[0]} ${it?.pickup ?? ''} - ${dates[1]} ${it?.returnt ?? ''}`.trim();
            return `${it?.pickup ?? ''} - ${it?.returnt ?? ''}`.trim();
        }
        catch {
            return '';
        }
    }
    function renderMiniCart() {
        const itemsWrap = document.getElementById('miniCartItems');
        const totalEl = document.getElementById('miniCartTotal');
        if (!itemsWrap)
            return;
        const cart = getJson(CART_KEY, []);
        itemsWrap.innerHTML = '';
        let total = 0;
        let hasPriced = false;
        if (!Array.isArray(cart) || cart.length === 0) {
            itemsWrap.innerHTML = '<div class="mini-empty">Cart is empty</div>';
            if (totalEl)
                totalEl.textContent = '';
            return;
        }
        cart.forEach((it, idx) => {
            const source = inferSource(it);
            const isBorrow = source === 'borrow';
            const row = document.createElement('div');
            row.className = 'mini-item';
            const metaText = buildCartMeta(it);
            let priceText = '';
            if (!isBorrow) {
                const priceDisplay = typeof it?.total === 'number'
                    ? it.total.toFixed(2) + ' Baht'
                    : escapeHtml(it?.price ?? '');
                if (priceDisplay) {
                    priceText = priceDisplay + ' ';
                    hasPriced = true;
                    total +=
                        typeof it?.total === 'number'
                            ? it.total
                            : parseFloat(String(it?.price ?? '0').replace(/[^0-9.]/g, '')) || 0;
                }
            }
            row.innerHTML = `
        <div class="mini-item-left">
          <div class="mini-name">${escapeHtml(it?.name ?? '')}</div>
          <div class="mini-meta">${escapeHtml(metaText)}</div>
        </div>
        <div class="mini-item-right">${priceText}<button class="mini-delete" data-idx="${idx}" aria-label="Delete">Delete</button></div>
      `;
            itemsWrap.appendChild(row);
        });
        if (totalEl)
            totalEl.textContent = hasPriced ? 'Total ' + total.toFixed(2) + ' Baht' : '';
        itemsWrap.querySelectorAll('.mini-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-idx') ?? '-1', 10);
                const cart = getJson(CART_KEY, []);
                if (!Array.isArray(cart))
                    return;
                if (isNaN(i) || i < 0 || i >= cart.length)
                    return;
                cart.splice(i, 1);
                setJson(CART_KEY, cart);
                renderMiniCart();
                if (cart.length === 0)
                    showMiniCart(false);
            });
        });
    }
    function renderMiniFav() {
        const itemsWrap = document.getElementById('miniFavItems');
        const countEl = document.getElementById('miniFavCount');
        if (!itemsWrap)
            return;
        const favs = getJson(FAV_KEY, []);
        itemsWrap.innerHTML = '';
        if (!Array.isArray(favs) || favs.length === 0) {
            itemsWrap.innerHTML = '<div class="mini-empty">No favorites</div>';
            if (countEl)
                countEl.textContent = '';
            return;
        }
        favs.forEach((it, idx) => {
            const row = document.createElement('div');
            row.className = 'mini-item';
            row.innerHTML = `
        <div class="mini-item-left">
          <div class="mini-name">${escapeHtml(it?.name ?? '')}</div>
          <div class="mini-meta">${escapeHtml(it?.detail ?? '')}</div>
        </div>
        <div class="mini-item-right"><button class="mini-fav-delete" data-idx="${idx}" aria-label="Remove">Remove</button></div>
      `;
            itemsWrap.appendChild(row);
        });
        if (countEl)
            countEl.textContent = favs.length + ' favorites';
        itemsWrap.querySelectorAll('.mini-fav-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-idx') ?? '-1', 10);
                const favs = getJson(FAV_KEY, []);
                if (!Array.isArray(favs))
                    return;
                if (isNaN(i) || i < 0 || i >= favs.length)
                    return;
                favs.splice(i, 1);
                setJson(FAV_KEY, favs);
                renderMiniFav();
                if (favs.length === 0)
                    showMiniFav(false);
            });
        });
    }
    function showPopupAtAnchor(popupId, anchorId, show, renderFn) {
        const popup = document.getElementById(popupId);
        const anchor = document.getElementById(anchorId);
        if (!popup || !anchor)
            return;
        if (show) {
            if (renderFn)
                renderFn();
            const rect = anchor.getBoundingClientRect();
            popup.style.position = 'absolute';
            popup.style.left = rect.left + 'px';
            popup.style.top = rect.bottom + 8 + window.scrollY + 'px';
            popup.classList.remove('hidden');
            popup.setAttribute('aria-hidden', 'false');
        }
        else {
            popup.classList.add('hidden');
            popup.setAttribute('aria-hidden', 'true');
        }
    }
    function showMiniCart(show) {
        showPopupAtAnchor('miniCartPopup', 'headerCartBtn', show, renderMiniCart);
    }
    function showMiniFav(show) {
        showPopupAtAnchor('miniFavPopup', 'headerFavBtn', show, renderMiniFav);
    }
    function wire() {
        ensurePopups();
        const cartBtn = document.getElementById('headerCartBtn');
        const favBtn = document.getElementById('headerFavBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', e => {
                e.preventDefault();
                const popup = document.getElementById('miniCartPopup');
                const isHidden = popup?.classList.contains('hidden');
                showMiniCart(!!isHidden);
            });
        }
        if (favBtn) {
            favBtn.addEventListener('click', e => {
                e.preventDefault();
                const popup = document.getElementById('miniFavPopup');
                const isHidden = popup?.classList.contains('hidden');
                showMiniFav(!!isHidden);
            });
        }
        document.getElementById('miniCartClose')?.addEventListener('click', () => showMiniCart(false));
        document.getElementById('miniFavClose')?.addEventListener('click', () => showMiniFav(false));
        document.addEventListener('click', e => {
            const target = e.target;
            const cartPopup = document.getElementById('miniCartPopup');
            if (cartPopup &&
                !cartPopup.contains(target) &&
                target.id !== 'headerCartBtn' &&
                !target.closest('#miniCartPopup'))
                showMiniCart(false);
            const favPopup = document.getElementById('miniFavPopup');
            if (favPopup &&
                !favPopup.contains(target) &&
                target.id !== 'headerFavBtn' &&
                !target.closest('#miniFavPopup'))
                showMiniFav(false);
        });
        function reposition() {
            try {
                const cartPopup = document.getElementById('miniCartPopup');
                if (cartPopup && !cartPopup.classList.contains('hidden'))
                    showMiniCart(true);
                const favPopup = document.getElementById('miniFavPopup');
                if (favPopup && !favPopup.classList.contains('hidden'))
                    showMiniFav(true);
            }
            catch { /* ignore */ }
        }
        window.addEventListener('scroll', reposition);
        window.addEventListener('resize', reposition);
        document.getElementById('miniCartCheckout')?.addEventListener('click', () => {
            const dlg = document.getElementById('confirmDialog');
            if (!dlg)
                return;
            dlg.classList.remove('hidden');
            dlg.setAttribute('aria-hidden', 'false');
        });
        document.getElementById('confirmClose')?.addEventListener('click', () => {
            const dlg = document.getElementById('confirmDialog');
            if (!dlg)
                return;
            dlg.classList.add('hidden');
            dlg.setAttribute('aria-hidden', 'true');
        });
        document.getElementById('confirmNo')?.addEventListener('click', () => {
            const dlg = document.getElementById('confirmDialog');
            if (!dlg)
                return;
            dlg.classList.add('hidden');
            dlg.setAttribute('aria-hidden', 'true');
        });
        document.getElementById('confirmYes')?.addEventListener('click', () => {
            const dlg = document.getElementById('confirmDialog');
            if (!dlg)
                return;
            dlg.classList.add('hidden');
            dlg.setAttribute('aria-hidden', 'true');
            const cart = getJson(CART_KEY, []);
            const hasBorrow = Array.isArray(cart) && cart.some(it => inferSource(it) === 'borrow');
            addCartToHistory(cart);
            setJson(CART_KEY, []);
            renderMiniCart();
            showMiniCart(false);
            if (!hasBorrow)
                alert('Checkout complete (demo)');
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wire);
    }
    else {
        wire();
    }
})();
// Auth-gated "จัดการอุปกรณ์" nav link — requires login, opens in new tab
(function () {
    function setupRentoutLink() {
        document.querySelectorAll('.nav a[href="/features/devices/rentout.html"]').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem('access_token');
                if (!token) {
                    window.location.href = '/features/auth/login.html';
                }
                else {
                    window.open('/features/devices/rentout.html', '_blank');
                }
            });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupRentoutLink);
    }
    else {
        setupRentoutLink();
    }
})();
// Auth-aware "ค้นหาอุปกรณ์" nav link
(function () {
    function setupDevicesLink() {
        document
            .querySelectorAll('.nav a[href="/features/devices/devices.html"], .nav a[href="/features/auth/devices-auth.html"]')
            .forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem('access_token');
                if (token) {
                    window.location.href = '/features/auth/devices-auth.html';
                }
                else {
                    window.location.href = '/features/devices/devices.html';
                }
            });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDevicesLink);
    }
    else {
        setupDevicesLink();
    }
})();
