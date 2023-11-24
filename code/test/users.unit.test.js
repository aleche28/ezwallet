import request from "supertest";
import { app } from "../app";
import { User, Group } from "../models/User.js";
import { transactions } from "../models/model";
import * as utils from "../controllers/utils";
import {
  getUsers,
  getUser,
  createGroup,
  getGroups,
  getGroup,
  addToGroup,
  removeFromGroup,
  deleteGroup,
  deleteUser,
} from "../controllers/users";
import jwt from "jsonwebtoken";

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js");
jest.mock("../controllers/utils.js");
jest.mock("../models/model.js");
jest.mock("jsonwebtoken");

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  User.find.mockClear();
  User.findOne.mockClear();
  User.deleteOne.mockClear();

  transactions.deleteMany.mockClear();

  Group.find.mockClear();
  Group.findOne.mockClear();
  Group.create.mockClear();
  Group.updateOne.mockClear();
  Group.deleteOne.mockClear();
  Group.deleteOne.mockClear();

  utils.verifyAuth.mockClear();

  jwt.verify.mockClear();
});

describe("getUsers", () => {
  test("should return empty list if there are no users", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(User, "find").mockImplementation(() => []);
    jest.spyOn(utils, "verifyAuth").mockImplementation((req, res, info) => {
      //res.locals = { refreshedTokenMessage: "msg" };
      return { flag: true, cause: "Authorized" };
    });

    await getUsers(mockReq, mockRes);
    expect(utils.verifyAuth).toBeCalled();
    expect(User.find).toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);
    expect(mockRes.json).toBeCalledWith({ data: [] });
  });

  test("should retrieve list of all users", async () => {
    const retrievedUsers = [
      { username: "test1", email: "test1@example.com", role: "user" },
      { username: "test2", email: "test2@example.com", role: "admin" },
    ];

    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(User, "find").mockImplementation(() => retrievedUsers);
    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });

    await getUsers(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(User.find).toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);
    expect(mockRes.json).toBeCalledWith({ data: retrievedUsers });
  });

  test("should return error 401 if the user requesting the list is not an admin", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: false, cause: "Unauthorized" };
    });
    jest.spyOn(User, "find").mockImplementation(() => []);

    await getUsers(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(User.find).not.toBeCalled();
    expect(mockRes.status).toBeCalledWith(401);
    expect(mockRes.json).toBeCalled();
  });
});

describe("getUser", () => {
  test("should return error 400 'User not found' if there is no such user", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(User, "findOne").mockImplementation(() => null);

    await getUser(mockReq, mockRes);
    expect(utils.verifyAuth).toBeCalled();
    expect(User.findOne).toBeCalled();
    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json).toBeCalledWith({ error: "User not found" });
  });

  test("should retrieve the user with the requested username", async () => {
    const user = {
      username: "mockUsername",
      email: "mockEmail@gmail.com",
      role: "user",
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: user,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(User, "findOne").mockImplementation(() => user);

    await getUser(mockReq, mockRes);
    expect(utils.verifyAuth).toBeCalled();
    expect(User.findOne).toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);
    expect(mockRes.json).toBeCalledWith({ data: user });
  });

  test("should return error 401 unauthorized", async () => {
    const user = {
      username: "mockUsername",
      email: "mockEmail@gmail.com",
      role: "user",
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: user,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: false, cause: "Unauthorized" };
    });
    jest.spyOn(User, "findOne").mockImplementation(() => user);

    await getUser(mockReq, mockRes);
    expect(utils.verifyAuth).toBeCalled();
    expect(User.findOne).not.toBeCalled();
    expect(mockRes.status).toBeCalledWith(401);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty("error");
  });
});

