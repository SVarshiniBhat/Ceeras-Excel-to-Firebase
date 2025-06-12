// Theme toggle switch
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-theme', themeToggle.checked);
});

// Smooth scroll and active nav link
const navLinks = document.querySelectorAll('.nav-links a');
const sections = Array.from(navLinks).map(link => document.querySelector(link.getAttribute('href')));

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth' });
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// Scroll spy to update active nav link on scroll
window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY || window.pageYOffset;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  let currentSectionIndex = -1;

  // If scrolled to the very top, highlight first nav link (Home)
  if (scrollPosition === 0) {
    currentSectionIndex = 0;
  }
  // If scrolled to the very bottom, highlight last nav link (Support)
  else if (Math.ceil(scrollPosition + windowHeight) >= documentHeight) {
    currentSectionIndex = sections.length - 1;
  }
  else {
    currentSectionIndex = sections.findIndex(section => {
      const rect = section.getBoundingClientRect();
      return rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
    });
  }

  if (currentSectionIndex === -1) {
    // If no section found, do not change active link
    return;
  }

  navLinks.forEach(link => link.classList.remove('active'));
  if (navLinks[currentSectionIndex]) {
    navLinks[currentSectionIndex].classList.add('active');
  }
});

// Drag and drop upload
const uploadContainer = document.getElementById('upload-container');
const excelInput = document.getElementById('excel');
const firebaseInput = document.getElementById('serviceAccount');
const excelFileName = document.getElementById('excel-file-name');
const firebaseFileName = document.getElementById('firebase-file-name');

// Drag over styling
uploadContainer.addEventListener('dragover', e => {
  e.preventDefault();
  uploadContainer.classList.add('dragging');
});

// Remove dragging style
uploadContainer.addEventListener('dragleave', e => {
  e.preventDefault();
  uploadContainer.classList.remove('dragging');
});

// Handle file drop
uploadContainer.addEventListener('drop', e => {
  e.preventDefault();
  uploadContainer.classList.remove('dragging');
  
  const files = e.dataTransfer.files;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (file.name.endsWith('.xlsx')) {
      excelInput.files = createFileList(file);
      excelInput.dispatchEvent(new Event('change'));
    } else if (file.name.endsWith('.json')) {
      firebaseInput.files = createFileList(file);
      firebaseInput.dispatchEvent(new Event('change'));
    } else {
      showErrorPopup('Only .xlsx (Excel) and .json (Firebase credentials) files are allowed.');
    }
  }
});

// Helper to create new FileList
function createFileList(file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  return dataTransfer.files;
}

// File input change handlers
excelInput.addEventListener('change', () => {
  excelFileName.textContent = excelInput.files.length > 0 ? excelInput.files[0].name : '';
});

firebaseInput.addEventListener('change', () => {
  firebaseFileName.textContent = firebaseInput.files.length > 0 ? firebaseInput.files[0].name : '';
});

// FAQ toggle
const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach(question => {
  question.addEventListener('click', () => {
    const expanded = question.getAttribute('aria-expanded') === 'true';
    question.setAttribute('aria-expanded', !expanded);
    const answer = question.nextElementSibling;
    if (answer) {
      if (!expanded) {
        answer.classList.add('show');
        answer.removeAttribute('hidden');
      } else {
        answer.classList.remove('show');
        answer.setAttribute('hidden', '');
      }
    }
  });
});

// Progress bar update
function updateProgress(percent) {
  const progressBar = document.getElementById('progress-bar');
  progressBar.style.width = percent + '%';
}

// SweetAlert2 notifications
function showSuccessPopup() {
  Swal.fire({
    icon: 'success',
    title: 'Successfully uploaded!',
    text: 'Check your database now.',
    confirmButtonColor: '#4F98CA',
    iconColor: '#4CAF50'
  });
}

function showErrorPopup(message) {
  Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: message || 'Something went wrong. Please try again.',
    confirmButtonColor: '#4F98CA'
  });
}

// Loader show/hide
const loaderContainer = document.getElementById('loader-container');
const uploadBtn = document.getElementById('upload-btn');

// Upload button click
uploadBtn.addEventListener('click', async () => {
  if (excelInput.files.length === 0) {
    showErrorPopup('Please select an Excel (.xlsx) file.');
    return;
  }
  if (firebaseInput.files.length === 0) {
    showErrorPopup('Please select a Firebase credentials (.json) file.');
    return;
  }

  if (loaderContainer) loaderContainer.style.display = 'flex';
  updateProgress(0);

  const formData = new FormData();
  formData.append('excel', excelInput.files[0]);
  formData.append('serviceAccount', firebaseInput.files[0]);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      updateProgress(100);
      showSuccessPopup();
    } else {
      const errorData = await response.json();
      showErrorPopup(errorData.message || 'Upload failed.');
    }
  } catch (error) {
    showErrorPopup(error.message);
  } finally {
    if (loaderContainer) loaderContainer.style.display = 'none';
    updateProgress(0);
  }
});
