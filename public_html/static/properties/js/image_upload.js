// static/properties/js/image_upload.js
document.addEventListener('DOMContentLoaded', function () {
    const fileInputs = document.querySelectorAll("input[type='file']");

    fileInputs.forEach(input => {
        FilePond.create(input, {
            allowMultiple: false,  // For admin inlines, keep one image per form
            allowReorder: false,
            allowImagePreview: true,
            imagePreviewMaxHeight: 150,
            labelIdle: 'Drag & Drop or <span class="filepond--label-action">Browse</span>',
            server: {
                process: {
                    url: (fieldName, file, metadata) => {
                        // Get property ID from the URL
                        const propertyId = window.location.pathname.split('/').filter(Boolean).pop();
                        return `/properties/admin/properties/property/${propertyId}/upload-image/`;
                    },
                    method: 'POST',
                    withCredentials: false,
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    onload: (response) => {
                        const data = JSON.parse(response);
                        if (data.success) {
                            // Refresh the page to show the new image
                            window.location.reload();
                        } else {
                            console.error('Upload error:', data.error);
                            alert('Failed to upload image: ' + data.error);
                        }
                    },
                    onerror: (error) => {
                        console.error('Upload error:', error);
                        alert('Failed to upload image. Please try again.');
                    }
                }
            }
        });
    });
});