describe("createGroup", () => {
  test("Create a new group successfully with all users added to the group", async () => {
    const group = {
      name: "testGroup",
      memberEmails: ["test@email.com", "test2@email.com"],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    Group.findOne = jest.fn().mockResolvedValue(null);

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({
        email: "test@email.com",
        username: "test1",
        role: "User",
      })
      .mockResolvedValueOnce({
        email: "test2@email.com",
        username: "test2",
        role: "User",
      })
      .mockResolvedValueOnce({
        email: "mockEmail@email.com",
        username: "mockUsername",
        role: "Admin",
      });
    jest.spyOn(Group, "create").mockResolvedValue({});

    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty(
      "data.group",
      "data.alreadyInGroup",
      "data.membersNotFound"
    );
    expect(resJson.data.membersNotFound).toEqual([]);
    expect(resJson.data.alreadyInGroup).toEqual([]);
    expect(resJson.data.group).toEqual({
      name: group.name,
      members: [
        { email: "test@email.com" },
        { email: "test2@email.com" },
        { email: "mockEmail@email.com" },
      ],
    });
  });

  test("Create a new group successfully with some users not added to the group", async () => {
    const group = {
      name: "testGroup",
      memberEmails: [
        "test1@email.com",
        "test2@email.com",
        "test3@email.com",
        "test4@email.com",
      ],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ test: "test1 is in group" })
      .mockResolvedValueOnce({ test: "test3 is in group" })
      .mockResolvedValueOnce(null);

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({
        email: "mockEmail@email.com",
        username: "mockUsername",
        role: "Admin",
      })
      .mockResolvedValueOnce({
        email: "test1@email.com",
        username: "test1",
        role: "User",
      })
      .mockResolvedValueOnce(null) // test2@email.com does not exist
      .mockResolvedValueOnce({
        email: "test3@email.com",
        username: "test3",
        role: "User",
      })
      .mockResolvedValueOnce({
        email: "test4@email.com",
        username: "test4",
        role: "User",
      });

    jest.spyOn(Group, "create").mockResolvedValue({});

    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);

    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty(
      "data.group",
      "data.alreadyInGroup",
      "data.membersNotFound"
    );
    expect(resJson.data.membersNotFound).toEqual(["test2@email.com"]);
    expect(resJson.data.alreadyInGroup).toEqual([
      "test1@email.com",
      "test3@email.com",
    ]);
    expect(resJson.data.group).toEqual({
      name: group.name,
      members: [{ email: "test4@email.com" }, { email: "mockEmail@email.com" }],
    });
  });

  test("Return error 400 if req.body does not contain all the necessary attributes", async () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    let group = {
      // missing name attribute
      memberEmails: ["test@email.com", "test2@email.com"],
    };

    let mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };

    await createGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    let resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty("error");
  });

  test("Return error 400 if the group name in req.body is an empty string", async () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    let group = {
      name: "  ",
      memberEmails: ["test@email.com", "test2@email.com"],
    };

    let mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };

    await createGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    let resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty("error");
  });

  test("Return error 400 if the array of emails in req.body is empty", async () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    let group = {
      name: "testGroup",
      memberEmails: [],
    };

    let mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };

    await createGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    let resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty("error");
  });

  test("Return error 400 if the group name in req.body represents an already existing group", async () => {
    const group = {
      name: "testGroup",
      memberEmails: ["test1@email.com", "test2@email.com"],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    const existingGroup = {
      name: "testGroup",
      memberEmails: ["test3@email.com", "test4@email.com"],
    };
    Group.findOne = jest.fn().mockResolvedValue(existingGroup);

    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(Group.findOne).toHaveBeenCalledTimes(1);
    expect(User.findOne).not.toBeCalled();
    expect(mockRes.status).toBeCalledWith(400);

    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty(
      "error",
      `Group ${group.name} already exists`
    );
  });

  test("Return error 400 if all the provided emails represent users that are already in a group or do not exist in the database", async () => {
    const group = {
      name: "testGroup",
      memberEmails: [
        "test1@email.com",
        "test2@email.com",
        "test3@email.com",
        "test4@email.com",
      ],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ test: "test1 is in group" })
      .mockResolvedValueOnce({ test: "test3 is in group" })
      .mockResolvedValueOnce(null);

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({
        email: "test1@email.com",
        username: "test1",
        role: "User",
      })
      .mockResolvedValueOnce(null) // test2@email.com does not exist
      .mockResolvedValueOnce({
        email: "test3@email.com",
        username: "test3",
        role: "User",
      })
      .mockResolvedValueOnce(null) // test4@email.com does not exist
      .mockResolvedValueOnce({
        email: "mockEmail@email.com",
        username: "mockUsername",
        role: "Admin",
      });
    jest.spyOn(Group, "create").mockResolvedValue({});

    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(mockRes.status).toBeCalledWith(400);

    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty(
      "error",
      "No user can be added to the group"
    );
  });

  test("Return error 400 if the user who calls the API is already in a group", async () => {
    const group = {
      name: "testGroup",
      memberEmails: ["test1@email.com", "test2@email.com"],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    const userGroup = {
      name: "userGroup",
      memberEmails: ["test3@email.com", "test4@email.com"],
    };

    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(userGroup);

    User.findOne = jest.fn().mockResolvedValue({
      username: "mockUsername",
      email: "mockEmail@email.com",
    });
    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(User.findOne).toBeCalled();
    expect(mockRes.status).toBeCalledWith(400);

    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty(
      "error",
      "User making the request is already in a group"
    );
  });

  test("Return error 400 if the user who calls the API does not exist", async () => {
    const group = {
      name: "testGroup",
      memberEmails: ["test1@email.com", "test2@email.com"],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });

    Group.findOne = jest.fn().mockResolvedValueOnce(null);

    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    User.findOne = jest.fn().mockResolvedValue(null);

    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(User.findOne).toBeCalled();
    expect(mockRes.status).toBeCalledWith(400);

    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty(
      "error",
      "User making the request does not exist"
    );
  });

  test("Return error 400 if at least one of the member emails is not in a valid email format", async () => {
    const group = {
      name: "testGroup",
      memberEmails: [
        "test1@email.com",
        "test2@email.com",
        "test3email.com",
        "test4@email.com",
      ],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    Group.findOne = jest.fn().mockResolvedValue(null);

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({
        email: "test1@email.com",
        username: "test1",
        role: "User",
      })
      .mockResolvedValueOnce({
        email: "test1@email.com",
        username: "test1",
        role: "User",
      });

    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(mockRes.status).toBeCalledWith(400);

    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty("error", "Found invalid email in the array");
  });

  test("Return error 400 if at least one of the member emails is an empty string", async () => {
    const group = {
      name: "testGroup",
      memberEmails: [
        "test1@email.com",
        "test2@email.com",
        "   ",
        "test4@email.com",
      ],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: true, cause: "Authorized" };
    });
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { email: "mockEmail@email.com" };
    });

    Group.findOne = jest.fn().mockResolvedValue(null);

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({
        email: "test1@email.com",
        username: "test1",
        role: "User",
      })
      .mockResolvedValueOnce({
        email: "test1@email.com",
        username: "test1",
        role: "User",
      });

    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(mockRes.status).toBeCalledWith(400);

    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty("error", "Empty email in array");
  });

  test("Return error 401 if called by a user who is not authenticated (authType = Simple)", async () => {
    const group = {
      name: "testGroup",
      memberEmails: ["test1@email.com", "test2@email.com", "test3@email.com"],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        username: "mockUsername",
      },
      body: group,
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(utils, "verifyAuth").mockImplementation(() => {
      return { flag: false, cause: "Unauthorized" };
    });

    await createGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(mockRes.status).toBeCalledWith(401);
  });
});

