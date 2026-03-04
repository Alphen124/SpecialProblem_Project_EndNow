// === EDIT DEVICE FUNCTIONALITY ===
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {

const editModalOverlay = document.getElementById('editModalOverlay');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditModal = document.getElementById('cancelEditModal');
const editDeviceForm = document.getElementById('editDeviceForm');

function openEditModal(deviceId) {
  const card = document.querySelector(`.rentout-card[data-id="${deviceId}"]`);
  if (!card) return;

  document.getElementById('editDeviceId').value = deviceId;
  document.getElementById('editDeviceId').dataset.imageUrl = card.dataset.imageUrl || '';
  document.getElementById('editDeviceName').value = card.dataset.name || '';
  document.getElementById('editDeviceType').value = card.dataset.type || '';
  document.getElementById('editPrice').value = card.dataset.price || '';
  document.getElementById('editDescription').value = card.dataset.description ||'';

  // Clear previous image preview
  const previewContainer = document.getElementById('editImagePreview');
  if (previewContainer) previewContainer.innerHTML = '';

  // Show existing images
  const imageUrl = card.dataset.imageUrl || '';
  if (imageUrl && previewContainer) {
    try {
      const imageUrls = JSON.parse(imageUrl);
      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        previewContainer.innerHTML = imageUrls.map(url => `
          <div style="position:relative; display:inline-block; margin:5px;">
            <img src="${url}" style="width:100px; height:100px; object-fit:cover; border-radius:4px;" alt="Current">
            <div style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.5); color:white; padding:2px 6px; border-radius:3px; font-size:10px;">Current</div>
          </div>
        `).join('');
      }
    } catch (e) {
      // If not JSON, treat as single URL
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

  editModalOverlay.setAttribute('aria-hidden', 'false');
  editModalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('editDeviceName').focus();
}

function closeEditModalFunc() {
  editModalOverlay.setAttribute('aria-hidden', 'true');
  editModalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  editDeviceForm.reset();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-edit');
  if (!btn || btn.disabled) return;
  const deviceId = btn.dataset.deviceId;
  if (deviceId) openEditModal(deviceId);
});

closeEditModal && closeEditModal.addEventListener('click', closeEditModalFunc);
cancelEditModal && cancelEditModal.addEventListener('click', closeEditModalFunc);
editModalOverlay && editModalOverlay.addEventListener('click', (e) => {
  if (e.target === editModalOverlay) closeEditModalFunc();
});

editDeviceForm && editDeviceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  let token = localStorage.getItem('access_token');
  if (!token && typeof getAuthToken === 'function') token = getAuthToken();
  if (!token) { alert('Please login first'); window.location.href = '/login.html'; return; }

  const deviceId = document.getElementById('editDeviceId').value;
  const imageFiles = document.getElementById('editImages') ? document.getElementById('editImages').files : [];
  const currentImageUrl = document.getElementById('editDeviceId').dataset.imageUrl || '';

  // Validation
  const name = document.getElementById('editDeviceName').value.trim();
  const type = document.getElementById('editDeviceType').value;
  const price = parseFloat(document.getElementById('editPrice').value);
  const description = document.getElementById('editDescription').value.trim();

  if (!name || !type || !price) {
    alert('Please fill in all required fields'); return;
  }

  try {
    const submitBtn = editDeviceForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    // Upload new images if selected
    let imageUrls = [];
    if (imageFiles && imageFiles.length > 0) {
      submitBtn.textContent = `Uploading ${imageFiles.length} image(s)...`;
      try {
        imageUrls = await uploadDeviceImages(imageFiles);
        console.log('Images uploaded:', imageUrls);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        alert('Failed to upload images: ' + uploadError.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
    } else {
      // Keep existing images if no new upload
      try {
        imageUrls = currentImageUrl ? JSON.parse(currentImageUrl) : [];
        if (!Array.isArray(imageUrls)) imageUrls = currentImageUrl ? [currentImageUrl] : [];
      } catch {
        imageUrls = currentImageUrl ? [currentImageUrl] : [];
      }
    }

    const deviceData = {
      name: name,
      type: type,
      price: price,
      description: description,
      imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : ''
    };

    submitBtn.textContent = 'Updating...';

    const response = await fetch(`http://localhost:3001/api/devices/${deviceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });

    const result = await response.json();
    if (response.ok && result.success) {
      closeEditModalFunc();
      document.getElementById('editImagePreview').innerHTML = '';
      alert('✅ Device updated successfully!');
      if (typeof loadMyDevices === 'function') await loadMyDevices();
    } else throw new Error(result.message || result.error || 'Failed to update device');
  } catch (error) {
    console.error('Error updating device:', error);
    alert('Error: ' + error.message);
    const submitBtn = editDeviceForm.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Update';
  }
});

// === DELETE DEVICE FUNCTIONALITY ===
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-delete');
  if (!btn || btn.disabled) return;
  const deviceId = btn.dataset.deviceId;
  if (!deviceId) return;

  const card = document.querySelector(`.rentout-card[data-id="${deviceId}"]`);
  const deviceName = card ? card.dataset.name : 'this device';

  if (!confirm(`Are you sure you want to delete "${deviceName}"?\n\nThis action cannot be undone.`)) return;

  let token = localStorage.getItem('access_token');
  if (!token && typeof getAuthToken === 'function') token = getAuthToken();
  if (!token) { alert('Please login first'); return; }

  try {
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    const response = await fetch(`http://localhost:3001/api/devices/${deviceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();
    if (response.ok && result.success) {
      alert('✅ Device deleted successfully!');
      if (typeof loadMyDevices === 'function') await loadMyDevices();
    } else throw new Error(result.message || result.error || 'Failed to delete device');
  } catch (error) {
    console.error('Error deleting device:', error);
    alert('Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
});

}); // End DOMContentLoaded
