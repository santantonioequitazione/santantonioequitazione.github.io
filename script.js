  const GALLERY_CACHE_KEY = 'gallery-manifest-v1';
  const GALLERY_CACHE_TTL_MS = 60 * 60 * 1000;
  let galleryItems = [];
  let currentLightboxIndex = -1;

  function formatVisibleNumber(phoneNumber) {
    const localNumber = phoneNumber.startsWith('39') ? phoneNumber.slice(2) : phoneNumber;
    return localNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }

  function createGalleryItem(item, index) {
    const button = document.createElement('button');
    button.className = 'gallery-item';
    button.type = 'button';
    button.setAttribute('aria-label', 'Apri immagine ' + (index + 1));

    const media = document.createElement('span');
    media.className = 'gallery-item-media';

    const img = document.createElement('img');
    img.src = item.thumb || item.src;
    img.loading = 'lazy';
    img.decoding = 'async';

    media.appendChild(img);
    button.appendChild(media);
    button.addEventListener('click', function () {
      openLightbox(index);
    });

    return button;
  }

  function updateLightboxImage() {
    const lightboxImage = document.getElementById('lightbox-image');
    const hasItems = galleryItems.length > 0;
    if (!hasItems || currentLightboxIndex < 0 || currentLightboxIndex >= galleryItems.length) {
      lightboxImage.src = '';
      lightboxImage.alt = '';
      return;
    }
    const item = galleryItems[currentLightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = 'Foto galleria ' + (currentLightboxIndex + 1);
  }

  function updateLightboxNav() {
    const prevButton = document.getElementById('lightbox-prev');
    const nextButton = document.getElementById('lightbox-next');
    const hasMultiple = galleryItems.length > 1;
    prevButton.disabled = !hasMultiple;
    nextButton.disabled = !hasMultiple;
    prevButton.hidden = !hasMultiple;
    nextButton.hidden = !hasMultiple;
  }

  function openLightbox(index) {
    const lightbox = document.getElementById('gallery-lightbox');
    if (!galleryItems.length) {
      return;
    }
    currentLightboxIndex = Math.max(0, Math.min(index, galleryItems.length - 1));
    updateLightboxImage();
    updateLightboxNav();

    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.setAttribute('open', 'open');
    }
    document.body.classList.add('lightbox-open');
  }

  function navigateLightbox(direction) {
    if (galleryItems.length < 2 || currentLightboxIndex < 0) {
      return;
    }
    currentLightboxIndex = (currentLightboxIndex + direction + galleryItems.length) % galleryItems.length;
    updateLightboxImage();
  }

  function closeLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    if (typeof lightbox.close === 'function') {
      lightbox.close();
    } else {
      lightbox.removeAttribute('open');
    }
    lightboxImage.src = '';
    lightboxImage.alt = '';
    currentLightboxIndex = -1;
    document.body.classList.remove('lightbox-open');
  }

  function getCachedGalleryManifest() {
    try {
      const raw = localStorage.getItem(GALLERY_CACHE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== 'number' || !Array.isArray(parsed.images)) {
        return null;
      }
      if ((Date.now() - parsed.ts) > GALLERY_CACHE_TTL_MS) {
        return null;
      }
      return parsed.images;
    } catch (_error) {
      return null;
    }
  }

  function setCachedGalleryManifest(images) {
    try {
      localStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify({ ts: Date.now(), images: images }));
    } catch (_error) {
      // Ignore storage errors (quota/private mode).
    }
  }

  function fetchGalleryManifest() {
    const cached = getCachedGalleryManifest();
    if (cached) {
      return Promise.resolve(cached);
    }

    return fetch('gallery/gallery.json', { cache: 'no-cache' })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Manifest non disponibile');
        }
        return response.json();
      })
      .then(function(images) {
        if (Array.isArray(images)) {
          setCachedGalleryManifest(images);
        }
        return images;
      });
  }

  document.addEventListener('DOMContentLoaded', function() {
    const phrases = [
      'Salve, vorrei avere informazioni sulle passeggiate a cavallo.',
      'Buongiorno, vorrei sapere di più sulla scuola.',
      'Ciao, vorrei avere informazioni sulla scuola addestramento.',
      'Salve, vorrei ricevere informazioni sulle gite ed escursioni a cavallo.',
      'Buongiorno, vorrei avere maggiori informazioni sul maneggio.',
      'Ciao, vorrei avere maggiori informazioni su Sant\'Antonio Equestrian Center.'
    ];

    const phoneNumber = '393486928009';
    const visibleNumber = formatVisibleNumber(phoneNumber);
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const encodedMessage = encodeURIComponent(randomPhrase);
    const phoneUrl = 'tel:+' + phoneNumber;
    const whatsappUrl = 'https://wa.me/' + phoneNumber + '?text=' + encodedMessage;

    document.querySelectorAll('[data-phone-link]').forEach(function(link) {
      link.href = phoneUrl;
    });

    document.querySelectorAll('[data-phone-text]').forEach(function(node) {
      node.textContent = visibleNumber;
    });

    document.querySelectorAll('[data-whatsapp-link]').forEach(function(link) {
      link.href = whatsappUrl;
    });

    const galleryGrid = document.getElementById('gallery-grid');
    const galleryEmpty = document.getElementById('gallery-empty');

    fetchGalleryManifest()
      .then(function(images) {
        if (!Array.isArray(images) || images.length === 0) {
          if (galleryEmpty) {
            galleryEmpty.hidden = false;
          }
          return;
        }
        galleryItems = images;
        updateLightboxNav();

        galleryItems.forEach(function(item, index) {
          galleryGrid.appendChild(createGalleryItem(item, index));
        });
      })
      .catch(function() {
        if (galleryEmpty) {
          galleryEmpty.hidden = false;
        }
      });

    const lightbox = document.getElementById('gallery-lightbox');
    document.getElementById('lightbox-prev').addEventListener('click', function() {
      navigateLightbox(-1);
    });
    document.getElementById('lightbox-next').addEventListener('click', function() {
      navigateLightbox(1);
    });
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
    lightbox.addEventListener('close', function() {
      document.body.classList.remove('lightbox-open');
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && lightbox.hasAttribute('open')) {
        closeLightbox();
        return;
      }
      if (!lightbox.hasAttribute('open')) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        navigateLightbox(-1);
      } else if (event.key === 'ArrowRight') {
        navigateLightbox(1);
      }
    });
  });
