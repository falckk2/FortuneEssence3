import { injectable, inject } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: Date;
}

export interface CreateReviewInput {
  productId: string;
  customerId: string;
  rating: number;
  title: string;
  comment: string;
}

export interface RatingStats {
  average: number;
  count: number;
}

export interface IReviewRepository {
  findByProductId(productId: string, limit: number): Promise<ApiResponse<Review[]>>;
  create(input: CreateReviewInput): Promise<ApiResponse<Review>>;
  markHelpful(reviewId: string, customerId: string): Promise<ApiResponse<{ helpful: number }>>;
  getRatingStats(productId: string): Promise<ApiResponse<RatingStats>>;
}

@injectable()
export class ReviewRepository implements IReviewRepository {
  private readonly tableName = 'reviews';

  constructor(
    @inject(TOKENS.SupabaseServerClient) private readonly supabase: SupabaseClient
  ) {}

  async findByProductId(productId: string, limit: number): Promise<ApiResponse<Review[]>> {
    try {
      // The embed must name the FK: reviews relates to customers both directly
      // and through review_helpful_votes, which PostgREST treats as ambiguous.
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*, customer:customers!reviews_customer_id_fkey(first_name, last_name)')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: `Failed to fetch reviews: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch reviews: ${error}`,
      };
    }
  }

  async create(input: CreateReviewInput): Promise<ApiResponse<Review>> {
    try {
      // Verified purchase: the customer has a delivered order containing this product.
      const { data: deliveredOrder } = await this.supabase
        .from('orders')
        .select('id')
        .eq('customer_id', input.customerId)
        .eq('status', 'delivered')
        .contains('items', JSON.stringify([{ productId: input.productId }]))
        .limit(1)
        .maybeSingle();

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          product_id: input.productId,
          customer_id: input.customerId,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          verified_purchase: !!deliveredOrder,
        })
        .select('*, customer:customers!reviews_customer_id_fkey(first_name, last_name)')
        .single();

      if (error) {
        // 23505: unique violation — one review per customer per product
        if (error.code === '23505') {
          return {
            success: false,
            error: 'You have already reviewed this product',
          };
        }
        return {
          success: false,
          error: `Failed to create review: ${error.message}`,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create review: ${error}`,
      };
    }
  }

  async markHelpful(reviewId: string, customerId: string): Promise<ApiResponse<{ helpful: number }>> {
    try {
      // Record the vote first — the composite primary key rejects duplicates.
      const { error: voteError } = await this.supabase
        .from('review_helpful_votes')
        .insert({ review_id: reviewId, customer_id: customerId });

      if (voteError) {
        if (voteError.code === '23505') {
          return {
            success: false,
            error: 'You have already marked this review as helpful',
          };
        }
        if (voteError.code === '23503') {
          return {
            success: false,
            error: 'Review not found',
          };
        }
        return {
          success: false,
          error: `Failed to record vote: ${voteError.message}`,
        };
      }

      const { data, error } = await this.supabase
        .rpc('increment_review_helpful', { p_review_id: reviewId });

      if (error) {
        return {
          success: false,
          error: `Failed to update helpful count: ${error.message}`,
        };
      }

      return {
        success: true,
        data: { helpful: data as number },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to mark review as helpful: ${error}`,
      };
    }
  }

  /**
   * Average rating and count of approved reviews — feeds the AggregateRating
   * JSON-LD on the product page (FABLE-010).
   */
  async getRatingStats(productId: string): Promise<ApiResponse<RatingStats>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'approved');

      if (error) {
        return {
          success: false,
          error: `Failed to fetch rating stats: ${error.message}`,
        };
      }

      const count = data.length;
      const average = count > 0
        ? Math.round((data.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
        : 0;

      return { success: true, data: { average, count } };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch rating stats: ${error}`,
      };
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private transformDbRecord(record: any): Review {
    // Display name is "FirstName L." — never expose the full surname publicly.
    const firstName = record.customer?.first_name ?? '';
    const lastInitial = record.customer?.last_name ? `${record.customer.last_name[0]}.` : '';
    const userName = [firstName, lastInitial].filter(Boolean).join(' ') || 'Anonym';

    return {
      id: record.id,
      productId: record.product_id,
      userId: record.customer_id,
      userName,
      rating: record.rating,
      title: record.title,
      comment: record.comment,
      verified: record.verified_purchase,
      helpful: record.helpful_count,
      createdAt: new Date(record.created_at),
    };
  }
}
