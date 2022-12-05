import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service/index";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId;
  try {
    const result = await bookingService.getBookingByUserId(userId);

    return res.status(httpStatus.OK).send(result);
  } catch (error) {
    if(error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
}

export async function createBooking(req: AuthenticatedRequest, res: Response) {
  const roomId: number = req.body.roomId;
  const userId = req.userId;

  try {
    const createBooking = await bookingService.updateBooking(roomId, userId);
    return res.status(httpStatus.OK).send({ "bookingId": createBooking.id });
  } catch (error) {
    if(error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if(error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}
export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const bookingId = Number(req.params.bookingId);
  const roomId: number = req.body.roomId;
 
  try {
    const updatedBooking = await bookingService.updateBooking(roomId, bookingId);
    return res.status(httpStatus.OK).send( { bookingId: updatedBooking.id });
  } catch (error) {
    if(error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if(error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}
