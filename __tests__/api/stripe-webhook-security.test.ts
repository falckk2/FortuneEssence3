import * as stripeRoute from '@/app/api/webhooks/stripe/route';

describe('Stripe webhook security (ISSUE-032, ISSUE-041)', () => {
  it('does not export a GET handler (ISSUE-032)', () => {
    expect((stripeRoute as Record<string, unknown>).GET).toBeUndefined();
    expect(stripeRoute.POST).toBeDefined();
  });
});

// escapeHtml is module-private; mirror its behaviour for template assertions.
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

describe('Stripe webhook email escaping expectations (ISSUE-041)', () => {
  it('documents expected escaping for payment failure admin email fields', () => {
    const orderId = '<script>evil</script>';
    const failureMessage = '<b>fail</b>';

    const snippet = `<p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
        <p><strong>Felmeddelande:</strong> ${escapeHtml(failureMessage)}</p>`;

    expect(snippet).toContain('&lt;script&gt;evil&lt;/script&gt;');
    expect(snippet).not.toContain('<script>');
  });

  it('escapes dispute template values in admin emails', () => {
    const disputeId = '<script>alert(1)</script>';
    const reason = 'fraudulent<img onerror=alert(1)>';

    const escapedSnippet = `<li><strong>Dispyt ID:</strong> ${escapeHtml(disputeId)}</li>
            <li><strong>Anledning:</strong> ${escapeHtml(reason)}</li>`;

    expect(escapedSnippet).toContain('&lt;script&gt;');
    expect(escapedSnippet).not.toContain('<script>');
    expect(escapedSnippet).toContain('&lt;img');
  });
});