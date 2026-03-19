// Multi-Image Upload Handler for Device Forms
(function () {
  // === Image Preview for Add Device Modal ===
  const addImageInput = document.getElementById('imageUpload') as HTMLInputElement | null;
  const addImagePreview = document.getElementById('imagePreview') as HTMLElement | null;

  if (addImageInput && addImagePreview) {
    addImageInput.addEventListener('change', (e: Event) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleImagePreview(files, addImagePreview);
    });
  }

  // === Image Preview for Edit Device Modal ===
  const editImageInput = document.getElementById('editImages') as HTMLInputElement | null;
  const editImagePreview = document.getElementById('editImagePreview') as HTMLElement | null;

  if (editImageInput && editImagePreview) {
    editImageInput.addEventListener('change', (e: Event) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleImagePreview(files, editImagePreview);
    });
  }

  // Handle image preview display
  function handleImagePreview(files: FileList, previewContainer: HTMLElement): void {
    previewContainer.innerHTML = '';

    if (!files || files.length === 0) return;

    // Limit to 5 images
    if (files.length > 5) {
      alert('Maximum 5 images allowed. Only first 5 will be used.');
    }

    const filesToPreview = Array.from(files).slice(0, 5);

    filesToPreview.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.warn(`File ${file.name} is not an image`);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 10MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const previewItem = document.createElement('div');
        previewItem.style.cssText =
          'position: relative; aspect-ratio: 1; border: 2px solid #ddd; border-radius: 8px; overflow: hidden;';

        const img = document.createElement('img');
        img.src = e.target?.result as string;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        img.alt = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '&times;';
        removeBtn.style.cssText =
          'position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 18px; line-height: 1; padding: 0;';
        removeBtn.title = 'Remove image';
        removeBtn.onclick = () => {
          previewItem.remove();
          // Note: Can't remove from FileList, but preview is removed
        };

        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        previewContainer.appendChild(previewItem);
      };
      reader.readAsDataURL(file);
    });
  }

  // === Upload Images to Server ===
  async function uploadImages(files: FileList): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    let token: string | null = localStorage.getItem('access_token');
    if (!token && typeof getAuthToken === 'function') {
      token = getAuthToken();
    }
    if (!token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    Array.from(files)
      .slice(0, 5)
      .forEach(file => {
        formData.append('images', file);
      });

    try {
      const response = await fetch('http://localhost:3001/api/upload/images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json() as { success: boolean; message?: string; data: { urls: string[] } };

      if (response.ok && result.success) {
        console.log('Images uploaded:', result.data.urls);
        return result.data.urls;
      } else {
        throw new Error(result.message ?? 'Failed to upload images');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Make uploadImages available globally
  window.uploadDeviceImages = uploadImages;
})();
