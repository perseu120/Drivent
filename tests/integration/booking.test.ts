import jwt from "jsonwebtoken";
import  httpStatus  from "http-status";
import app, { init } from "@/app";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import { createEnrollmentWithAddress, createHotel, createRoomWithHotelId, createUser } from "../factories";
import faker from "@faker-js/faker";
import { createBooking } from "../factories/booking-factory";

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
    faker.seed(99);
    const userCreate = await createUser();
    const token = await generateValidToken(userCreate);
    await createEnrollmentWithAddress(userCreate);
    const hotelCreate = await createHotel();
    const body = {
      "roomId": faker.datatype.number()
    };
    
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
});
