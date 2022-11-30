import Router from "express";

const bookingRouter = Router();

bookingRouter
  .get("/booking")
  .post("/booking")
  .put("/booking");

export { bookingRouter };
