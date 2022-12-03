import { notFoundError, ForbiddenError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository/index";
import roomRepository from "@/repositories/room-repository";

async function getBookingByUserId(userId: number) {
  const result = await bookingRepository.findBookingByUserId(userId);
  if(!result) throw notFoundError();

  return  result;
}

async function createBooking(roomId: number, userId: number) {
  const resultRoom = await roomRepository.findRoomById(roomId);

  if(!resultRoom) throw notFoundError();
  
  const booking = await bookingRepository.findAllBookingByRoom(roomId);

  const capacity = booking[0].Room.capacity;

  if(capacity <= booking.length) throw ForbiddenError();

  booking.map(booking => {
    if(booking.userId === userId || booking.User.id === userId) throw ForbiddenError();
  });

  const createBooking = await bookingRepository.creatBooking(roomId, userId);

  return createBooking;
}

const bookingService = {
  getBookingByUserId,
  createBooking
};

export default bookingService;