describe("getGroups", () => {
  test("Return empty array if there are no groups", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Group.find = jest.fn().mockResolvedValue([]);
    jest
      .spyOn(utils, "verifyAuth")
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await getGroups(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(Group.find).toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);
    expect(mockRes.json).toBeCalledWith({ data: [] });
  });

  test("Retrieve array of all groups", async () => {
    const retrievedGroups = [
      {
        name: "group1",
        members: [
          { email: "test1@example.com" },
          { email: "test2@example.com" },
        ],
      },
      {
        name: "group2",
        members: [
          { email: "test3@example.com" },
          { email: "test2@example.com" },
        ],
      },
    ];

    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Group.find = jest.fn().mockResolvedValue(retrievedGroups);
    jest
      .spyOn(utils, "verifyAuth")
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await getGroups(mockReq, mockRes);

    const expectedGroups = [
      {
        name: "group1",
        members: [
          { email: "test1@example.com" },
          { email: "test2@example.com" },
        ],
      },
      {
        name: "group2",
        members: [
          { email: "test3@example.com" },
          { email: "test2@example.com" },
        ],
      },
    ];
    expect(utils.verifyAuth).toBeCalled();
    expect(Group.find).toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({ data: expectedGroups });
  });

  test("Return error 401 if the user requesting the list is not an admin", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest
      .spyOn(utils, "verifyAuth")
      .mockReturnValue({ flag: false, cause: "Unauthorized" });
    Group.find = jest.fn().mockResolvedValue([]);

    await getGroups(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(mockRes.status).toBeCalledWith(401);
    expect(Group.find).not.toBeCalled();
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty("error");
  });
});

