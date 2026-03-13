import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import type { ICartService, IEmailService, IProductService } from '@/interfaces';
import type { CartItem } from '@/types';

/**
 * Cron job endpoint for sending abandoned cart recovery emails
 * Runs every hour to detect and remind customers about their abandoned carts
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 * Vercel Cron: Configured in vercel.json
 */
export async function GET(request: NextRequest) {
  try {
    const cartService = container.resolve<ICartService>(TOKENS.ICartService);
    const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);
    const productService = container.resolve<IProductService>(TOKENS.IProductService);

    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Abandoned Cart Cron] Starting abandoned cart reminder job...');

    const abandonedCartsResult = await cartService.getAbandonedCartsForReminder(1, 3);

    if (!abandonedCartsResult.success || !abandonedCartsResult.data) {
      console.error('[Abandoned Cart Cron] Failed to get abandoned carts:', abandonedCartsResult.error);
      return NextResponse.json(
        { success: false, error: abandonedCartsResult.error || 'Internal server error' },
        { status: 500 }
      );
    }

    const abandonedCarts = abandonedCartsResult.data;

    if (abandonedCarts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No abandoned carts to remind',
        remindersSent: 0,
      });
    }

    console.log(`[Abandoned Cart Cron] Found ${abandonedCarts.length} abandoned carts to remind`);

    let remindersSent = 0;
    let remindersFailedCount = 0;
    const errors: string[] = [];

    for (const cart of abandonedCarts) {
      try {
        const enrichedItems = await Promise.all(
          (cart.items as CartItem[]).map(async (item) => {
            const productResult = await productService.getProduct(item.productId);
            return {
              name: productResult.success && productResult.data
                ? productResult.data.name
                : `Product ${item.productId}`,
              quantity: item.quantity,
              price: item.price,
            };
          })
        );

        const emailResult = await emailService.sendAbandonedCartRecovery(
          cart.email,
          {
            items: enrichedItems,
            total: cart.total,
            recoveryToken: cart.recoveryToken,
          },
          'sv'
        );

        if (!emailResult.success) {
          console.error(`[Abandoned Cart Cron] Failed to send email to cart ${cart.cartId}:`, emailResult.error);
          remindersFailedCount++;
          errors.push(`Failed to send email to ${cart.email}: ${emailResult.error}`);
          continue;
        }

        const markResult = await cartService.markCartReminded(cart.id);
        if (!markResult.success) {
          console.error(`[Abandoned Cart Cron] Failed to mark cart ${cart.id} as reminded:`, markResult.error);
          errors.push(`Failed to mark cart ${cart.id} as reminded: ${markResult.error}`);
        }

        remindersSent++;
      } catch (error) {
        console.error(`[Abandoned Cart Cron] Error processing cart ${cart.cartId}:`, error);
        remindersFailedCount++;
        errors.push(`Error processing cart ${cart.cartId}: ${error}`);
      }
    }

    console.log(`[Abandoned Cart Cron] Job completed. Sent: ${remindersSent}, Failed: ${remindersFailedCount}`);

    return NextResponse.json({
      success: true,
      message: `Sent ${remindersSent} abandoned cart reminders`,
      remindersSent,
      remindersFailed: remindersFailedCount,
      totalProcessed: abandonedCarts.length,
      errors,
    });
  } catch (error) {
    console.error('[Abandoned Cart Cron] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: `${error}` },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
