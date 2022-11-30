import { prisma } from "@/config";

async function findBookingById(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId
    },
    include: {
      Room: true
    }    
  });
}

const bookingRepository = {
  findBookingById,
};

export default  bookingRepository;
