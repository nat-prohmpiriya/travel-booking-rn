import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryConstraint,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  Review,
  ReviewResponse,
  ReviewStats,
  CreateReviewData,
  UpdateReviewData,
  ReviewFilters,
  ReviewAction,
  FirebaseResponse,
  QueryOptions,
  PaginatedResult,
} from '../types';

class ReviewService {
  private readonly collection = 'reviews';
  private readonly actionsCollection = 'reviewActions';

  // Create new review
  async createReview(
    userId: string,
    userName: string,
    reviewData: CreateReviewData
  ): Promise<FirebaseResponse<Review>> {
    try {
      const now: Timestamp = Timestamp.now();

      const reviewPayload: Omit<Review, 'id'> = {
        hotelId: reviewData.hotelId,
        userId,
        userName,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        roomType: reviewData.roomType,
        stayDate: reviewData.stayDate,
        isVerified: false, // Will be verified later
        helpfulCount: 0,
        reportCount: 0,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        tags: reviewData.tags || [],
        images: reviewData.images || [],
        responses: [],
      };

      const docRef = await addDoc(collection(db, this.collection), reviewPayload);
      const newReview: Review = { id: docRef.id, ...reviewPayload };

      // Update hotel rating stats
      await this.updateHotelRatingStats(reviewData.hotelId);

      return { success: true, data: newReview };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get review by ID
  async getReviewById(reviewId: string): Promise<FirebaseResponse<Review>> {
    try {
      const reviewDoc = await getDoc(doc(db, this.collection, reviewId));

      if (!reviewDoc.exists()) {
        return {
          success: false,
          error: { code: 'not-found', message: 'Review not found' },
        };
      }

      const review: Review = { id: reviewDoc.id, ...reviewDoc.data() } as Review;
      return { success: true, data: review };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get hotel reviews
  async getHotelReviews(
    hotelId: string,
    filters?: ReviewFilters,
    options?: QueryOptions
  ): Promise<FirebaseResponse<PaginatedResult<Review>>> {
    try {
      const constraints: QueryConstraint[] = [
        where('hotelId', '==', hotelId),
        where('isActive', '==', true),
      ];

      // Apply filters
      if (filters?.rating && filters.rating.length > 0) {
        constraints.push(where('rating', 'in', filters.rating));
      }

      if (filters?.verified !== undefined) {
        constraints.push(where('isVerified', '==', filters.verified));
      }

      if (filters?.hasImages) {
        constraints.push(where('images', '!=', []));
      }

      if (filters?.roomType) {
        constraints.push(where('roomType', '==', filters.roomType));
      }

      // Apply sorting
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'newest':
            constraints.push(orderBy('createdAt', 'desc'));
            break;
          case 'oldest':
            constraints.push(orderBy('createdAt', 'asc'));
            break;
          case 'highest':
            constraints.push(orderBy('rating', 'desc'));
            break;
          case 'lowest':
            constraints.push(orderBy('rating', 'asc'));
            break;
          case 'helpful':
            constraints.push(orderBy('helpfulCount', 'desc'));
            break;
          default:
            constraints.push(orderBy('createdAt', 'desc'));
        }
      } else {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      // Apply pagination
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      if (options?.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }

      const q = query(collection(db, this.collection), ...constraints);
      const querySnapshot = await getDocs(q);

      let reviews: Review[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];

      // Apply tag filter (client-side for array contains)
      if (filters?.tags && filters.tags.length > 0) {
        reviews = reviews.filter((review) =>
          filters.tags!.some((tag) => review.tags?.includes(tag))
        );
      }

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore: boolean = querySnapshot.docs.length === (options?.limit || 20);

      return {
        success: true,
        data: {
          data: reviews,
          hasMore,
          lastDoc,
          total: reviews.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get user reviews
  async getUserReviews(
    userId: string,
    options?: QueryOptions
  ): Promise<FirebaseResponse<PaginatedResult<Review>>> {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
      ];

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      if (options?.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }

      const q = query(collection(db, this.collection), ...constraints);
      const querySnapshot = await getDocs(q);

      const reviews: Review[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore: boolean = querySnapshot.docs.length === (options?.limit || 20);

      return {
        success: true,
        data: {
          data: reviews,
          hasMore,
          lastDoc,
          total: reviews.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Update review
  async updateReview(
    reviewId: string,
    updateData: UpdateReviewData
  ): Promise<FirebaseResponse<Review>> {
    try {
      const updatePayload = {
        ...updateData,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, this.collection, reviewId), updatePayload);

      // If rating was updated, refresh hotel stats
      if (updateData.rating) {
        const reviewResponse = await this.getReviewById(reviewId);
        if (reviewResponse.success && reviewResponse.data) {
          await this.updateHotelRatingStats(reviewResponse.data.hotelId);
        }
      }

      return await this.getReviewById(reviewId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Delete review (soft delete)
  async deleteReview(reviewId: string): Promise<FirebaseResponse<null>> {
    try {
      const reviewResponse = await this.getReviewById(reviewId);
      if (!reviewResponse.success || !reviewResponse.data) {
        return reviewResponse;
      }

      await updateDoc(doc(db, this.collection, reviewId), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      // Update hotel rating stats after deletion
      await this.updateHotelRatingStats(reviewResponse.data.hotelId);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Add response to review
  async addReviewResponse(
    reviewId: string,
    userId: string,
    userName: string,
    userRole: ReviewResponse['userRole'],
    content: string
  ): Promise<FirebaseResponse<Review>> {
    try {
      const response: ReviewResponse = {
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userName,
        userRole,
        content,
        createdAt: Timestamp.now(),
        isActive: true,
      };

      await updateDoc(doc(db, this.collection, reviewId), {
        responses: arrayUnion(response),
        updatedAt: Timestamp.now(),
      });

      return await this.getReviewById(reviewId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Mark review as helpful
  async markReviewHelpful(reviewId: string, userId: string): Promise<FirebaseResponse<Review>> {
    try {
      // Check if user already marked this review as helpful
      const actionExists = await this.checkUserAction(reviewId, userId, 'helpful');
      if (actionExists) {
        return {
          success: false,
          error: { code: 'already-marked', message: 'Already marked as helpful' },
        };
      }

      // Add helpful action
      await this.addUserAction(reviewId, userId, 'helpful');

      // Increment helpful count
      await updateDoc(doc(db, this.collection, reviewId), {
        helpfulCount: increment(1),
        updatedAt: Timestamp.now(),
      });

      return await this.getReviewById(reviewId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Report review
  async reportReview(reviewId: string, userId: string, reason?: string): Promise<FirebaseResponse<Review>> {
    try {
      // Check if user already reported this review
      const actionExists = await this.checkUserAction(reviewId, userId, 'report');
      if (actionExists) {
        return {
          success: false,
          error: { code: 'already-reported', message: 'Already reported' },
        };
      }

      // Add report action
      await this.addUserAction(reviewId, userId, 'report', reason);

      // Increment report count
      await updateDoc(doc(db, this.collection, reviewId), {
        reportCount: increment(1),
        updatedAt: Timestamp.now(),
      });

      return await this.getReviewById(reviewId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get hotel review statistics
  async getHotelReviewStats(hotelId: string): Promise<FirebaseResponse<ReviewStats>> {
    try {
      const q = query(
        collection(db, this.collection),
        where('hotelId', '==', hotelId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = querySnapshot.docs.map(doc => doc.data()) as Review[];

      if (reviews.length === 0) {
        return {
          success: true,
          data: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            categories: {
              cleanliness: 0,
              service: 0,
              location: 0,
              facilities: 0,
              value: 0,
            },
          },
        };
      }

      const totalReviews: number = reviews.length;
      const averageRating: number = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((review) => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      const stats: ReviewStats = {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        categories: {
          cleanliness: averageRating,
          service: averageRating,
          location: averageRating,
          facilities: averageRating,
          value: averageRating,
        },
      };

      return { success: true, data: stats };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Private helper methods
  private async checkUserAction(
    reviewId: string,
    userId: string,
    actionType: 'helpful' | 'report'
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.actionsCollection),
        where('reviewId', '==', reviewId),
        where('userId', '==', userId),
        where('type', '==', actionType)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      return false;
    }
  }

  private async addUserAction(
    reviewId: string,
    userId: string,
    actionType: 'helpful' | 'report',
    reason?: string
  ): Promise<void> {
    const action: ReviewAction & { reviewId: string; reason?: string } = {
      reviewId,
      userId,
      type: actionType,
      timestamp: Timestamp.now(),
      ...(reason && { reason }),
    };

    await addDoc(collection(db, this.actionsCollection), action);
  }

  private async updateHotelRatingStats(hotelId: string): Promise<void> {
    try {
      const statsResponse = await this.getHotelReviewStats(hotelId);
      if (statsResponse.success && statsResponse.data) {
        const stats = statsResponse.data;

        // Update hotel document with new rating and review count
        await updateDoc(doc(db, 'hotels', hotelId), {
          rating: stats.averageRating,
          reviewCount: stats.totalReviews,
          reviewStats: stats,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error updating hotel rating stats:', error);
    }
  }
}

export const reviewService = new ReviewService();