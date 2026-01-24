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
        yearDisplay = `<div class="project-year" data-year="${project.year}" style="flex: 0.3; text-align: left;">${project.year}</div>`;
        yearDisplayMobile = `<div class="project-year" data-year="${project.year}" style="flex: 0 0 60px; text-align: left;">${project.year}</div>`;
        line = '<hr>';
      } else {
        yearDisplay = `<div class="project-year" data-year="${project.year}" style="flex: 0.3; text-align: left;"></div>`;
        yearDisplayMobile = `<div class="project-year" data-year="${project.year}" style="flex: 0 0 60px; text-align: left;"></div>`;
      }

      const formattedIndex = projectIndex.toString().padStart(3, '0'); // Format as 001, 002, etc.

      return `
        <div class="sidebar-item" 
             onmouseover="startSlideshow(${index}); highlightYear('${project.year}')" 
             onmouseout="stopSlideshow(); removeHighlight('${project.year}')">
          <a href="work.html?id=${project.id}" class="project-link">
            <div class="desktop" style="display: flex; align-items: center;">
              <!-- Year -->
              ${yearDisplay}
              <!-- Sequential Number -->
              <div class="sequential-number">${formattedIndex}</div>
              <!-- Title -->
              <div style="flex: 2; text-align: left;">${project.title}</div>
              <!-- Type -->
              <div style="flex: 2; text-align: left;">${project.type}</div>
            </div>
            <div class="mobile">
              <div style="display: flex; align-items: left;">
                <!-- Year -->
                ${yearDisplayMobile}
                <!-- Title -->
                <div style="flex: 2.6; text-align: left;">${project.title} <g> ${project.type}</g></div>
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
  const imageGallery = document.getElementById('image-gallery');
  const projectSection = document.querySelector('.sidebar');

  if (projectSection) {
  window.addEventListener('scroll', function () {
    const projectSectionTop = projectSection.getBoundingClientRect().top;
    const headerHeight = document.querySelector('.header').offsetHeight;

    if (projectSectionTop <= headerHeight) {
      imageGallery.classList.add('fixed');
    } else {
      imageGallery.classList.remove('fixed');
    }
  });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const imageGallery = document.getElementById('gallery-image');
  let images = [];
  let slideshowInterval;

  function showRandomImage() {
    if (images.length > 0) {
      const currentIndex = Math.floor(Math.random() * images.length);
      imageGallery.innerHTML = `<img src="${images[currentIndex]}" alt="Slideshow Image" class="active">`;
    }
  }

  // Fetch projects data and store image paths in an array
  fetch('js/projects.json')
    .then(response => response.json())
    .then(data => {
      data.forEach(project => {
        project.media.forEach(mediaItem => {
          if (mediaItem.type === 'image' && !mediaItem.excludeFromIndex) {
            images.push(mediaItem.src);
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

  // Function to stop the initial slideshow
  function stopSlideshow() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
  }

  // Add hover event listeners to project elements
  const projectList = document.getElementById('project-list');
  if (projectList) {
    projectList.addEventListener('mouseover', function (event) {
      if (event.target.closest('.sidebar-item')) {
        stopSlideshow();
      }
    });

    projectList.addEventListener('mouseout', function (event) {
      if (event.target.closest('.sidebar-item')) {
        // Optionally, you can restart the slideshow when the mouse leaves the project
        showRandomImage();
        slideshowInterval = setInterval(showRandomImage, 3000);
      }
    });
  }

  // Menu toggle functionality
  const menuToggle = document.getElementById('menu-toggle');
  const menuItems = document.getElementById('menu-items');

  if (menuToggle && menuItems) {
    menuToggle.addEventListener('click', function () {
      const isHidden = menuItems.style.display === 'none';
      menuItems.style.display = isHidden ? 'block' : 'none';
      menuToggle.textContent = isHidden ? 'close' : 'menu';
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
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
});

document.addEventListener('DOMContentLoaded', function () {
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
});

document.addEventListener('DOMContentLoaded', function () {
  const landingOverlay = document.getElementById('landing-overlay');
  const enterBtn = document.getElementById('enter-site');
  let isLandingVisible = true;
  let scrollYAccumulator = 0;
  const thresholdRatio = 0.4;

  // Force video autoplay for iOS/Safari
  const bgVideo = document.querySelector('.landing-video-background video');
  if (bgVideo) {
    bgVideo.muted = true;
    bgVideo.play().catch(e => console.log("Autoplay failed:", e));
  }

  if (landingOverlay) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('skip') === 'true') {
      landingOverlay.style.display = 'none';
      document.body.style.overflow = 'hidden';
      isLandingVisible = false;
      
      const landingLogo = document.querySelector('.landing-logo');
      if (landingLogo) landingLogo.style.display = 'none';
    }
  }

  function hideLanding() {
    if (!isLandingVisible) return;
    isLandingVisible = false;
    
    // Slide out the landing page
    landingOverlay.style.transition = 'transform 1s ease-in-out';
    landingOverlay.style.transform = 'translateY(-100%)';
    landingOverlay.classList.add('slide-out');
    
    // Enable scrolling on the body after transition
    setTimeout(() => {
      document.body.style.overflow = 'hidden';
      // Optional: Pause video to save resources
      const video = landingOverlay.querySelector('video');
      if(video) video.pause();

      const landingLogo = document.querySelector('.landing-logo');
      if (landingLogo) landingLogo.style.display = 'none';
    }, 1000); // Match transition duration
  }

  if (landingOverlay && enterBtn) {
    // Click event
    enterBtn.addEventListener('click', function(e) {
      e.preventDefault();
      hideLanding();
    });

    // Scroll event (Mouse wheel)
    let wheelTimeout;
    window.addEventListener('wheel', function(e) {
      if (!isLandingVisible) return;
      
      scrollYAccumulator += e.deltaY;
      if (scrollYAccumulator < 0) scrollYAccumulator = 0;
      
      const windowHeight = window.innerHeight;
      
      landingOverlay.style.transition = 'none';
      landingOverlay.style.transform = `translateY(-${scrollYAccumulator}px)`;

      if (scrollYAccumulator > windowHeight * thresholdRatio) {
        hideLanding();
      } else {
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          if (isLandingVisible && scrollYAccumulator <= windowHeight * thresholdRatio) {
            landingOverlay.style.transition = 'transform 0.5s ease-out';
            landingOverlay.style.transform = 'translateY(0)';
            scrollYAccumulator = 0;
          }
        }, 150);
      }
    }, { passive: false });

    // Touch event (Swipe up)
    let touchStartY = 0;
    window.addEventListener('touchstart', e => {
        if (isLandingVisible) touchStartY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      if (!isLandingVisible) return;
      
      const currentTouchY = e.touches[0].clientY;
      const deltaY = touchStartY - currentTouchY;
      touchStartY = currentTouchY;

      scrollYAccumulator += deltaY;
      if (scrollYAccumulator < 0) scrollYAccumulator = 0;

      const windowHeight = window.innerHeight;
      landingOverlay.style.transition = 'none';
      landingOverlay.style.transform = `translateY(-${scrollYAccumulator}px)`;

      if (scrollYAccumulator > windowHeight * thresholdRatio) {
        hideLanding();
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (!isLandingVisible) return;
        const windowHeight = window.innerHeight;
        if (scrollYAccumulator <= windowHeight * thresholdRatio) {
            landingOverlay.style.transition = 'transform 0.5s ease-out';
            landingOverlay.style.transform = 'translateY(0)';
            scrollYAccumulator = 0;
        }
    });
  }
});