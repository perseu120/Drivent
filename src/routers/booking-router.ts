import { authenticateToken } from "@/middlewares";
import { getBooking, createBooking } from "@/controllers/booking-controller";
import Router from "express";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBooking)
  .post("/", createBooking)
  .put("/");

export { bookingRouter };
