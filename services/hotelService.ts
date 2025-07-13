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
  GeoPoint,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  Hotel,
  HotelRoom,
  SearchFilters,
  CreateHotelData,
  UpdateHotelData,
  FirebaseResponse,
  QueryOptions,
  PaginatedResult,
} from '../types';

class HotelService {
  private readonly collection = 'hotels';

  // Create new hotel
  async createHotel(hotelData: CreateHotelData): Promise<FirebaseResponse<Hotel>> {
    try {
      const hotelPayload: Omit<Hotel, 'id'> = {
        ...hotelData,
        coordinates: hotelData.coordinates
          ? new GeoPoint(hotelData.coordinates.lat, hotelData.coordinates.lng)
          : undefined,
        rating: 0,
        reviewCount: 0,
        priceRange: { min: 0, max: 0 },
        rooms: [],
        isActive: true,
        isFeatured: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collection), hotelPayload);
      const newHotel: Hotel = { id: docRef.id, ...hotelPayload };

      return { success: true, data: newHotel };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get hotel by ID
  async getHotelById(hotelId: string): Promise<FirebaseResponse<Hotel>> {
    try {
      const hotelDoc = await getDoc(doc(db, this.collection, hotelId));

      if (!hotelDoc.exists()) {
        return {
          success: false,
          error: { code: 'not-found', message: 'Hotel not found' },
        };
      }

      const hotel: Hotel = { id: hotelDoc.id, ...hotelDoc.data() } as Hotel;
      return { success: true, data: hotel };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Search hotels with filters
  async searchHotels(
    filters: SearchFilters,
    options?: QueryOptions
  ): Promise<FirebaseResponse<PaginatedResult<Hotel>>> {
    try {
      const constraints: QueryConstraint[] = [where('isActive', '==', true)];

      // Apply filters
      if (filters.location) {
        constraints.push(where('city', '==', filters.location));
      }

      if (filters.rating) {
        constraints.push(where('rating', '>=', filters.rating));
      }

      if (filters.priceRange) {
        constraints.push(where('priceRange.min', '>=', filters.priceRange[0]));
        constraints.push(where('priceRange.max', '<=', filters.priceRange[1]));
      }

      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price-low':
            constraints.push(orderBy('priceRange.min', 'asc'));
            break;
          case 'price-high':
            constraints.push(orderBy('priceRange.max', 'desc'));
            break;
          case 'rating':
            constraints.push(orderBy('rating', 'desc'));
            break;
          default:
            constraints.push(orderBy('updatedAt', 'desc'));
        }
      } else {
        constraints.push(orderBy('updatedAt', 'desc'));
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

      const hotels: Hotel[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Hotel[];

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore: boolean = querySnapshot.docs.length === (options?.limit || 20);

      return {
        success: true,
        data: {
          data: hotels,
          hasMore,
          lastDoc,
          total: hotels.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get featured hotels
  async getFeaturedHotels(limitCount: number = 10): Promise<FirebaseResponse<Hotel[]>> {
    try {
      const q = query(
        collection(db, this.collection),
        where('isActive', '==', true),
        where('isFeatured', '==', true),
        orderBy('rating', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const hotels: Hotel[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Hotel[];

      return { success: true, data: hotels };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get hotels by city
  async getHotelsByCity(city: string, limitCount: number = 20): Promise<FirebaseResponse<Hotel[]>> {
    try {
      const q = query(
        collection(db, this.collection),
        where('isActive', '==', true),
        where('city', '==', city),
        orderBy('rating', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const hotels: Hotel[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Hotel[];

      return { success: true, data: hotels };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Update hotel
  async updateHotel(
    hotelId: string,
    updateData: UpdateHotelData
  ): Promise<FirebaseResponse<Hotel>> {
    try {
      const updatePayload: any = {
        ...updateData,
        updatedAt: Timestamp.now(),
      };

      // Convert coordinates if provided
      if (updateData.coordinates) {
        updatePayload.coordinates = new GeoPoint(
          updateData.coordinates.lat,
          updateData.coordinates.lng
        );
      }

      await updateDoc(doc(db, this.collection, hotelId), updatePayload);

      const updatedHotel = await this.getHotelById(hotelId);
      return updatedHotel;
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Delete hotel (soft delete)
  async deleteHotel(hotelId: string): Promise<FirebaseResponse<null>> {
    try {
      await updateDoc(doc(db, this.collection, hotelId), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Add room to hotel
  async addRoomToHotel(hotelId: string, roomData: Omit<HotelRoom, 'id'>): Promise<FirebaseResponse<Hotel>> {
    try {
      const hotelResponse = await this.getHotelById(hotelId);
      if (!hotelResponse.success || !hotelResponse.data) {
        return hotelResponse;
      }

      const hotel: Hotel = hotelResponse.data;
      const newRoom: HotelRoom = {
        id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...roomData,
      };

      const updatedRooms: HotelRoom[] = [...hotel.rooms, newRoom];
      
      // Update price range based on room prices
      const prices: number[] = updatedRooms.map(room => room.price);
      const priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };

      await updateDoc(doc(db, this.collection, hotelId), {
        rooms: updatedRooms,
        priceRange,
        updatedAt: Timestamp.now(),
      });

      return await this.getHotelById(hotelId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Update hotel room
  async updateHotelRoom(
    hotelId: string,
    roomId: string,
    roomData: Partial<Omit<HotelRoom, 'id'>>
  ): Promise<FirebaseResponse<Hotel>> {
    try {
      const hotelResponse = await this.getHotelById(hotelId);
      if (!hotelResponse.success || !hotelResponse.data) {
        return hotelResponse;
      }

      const hotel: Hotel = hotelResponse.data;
      const roomIndex: number = hotel.rooms.findIndex(room => room.id === roomId);

      if (roomIndex === -1) {
        return {
          success: false,
          error: { code: 'not-found', message: 'Room not found' },
        };
      }

      const updatedRooms: HotelRoom[] = [...hotel.rooms];
      updatedRooms[roomIndex] = { ...updatedRooms[roomIndex], ...roomData };

      // Update price range if room price changed
      if (roomData.price) {
        const prices: number[] = updatedRooms.map(room => room.price);
        const priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
        };

        await updateDoc(doc(db, this.collection, hotelId), {
          rooms: updatedRooms,
          priceRange,
          updatedAt: Timestamp.now(),
        });
      } else {
        await updateDoc(doc(db, this.collection, hotelId), {
          rooms: updatedRooms,
          updatedAt: Timestamp.now(),
        });
      }

      return await this.getHotelById(hotelId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Remove room from hotel
  async removeRoomFromHotel(hotelId: string, roomId: string): Promise<FirebaseResponse<Hotel>> {
    try {
      const hotelResponse = await this.getHotelById(hotelId);
      if (!hotelResponse.success || !hotelResponse.data) {
        return hotelResponse;
      }

      const hotel: Hotel = hotelResponse.data;
      const updatedRooms: HotelRoom[] = hotel.rooms.filter(room => room.id !== roomId);

      // Update price range
      const prices: number[] = updatedRooms.map(room => room.price);
      const priceRange = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
      } : { min: 0, max: 0 };

      await updateDoc(doc(db, this.collection, hotelId), {
        rooms: updatedRooms,
        priceRange,
        updatedAt: Timestamp.now(),
      });

      return await this.getHotelById(hotelId);
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }
}

export const hotelService = new HotelService();