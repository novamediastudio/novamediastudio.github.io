let projectsData = [];
let slideshowInterval;

// Fetch projects data and store it in a variable
fetch('js/projects.json')
  .then(response => response.json())
  .then(data => {
    // Sort projects by year and month, placing non-numeric years at the bottom
    const sortedProjects = data.sort((a, b) => {
      const isANumeric = !isNaN(a.year);
      const isBNumeric = !isNaN(b.year);

      if (!isANumeric && isBNumeric) return 1;
      if (isANumeric && !isBNumeric) return -1;
      if (!isANumeric && !isBNumeric) return a.year.localeCompare(b.year);

      // Compare by year and month
      if (a.year !== b.year) {
        return b.year.localeCompare(a.year);
      }
      return (b.month || 0) - (a.month || 0); // Handle missing months by assuming 0
    });

    projectsData = sortedProjects;
    const projectList = document.getElementById('project-list');

    if (projectList) {
    let currentYear = '';
    let projectIndex = 0; // Sequential index for numbering

    projectList.innerHTML = sortedProjects.map((project, index) => {
      projectIndex += 1; // Increment the sequential number

      let yearDisplay = '';
      let yearDisplayMobile = '';
      let line = '';
      if (project.year !== currentYear) {
        currentYear = project.year;
        yearDisplay = `<div class="project-year" data-year="${project.year}">${project.year}</div>`;
        yearDisplayMobile = `<div class="project-year" data-year="${project.year}">${project.year}</div>`;
        line = '<hr>';
      } else {
        yearDisplay = `<div class="project-year" data-year="${project.year}"></div>`;
        yearDisplayMobile = `<div class="project-year" data-year="${project.year}"></div>`;
      }

      const formattedIndex = projectIndex.toString().padStart(3, '0'); // Format as 001, 002, etc.

      return `
        <div class="sidebar-item"
             onmouseover="startSlideshow(${index}); highlightYear('${project.year}')"
             onmouseout="stopSlideshow(); removeHighlight('${project.year}')">
          <a href="work.html?id=${project.id}" class="project-link">
            <div class="desktop sidebar-row">
              ${yearDisplay}
              <div class="project-title">${project.title}</div>
              <div class="project-type">${project.type}</div>
            </div>
            <div class="mobile">
              <div class="sidebar-row-mobile">
                ${yearDisplayMobile}
                <div class="project-title-mobile">${project.title} <g>${project.type}</g></div>
              </div>
            </div>
          </a>
        </div>
      `;
    }).join('');
    }
  });

// Function to highlight the year
function highlightYear(year) {
  const yearElements = document.querySelectorAll(`.project-year[data-year="${year}"]`);
  yearElements.forEach(element => element.classList.add('highlight'));
}

// Function to remove the highlight from the year
function removeHighlight(year) {
  const yearElements = document.querySelectorAll(`.project-year[data-year="${year}"]`);
  yearElements.forEach(element => element.classList.remove('highlight'));
}

