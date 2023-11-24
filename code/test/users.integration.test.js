import request from "supertest";
import { app } from "../app";
import { User, Group } from "../models/User.js";
import { transactions, categories } from "../models/model";
import mongoose, { Model } from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();
beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

const generateToken = (payload, expirationTime = "1h") => {
  return jwt.sign(payload, process.env.ACCESS_KEY, {
    expiresIn: expirationTime,
  });
};

describe("getUsers", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should return empty list if there are no users", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toEqual([]);
  });

  test("should retrieve list of all users", async () => {
    await User.create({
      username: "tester",
      email: "test@test.com",
      password: "tester",
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    const users = response.body.data;
    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual("tester");
    expect(users[0].email).toEqual("test@test.com");
    expect(users[0].role).toEqual("Regular");
  });

  test("should return error 401 if the user requesting the list is not an admin", async () => {
    const user = {
      email: "user@user.com",
      username: "user",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, "7d");

    const response = await request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});

describe("getUser", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should return error 400 'User not found' if there is no such user", async () => {
    await User.create({
      username: "tester",
      email: "test@test.com",
      password: "tester",
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .get(`/api/users/randomuser`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toEqual("User not found");
  });

  test("should retrieve the user with the requested username if an admin is calling the API", async () => {
    const user = {
      username: "tester",
      email: "test@test.com",
      password: "tester",
    };
    await User.create(user);

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .get(`/api/users/tester`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    const retrievedUser = response.body.data;
    delete user.password; // we expect the password to NOT be returned
    expect(retrievedUser).toEqual({ ...user, role: "Regular" });
    expect(retrievedUser.role).toEqual("Regular");
  });

  test("should retrieve the user with the requested username if the same user is calling the API", async () => {
    const user = {
      username: "tester",
      email: "test@test.com",
      password: "tester",
    };
    await User.create(user);

    const reqUser = {
      email: "test@test.com",
      username: "tester",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(reqUser);
    const refreshToken = generateToken(reqUser, "7d");

    const response = await request(app)
      .get(`/api/users/tester`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    const retrievedUser = response.body.data;
    delete user.password; // we expect the password to NOT be returned
    expect(retrievedUser).toEqual({ ...user, role: "Regular" });
    expect(retrievedUser.role).toEqual("Regular");
  });

  test("should return error 401 unauthorized if the user is not an admin and is requesting info about another user", async () => {
    const user = {
      username: "tester",
      email: "test@test.com",
      password: "tester",
    };
    await User.create(user);

    const reqUser = {
      email: "user@user.com",
      username: "user",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(reqUser);
    const refreshToken = generateToken(reqUser, "7d");

    const response = await request(app)
      .get(`/api/users/tester`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    //expect(response.body).toEqual({});
  });
});

describe("createGroup", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
  });

  test("Create a new group successfully with all users added to the group", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user1",
        email: "user1@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user3",
        email: "user3@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ name: "testGroup", memberEmails: users.map((u) => u.email) });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    const data = response.body.data;
    expect(data.membersNotFound).toHaveLength(0);
    expect(data.alreadyInGroup).toHaveLength(0);
    expect(data.group).toHaveProperty("name");
    expect(data.group).toHaveProperty("members");
    expect(data.group.name).toBe("testGroup");
    expect(data.group.members).toHaveLength(4);

    const expectedMembers = users.map((u) =>
      Object.assign({}, { email: u.email })
    );
    expect(data.group.members).toEqual(expect.arrayContaining(expectedMembers));
    expect(expectedMembers).toEqual(expect.arrayContaining(data.group.members));
  });

  test("Create a new group successfully with some users not added to the group", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user1",
        email: "user1@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
      // user3 does not exist
      //{ username: "user3", email: "user3@email.com", password: "password", role: "Regular" },
    ];
    await User.insertMany(users);
    const user2 = await User.findOne({ username: "user2" });
    // user2 is already in a group
    await Group.create({
      name: "existingGroup",
      members: [
        {
          email: "user2@email.com",
          user: user2._id,
        },
      ],
    });

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: [...users.map((u) => u.email), "user3@email.com"],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    const data = response.body.data;
    expect(data.membersNotFound).toHaveLength(1);
    expect(data.alreadyInGroup).toHaveLength(1);
    expect(data.group).toHaveProperty("name");
    expect(data.group).toHaveProperty("members");
    expect(data.group.name).toBe("testGroup");
    expect(data.group.members).toHaveLength(2);

    const expectedMembers = [
      { email: "user@email.com" },
      { email: "user1@email.com" },
    ];
    expect(data.group.members).toEqual(expect.arrayContaining(expectedMembers));
  });

  test("Return error 400 if req.body does not contain all the necessary attributes", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user1",
        email: "user1@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        // missing memberEmails
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "Missing name or memberEmails in body content"
    );
  });

  test("Return error 400 if the group name in req.body is an empty string", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user1",
        email: "user1@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "   ",
        memberEmails: users.map((u) => u.email),
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("Return error 400 if the array of emails is empty", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user1",
        email: "user1@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("Return error 400 if the group name in req.body represents an already existing group", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user1",
        email: "user1@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];

    await User.insertMany(users);
    const user2 = await User.findOne({ username: "user2" });
    await Group.create({
      name: "testGroup",
      members: [
        {
          email: "user2@email.com",
          user: user2._id,
        },
      ],
    });

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: users.map((u) => u.email),
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Group testGroup already exists");
  });

  test("Return error 400 if all the provided emails represent users that are already in a group or do not exist in the database", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);
    const user2 = await User.findOne({ username: "user2" });
    // user2 is already in a group
    await Group.create({
      name: "existingGroup",
      members: [
        {
          email: "user2@email.com",
          user: user2._id,
        },
      ],
    });

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: [...users.map((u) => u.email), "user1@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("No user can be added to the group");
  });

  test("Return error 400 if the user who calls the API is already in a group", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);
    const user = await User.findOne({ username: "user" });
    // user calling the API is already in a group
    await Group.create({
      name: "userGroup",
      members: [
        {
          email: "user@email.com",
          user: user._id,
        },
      ],
    });

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: ["user@email.com", "user1@email.com", "user2@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "User making the request is already in a group"
    );
  });

  test("Return error 400 if the user who calls the API does not exist", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user3",
        email: "user3@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.create(users[0]);
    const user = await User.findOne({ username: "user" });

    await User.create(users[2]);

    await Group.create({
      name: "userGroup",
      members: [
        {
          email: "user@email.com",
          user: user._id,
        },
      ],
    });

    const accessToken = generateToken(users[1]);
    const refreshToken = generateToken(users[1], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: ["user@email.com", "user3@email.com", "user2@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "User making the request does not exist"
    );
  });

  test("Return error 400 if at least one of the member emails is not in a valid email format", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: ["user@email.com", "user1email.com", "user2@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Found invalid email in the array");
  });

  test("Return error 400 if at least one of the member emails is an empty string", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: ["user@email.com", "    ", "user2@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Empty email in array");
  });

  test("Return error 401 if called by a user who is not authenticated (authType = Simple)", async () => {
    const users = [
      {
        username: "user",
        email: "user@email.com",
        password: "password",
        role: "Regular",
      },
      {
        username: "user2",
        email: "user2@email.com",
        password: "password",
        role: "Regular",
      },
    ];
    await User.insertMany(users);

    const accessToken = generateToken(users[0]);
    const refreshToken = generateToken(users[0], "7d");

    const response = await request(app)
      .post(`/api/groups`)
      //.set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        name: "testGroup",
        memberEmails: ["user@email.com", "user2@email.com"],
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});

