import jwt from "jsonwebtoken";
import  httpStatus  from "http-status";
import app, { init } from "@/app";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import { createEnrollmentWithAddress, createHotel, createRoomWithHotelId, createUser, createBooking, createTicketTypeWithHotel, createTicket, createTicketTypeWithoutHotel, createTicketTypeRemote } from "../factories";
import faker from "@faker-js/faker";

beforeAll(async () => {
  await init();
  await cleanDb();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("User has no reservation: Must return status code 404", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken();
    await createEnrollmentWithAddress(userCreate);
    const hotelCreate = await createHotel();
    createRoomWithHotelId(hotelCreate.id);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("Must return an empty object if there is no booking with status code 200", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    await createEnrollmentWithAddress(userCreate);
    const hotelCreate = await createHotel();
    const createRoom = await createRoomWithHotelId(hotelCreate.id);
    const createdBooking = await createBooking(userCreate.id, createRoom.id);
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    delete createdBooking.createdAt;
    delete createdBooking.updatedAt;

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toMatchObject(createdBooking);
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should return 404 when room id does not exist", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const hotelCreate = await createHotel();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, "PAID");

    const body = {
      "roomId": faker.datatype.number()
    };
    
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("if the room is full it should return 403", async () => {
    const userCreate = await createUser();
    const user2Create = await createUser();
    const user3Create = await createUser();
    const token = await generateValidToken(userCreate);
    await createEnrollmentWithAddress(userCreate);
    const hotelCreate = await createHotel();
    const createRoom = await createRoomWithHotelId(hotelCreate.id);

    createBooking(userCreate.id, createRoom.id);
    createBooking(user2Create.id, createRoom.id);
    createBooking(user3Create.id, createRoom.id);
    const body = {
      "roomId": createRoom.id
    };

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("if the user already has a reservation in a room, it should return 403", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    await createEnrollmentWithAddress(userCreate);
    const hotelCreate = await createHotel();
    const createRoom = await createRoomWithHotelId(hotelCreate.id);

    createBooking(userCreate.id, createRoom.id);

    const body = {
      "roomId": createRoom.id
    };

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should return 404 if no enrollment exists", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const hotelCreate = await createHotel();
    const createRoom = await createRoomWithHotelId(hotelCreate.id);

    const body = {
      "roomId": createRoom.id
    };

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
  it("should return 404 when user has a reserved ticket", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const hotelCreate = await createHotel();
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, "RESERVED");
    const createRoom = await createRoomWithHotelId(hotelCreate.id);

    const body = {
      "roomId": createRoom.id
    };

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
  it("should return 404 when the user has a ticket without a hotel", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const hotelCreate = await createHotel();
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const ticketType = await createTicketTypeWithoutHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, "PAID");
    const createRoom = await createRoomWithHotelId(hotelCreate.id);

    const body = {
      "roomId": createRoom.id
    };

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
  it("should return 404 when the user has a ticket remote", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const hotelCreate = await createHotel();
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const ticketType = await createTicketTypeRemote();
    const ticket = await createTicket(enrollment.id, ticketType.id, "PAID");
    const createRoom = await createRoomWithHotelId(hotelCreate.id);

    const body = {
      "roomId": createRoom.id
    };

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
  it("if the user already has a booking registered, it should return 403", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const hotelCreate = await createHotel();
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, "PAID");
    const createRoom = await createRoomWithHotelId(hotelCreate.id);
    const createdBooking = await createBooking(userCreate.id, createRoom.id);
   
    const body = {
      "roomId": createRoom.id
    };

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("Must return status code 200 with bookingId", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const hotelCreate = await createHotel();
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, "PAID");
    const createRoom = await createRoomWithHotelId(hotelCreate.id);

    const body = {
      "roomId": createRoom.id
    };

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
    
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({ bookingId: expect.any(Number) });
  });
});

describe("PUT /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking");
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
  
    const response = await server.put("/booking").set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
    const response = await server.put("/booking").set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should return 404 when room id does not exist", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const hotelCreate = await createHotel();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, "PAID");

    const body = {
      "roomId": faker.datatype.number()
    };
    
    const response = await server.put("/booking/1234567").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("if the room is full it should return 403", async () => {
    const userCreate = await createUser();
    const user2Create = await createUser();
    const user3Create = await createUser();
    const token = await generateValidToken(userCreate);
    await createEnrollmentWithAddress(userCreate);
    const hotelCreate = await createHotel();
    const createRoom = await createRoomWithHotelId(hotelCreate.id);
    const createdBooking = await createBooking(userCreate.id, createRoom.id);

    createBooking(userCreate.id, createRoom.id);
    createBooking(user2Create.id, createRoom.id);
    createBooking(user3Create.id, createRoom.id);
    const body = {
      "roomId": createRoom.id
    };

    const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("if the bookingId is invalid it should return 403", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const hotelCreate = await createHotel();
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, "PAID");
    const createRoom = await createRoomWithHotelId(hotelCreate.id);

    const body = {
      "roomId": createRoom.id
    };

    const response = await server.put(`/booking/${faker.datatype.number()}`).set("Authorization", `Bearer ${token}`).send(body);
    
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("Must return status code 200 with bookingId", async () => {
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    const hotelCreate = await createHotel();
    const enrollment = await createEnrollmentWithAddress(userCreate);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, "PAID");
    const createRoom = await createRoomWithHotelId(hotelCreate.id);
    const createdBooking = await createBooking(userCreate.id, createRoom.id);

    const body = {
      "roomId": createRoom.id
    };

    const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(body);
    
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({ bookingId: expect.any(Number) });
  });
});