describe("getGroup", () => {
  test("Return error 400 if there is no such group", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest
      .spyOn(utils, "verifyAuth")
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest.fn().mockResolvedValue(null);

    await getGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(Group.findOne).toBeCalled();
    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json).toBeCalledWith({
      error: `Group ${mockReq.params.name} does not exist`,
    });
  });

  test("Should retrieve the group with the requested name", async () => {
    const groupDB = {
      name: "testgroup",
      members: [
        {
          email: "test1@email.com",
          user: { username: "test1", role: "user", email: "test1@email.com" },
        },
        {
          email: "test2@email.com",
          user: { username: "test2", role: "user", email: "test2@email.com" },
        },
        {
          email: "test3@email.com",
          user: { username: "test3", role: "user", email: "test3@email.com" },
        },
      ],
    };
    const groupExpected = {
      name: "testgroup",
      members: [
        { email: "test1@email.com" },
        { email: "test2@email.com" },
        { email: "test3@email.com" },
      ],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest
      .spyOn(utils, "verifyAuth")
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest.fn().mockResolvedValue(groupDB);

    await getGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toBeCalled();
    expect(Group.findOne).toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);

    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({ data: { group: groupExpected } });
  });

  test("Return error 401 if called by an authenticated user who is neither part of the group (authType = Group) nor an admin (authType = Admin)", async () => {
    const groupDB = {
      name: "testgroup",
      members: [
        {
          email: "test1@email.com",
          user: { username: "test1", role: "user", email: "test1@email.com" },
        },
        {
          email: "test2@email.com",
          user: { username: "test2", role: "user", email: "test2@email.com" },
        },
        {
          email: "test3@email.com",
          user: { username: "test3", role: "user", email: "test3@email.com" },
        },
      ],
    };
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValueOnce({ flag: false, cause: "Not an admin" }) // not an admin
      .mockReturnValueOnce({ flag: true, cause: "Authenticated" }) // simpleAuth: user is authenticated
      .mockReturnValueOnce({ flag: false, cause: "User not in group" }); // groupAuth: user is not part of that group

    Group.findOne = jest.fn().mockResolvedValue(groupDB);

    await getGroup(mockReq, mockRes);

    expect(utils.verifyAuth).toHaveBeenCalledTimes(3);
    expect(Group.findOne).toBeCalled();

    expect(mockRes.status).toBeCalledWith(401);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty("error");
  });
});

