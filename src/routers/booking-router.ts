import Router from "express";

const bookingRouter = Router();

bookingRouter
  .get("/")
  .post("/")
  .put("/");

export { bookingRouter };
