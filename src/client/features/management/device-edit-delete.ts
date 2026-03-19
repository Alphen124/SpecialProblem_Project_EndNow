// === EDIT DEVICE FUNCTIONALITY ===
document.addEventListener('DOMContentLoaded', function () {
  const editModalOverlay = document.getElementById('editModalOverlay') as HTMLElement | null;
  const closeEditModal = document.getElementById('closeEditModal') as HTMLElement | null;
  const cancelEditModal = document.getElementById('cancelEditModal') as HTMLElement | null;
  const editDeviceForm = document.getElementById('editDeviceForm') as HTMLFormElement | null;

  function openEditModal(deviceId: string): void {
    const card = document.querySelector<HTMLElement>(`.rentout-card[data-id="${deviceId}"]`);
    if (!card) return;

    (document.getElementById('editDeviceId') as HTMLInputElement).value = deviceId;
    (document.getElementById('editDeviceId') as HTMLInputElement & { dataset: DOMStringMap }).dataset.imageUrl =
      card.dataset.imageUrl ?? '';
    (document.getElementById('editDeviceName') as HTMLInputElement).value = card.dataset.name ?? '';
    (document.getElementById('editDeviceType') as HTMLInputElement).value = card.dataset.type ?? '';
    (document.getElementById('editPrice') as HTMLInputElement).value = card.dataset.price ?? '';
    (document.getElementById('editDescription') as HTMLTextAreaElement).value =
      card.dataset.description ?? '';

    const previewContainer = document.getElementById('editImagePreview');
    if (previewContainer) previewContainer.innerHTML = '';

    const imageUrl = card.dataset.imageUrl ?? '';
    if (imageUrl && previewContainer) {
      try {
        const imageUrls = JSON.parse(imageUrl) as unknown;
        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
          previewContainer.innerHTML = (imageUrls as string[])
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
      } catch {
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
    (document.getElementById('editDeviceName') as HTMLInputElement | null)?.focus();
  }

  function closeEditModalFunc(): void {
    editModalOverlay?.setAttribute('aria-hidden', 'true');
    editModalOverlay?.classList.remove('open');
    document.body.style.overflow = '';
    editDeviceForm?.reset();
  }

  document.addEventListener('click', (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.btn-edit');
    if (!btn || (btn as HTMLButtonElement).disabled) return;
    const deviceId = btn.dataset.deviceId;
    if (deviceId) openEditModal(deviceId);
  });

  closeEditModal?.addEventListener('click', closeEditModalFunc);
  cancelEditModal?.addEventListener('click', closeEditModalFunc);
  editModalOverlay?.addEventListener('click', (e: MouseEvent) => {
    if (e.target === editModalOverlay) closeEditModalFunc();
  });

  editDeviceForm?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    let token: string | null = localStorage.getItem('access_token');
    if (!token && typeof getAuthToken === 'function') token = getAuthToken();
    if (!token) {
      alert('Please login first');
      window.location.href = '/features/auth/login.html';
      return;
    }

    // Detect admin
    let isAdmin = false;
    try {
      const pl = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      ) as { is_admin?: boolean };
      isAdmin = !!pl.is_admin;
    } catch { /* ignore */ }

    const deviceId = (document.getElementById('editDeviceId') as HTMLInputElement).value;
    const imageFilesInput = document.getElementById('editImages') as HTMLInputElement | null;
    const imageFiles = imageFilesInput?.files ?? null;
    const currentImageUrl =
      (document.getElementById('editDeviceId') as HTMLInputElement & { dataset: DOMStringMap })
        .dataset.imageUrl ?? '';

    const name = (document.getElementById('editDeviceName') as HTMLInputElement).value.trim();
    const type = (document.getElementById('editDeviceType') as HTMLInputElement).value;
    const priceRaw = (document.getElementById('editPrice') as HTMLInputElement).value;
    const price = isAdmin ? 0 : parseFloat(priceRaw);
    const description = (document.getElementById('editDescription') as HTMLTextAreaElement).value.trim();

    if (!name || !type || (!isAdmin && !price)) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const submitBtn = editDeviceForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      const originalText = submitBtn.textContent ?? 'Update';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading...';

      let imageUrls: string[] = [];

      if (imageFiles && imageFiles.length > 0) {
        submitBtn.textContent = `Uploading ${imageFiles.length} image(s)...`;
        try {
          imageUrls = await window.uploadDeviceImages(imageFiles);
          console.log('Images uploaded:', imageUrls);
        } catch (uploadError) {
          const err = uploadError as Error;
          console.error('Image upload failed:', err);
          alert('Failed to upload images: ' + err.message);
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }
      } else {
        try {
          const parsed = JSON.parse(currentImageUrl) as unknown;
          if (Array.isArray(parsed)) {
            imageUrls = parsed as string[];
          } else {
            imageUrls = currentImageUrl ? [currentImageUrl] : [];
          }
        } catch {
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

      const result = await response.json() as { success: boolean; message?: string; error?: string };

      if (response.ok && result.success) {
        closeEditModalFunc();
        const preview = document.getElementById('editImagePreview');
        if (preview) preview.innerHTML = '';
        alert('✅ Device updated successfully!');
        if (typeof loadMyDevices === 'function') await loadMyDevices();
      } else {
        throw new Error(result.message ?? result.error ?? 'Failed to update device');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error updating device:', err);
      alert('Error: ' + err.message);
      const submitBtn = editDeviceForm.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update';
      }
    }
  });

  // === DELETE DEVICE FUNCTIONALITY ===
  document.addEventListener('click', async (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.btn-delete');
    if (!btn || btn.disabled) return;
    const deviceId = btn.dataset.deviceId;
    if (!deviceId) return;

    const card = document.querySelector<HTMLElement>(`.rentout-card[data-id="${deviceId}"]`);
    const deviceName = card ? card.dataset.name ?? 'this device' : 'this device';

    if (!confirm(`Are you sure you want to delete "${deviceName}"?\n\nThis action cannot be undone.`)) return;

    let token: string | null = localStorage.getItem('access_token');
    if (!token && typeof getAuthToken === 'function') token = getAuthToken();
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

      const result = await response.json() as { success: boolean; message?: string; error?: string };

      if (response.ok && result.success) {
        alert('✅ Device deleted successfully!');
        if (typeof loadMyDevices === 'function') await loadMyDevices();
      } else {
        throw new Error(result.message ?? result.error ?? 'Failed to delete device');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting device:', err);
      alert('Error: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });
}); // End DOMContentLoaded