describe("addToGroup", () => {
  test("Return error 400 if req.body does not contain all necessary attributes", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        // missing emails array
      },
      url: "/groups/testgroup/add",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Missing 'emails' array in body content"
    );
  });

  test("Return error 400 if the array of emails is empty", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: [],
      },
      url: "/groups/testgroup/add",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Array 'emails' is empty"
    );
  });

  test("Return error 400 if group name does not represent a group in the database", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/add",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest.fn().mockResolvedValue(null);

    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Group testgroup does not exist"
    );
  });

  test("Return error 400 if all provided emails represent users that are already in a group or do not exist", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/add",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(group) // the group exists
      .mockResolvedValueOnce({ name: "differentgroup" }) // test1 is already in a group
      .mockResolvedValueOnce({ name: "differentgroup" }); // test3 is already in a group
    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({ username: "test1" }) // test1 exists
      .mockResolvedValueOnce(null) // test2 does not exist
      .mockResolvedValueOnce({ username: "test3" }); // test3 exists

    await addToGroup(mockReq, mockRes);

    //expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "No user can be added to the group"
    );
  });

  test("Return error 400 if at least one of the member emails is not in a valid email format", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/add",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(group) // the group exists
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({ username: "test1" })
      .mockResolvedValueOnce({ username: "test2" })
      .mockResolvedValueOnce({ username: "test3" });

    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Found invalid email in array"
    );
  });

  test("Return error 400 if at least one of the member emails is an empty string", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "    "],
      },
      url: "/groups/testgroup/add",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(group) // the group exists
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({ username: "test1" })
      .mockResolvedValueOnce({ username: "test2" })
      .mockResolvedValueOnce({ username: "test3" });

    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Empty email in array"
    );
  });

  test("Return error 401 if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/add", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/add",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: false, cause: "Unauthorized" });

    Group.findOne = jest.fn().mockResolvedValue(group);

    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(401);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Unauthorized"
    );
  });

  test("Return error 401 if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/insert", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/insert",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: false, cause: "Unauthorized" });

    Group.findOne = jest.fn().mockResolvedValue(group);

    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(401);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Unauthorized"
    );
  });

  test("Successfully add the members to the group", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: [
          "test1@email.com",
          "test2@email.com",
          "test3@email.com",
          "test4@email.com",
          "test5@email.com",
        ],
      },
      url: "/groups/testgroup/add",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test1@email.com" }, { email: "test6@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(group) // the group exists
      .mockResolvedValueOnce({ name: "testgroup" }) // test1 is already in the same group
      .mockResolvedValueOnce(null) // test2 is not in a group
      .mockResolvedValueOnce({ name: "differentgroup" }) // test3 is already in a group
      .mockResolvedValueOnce(null); // test4 is not in a group

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({ username: "test1" }) // test1 exists
      .mockResolvedValueOnce({ username: "test2" }) // test2 exists
      .mockResolvedValueOnce({ username: "test3" }) // test3 exists
      .mockResolvedValueOnce({ username: "test4" }) // test4 exists
      .mockResolvedValueOnce(null); // test5 does not exist

    Group.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty(
      "data.group",
      "data.group.name",
      "data.group.members",
      "data.membersNotFound",
      "data.alreadyInGroup"
    );

    const resExpected = {
      data: {
        alreadyInGroup: ["test3@email.com"],
        membersNotFound: ["test5@email.com"],
        group: {
          name: "testgroup",
          members: [
            { email: "test1@email.com" },
            { email: "test6@email.com" },
            { email: "test2@email.com" },
            { email: "test4@email.com" },
          ],
        },
      },
    };
    expect(resJson).toEqual(resExpected);
  });
});

