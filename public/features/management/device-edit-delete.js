"use strict";
// === EDIT DEVICE FUNCTIONALITY ===
document.addEventListener('DOMContentLoaded', function () {
    const editModalOverlay = document.getElementById('editModalOverlay');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditModal = document.getElementById('cancelEditModal');
    const editDeviceForm = document.getElementById('editDeviceForm');
    function openEditModal(deviceId) {
        const card = document.querySelector(`.rentout-card[data-id="${deviceId}"]`);
        if (!card)
            return;
        document.getElementById('editDeviceId').value = deviceId;
        document.getElementById('editDeviceId').dataset.imageUrl =
            card.dataset.imageUrl ?? '';
        document.getElementById('editDeviceName').value = card.dataset.name ?? '';
        document.getElementById('editDeviceType').value = card.dataset.type ?? '';
        document.getElementById('editPrice').value = card.dataset.price ?? '';
        document.getElementById('editDescription').value =
            card.dataset.description ?? '';
        const previewContainer = document.getElementById('editImagePreview');
        if (previewContainer)
            previewContainer.innerHTML = '';
        const imageUrl = card.dataset.imageUrl ?? '';
        if (imageUrl && previewContainer) {
            try {
                const imageUrls = JSON.parse(imageUrl);
                if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                    previewContainer.innerHTML = imageUrls
                        .map(url => {
                        const decodedUrl = decodeURIComponent(url);
                        return `
                <div style="position:relative; display:inline-block; margin:5px;">
                  <img src="${decodedUrl}" style="width:100px; height:100px; object-fit:cover; border-radius:4px;" alt="Current">
                  <div style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.5); color:white; padding:2px 6px; border-radius:3px; font-size:10px;">Current</div>
                </div>
              `;
                    })
                        .join('');
                }
            }
            catch {
                if (imageUrl) {
                    previewContainer.innerHTML = `
            <div style="position:relative; display:inline-block; margin:5px;">
              <img src="${imageUrl}" style="width:100px; height:100px; object-fit:cover; border-radius:4px;" alt="Current">
              <div style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.5); color:white; padding:2px 6px; border-radius:3px; font-size:10px;">Current</div>
            </div>
          `;
                }
            }
        }
        editModalOverlay?.setAttribute('aria-hidden', 'false');
        editModalOverlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.getElementById('editDeviceName')?.focus();
    }
    function closeEditModalFunc() {
        editModalOverlay?.setAttribute('aria-hidden', 'true');
        editModalOverlay?.classList.remove('open');
        document.body.style.overflow = '';
        editDeviceForm?.reset();
    }
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-edit');
        if (!btn || btn.disabled)
            return;
        const deviceId = btn.dataset.deviceId;
        if (deviceId)
            openEditModal(deviceId);
    });
    closeEditModal?.addEventListener('click', closeEditModalFunc);
    cancelEditModal?.addEventListener('click', closeEditModalFunc);
    editModalOverlay?.addEventListener('click', (e) => {
        if (e.target === editModalOverlay)
            closeEditModalFunc();
    });
    editDeviceForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        let token = localStorage.getItem('access_token');
        if (!token && typeof getAuthToken === 'function')
            token = getAuthToken();
        if (!token) {
            alert('Please login first');
            window.location.href = '/features/auth/login.html';
            return;
        }
        // Detect admin
        let isAdmin = false;
        try {
            const pl = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            isAdmin = !!pl.is_admin;
        }
        catch { /* ignore */ }
        const deviceId = document.getElementById('editDeviceId').value;
        const imageFilesInput = document.getElementById('editImages');
        const imageFiles = imageFilesInput?.files ?? null;
        const currentImageUrl = document.getElementById('editDeviceId')
            .dataset.imageUrl ?? '';
        const name = document.getElementById('editDeviceName').value.trim();
        const type = document.getElementById('editDeviceType').value;
        const priceRaw = document.getElementById('editPrice').value;
        const price = isAdmin ? 0 : parseFloat(priceRaw);
        const description = document.getElementById('editDescription').value.trim();
        if (!name || !type || (!isAdmin && !price)) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            const submitBtn = editDeviceForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent ?? 'Update';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';
            let imageUrls = [];
            if (imageFiles && imageFiles.length > 0) {
                submitBtn.textContent = `Uploading ${imageFiles.length} image(s)...`;
                try {
                    imageUrls = await window.uploadDeviceImages(imageFiles);
                    console.log('Images uploaded:', imageUrls);
                }
                catch (uploadError) {
                    const err = uploadError;
                    console.error('Image upload failed:', err);
                    alert('Failed to upload images: ' + err.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
            }
            else {
                try {
                    const parsed = JSON.parse(currentImageUrl);
                    if (Array.isArray(parsed)) {
                        imageUrls = parsed;
                    }
                    else {
                        imageUrls = currentImageUrl ? [currentImageUrl] : [];
                    }
                }
                catch {
                    imageUrls = currentImageUrl ? [currentImageUrl] : [];
                }
            }
            const deviceData = {
                name,
                type,
                price,
                description,
                imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : '',
            };
            submitBtn.textContent = 'Updating...';
            const response = await fetch(`http://localhost:3001/api/devices/${deviceId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(deviceData),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                closeEditModalFunc();
                const preview = document.getElementById('editImagePreview');
                if (preview)
                    preview.innerHTML = '';
                alert('✅ Device updated successfully!');
                if (typeof loadMyDevices === 'function')
                    await loadMyDevices();
            }
            else {
                throw new Error(result.message ?? result.error ?? 'Failed to update device');
            }
        }
        catch (error) {
            const err = error;
            console.error('Error updating device:', err);
            alert('Error: ' + err.message);
            const submitBtn = editDeviceForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update';
            }
        }
    });
    // === DELETE DEVICE FUNCTIONALITY ===
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-delete');
        if (!btn || btn.disabled)
            return;
        const deviceId = btn.dataset.deviceId;
        if (!deviceId)
            return;
        const card = document.querySelector(`.rentout-card[data-id="${deviceId}"]`);
        const deviceName = card ? card.dataset.name ?? 'this device' : 'this device';
        if (!confirm(`Are you sure you want to delete "${deviceName}"?\n\nThis action cannot be undone.`))
            return;
        let token = localStorage.getItem('access_token');
        if (!token && typeof getAuthToken === 'function')
            token = getAuthToken();
        if (!token) {
            alert('Please login first');
            return;
        }
        try {
            btn.disabled = true;
            btn.textContent = 'Deleting...';
            const response = await fetch(`http://localhost:3001/api/devices/${deviceId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('✅ Device deleted successfully!');
                if (typeof loadMyDevices === 'function')
                    await loadMyDevices();
            }
            else {
                throw new Error(result.message ?? result.error ?? 'Failed to delete device');
            }
        }
        catch (error) {
            const err = error;
            console.error('Error deleting device:', err);
            alert('Error: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Delete';
        }
    });
}); // End DOMContentLoaded
