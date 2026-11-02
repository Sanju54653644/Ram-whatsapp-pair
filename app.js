let selectedSlot = '1';
const tabs = document.querySelectorAll('.tab');
const phone = document.getElementById('phone');
const generate = document.getElementById('generate');
const resultText = document.getElementById('resultText');
const copy = document.getElementById('copy');
const status = document.getElementById('status');

tabs.forEach(tab => tab.addEventListener('click', () => {
  selectedSlot = tab.dataset.slot;
  tabs.forEach(item => item.classList.toggle('active', item === tab));
  resultText.textContent = 'Your pair code will appear here';
  resultText.classList.remove('code');
  copy.hidden = true;
  status.textContent = '';
}));

generate.addEventListener('click', async () => {
  const number = phone.value.replace(/\D/g, '');
  if (!/^\d{8,15}$/.test(number)) {
    status.textContent = 'Enter a valid number with country code (8–15 digits).';
    return;
  }
  generate.disabled = true;
  generate.textContent = 'Generating...';
  status.textContent = 'Please wait. Do not close this page.';
  copy.hidden = true;
  try {
    const response = await fetch(`/api/pair/${selectedSlot}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Pairing request failed.');
    resultText.textContent = data.code;
    resultText.classList.add('code');
    copy.hidden = false;
    status.textContent = data.message || 'Code generated. Enter it in WhatsApp Linked Devices.';
  } catch (error) {
    resultText.textContent = 'Your pair code will appear here';
    resultText.classList.remove('code');
    status.textContent = error.message;
  } finally {
    generate.disabled = false;
    generate.textContent = '🔑 Generate Pair Code';
  }
});

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultText.textContent);
    status.textContent = 'Pairing code copied.';
  } catch {
    status.textContent = 'Copy unavailable. Select the code and copy it manually.';
  }
});