function startSlideshow(index) {
  const gallery = document.getElementById('gallery-image');
  console.log(`Starting slideshow for project index: ${index}`);

  if (projectsData[index] && projectsData[index].media) {
    let currentMediaIndex = 0;
    const mediaItems = projectsData[index].media;

    // Function to show the current media item
    const showCurrentMedia = () => {
      const item = mediaItems[currentMediaIndex];
      let creditsHtml = '';
      if (item.credits) {
        if (item.link) {
          creditsHtml = `<div class="slideshow-credits" style="pointer-events: auto;"><a href="${item.link}" target="_blank">${item.credits}</a></div>`;
        } else {
          creditsHtml = `<div class="slideshow-credits">${item.credits}</div>`;
        }
      }

      if (item.type === 'image') {
        gallery.innerHTML = `<img src="${item.src}" alt="Project Image" class="active">${creditsHtml}`;
        clearInterval(slideshowInterval);
        slideshowInterval = setInterval(() => {
          currentMediaIndex = (currentMediaIndex + 1) % mediaItems.length;
          showCurrentMedia();
        }, 2500);
        // Check if the media type is a standard video file (mp4/webm)
      } else if (item.type === 'video' && !item.src.includes("drive.google.com")) {
        const fileExtension = item.src.split('.').pop();
        const mimeType = fileExtension === 'webm' ? 'video/webm' : 'video/mp4';
        gallery.innerHTML = `<video autoplay muted loop playsinline class="active">
      <source src="${item.src}" type="${mimeType}">
      Your browser does not support the video tag.
    </video>${creditsHtml}`;

        const videoElement = gallery.querySelector('video');
        videoElement.addEventListener('ended', () => {
          currentMediaIndex = (currentMediaIndex + 1) % mediaItems.length;
          showCurrentMedia();
        });
        clearInterval(slideshowInterval);

        // Check if the media type is a Google Drive video (iframe embed)
      } else if (item.type === 'google-drive-video') {
        gallery.innerHTML = `
      <iframe class="google-drive-video active"
              src="${item.src}" 
              width="auto" 
              height="auto"
              allow="autoplay"
              frameborder="0"
              sandbox="allow-top-navigation allow-scripts allow-forms"
              allowfullscreen>
      </iframe>${creditsHtml}`;
        clearInterval(slideshowInterval);
      }
    };

    showCurrentMedia();
  } else {
    console.error(`Media not found for project index: ${index}`);
    gallery.innerHTML = '<p>Preview not available.</p>';
  }
}

