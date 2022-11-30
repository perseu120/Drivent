import { notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository/index";

async function getBookingByUserId(userId: number) {
  const result = await bookingRepository.findBookingById(userId);

  if(!result) throw notFoundError();

  return  result;
}

const bookingService = {
  getBookingByUserId
};

export default bookingService;
