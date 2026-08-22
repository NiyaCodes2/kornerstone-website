document.querySelectorAll('.accordion-row').forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.nextElementSibling;
    const isOpen = panel.classList.contains('open');

    document.querySelectorAll('.accordion-panel').forEach((p) => p.classList.remove('open'));
    document.querySelectorAll('.accordion-row').forEach((b) => {
      b.classList.remove('active');
      b.lastElementChild.textContent = '+';
    });

    if (!isOpen) {
      panel.classList.add('open');
      button.classList.add('active');
      button.lastElementChild.textContent = '—';
    }
  });
});
