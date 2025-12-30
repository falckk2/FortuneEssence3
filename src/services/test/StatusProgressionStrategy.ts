import { IStatusProgressionStrategy } from '@/interfaces/test';

/**
 * Linear Status Progression Strategy
 * Implements a simple linear progression through order statuses
 *
 * This follows the Open/Closed Principle:
 * - Open for extension: Create new strategies for different progression patterns
 * - Closed for modification: Don't need to change this class for new patterns
 */
export class LinearStatusProgressionStrategy implements IStatusProgressionStrategy {
  private progressionMap: Record<string, string>;
  private allStatuses: string[];

  constructor(progressionMap?: Record<string, string>) {
    this.progressionMap = progressionMap || this.getDefaultProgression();
    this.allStatuses = this.extractAllStatuses();
  }

  private getDefaultProgression(): Record<string, string> {
    return {
      'pending': 'processing',
      'processing': 'confirmed',
      'confirmed': 'shipped',
      'shipped': 'in_transit',
      'in_transit': 'out_for_delivery',
      'out_for_delivery': 'delivered',
    };
  }

  private extractAllStatuses(): string[] {
    const statuses = new Set<string>();

    // Add all keys (source statuses)
    Object.keys(this.progressionMap).forEach(status => statuses.add(status));

    // Add all values (target statuses)
    Object.values(this.progressionMap).forEach(status => statuses.add(status));

    // Add terminal statuses that might not be in the map
    statuses.add('cancelled');

    return Array.from(statuses);
  }

  getNextStatus(currentStatus: string): string | null {
    return this.progressionMap[currentStatus] || null;
  }

  canProgress(currentStatus: string): boolean {
    return currentStatus in this.progressionMap;
  }

  getAllStatuses(): string[] {
    return [...this.allStatuses];
  }
}

/**
 * Custom Status Progression Strategy
 * Allows for custom, configurable status flows
 *
 * Example: Returns flow, where items go from shipped -> returned
 */
export class CustomStatusProgressionStrategy implements IStatusProgressionStrategy {
  constructor(
    private progressionMap: Record<string, string>,
    private validStatuses: string[]
  ) {}

  getNextStatus(currentStatus: string): string | null {
    return this.progressionMap[currentStatus] || null;
  }

  canProgress(currentStatus: string): boolean {
    return currentStatus in this.progressionMap;
  }

  getAllStatuses(): string[] {
    return [...this.validStatuses];
  }
}

/**
 * Conditional Status Progression Strategy
 * Allows for conditional branching based on order properties
 *
 * Example: International orders might have different statuses than domestic
 */
export class ConditionalStatusProgressionStrategy implements IStatusProgressionStrategy {
  constructor(
    private strategies: Map<string, IStatusProgressionStrategy>,
    private defaultStrategy: IStatusProgressionStrategy,
    private conditionEvaluator: (order: any) => string
  ) {}

  // Note: This requires order context, which we'd need to pass in
  // For now, we'll use the default strategy
  getNextStatus(currentStatus: string, order?: any): string | null {
    if (order) {
      const strategyKey = this.conditionEvaluator(order);
      const strategy = this.strategies.get(strategyKey) || this.defaultStrategy;
      return strategy.getNextStatus(currentStatus);
    }
    return this.defaultStrategy.getNextStatus(currentStatus);
  }

  canProgress(currentStatus: string, order?: any): boolean {
    if (order) {
      const strategyKey = this.conditionEvaluator(order);
      const strategy = this.strategies.get(strategyKey) || this.defaultStrategy;
      return strategy.canProgress(currentStatus);
    }
    return this.defaultStrategy.canProgress(currentStatus);
  }

  getAllStatuses(): string[] {
    // Combine all statuses from all strategies
    const allStatuses = new Set<string>();

    this.strategies.forEach(strategy => {
      strategy.getAllStatuses().forEach(status => allStatuses.add(status));
    });

    this.defaultStrategy.getAllStatuses().forEach(status => allStatuses.add(status));

    return Array.from(allStatuses);
  }
}

/**
 * Factory function to create the default status progression strategy
 */
export function createDefaultStatusProgressionStrategy(): IStatusProgressionStrategy {
  return new LinearStatusProgressionStrategy();
}

/**
 * Factory function to create a custom progression strategy from config
 */
export function createStatusProgressionFromConfig(
  config: Record<string, string>
): IStatusProgressionStrategy {
  return new LinearStatusProgressionStrategy(config);
}
