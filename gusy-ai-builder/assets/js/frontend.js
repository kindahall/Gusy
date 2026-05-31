(function () {
  function submitForm(form) {
    const status = form.querySelector('.gusy-form-status');
    const data = Object.fromEntries(new FormData(form).entries());
    data.sourceUrl = window.location.href;

    if (status) {
      status.textContent = 'Sending';
    }

    fetch((window.GusyFrontendSettings && window.GusyFrontendSettings.restBase ? window.GusyFrontendSettings.restBase : '/wp-json/gusy/v1') + '/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': window.GusyFrontendSettings ? window.GusyFrontendSettings.nonce : ''
      },
      body: JSON.stringify(data)
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Request failed');
      }
      return response.json();
    }).then(function () {
      form.reset();
      if (status) {
        status.textContent = 'Request sent.';
      }
    }).catch(function () {
      if (status) {
        status.textContent = 'Unable to send the request right now.';
      }
    });
  }

  document.querySelectorAll('[data-gusy-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitForm(form);
    });
  });

  document.querySelectorAll('[data-gusy-pricing]').forEach(function (pricing) {
    const buttons = pricing.querySelectorAll('[data-billing]');
    const prices = pricing.querySelectorAll('[data-monthly]');

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const billing = button.getAttribute('data-billing');
        buttons.forEach(function (item) {
          item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
        });
        prices.forEach(function (price) {
          price.textContent = billing === 'yearly' ? price.getAttribute('data-yearly') : price.getAttribute('data-monthly');
        });
      });
    });
  });
})();
