/* AJ The Foot Doc: contact form handler.
   His email address is intentionally NOT used anywhere in this file (no mailto, no display) —
   the form delivers only through a hosted endpoint, so his address is never exposed to visitors
   or scrapers.

   TO MAKE THE FORM DELIVER MESSAGES (before launch):
     1. Create the form in Jotform / Formspree / a Worker, with the destination email set
        server-side (kept private on their platform, never in this code).
     2. Paste the POST endpoint URL into FORM_ENDPOINT below.
   Until an endpoint is set, the form does not send; it tells the visitor it is being finalized
   and points them to LinkedIn (a public channel). It never silently drops a message as "sent". */
(function () {
  var FORM_ENDPOINT = ''; // e.g. Jotform/Formspree POST URL. Destination email lives on that service, not here.
  var LINKEDIN = 'https://www.linkedin.com/in/alton-r-johnson-jr-dpm-dabpm-fasps-ffpm-rcps-cwsp-a1063734';

  var form = document.getElementById('contactForm');
  if (!form) return;
  var card = form.parentElement;
  var statusEl = document.getElementById('cf-status');
  var btn = document.getElementById('cf-submit');

  /* Deep-link preset: /contact/?request=cv arrives from the "Request his CV" links.
     Preselect Other and prefill the details so a CV request is one confirmed click. */
  if (/[?&]request=cv\b/.test(window.location.search)) {
    var other = form.querySelector('#p-other');
    if (other) other.checked = true;
    var details = form.querySelector('#cf-details');
    if (details && !details.value) {
      details.value = "I'd like to request Dr. Johnson's full curriculum vitae. A little about me and why:";
    }
  }

  function collect() {
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data.consent = form.querySelector('#cf-consent').checked ? 'yes' : 'no';
    return data;
  }

  function showSuccess() {
    card.innerHTML =
      '<div class="cf-success">' +
        '<div class="cf-tick" aria-hidden="true">✓</div>' +
        '<h3>Message on its way.</h3>' +
        '<p>Thank you for reaching out. Dr. Johnson’s team will get back to you at the email you provided.</p>' +
      '</div>';
  }

  function showPending() {
    /* No endpoint wired yet: be honest (do not claim it sent) and offer a working public channel.
       Never expose his email here. */
    card.innerHTML =
      '<div class="cf-success">' +
        '<div class="cf-tick" aria-hidden="true">✉</div>' +
        '<h3>Almost there.</h3>' +
        '<p>The contact form is being connected. For the fastest reply right now, reach Dr. Johnson’s team on LinkedIn.</p>' +
        '<p style="margin-top:20px"><a class="btn" href="' + LINKEDIN + '" target="_blank" rel="noopener">Message on LinkedIn</a></p>' +
      '</div>';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.className = 'cf-status';
    statusEl.textContent = '';

    if (!form.checkValidity()) {
      statusEl.className = 'cf-status cf-err';
      statusEl.textContent = 'Please complete the required fields, including the consent box.';
      form.reportValidity();
      return;
    }

    var data = collect();

    if (!FORM_ENDPOINT) { showPending(); return; }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { if (!r.ok) throw new Error('bad response'); return r; })
      .then(function () { showSuccess(); })
      .catch(function () {
        statusEl.className = 'cf-status cf-err';
        statusEl.textContent = 'Something went wrong sending that. Please try again in a moment, or reach out on LinkedIn.';
        btn.disabled = false;
        btn.textContent = 'Send message';
      });
  });
})();
