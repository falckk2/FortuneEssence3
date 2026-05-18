import {
  IShipmentSimulationService,
  ShipmentSimulationResult,
  IStatusProgressionStrategy,
} from '$lib/interfaces/test';
import { IShippingService } from '$lib/interfaces';
import { ApiResponse } from '$lib/types';

/**
 * Shipment Simulation Service
 *
 * Single Responsibility: Handle shipment status simulation
 * Uses Strategy Pattern for status progression (Open/Closed Principle)
 */
export class ShipmentSimulationService implements IShipmentSimulationService {
  constructor(
    private orderRepository: any, // Should be IOrderRepository
    private shippingService: IShippingService,
    private statusProgressionStrategy: IStatusProgressionStrategy
  ) {}

  async progressToNextStatus(
    orderId: string
  ): Promise<ApiResponse<ShipmentSimulationResult>> {
    try {
      // Get current order
      const orderResult = await this.orderRepository.findById(orderId);
      if (!orderResult.success) {
        return {
          success: false,
          error: `Order not found: ${orderResult.error}`,
        };
      }

      const order = orderResult.data!;
      const currentStatus = order.status;

      // Use strategy to get next status
      const nextStatus = this.statusProgressionStrategy.getNextStatus(currentStatus);

      if (!nextStatus) {
        return {
          success: false,
          error: `No next status available for current status: ${currentStatus}`,
        };
      }

      console.log(
        `🧪 TEST MODE: Progressing order ${orderId} from ${currentStatus} to ${nextStatus}`
      );

      // Update status
      const updateResult = await this.orderRepository.updateStatus(orderId, nextStatus);

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error,
        };
      }

      return {
        success: true,
        data: {
          orderId,
          previousStatus: currentStatus,
          currentStatus: nextStatus,
          order: updateResult.data,
          message: `✅ Order status updated: ${currentStatus} → ${nextStatus}`,
        },
      };
    } catch (error) {
      console.error('🧪 TEST MODE: Error progressing status:', error);
      return {
        success: false,
        error: `Failed to progress status: ${error}`,
      };
    }
  }

  async setOrderStatus(
    orderId: string,
    status: string
  ): Promise<ApiResponse<ShipmentSimulationResult>> {
    try {
      // Validate status using strategy
      const validStatuses = this.statusProgressionStrategy.getAllStatuses();

      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error: `Invalid status. Valid options: ${validStatuses.join(', ')}`,
        };
      }

      console.log(`🧪 TEST MODE: Setting order ${orderId} to status: ${status}`);

      // Update status
      const updateResult = await this.orderRepository.updateStatus(orderId, status);

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error,
        };
      }

      return {
        success: true,
        data: {
          orderId,
          currentStatus: status,
          order: updateResult.data,
          message: `✅ Order status set to: ${status}`,
        },
      };
    } catch (error) {
      console.error('🧪 TEST MODE: Error setting status:', error);
      return {
        success: false,
        error: `Failed to set status: ${error}`,
      };
    }
  }

  async simulateCompleteDelivery(
    orderId: string
  ): Promise<ApiResponse<ShipmentSimulationResult>> {
    try {
      console.log(
        `🧪 TEST MODE: Simulating complete delivery flow for order ${orderId}`
      );

      const statusSequence = [
        'processing',
        'confirmed',
        'shipped',
        'in_transit',
        'out_for_delivery',
        'delivered',
      ];
      const results = [];

      for (const status of statusSequence) {
        const updateResult = await this.orderRepository.updateStatus(orderId, status);
        if (updateResult.success) {
          results.push({
            status,
            timestamp: new Date().toISOString(),
            success: true,
          });
          console.log(`🧪 TEST MODE: → ${status}`);
          // Small delay to simulate real-world progression
          await this.delay(100);
        } else {
          results.push({
            status,
            timestamp: new Date().toISOString(),
            success: false,
            error: updateResult.error,
          });
        }
      }

      return {
        success: true,
        data: {
          orderId,
          currentStatus: 'delivered',
          progression: results,
          message: '✅ Complete delivery simulation completed',
        },
      };
    } catch (error) {
      console.error('🧪 TEST MODE: Error simulating delivery:', error);
      return {
        success: false,
        error: `Failed to simulate delivery: ${error}`,
      };
    }
  }

  async generateTrackingEvents(orderId: string): Promise<ApiResponse<any>> {
    try {
      // Get order
      const orderResult = await this.orderRepository.findById(orderId);
      if (!orderResult.success) {
        return {
          success: false,
          error: `Order not found: ${orderResult.error}`,
        };
      }

      const order = orderResult.data!;

      if (!order.trackingNumber) {
        return {
          success: false,
          error: 'Order does not have a tracking number',
        };
      }

      console.log(`🧪 TEST MODE: Generating tracking events for order ${orderId}`);

      const trackingResult = await this.shippingService.trackShipment(
        order.trackingNumber
      );

      if (!trackingResult.success) {
        return {
          success: false,
          error: trackingResult.error,
        };
      }

      return {
        success: true,
        data: {
          orderId,
          trackingNumber: order.trackingNumber,
          tracking: trackingResult.data,
          message: '✅ Tracking events generated',
        },
      };
    } catch (error) {
      console.error('🧪 TEST MODE: Error generating tracking:', error);
      return {
        success: false,
        error: `Failed to generate tracking: ${error}`,
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
