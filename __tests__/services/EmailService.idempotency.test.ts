import { EmailService } from '@/services/email/EmailService';

global.fetch = jest.fn();

describe('EmailService idempotency (ISSUE-019)', () => {
  let emailService: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-api-key';
    emailService = new EmailService();
  });

  it('forwards Idempotency-Key header when idempotencyKey is provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'msg-123' }),
    });

    await emailService.sendEmail({
      to: 'customer@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      idempotencyKey: 'order-confirm:order-abc',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Idempotency-Key': 'order-confirm:order-abc',
        }),
      })
    );
  });

  it('omits Idempotency-Key header when idempotencyKey is not provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'msg-456' }),
    });

    await emailService.sendEmail({
      to: 'customer@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers['Idempotency-Key']).toBeUndefined();
  });
});