// Stop the slideshow
function stopSlideshow() {
  clearInterval(slideshowInterval);
}
// Add scroll indicator element
const projectDetails = document.querySelector('.project-details');
if (projectDetails) {
  const scrollIndicator = document.createElement('div');
  scrollIndicator.className = 'scroll-indicator';
  projectDetails.appendChild(scrollIndicator);

  // Handle scroll event
  projectDetails.addEventListener('scroll', () => {
    const atBottom = projectDetails.scrollHeight - projectDetails.scrollTop === projectDetails.clientHeight;
    projectDetails.classList.toggle('at-bottom', atBottom);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const imageGallery = document.getElementById('gallery-image');
  let images = []; // each entry: { src, title, year, id }
  let slideshowInterval;

  // Persistent tag element — created once, updated on each image change
  const galleryTag = document.createElement('a');
  galleryTag.className = 'gallery-project-tag';
  galleryTag.innerHTML = '<span class="gallery-tag-year"></span><span class="gallery-tag-title"></span>';
  document.body.appendChild(galleryTag);

  const tagYearEl  = galleryTag.querySelector('.gallery-tag-year');
  const tagTitleEl = galleryTag.querySelector('.gallery-tag-title');

  let tagTypingTimeout = null;

  // Typewriter for the gallery title — erases current text then types new one
  function typeGalleryTitle(element, newText) {
    if (tagTypingTimeout) clearTimeout(tagTypingTimeout);
    const typeSpeed   = 28;
    const eraseSpeed  = 18;
    const current     = element.textContent;

    function erase(len) {
      if (len === 0) { type(0); return; }
      element.textContent = current.substring(0, len - 1);
      tagTypingTimeout = setTimeout(() => erase(len - 1), eraseSpeed);
    }

    function type(i) {
      if (i > newText.length) return;
      element.textContent = newText.substring(0, i);
      tagTypingTimeout = setTimeout(() => type(i + 1), typeSpeed);
    }

    if (current === '') {
      type(0);
    } else {
      erase(current.length);
    }
  }

  function showRandomImage() {
    if (images.length === 0) return;
    const item = images[Math.floor(Math.random() * images.length)];
    imageGallery.innerHTML = `<img src="${item.src}" alt="${item.title}" class="active">`;
    galleryTag.href = `work.html?id=${item.id}`;
    tagYearEl.textContent  = item.year;
    typeGalleryTitle(tagTitleEl, item.title.toUpperCase());
  }

  // Fetch projects data and store image entries with project metadata
  fetch('js/projects.json')
    .then(response => response.json())
    .then(data => {
      data.forEach(project => {
        project.media.forEach(mediaItem => {
          if (mediaItem.type === 'image' && !mediaItem.excludeFromIndex) {
            images.push({ src: mediaItem.src, title: project.title, year: project.year, id: project.id });
          }
        });
      });

      // Start the slideshow
      if (images.length > 0) {
        // Show the first random image
        showRandomImage();

        // Change image every 3 seconds
        slideshowInterval = setInterval(showRandomImage, 3000);
      }
    });

  // Function to stop the background (index) slideshow
  function stopBackgroundSlideshow() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
  }

  // Add hover event listeners to project elements
  const projectList = document.getElementById('project-list');
  if (projectList) {
    // mouseover bubbles — only act when entering a sidebar-item from outside it
    projectList.addEventListener('mouseover', function (event) {
      const item = event.target.closest('.sidebar-item');
      if (!item) return;
      // relatedTarget is where the mouse came from; skip if still within same item
      if (item.contains(event.relatedTarget)) return;
      stopBackgroundSlideshow();
      galleryTag.style.visibility = 'hidden'; // hide tag — project hover takes over
    });

    // mouseout bubbles — only act when truly leaving a sidebar-item
    projectList.addEventListener('mouseout', function (event) {
      const item = event.target.closest('.sidebar-item');
      if (!item) return;
      // relatedTarget is where the mouse went; skip if still within same item
      if (item.contains(event.relatedTarget)) return;
      galleryTag.style.visibility = 'visible';
      showRandomImage();
      slideshowInterval = setInterval(showRandomImage, 3000);
    });
  }

  /* --- Custom Cursor --- */
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  document.body.appendChild(cursor);

  function moveCursor(x, y) {
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
  }

  // Initialize cursor position
  moveCursor(-10, -10);
  cursor.style.opacity = '0'; // Start hidden

  document.addEventListener('mousemove', (e) => {
    cursor.style.opacity = '1';
    moveCursor(e.clientX, e.clientY); 
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });

  document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'IFRAME') {
      cursor.style.opacity = '0';
    }
  });

  document.addEventListener('mousedown', () => {
    cursor.classList.add('pressed'); 
  });
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('pressed'); 
  });

  /* --- Typing Effect for Tags --- */
  const tags = ["A/V DUO", "VIDEO MAPPING", "IMMERSIVE EXPERIENCES"];
  const tagIds = ['current-tag', 'current-tag-mobile'];
  tagIds.forEach(id => {
    const tagElement = document.getElementById(id);
    if (tagElement) {
      let tagIndex = 0;
      let charIndex = 0;
      let isDeleting = false;
      let typeSpeed = 30;
      let holdTime = 3000;

      tagElement.textContent = "| " + tags[0];

      function typeEffect() {
        const currentTag = tags[tagIndex];

        if (isDeleting) {
          tagElement.textContent = currentTag.substring(charIndex);
          charIndex++;
          if (charIndex > currentTag.length) {
            isDeleting = false;
            tagIndex = (tagIndex + 1) % tags.length;
            charIndex = 1;
            setTimeout(typeEffect, 150);
          } else {
            setTimeout(typeEffect, typeSpeed);
          }
        } else {
          tagElement.textContent = currentTag.substring(currentTag.length - charIndex);
          charIndex++;
          if (charIndex > currentTag.length) {
            isDeleting = true;
            charIndex = 1;
            setTimeout(typeEffect, holdTime);
          } else {
            setTimeout(typeEffect, typeSpeed);
          }
        }
      }
      setTimeout(() => {
        isDeleting = true;
        charIndex = 1;
        typeEffect();
      }, holdTime);
    }
  });

  /* ── SPLASH SECTION LOGIC ── */
  const splashEl = document.getElementById('splash'); // Renamed from splash to splashEl

  // Bail out on pages that don't have the splash element (work, about, contact)
  if (!splashEl) return;

  // ── ?splash=false: suppress synchronously, before any async work ──
  // This must happen before the manifest fetch so there is no visible flash.
  if (new URLSearchParams(window.location.search).get('splash') === 'false') {
    splashEl.style.display = 'none';
    document.body.style.overflow = 'hidden';
    const _landingLogo = document.querySelector('.landing-logo');
    if (_landingLogo) _landingLogo.style.display = 'block';
    return; // Skip all splash setup
  }

  const vidA = document.getElementById('vid-a');
  const vidB = document.getElementById('vid-b');
  const dots = document.getElementById('progress-dots');
  const loadBar = document.getElementById('loading-bar');
  const loadFill = document.getElementById('loading-fill');
  const enterText = document.getElementById('enter-text'); // Changed from skipBtn
  const splashTag = document.getElementById('splash-tag');

  /* ── State ── */
  let sequence = []; // clip objects from manifest
  let currentIndex = 0; // which clip is currently playing
  let active = vidA; // the video element currently visible
  let standby = vidB; // the video element preloading the next clip
  let dotEls = []; // dot button elements

  // Splash visibility state for scroll/touch
  let isSplashVisible = true;
  let isTransitioning = false;
  let scrollYAccumulator = 0;
  const thresholdRatio = 0.2;

  /* ── 1. Fetch manifest ── */
  let manifest;
  (async () => { // Wrap the async part in an IIFE
    try {
      const res = await fetch('./js/manifest.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      manifest = await res.json();
    } catch (err) {
      console.error('[Splash] Could not load manifest.json:', err);
      hideSplash(false); // Hide without animation on error
      return;
    }

    sequence = manifest.sequence ?? [];
    if (sequence.length === 0) {
      hideSplash(false);
      return;
    }

    const loop = manifest.loop ?? true;
    const baseURL = manifest.baseURL ?? './videos';
    const fadeDur = manifest.fadeDuration ?? 700; // ms, should match CSS transition

    /* ── 2. Build progress dots ── */
    sequence.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Go to clip ${i + 1}`);
      btn.addEventListener('click', () => jumpTo(i));
      dots.appendChild(btn);
      dotEls.push(btn);
    });

    // Set initial state to block view
    document.body.classList.add('splash-active');

    /* ── 3. Load & play first clip ── */
    await loadInto(active, sequence[0], true);
    hideLoadingBar();
    play(active);
    updateDots(); // Initial UI update
    addClipListeners(active);

    /* Preload second clip straight away */
    if (sequence.length > 1) {
      preload(standby, sequence[1]);
    }

    /* ── 4. Enter text click ── */
    enterText.addEventListener('click', () => hideSplash(true));

    /* ── 5. Scroll/Touch events for hiding splash ── */
    // Scroll event (Mouse wheel)
    let wheelTimeout;
    window.addEventListener('wheel', function(e) {
      if (!isSplashVisible) return;

      e.preventDefault();
      scrollYAccumulator += e.deltaY;
      if (scrollYAccumulator < 0) scrollYAccumulator = 0;

      const windowHeight = window.innerHeight;

      splashEl.style.transition = 'none'; // Disable transition for direct scroll
      splashEl.style.transform = `translateY(-${scrollYAccumulator}px)`;

      if (scrollYAccumulator > windowHeight * thresholdRatio) {
        hideSplash(true); // Animate out
      } else {
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          if (isSplashVisible && scrollYAccumulator <= windowHeight * thresholdRatio) {
            splashEl.style.transition = 'transform 0.5s ease-out';
            splashEl.style.transform = 'translateY(0)';
            scrollYAccumulator = 0;
          }
        }, 150);
      }
    }, { passive: false });

    // Touch event (Swipe up)
    let touchStartY = 0;
    window.addEventListener('touchstart', e => {
      if (isSplashVisible) touchStartY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      if (!isSplashVisible) return;

      e.preventDefault();
      const currentTouchY = e.touches[0].clientY;
      const deltaY = touchStartY - currentTouchY;
      touchStartY = currentTouchY;

      scrollYAccumulator += deltaY;
      if (scrollYAccumulator < 0) scrollYAccumulator = 0;

      const windowHeight = window.innerHeight;
      splashEl.style.transition = 'none';
      splashEl.style.transform = `translateY(-${scrollYAccumulator}px)`;

      if (scrollYAccumulator > windowHeight * thresholdRatio) {
        hideSplash(true);
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (!isSplashVisible) return;
      if (!isSplashVisible || isTransitioning) return;
      const windowHeight = window.innerHeight;
      if (scrollYAccumulator <= windowHeight * thresholdRatio) {
        splashEl.style.transition = 'transform 0.5s ease-out';
        splashEl.style.transform = 'translateY(0)';
        scrollYAccumulator = 0;
      }
    });


    /* ════════════════════════════════════
       CORE FUNCTIONS
    ════════════════════════════════════ */

    /**
     * Set up listeners to trigger the next clip transition.
     * Triggers early based on fadeDur for a seamless crossfade.
     */
    function addClipListeners(videoEl) {
      const checkTime = () => {
        const offset = (fadeDur || 0) / 1000;
        if (videoEl.duration && videoEl.currentTime >= videoEl.duration - offset) {
          onClipEnded();
        }
      };
      videoEl._checkTime = checkTime;
      videoEl.addEventListener('timeupdate', checkTime);
      videoEl.addEventListener('ended', onClipEnded);
    }

    function removeClipListeners(videoEl) {
      videoEl.removeEventListener('ended', onClipEnded);
      if (videoEl._checkTime) {
        videoEl.removeEventListener('timeupdate', videoEl._checkTime);
        delete videoEl._checkTime;
      }
    }

    /**
     * Called when the active video finishes.
     */
    function onClipEnded() {
      removeClipListeners(active);
      const nextIndex = (currentIndex + 1) % sequence.length;

      // If we are at the end of the sequence and loop is disabled, hide the splash
      if (nextIndex === 0 && !loop) {
        hideSplash(true);
        return;
      }

      transitionTo(nextIndex);
    }

    /**
     * Jump to a specific clip index (e.g. from dot click).
     */
    function jumpTo(index) {
      if (index === currentIndex) return;

      // Stop and clear current video
      active.pause();
      removeClipListeners(active);

      // If the standby element already has the right clip, use it
      // Otherwise load fresh into standby
      const targetClip = sequence[index];
      const standbyReady =
        standby.dataset.clipIndex === String(index) &&
        standby.readyState >= 3; // HAVE_FUTURE_DATA

      const doTransition = () => {
        currentIndex = index;
        swapVideoEls();
        play(active);
        addClipListeners(active);
        updateDots();

        // Preload the next one
        const nextIndex = index + 1 < sequence.length ? index + 1 : (loop ? 0 : null);
        if (nextIndex !== null) {
          setTimeout(() => preload(standby, sequence[nextIndex]), fadeDur);
        }
      };

      if (standbyReady) {
        doTransition();
      } else {
        showLoadingBar();
        loadInto(standby, targetClip, false).then(() => {
          hideLoadingBar();
          doTransition();
        });
      }
    }

    /**
     * Crossfade from the current clip to the next one.
     */
    function transitionTo(nextIndex) {
      const nextClip = sequence[nextIndex];
      removeClipListeners(active);

      const doSwap = () => {
        currentIndex = nextIndex;
        swapVideoEls();

        // Reset position and play
        active.currentTime = 0;
        play(active);
        addClipListeners(active);
        updateDots();

        // Start preloading the one after next
        const afterNext = nextIndex + 1 < sequence.length ?
          nextIndex + 1 :
          (loop ? 0 : null);

        if (afterNext !== null) {
          setTimeout(() => preload(standby, sequence[afterNext]), fadeDur);
        }
      };

      // Check if standby is ready
      const standbyClipReady =
        standby.dataset.clipIndex === String(nextIndex) &&
        standby.readyState >= 3;

      if (standbyClipReady) {
        doSwap();
      } else {
        // Show loading bar while we wait for the next clip
        showLoadingBar();
        loadInto(standby, nextClip, false).then(() => {
          hideLoadingBar();
          doSwap();
        });
      }
    }

    /**
     * Swap active ↔ standby references and apply CSS classes.
     */
    function swapVideoEls() {
      // Cross-fade: active fades out, standby fades in
      active.classList.remove('active');
      active.classList.add('fading');
      standby.classList.add('active');
      standby.classList.remove('fading');

      // After transition, fully hide the old active
      const outgoing = active;
      setTimeout(() => {
        outgoing.classList.remove('fading');
        outgoing.pause();
      }, fadeDur);

      // Swap references
      [active, standby] = [standby, active];
    }

    /**
     * Set the src of a video element and wait until it can play.
     * Returns a promise.
     */
    function loadInto(videoEl, clip, isFirst) {
      return new Promise((resolve) => {
        const src = baseURL + clip.file;

        // If it's already loaded with this src, resolve immediately
        if (videoEl.dataset.src === src && videoEl.readyState >= 3) {
          resolve();
          return;
        }

        videoEl.src = src;
        videoEl.dataset.src = src;
        videoEl.dataset.clipIndex = String(sequence.indexOf(clip));
        videoEl.load();

        // Show progress on loading bar for first clip
        if (isFirst) {
          videoEl.addEventListener('progress', onProgress, { passive: true });
        }

        videoEl.addEventListener('canplaythrough', () => {
          if (isFirst) videoEl.removeEventListener('progress', onProgress);
          resolve();
        }, { once: true });

        // Fallback: if canplaythrough never fires, resolve on canplay
        videoEl.addEventListener('canplay', () => {
          if (isFirst) videoEl.removeEventListener('progress', onProgress);
          resolve();
        }, { once: true });

        // Error fallback
        videoEl.addEventListener('error', () => {
          console.warn('[Splash] Failed to load clip:', src);
          resolve(); // resolve anyway so the sequence doesn't stall
        }, { once: true });
      });
    }

    /**
     * Silently preload a clip into the standby video element.
     */
    function preload(videoEl, clip) {
      const src = baseURL + clip.file;
      if (videoEl.dataset.src === src) return; // already loaded
      videoEl.src = src;
      videoEl.dataset.src = src;
      videoEl.dataset.clipIndex = String(sequence.indexOf(clip));
      videoEl.preload = 'auto';
      videoEl.load();
    }

    /**
     * Play a video (handles the promise returned by .play() in modern browsers).
     */
    function play(videoEl) {
      videoEl.classList.add('active');
      const p = videoEl.play();
      if (p) p.catch(err => console.warn('[Splash] play() blocked:', err));
    }

    /* ── Loading bar helpers ── */
    function onProgress() {
      if (!active.duration) return;
      try {
        const buf = active.buffered;
        if (buf.length) {
          const pct = (buf.end(buf.length - 1) / active.duration) * 100;
          loadFill.style.width = Math.min(pct, 100) + '%';
        }
      } catch (_) {}
    }

    function showLoadingBar() {
      loadBar.classList.remove('hidden');
      loadFill.style.width = '0%';
    }

    function hideLoadingBar() {
      loadFill.style.width = '100%';
      setTimeout(() => loadBar.classList.add('hidden'), 400);
    }

    /* ── Dot state ── */
    function updateDots() {
      dotEls.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
      
      // Update Tag
      if (splashTag && sequence[currentIndex]) {
        // Only apply fade transition if splash is already fully visible
        const isInitialLoad = splashTag.textContent === "";
        if (!isInitialLoad) splashTag.style.opacity = '0';
        
        setTimeout(() => {
          splashTag.textContent = sequence[currentIndex].tag || '';
          if (!isInitialLoad) splashTag.style.opacity = '1';
        }, isInitialLoad ? 0 : 250);
      }
    }

    /* ── Hide splash and scroll to main content ── */
    function hideSplash(animate = true) {
      if (!isSplashVisible) return; // Prevent multiple calls
      isSplashVisible = false;

      const landingLogo = document.querySelector('.landing-logo');

      if (animate) {
        splashEl.style.transition = 'transform 1s ease-in-out';
        splashEl.style.transform = 'translateY(-100%)';
        splashEl.classList.add('slide-out');
        setTimeout(() => {
          splashEl.style.display = 'none';
          // Keep body overflow hidden — the page layout is locked by design;
          // only the sidebar scrolls internally.
          document.body.style.overflow = 'hidden';
          if (landingLogo) landingLogo.style.display = 'block';
        }, 1000); // Match CSS transition duration
      } else {
        splashEl.style.display = 'none';
        document.body.style.overflow = 'hidden';
        if (landingLogo) landingLogo.style.display = 'block';
      }
    }

  })(); // End of integrated splash.js logic
});