import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import type { ICartService, IEmailService, IProductService } from '@/interfaces';
import { TOKENS } from '@/config/di-container';
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
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Abandoned Cart Cron] Starting abandoned cart reminder job...');

    // Get services from DI container
    const cartService = container.resolve<ICartService>(TOKENS.ICartService);
    const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);
    const productService = container.resolve<IProductService>(TOKENS.IProductService);

    // Get abandoned carts that need reminders
    // - Carts abandoned for 1+ hours
    // - Maximum 3 reminders per cart
    const abandonedCartsResult = await cartService.getAbandonedCartsForReminder(1, 3);

    if (!abandonedCartsResult.success || !abandonedCartsResult.data) {
      console.error('[Abandoned Cart Cron] Failed to get abandoned carts:', abandonedCartsResult.error);
      return NextResponse.json({
        success: false,
        error: abandonedCartsResult.error || 'Failed to get abandoned carts',
      }, { status: 500 });
    }

    const abandonedCarts = abandonedCartsResult.data;
    console.log(`[Abandoned Cart Cron] Found ${abandonedCarts.length} abandoned carts to remind`);

    if (abandonedCarts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No abandoned carts to remind',
        remindersSent: 0,
      });
    }

    let remindersSent = 0;
    let remindersFailedCount = 0;
    const errors: string[] = [];

    // Process each abandoned cart
    for (const cart of abandonedCarts) {
      try {
        console.log(`[Abandoned Cart Cron] Processing cart ${cart.cart_id} for ${cart.email}`);

        // Enrich cart items with product names
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

        // Send recovery email
        const emailResult = await emailService.sendAbandonedCartRecovery(
          cart.email,
          {
            items: enrichedItems,
            total: cart.total,
            recoveryToken: cart.recovery_token,
          },
          'sv' // Default to Swedish for Swedish e-commerce site
        );

        if (!emailResult.success) {
          console.error(`[Abandoned Cart Cron] Failed to send email to ${cart.email}:`, emailResult.error);
          errors.push(`Failed to send email to ${cart.email}: ${emailResult.error}`);
          remindersFailedCount++;
          continue;
        }

        // Mark cart as reminded
        const markResult = await cartService.markCartReminded(cart.id);

        if (!markResult.success) {
          console.error(`[Abandoned Cart Cron] Failed to mark cart ${cart.id} as reminded:`, markResult.error);
          errors.push(`Failed to mark cart ${cart.id} as reminded: ${markResult.error}`);
          // Don't increment failed count since email was sent successfully
        }

        remindersSent++;
        console.log(`[Abandoned Cart Cron] Successfully sent reminder to ${cart.email} (reminder #${cart.reminder_count + 1})`);
      } catch (error) {
        console.error(`[Abandoned Cart Cron] Error processing cart ${cart.cart_id}:`, error);
        errors.push(`Error processing cart ${cart.cart_id}: ${error}`);
        remindersFailedCount++;
      }
    }

    console.log(`[Abandoned Cart Cron] Job completed. Sent: ${remindersSent}, Failed: ${remindersFailedCount}`);

    return NextResponse.json({
      success: true,
      message: `Sent ${remindersSent} abandoned cart reminders`,
      remindersSent,
      remindersFailed: remindersFailedCount,
      totalProcessed: abandonedCarts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Abandoned Cart Cron] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Unexpected error: ${error}`,
      },
      { status: 500 }
    );
  }
}

// Disable caching for cron endpoints
export const dynamic = 'force-dynamic';
export const revalidate = 0;
