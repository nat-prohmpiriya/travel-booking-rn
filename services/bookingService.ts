import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  Booking,
  CreateBookingData,
  UpdateBookingData,
  BookingFilters,
  FirebaseResponse,
  QueryOptions,
  PaginatedResult,
} from '../types';

class BookingService {
  private readonly collection = 'bookings';

  // Generate confirmation code
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create new booking
  async createBooking(bookingData: CreateBookingData): Promise<FirebaseResponse<Booking>> {
    try {
      const confirmationCode: string = this.generateConfirmationCode();
      const now: Timestamp = Timestamp.now();

      // Calculate cancellation deadline (24 hours before check-in)
      const cancellationDeadline: Timestamp = Timestamp.fromDate(
        new Date(bookingData.checkIn.getTime() - 24 * 60 * 60 * 1000)
      );

      const bookingPayload: Omit<Booking, 'id'> = {
        confirmationCode,
        userId: bookingData.userId,
        hotelId: bookingData.hotelId,
        hotelName: bookingData.hotelName,
        hotelLocation: bookingData.hotelLocation,
        hotelImage: bookingData.hotelImage,
        roomId: bookingData.roomId,
        roomName: bookingData.roomName,
        checkIn: Timestamp.fromDate(bookingData.checkIn),
        checkOut: Timestamp.fromDate(bookingData.checkOut),
        guests: bookingData.guests,
        rooms: bookingData.rooms,
        guestInfo: bookingData.guestInfo,
        pricing: bookingData.pricing,
        paymentInfo: {
          method: bookingData.paymentInfo?.method || 'card',
          status: 'pending',
        },
        status: 'pending',
        policies: {
          cancellationDeadline,
          canModify: true,
          canCancel: true,
        },
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.collection), bookingPayload);
      const newBooking: Booking = { id: docRef.id, ...bookingPayload };

      return { success: true, data: newBooking };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<FirebaseResponse<Booking>> {
    try {
      const bookingDoc = await getDoc(doc(db, this.collection, bookingId));

      if (!bookingDoc.exists()) {
        return {
          success: false,
          error: { code: 'not-found', message: 'Booking not found' },
        };
      }

      const booking: Booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
      return { success: true, data: booking };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get booking by confirmation code
  async getBookingByConfirmationCode(confirmationCode: string): Promise<FirebaseResponse<Booking>> {
    try {
      const q = query(
        collection(db, this.collection),
        where('confirmationCode', '==', confirmationCode)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: false,
          error: { code: 'not-found', message: 'Booking not found' },
        };
      }

      const bookingDoc = querySnapshot.docs[0];
      const booking: Booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

      return { success: true, data: booking };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get user bookings
  async getUserBookings(
    userId: string,
    filters?: BookingFilters,
    options?: QueryOptions
  ): Promise<FirebaseResponse<PaginatedResult<Booking>>> {
    try {
      const constraints: QueryConstraint[] = [where('userId', '==', userId)];

      // Apply filters
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.dateRange) {
        constraints.push(where('checkIn', '>=', Timestamp.fromDate(filters.dateRange.start)));
        constraints.push(where('checkIn', '<=', Timestamp.fromDate(filters.dateRange.end)));
      }

      // Default sorting by creation date (newest first)
      constraints.push(orderBy('createdAt', 'desc'));

      // Apply pagination
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      if (options?.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }

      const q = query(collection(db, this.collection), ...constraints);
      const querySnapshot = await getDocs(q);

      let bookings: Booking[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];

      // Apply text search filter if provided
      if (filters?.search) {
        const searchTerm: string = filters.search.toLowerCase();
        bookings = bookings.filter(
          (booking) =>
            booking.hotelName.toLowerCase().includes(searchTerm) ||
            booking.confirmationCode.toLowerCase().includes(searchTerm) ||
            booking.hotelLocation.toLowerCase().includes(searchTerm)
        );
      }

      // Apply custom limit if provided in filters
      if (filters?.limit) {
        bookings = bookings.slice(0, filters.limit);
      }

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore: boolean = querySnapshot.docs.length === (options?.limit || 20);

      return {
        success: true,
        data: {
          data: bookings,
          hasMore,
          lastDoc,
          total: bookings.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Update booking
  async updateBooking(
    bookingId: string,
    updateData: UpdateBookingData
  ): Promise<FirebaseResponse<Booking>> {
    try {
      const updatePayload: any = {
        ...updateData,
        updatedAt: Timestamp.now(),
      };

      // Convert dates to timestamps if provided
      if (updateData.checkIn) {
        updatePayload.checkIn = Timestamp.fromDate(updateData.checkIn);
      }

      if (updateData.checkOut) {
        updatePayload.checkOut = Timestamp.fromDate(updateData.checkOut);
      }

      // Update payment status if provided
      if (updateData.paymentStatus) {
        updatePayload['paymentInfo.status'] = updateData.paymentStatus;
        if (updateData.paymentStatus === 'completed') {
          updatePayload['paymentInfo.paymentDate'] = Timestamp.now();
          updatePayload.status = 'confirmed';
        }
      }

      await updateDoc(doc(db, this.collection, bookingId), updatePayload);

      const updatedBooking = await this.getBookingById(bookingId);
      return updatedBooking;
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string): Promise<FirebaseResponse<Booking>> {
    try {
      const bookingResponse = await this.getBookingById(bookingId);
      if (!bookingResponse.success || !bookingResponse.data) {
        return bookingResponse;
      }

      const booking: Booking = bookingResponse.data;

      // Check if booking can be cancelled
      if (!booking.policies.canCancel) {
        return {
          success: false,
          error: { code: 'cannot-cancel', message: 'Booking cannot be cancelled' },
        };
      }

      // Check cancellation deadline
      const now: Date = new Date();
      const deadline: Date = booking.policies.cancellationDeadline.toDate();

      if (now > deadline) {
        return {
          success: false,
          error: { code: 'past-deadline', message: 'Cancellation deadline has passed' },
        };
      }

      const updatePayload = {
        status: 'cancelled' as const,
        'paymentInfo.status': 'refunded' as const,
        updatedAt: Timestamp.now(),
        ...(reason && { cancellationReason: reason }),
      };

      await updateDoc(doc(db, this.collection, bookingId), updatePayload);

      return await this.getBookingById(bookingId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Check-in booking
  async checkInBooking(bookingId: string): Promise<FirebaseResponse<Booking>> {
    try {
      const updatePayload = {
        status: 'checked-in' as const,
        updatedAt: Timestamp.now(),
        checkedInAt: Timestamp.now(),
      };

      await updateDoc(doc(db, this.collection, bookingId), updatePayload);

      return await this.getBookingById(bookingId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Check-out booking
  async checkOutBooking(bookingId: string): Promise<FirebaseResponse<Booking>> {
    try {
      const updatePayload = {
        status: 'checked-out' as const,
        updatedAt: Timestamp.now(),
        checkedOutAt: Timestamp.now(),
      };

      await updateDoc(doc(db, this.collection, bookingId), updatePayload);

      return await this.getBookingById(bookingId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get upcoming bookings for user
  async getUpcomingBookings(userId: string, limitCount: number = 5): Promise<FirebaseResponse<Booking[]>> {
    try {
      const today: Timestamp = Timestamp.fromDate(new Date());

      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('checkIn', '>=', today),
        where('status', 'in', ['confirmed', 'pending']),
        orderBy('checkIn', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];

      return { success: true, data: bookings };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get booking history for user
  async getBookingHistory(userId: string, limitCount: number = 20): Promise<FirebaseResponse<Booking[]>> {
    try {
      const today: Timestamp = Timestamp.fromDate(new Date());

      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('checkOut', '<', today),
        orderBy('checkOut', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];

      return { success: true, data: bookings };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }
}

export const bookingService = new BookingService();