describe("removeFromGroup", () => {
  test("Return error 400 if req.body does not contain all necessary attributes", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        // missing emails array
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Missing 'emails' array in body content"
    );
  });

  test("Return error 400 if the array of emails is empty", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: [],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Array 'emails' is empty"
    );
  });

  test("Return error 400 if group name does not represent a group in the database", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest.fn().mockResolvedValue(null);

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Group testgroup does not exist"
    );
  });

  test("Return error 400 if all provided emails represent users that do not belong to the group or do not exist", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test2@email.com", "test6@email.com"],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [
        { email: "test1@email.com", user: { username: "test1" } },
        { email: "test3@email.com", user: { username: "test3" } },
        { email: "test4@email.com", user: { username: "test4" } },
        { email: "test5@email.com", user: { username: "test5" } },
      ],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    Group.findOne = jest.fn().mockResolvedValueOnce(group); // the group exists

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce(null) // test2 does not exist
      .mockResolvedValueOnce({ username: "test6" }); // test6 exists

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({ error: "No user can be removed from the group" });
  });

  test("Return error 400 if the group contains only one member before deleting any user", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test2@email.com", "test6@email.com"],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test1@email.com", user: { username: "test1" } }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    Group.findOne = jest.fn().mockResolvedValueOnce(group); // the group exists

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce(null) // test2 does not exist
      .mockResolvedValueOnce({ username: "test6" }); // test6 exists

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      error: "Only one member remaining in the group",
    });
  });

  test("Return error 400 if at least one of the member emails is not in a valid email format", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(group) // the group exists
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({ username: "test1" })
      .mockResolvedValueOnce({ username: "test2" })
      .mockResolvedValueOnce({ username: "test3" });

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Found invalid email in array"
    );
  });

  test("Return error 400 if at least one of the member emails is an empty string", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "    "],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.findOne = jest
      .fn()
      .mockResolvedValueOnce(group) // the group exists
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({ username: "test1" })
      .mockResolvedValueOnce({ username: "test2" })
      .mockResolvedValueOnce({ username: "test3" });

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Empty email in array"
    );
  });

  test("Return error 401 if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/remove", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: false, cause: "Unauthorized" });

    Group.findOne = jest.fn().mockResolvedValue(group);

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(401);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Unauthorized"
    );
  });

  test("Return error 401 if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/pull", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/pull",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: false, cause: "Unauthorized" });

    Group.findOne = jest.fn().mockResolvedValue(group);

    await removeFromGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(401);
    expect(mockRes.json.mock.calls[0][0]).toHaveProperty(
      "error",
      "Unauthorized"
    );
  });

  test("Successfully remove the members from the group", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: [
          "test1@email.com",
          "test2@email.com",
          "test3@email.com",
          "test6@email.com",
        ],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [
        { email: "test1@email.com", user: { username: "test1" } },
        { email: "test3@email.com", user: { username: "test3" } },
        { email: "test4@email.com", user: { username: "test4" } },
        { email: "test5@email.com", user: { username: "test5" } },
      ],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    Group.findOne = jest.fn().mockResolvedValueOnce(group); // the group exists

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({ username: "test1" }) // test1 exists
      .mockResolvedValueOnce(null) // test2 does not exist
      .mockResolvedValueOnce({ username: "test3" }) // test3 exists
      .mockResolvedValueOnce({ username: "test6" }); // test6 exists

    Group.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

    await removeFromGroup(mockReq, mockRes);

    const retGroup = {
      name: "testgroup",
      members: [{ email: "test4@email.com" }, { email: "test5@email.com" }],
    };
    const retObj = {
      data: {
        group: retGroup,
        membersNotFound: ["test2@email.com"],
        notInGroup: ["test6@email.com"],
      },
    };
    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual(retObj);
  });

  test("Successfully remove the members from the group (but keep one member in the group)", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      params: {
        name: "testgroup",
      },
      body: {
        emails: ["test1@email.com", "test2@email.com", "test3@email.com"],
      },
      url: "/groups/testgroup/remove",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const group = {
      name: "testgroup",
      members: [
        { email: "test1@email.com", user: { username: "test1" } },
        { email: "test3@email.com", user: { username: "test3" } },
        { email: "test2@email.com", user: { username: "test2" } },
      ],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    Group.findOne = jest.fn().mockResolvedValueOnce(group); // the group exists

    User.findOne = jest
      .fn()
      .mockResolvedValueOnce({ username: "test1" })
      .mockResolvedValueOnce({ username: "test2" })
      .mockResolvedValueOnce({ username: "test3" });

    Group.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

    await removeFromGroup(mockReq, mockRes);

    const retGroup = {
      name: "testgroup",
      members: [{ email: "test1@email.com" }],
    };
    const retObj = {
      data: {
        group: retGroup,
        membersNotFound: [],
        notInGroup: [],
      },
    };
    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual(retObj);
  });
});

