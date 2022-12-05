import { authenticateToken } from "@/middlewares";
import { getBooking, createBooking, updateBooking } from "@/controllers/booking-controller";
import Router from "express";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBooking)
  .post("/", createBooking)
  .put("/:bookingId", updateBooking);

export { bookingRouter };