describe("getGroups", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
  });

  test("Return empty array if there are no groups", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .get("/api/groups")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toEqual([]);
  });

  test("Retrieve array of all groups", async () => {
    const fakeId = mongoose.Types.ObjectId();

    await Group.create({
      name: "testGroup",
      members: [{ email: "email@email.com", user: fakeId }],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .get("/api/groups")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    const groups = response.body.data;
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toEqual("testGroup");
    expect(groups[0].members).toEqual([{ email: "email@email.com" }]);
  });

  test("Return error 401 if the user requesting the list is not an admin", async () => {
    const user = {
      email: "user@user.com",
      username: "user",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, "7d");

    const response = await request(app)
      .get("/api/groups")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});

describe("getGroup", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
  });

  test("Return error 400 if the group requested does not exist", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .get(`/api/groups/randomgroup`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toEqual("Group randomgroup does not exist");
  });

  test("Should retrieve the group with the requested name if an admin is calling the API", async () => {
    const fakeId = mongoose.Types.ObjectId();

    await Group.create({
      name: "testGroup",
      members: [{ email: "test@test.com", user: fakeId }],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .get(`/api/groups/testGroup`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);

    const group = response.body?.data?.group;
    expect(group).not.toBeFalsy();
    expect(group.name).toBe("testGroup");
    expect(group.members).toEqual([{ email: "test@test.com" }]);
  });

  test("should retrieve the requested group if the user calling the API is a member of the group", async () => {
    const user = await User.create({
      username: "tester",
      email: "test@test.com",
      password: "tester",
    });

    const fakeId = mongoose.Types.ObjectId();

    await Group.create({
      name: "testGroup",
      members: [
        { email: "email@email.com", user: fakeId },
        { email: user.email, user: user._id },
      ],
    });

    const reqUser = {
      email: "test@test.com",
      username: "tester",
      id: 1,
      role: "Regular",
    };

    const accessToken = generateToken(reqUser);
    const refreshToken = generateToken(reqUser, "7d");

    const response = await request(app)
      .get(`/api/groups/testGroup`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);

    const group = response.body?.data?.group;
    expect(group).not.toBeFalsy();
    expect(group.name).toBe("testGroup");
    expect(group.members).toEqual([
      { email: "email@email.com" },
      { email: "test@test.com" },
    ]);
  });

  test("Return error 401 if called by an authenticated user who is neither part of the group (authType = Group) nor an admin (authType = Admin)", async () => {
    const user = await User.create({
      username: "user1",
      email: "user1@email.com",
      password: "password",
    });

    const fakeId = mongoose.Types.ObjectId();

    await Group.create({
      name: "testGroup",
      members: [
        { email: "user2@email.com", user: fakeId },
        { email: user.email, user: user._id },
      ],
    });

    const reqUser = {
      email: "test@test.com",
      username: "tester",
      id: 1,
      role: "Regular",
    };

    const accessToken = generateToken(reqUser);
    const refreshToken = generateToken(reqUser, "7d");

    const response = await request(app)
      .get(`/api/groups/testGroup`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});

describe("addToGroup", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
  });

  test("Return error 400 if req.body does not contain all necessary attributes", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/insert`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        // missing emails
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Missing 'emails' array in body content");
  });

  test("Return error 400 if the array of emails is empty", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/insert`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: []
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Array 'emails' is empty");
  });

  test("Return error 400 if group name does not represent a group in the database", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/insert`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user@email.com", "user2@email.com", "use3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Group testGroup does not exist");
  });

  test("Return error 400 if all provided emails represent users that are already in a group or do not exist", async () => {
    const user = await User.create({
      username: "user",
      email: "user@email.com",
      password: "password",
    });

    await Group.create({
      name: "testGroup",
      members: [{ email: user.email, user: user._id }],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/insert`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2@email.com", "user3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("No user can be added to the group");
  });

  test("Return error 400 if at least one of the member emails is not in a valid email format", async () => {
    const user = await User.create({
      username: "user",
      email: "user@email.com",
      password: "password",
    });

    await Group.create({
      name: "testGroup",
      members: [{ email: user.email, user: user._id }],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/insert`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2email.com", "user3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Found invalid email in array");
  });

  test("Return error 400 if at least one of the member emails is an empty string", async () => {
    const user = await User.create({
      username: "user",
      email: "user@email.com",
      password: "password",
    });

    await Group.create({
      name: "testGroup",
      members: [{ email: user.email, user: user._id }],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/insert`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "    ", "user3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Empty email in array");
  });

  test("Return error 401 if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/add", async () => {
    const fakeId = mongoose.Types.ObjectId();

    await Group.create({
      name: "testGroup",
      members: [{ email: "test@email.com", user: fakeId }],
    });

    const user = {
      email: "user@user.com",
      username: "user",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/add`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2email.com", "user3@email.com"],
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("Return error 401 if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/insert", async () => {
    const fakeId = mongoose.Types.ObjectId();

    await Group.create({
      name: "testGroup",
      members: [{ email: "test@email.com", user: fakeId }],
    });

    const user = {
      email: "user@user.com",
      username: "user",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/insert`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2email.com", "user3@email.com"],
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("Successfully add the members to the group", async () => {
    const user1 = await User.create({
      username: "user1",
      email: "user1@email.com",
      password: "password",
    });

    const user2 = await User.create({
      username: "user2",
      email: "user2@email.com",
      password: "password",
    });

    const user4 = await User.create({
      username: "user4",
      email: "user4@email.com",
      password: "password",
    });

    await Group.create({
      name: "testGroup",
      members: [{ email: user1.email, user: user1._id }],
    });

    await Group.create({
      name: "anotherGroup",
      members: [{ email: user2.email, user: user2._id }],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/insert`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: [
          "user1@email.com",
          "user2@email.com",
          "user3@email.com",
          "user4@email.com",
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");

    const data = response.body.data;
    expect(data.membersNotFound).toHaveLength(1);
    expect(data.membersNotFound).toEqual(["user3@email.com"]);

    expect(data.alreadyInGroup).toHaveLength(1);
    expect(data.alreadyInGroup).toEqual(["user2@email.com"]);

    expect(data.group).toHaveProperty("name");
    expect(data.group).toHaveProperty("members");
    expect(data.group.name).toBe("testGroup");
    expect(data.group.members).toHaveLength(2);

    const expectedMembers = [
      { email: "user1@email.com" },
      { email: "user4@email.com" },
    ];
    expect(data.group.members).toEqual(expect.arrayContaining(expectedMembers));
  });
});

describe("removeFromGroup", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
  });

  test("Return error 400 if req.body does not contain all necessary attributes", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        // missing emails
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Missing 'emails' array in body content");
  });

  test("Return error 400 if the array of emails is empty", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: []
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Array 'emails' is empty");
  });

  test("Return error 400 if group name does not represent a group in the database", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user@email.com", "user2@email.com", "use3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Group testGroup does not exist");
  });

  test("Return error 400 if all provided emails represent users that do not belong to the group or do not exist", async () => {
    const user = await User.create({
      username: "user",
      email: "user@email.com",
      password: "password",
    });

    await User.create({
      username: "user1",
      email: "user1@email.com",
      password: "password",
    });

    const fakeId = mongoose.Types.ObjectId();
    await Group.create({
      name: "testGroup",
      members: [
        { email: user.email, user: user._id },
        { email: "random@email.com", user: fakeId },
      ],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2@email.com", "user3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("No user can be removed from the group");
  });

  test("Return error 400 if at least one of the member emails is not in a valid email format", async () => {
    const user = await User.create({
      username: "user",
      email: "user@email.com",
      password: "password",
    });

    await User.create({
      username: "user1",
      email: "user1@email.com",
      password: "password",
    });

    const fakeId = mongoose.Types.ObjectId();
    await Group.create({
      name: "testGroup",
      members: [
        { email: user.email, user: user._id },
        { email: "random@email.com", user: fakeId },
      ],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2email.com", "user3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Found invalid email in array");
  });

  test("Return error 400 if the group contains only one member before deleting any user", async () => {
    const user = await User.create({
      username: "user",
      email: "user@email.com",
      password: "password",
    });

    await User.create({
      username: "user1",
      email: "user1@email.com",
      password: "password",
    });

    await Group.create({
      name: "testGroup",
      members: [{ email: user.email, user: user._id }],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2@email.com", "user3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Only one member remaining in the group");
  });

  test("Return error 400 if at least one of the member emails is an empty string", async () => {
    const user = await User.create({
      username: "user",
      email: "user@email.com",
      password: "password",
    });

    await User.create({
      username: "user1",
      email: "user1@email.com",
      password: "password",
    });

    const fakeId = mongoose.Types.ObjectId();
    await Group.create({
      name: "testGroup",
      members: [
        { email: user.email, user: user._id },
        { email: "random@email.com", user: fakeId },
      ],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "    ", "user3@email.com"],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Empty email in array");
  });

  test("Return error 401 if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/remove", async () => {
    const fakeId = mongoose.Types.ObjectId();
    await Group.create({
      name: "testGroup",
      members: [{ email: "random@email.com", user: fakeId }],
    });

    const user = {
      email: "user@email.com",
      username: "user",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/remove`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2@email.com", "user3@email.com"],
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("Return error 401 if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/pull", async () => {
    const fakeId = mongoose.Types.ObjectId();
    await Group.create({
      name: "testGroup",
      members: [{ email: "random@email.com", user: fakeId }],
    });

    const user = {
      email: "user@email.com",
      username: "user",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: ["user1@email.com", "user2@email.com", "user3@email.com"],
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("Successfully remove the members from the group", async () => {
    const user = await User.create({
      username: "user",
      email: "user@email.com",
      password: "password",
    });

    await User.create({
      username: "user1",
      email: "user1@email.com",
      password: "password",
    });

    const user2 = await User.create({
      username: "user2",
      email: "user2@email.com",
      password: "password",
    });

    await Group.create({
      name: "testGroup",
      members: [
        { email: user.email, user: user._id },
        { email: user2.email, user: user2._id },
      ],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .patch(`/api/groups/testGroup/pull`)
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        emails: [
          "user@email.com", // will not be removed
          "user1@email.com", // not in group
          "user2@email.com", // will not be removed
          "user3@email.com", // not found
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");

    const data = response.body.data;
    expect(data.membersNotFound).toHaveLength(1);
    expect(data.membersNotFound).toEqual(["user3@email.com"]);

    expect(data.notInGroup).toHaveLength(1);
    expect(data.notInGroup).toEqual(["user1@email.com"]);

    expect(data.group).toHaveProperty("name");
    expect(data.group).toHaveProperty("members");
    expect(data.group.name).toBe("testGroup");
    expect(data.group.members).toHaveLength(1);

    const expectedMembers = [{ email: "user@email.com" }];
    expect(data.group.members).toEqual(expectedMembers);
  });
});

describe("deleteUser", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
    await transactions.deleteMany({});
  });

  test("Delete the user successfully (user does not belong to any group)", async () => {
    await User.create({
      username: "testUser",
      email: "user@email.com",
      password: "password",
    });

    await transactions.create({
      username: "testUser",
      type: "test",
      amount: 10,
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ email: "user@email.com" });

    const checkUser = await User.findOne({ email: "user@email.com" });
    expect(checkUser).toBe(null);

    const checkTransactions = await transactions.find({});
    expect(checkTransactions).toHaveLength(0);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toEqual({
      deletedFromGroup: false,
      deletedTransactions: 1,
    });
  });

  test("Delete the user successfully (user does belongs to a group, but isn't the last member)", async () => {
    const user = await User.create({
      username: "testUser",
      email: "user@email.com",
      password: "password",
    });

    await transactions.create({
      username: "testUser",
      type: "test",
      amount: 10,
    });

    const fakeId = mongoose.Types.ObjectId();
    await Group.create({
      name: "testGroup",
      members: [
        { email: user.email, user: user._id },
        { email: "random@email.com", user: fakeId },
      ],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ email: "user@email.com" });

    const checkUser = await User.findOne({ email: "user@email.com" });
    expect(checkUser).toBe(null);

    const checkTransactions = await transactions.find({});
    expect(checkTransactions).toHaveLength(0);

    const checkGroup = await Group.findOne({ name: "testGroup" });
    expect(checkGroup.members).toHaveLength(1);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toEqual({
      deletedFromGroup: true,
      deletedTransactions: 1,
    });
  });

  test("Delete the user successfully (user is the last member of a group)", async () => {
    const user = await User.create({
      username: "testUser",
      email: "user@email.com",
      password: "password",
    });

    await Group.create({
      name: "testGroup",
      members: [
        { email: user.email, user: user._id }
      ],
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ email: "user@email.com" });

    const checkUser = await User.findOne({ email: "user@email.com" });
    expect(checkUser).toBeNull();

    const checkGroup = await Group.findOne({ name: "testGroup" });
    expect(checkGroup).toBeNull();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toEqual({
      deletedFromGroup: true,
      deletedTransactions: 0,
    });
  });

  test("Return error 400 if the request body does not contain all the necessary attributes", async () => {
    const user = await User.create({
      username: "testUser",
      email: "user@email.com",
      password: "password",
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ /* missing email attribute */ });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Undefined or empty 'email' in body content" });
  });

  test("Return error 400 if the email passed in the request body is an empty string", async () => {
    const user = await User.create({
      username: "testUser",
      email: "user@email.com",
      password: "password",
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ email: "   " });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Undefined or empty 'email' in body content" });
  });

  test("Return error 400 if the email passed in the request body is not in correct email format", async () => {
    const user = await User.create({
      username: "testUser",
      email: "user@email.com",
      password: "password",
    });

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ email: "notanemail.com" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid 'email' in body content" });
  });

  test("Return error 400 if the email passed in the request body does not represent a user in the database", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ email: "user@email.com" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "User with email: user@email.com does not exist" });
  });

  test("Return error 400 if the email passed in the request body represents an admin", async () => {
    await User.create({
      username: "admin1",
      email: "admin1@email.com",
      password: "admin",
      role: "Admin"
    })
    
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ email: "admin1@email.com" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Can't delete an admin account" });
  });

  test("Return error 401 if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    const user = {
      email: "user@email.com",
      username: "user",
      id: 1,
      role: "Regular",
    };
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, "7d");

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ email: "test@email.com" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");

  });
});

describe("deleteGroup", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
  });

  test("Delete the group successfully", async () => {
    const fakeId = mongoose.Types.ObjectId();

    await Group.create({
      name: "testGroup",
      members: [{ email: "email@email.com", user: fakeId }],
    });

    const groups = await Group.find({});
    expect(groups).toHaveLength(1);

    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/groups")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ name: "testGroup" });

    const res = await Group.findOne({ name: "testGroup" });
    expect(res).toBeNull();
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toEqual({
      message: "Group deleted successfully",
    });
  });

  test("Return error 400 if the request body does not contain all the necessary attributes", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/groups")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        /* missing name attribute */
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Invalid name in body content");
  });

  test("Return error 400 if the name passed in the request body is an empty string", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/groups")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ name: "   " });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Invalid name in body content");
  });

  test("Return error 400 if the name passed in the request body does not represent a group in the database", async () => {
    const admin = {
      email: "admin@admin.com",
      username: "admin",
      id: 1,
      role: "Admin",
    };
    const accessToken = generateToken(admin);
    const refreshToken = generateToken(admin, "7d");

    const response = await request(app)
      .delete("/api/groups")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ name: "testGroup" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Group testGroup does not exist");
  });

  test("Return error 401 if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    const reqUser = {
      email: "test@test.com",
      username: "tester",
      id: 1,
      role: "Regular",
    };

    const accessToken = generateToken(reqUser);
    const refreshToken = generateToken(reqUser, "7d");

    const response = await request(app)
      .delete("/api/groups")
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({ name: "testGroup" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});