describe("deleteUser", () => {
  test("Delete the user successfully (user does not belong to any group)", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        email: "test@email.com",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const user = {
      email: "test@email.com",
      username: "testUser",
      role: "User",
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    User.findOne = jest.fn().mockResolvedValue(user);
    User.deleteOne = jest.fn().mockResolvedValue({});
    transactions.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
    Group.findOne = jest.fn().mockResolvedValue(null);

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      data: { deletedTransactions: 5, deletedFromGroup: false },
    });
  });

  test("Delete the user successfully (user does belongs to a group, but isn't the last member)", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        email: "test@email.com",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const user = {
      email: "test@email.com",
      username: "testUser",
      role: "User",
    };
    const group = {
      name: "group",
      members: [
        {
          email: "test@email.com",
          user: { email: "test@email.com", username: "testUser", role: "User" },
        },
        {
          email: "test2@email.com",
          user: {
            email: "test2@email.com",
            username: "testUser2",
            role: "User",
          },
        },
        {
          email: "test3@email.com",
          user: {
            email: "test3@email.com",
            username: "testUser3",
            role: "User",
          },
        },
      ],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    User.findOne = jest.fn().mockResolvedValue(user);
    User.deleteOne = jest.fn().mockResolvedValue({});
    transactions.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
    Group.findOne = jest.fn().mockResolvedValue(group);
    Group.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      data: { deletedTransactions: 5, deletedFromGroup: true },
    });
  });

  test("Delete the user successfully (user is the last member of a group)", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        email: "test@email.com",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const user = {
      email: "test@email.com",
      username: "testUser",
      role: "User",
    };
    const group = {
      name: "group",
      members: [
        {
          email: "test@email.com",
          user: { email: "test@email.com", username: "testUser", role: "User" },
        },
      ],
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    User.findOne = jest.fn().mockResolvedValue(user);
    User.deleteOne = jest.fn().mockResolvedValue({});
    transactions.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
    Group.findOne = jest.fn().mockResolvedValue(group);
    Group.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    Group.deleteOne = jest.fn().mockResolvedValue({});

    await deleteUser(mockReq, mockRes);

    expect(Group.deleteOne).toBeCalled();
    expect(Group.updateOne).not.toBeCalled();
    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      data: { deletedTransactions: 5, deletedFromGroup: true },
    });
  });

  test("Return error 400 if the request body does not contain all the necessary attributes", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        // missing email
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const user = {
      email: "test@email.com",
      username: "testUser",
      role: "User",
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      error: "Undefined or empty 'email' in body content",
    });
  });

  test("Return error 400 if the email passed in the request body is an empty string", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        email: "    ",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const user = {
      email: "test@email.com",
      username: "testUser",
      role: "User",
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      error: "Undefined or empty 'email' in body content",
    });
  });

  test("Return error 400 if the email passed in the request body is not in correct email format", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        email: "testemail.com",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const user = {
      email: "test@email.com",
      username: "testUser",
      role: "User",
    };
    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      error: "Invalid 'email' in body content",
    });
  });

  test("Return error 400 if the email passed in the request body does not represent a user in the database", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        email: "test@email.com",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    User.findOne = jest.fn().mockResolvedValue(null);

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      error: "User with email: test@email.com does not exist",
    });
  });

  test("Return error 400 if the email passed in the request body represents an admin", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        email: "test@email.com",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    User.findOne = jest.fn().mockResolvedValue({
      username: "test",
      email: "test@test.com",
      role: "Admin",
    });

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      error: "Can't delete an admin account",
    });
  });

  test("Return error 401 if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        email: "test@email.com",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: false, cause: "Not an admin" });

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(401);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      error: "Not an admin",
    });
  });
});

describe("deleteGroup", () => {
  test("Delete the group successfully", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        name: "testgroup",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    Group.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

    await deleteGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(200);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({
      data: { message: "Group deleted successfully" },
    });
  });

  test("Return error 400 if the request body does not contain all the necessary attributes", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        // missing name
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await deleteGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({ error: "Invalid name in body content" });
  });

  test("Return error 400 if the name passed in the request body is an empty string", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        name: "    ",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });

    await deleteGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({ error: "Invalid name in body content" });
  });

  test("Return error 400 if the name passed in the request body does not represent a group in the database", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        name: "testgroup",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: true, cause: "Authorized" });
    Group.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 0 });

    await deleteGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(400);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toEqual({ error: "Group testgroup does not exist" });
  });

  test("Return error 401 if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    const mockReq = {
      cookies: "accessToken=asd;refreshToken=asdf",
      body: {
        name: "testgroup",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    utils.verifyAuth = jest
      .fn()
      .mockReturnValue({ flag: false, cause: "Unauthorized" });

    await deleteGroup(mockReq, mockRes);

    expect(mockRes.status).toBeCalledWith(401);
    const resJson = mockRes.json.mock.calls[0][0];
    expect(resJson).toHaveProperty("error");
  });
});
