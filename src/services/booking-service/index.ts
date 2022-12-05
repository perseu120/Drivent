import ticketRepository from "@/repositories/ticket-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import { notFoundError, ForbiddenError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository/index";
import roomRepository from "@/repositories/room-repository";

async function getBookingByUserId(userId: number) {
  const result = await bookingRepository.findBookingByUserId(userId);
  if(!result) throw notFoundError();

  return  result;
}

async function createBooking(roomId: number, userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if(!enrollment) throw notFoundError();

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if( ticket.status === "RESERVED" || !ticket.TicketType.includesHotel || ticket.TicketType.isRemote) throw notFoundError();

  const resultRoom = await roomRepository.findRoomById(roomId);
  if(!resultRoom) throw notFoundError();
  
  const booking = await bookingRepository.findAllBookingByRoom(roomId);
  
  const capacity = booking[0]?.Room.capacity;
 
  if(capacity <= booking.length) throw ForbiddenError();
  
  booking.map(booking => {
    if(booking.userId === userId || booking.User.id === userId) throw ForbiddenError();
  });
  
  const createBooking = await bookingRepository.creatBooking(userId, roomId);

  return createBooking;
}

async function updateBooking(roomId: number, bookingId: number) {
  const resultRoom = await roomRepository.findRoomById(roomId);
  if(!resultRoom) throw notFoundError();

  const booking = await bookingRepository.findAllBookingByRoom(roomId);

  if(!booking) throw ForbiddenError();
  
  const capacity = booking[0]?.Room.capacity;
 
  if(capacity <= booking.length) throw ForbiddenError();

  return await bookingRepository.updateBooking(roomId, bookingId);
}

const bookingService = {
  getBookingByUserId,
  createBooking,
  updateBooking
};

export default bookingService;
