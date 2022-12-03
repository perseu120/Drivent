import { prisma } from "@/config";

async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId
    },
    include: {
      Room: true
    }    
  });
}

async function findAllBookingByRoom(roomId: number) {
  return prisma.booking.findMany({
    where: {
      roomId
    },
    include: {
      Room: true,
      User: true
    }
  });
}

async function creatBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      roomId,
      userId
    }
  });
}

const bookingRepository = {
  findBookingByUserId,
  findAllBookingByRoom,
  creatBooking
};

export default  bookingRepository;
