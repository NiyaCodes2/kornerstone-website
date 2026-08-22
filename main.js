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


// KSPS public proposal form -> Formspree via AJAX
const proposalForm = document.getElementById('proposalForm');
if (proposalForm) {
  proposalForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('proposalFormStatus');
    const submitBtn = document.getElementById('proposalSubmitBtn');
    const formData = new FormData(proposalForm);
    status.className = 'form-status full';
    status.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    try {
      const response = await fetch(proposalForm.action, {method:'POST',body:formData,headers:{'Accept':'application/json'}});
      if (response.ok) {
        proposalForm.reset();
        proposalForm.innerHTML = `<div class="form-success-card"><strong>Request Received ✓</strong><p>Thanks for reaching out to Kornerstone Property Solutions. We received your property information and a member of our team will be in touch regarding next steps.</p></div>`;
      } else {
        const data = await response.json().catch(() => ({}));
        status.textContent = data?.errors?.map(e=>e.message).join(' ') || 'Something went wrong while submitting your request. Please try again.';
        status.className = 'form-status full show error';
        submitBtn.disabled = false; submitBtn.textContent = 'Request a Proposal';
      }
    } catch (error) {
      status.textContent = 'We could not send your request right now. Please check your connection and try again.';
      status.className = 'form-status full show error';
      submitBtn.disabled = false; submitBtn.textContent = 'Request a Proposal';
    }
  });
}
