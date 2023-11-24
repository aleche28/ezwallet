import jwt from "jsonwebtoken";
import {
  handleDateFilterParams,
  verifyAuth,
  handleAmountFilterParams,
} from "../controllers/utils";

jest.mock("jsonwebtoken");

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  jwt.verify.mockClear();
  jwt.sign.mockClear();
  //additional `mockClear()` must be placed here
});

describe("handleDateFilterParams", () => {
  test("should get an error because of wrong 'date' date format", () => {
    const mockReq = { query: { date: "wrong_format", from: "", upTo: "" } };
    expect(() => handleDateFilterParams(mockReq)).toThrowError(
      "Invalid date format"
    );
  });

  test("should get an error because of invalid 'from' date format", () => {
    const mockReq = { query: { date: "", from: "wrong_format", upTo: "" } };
    expect(() => handleDateFilterParams(mockReq)).toThrowError(
      'Invalid " from " date format'
    );
  });

  test("should get an error because of invalid 'upTo' date format", () => {
    const mockReq = { query: { date: "", from: "", upTo: "wrong_format" } };
    expect(() => handleDateFilterParams(mockReq)).toThrowError(
      'Invalid "upTo" date format'
    );
  });

  test("should get an error because of invalid 'from' date format (passing also upTo)", () => {
    const mockReq = {
      query: { date: "", from: "wrong_format", upTo: "2023-04-30" },
    };
    expect(() => handleDateFilterParams(mockReq)).toThrowError(
      'Invalid " from " date format'
    );
  });

  test("should get an error because of invalid 'upTo' date format (passing also from)", () => {
    const mockReq = {
      query: { date: "", from: "2023-04-30", upTo: "wrong_format" },
    };
    expect(() => handleDateFilterParams(mockReq)).toThrowError(
      'Invalid "upTo" date format'
    );
  });

  test("should get an error because wrong combination of paramenters", () => {
    const mockReq = {
      query: { date: "2023-04-30", from: "2023-04-30", upTo: "" },
    };
    expect(() => handleDateFilterParams(mockReq)).toThrowError(
      "Invalid combination"
    );
  });

  test("should get an empty request to match all", () => {
    const mockReq = { query: { date: "", from: "", upTo: "" } };
    const mockRes = { date: { $exists: true } };
    const res = handleDateFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should get a query to match a single day", () => {
    const mockReq = { query: { date: "2023-04-30" } };
    const mockRes = {
      date: {
        $gte: new Date("2023-04-30T00:00:00.000Z"),
        $lte: new Date("2023-04-30T23:59:59.999Z"),
      },
    };
    const res = handleDateFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should get a query to match from a date onwards", () => {
    const mockReq = { query: { date: "", from: "2023-04-30", upTo: "" } };
    const mockRes = { date: { $gte: new Date("2023-04-30T00:00:00.000Z") } };
    const res = handleDateFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should get a query to match up to a certain date", () => {
    const mockReq = { query: { date: "", from: "", upTo: "2023-04-30" } };
    const mockRes = { date: { $lte: new Date("2023-04-30T23:59:59.999Z") } };
    const res = handleDateFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should get a query to match from a date up to another", () => {
    const mockReq = {
      query: { date: "", from: "2023-01-30", upTo: "2023-04-30" },
    };
    const mockRes = {
      date: {
        $gte: new Date("2023-01-30T00:00:00.000Z"),
        $lte: new Date("2023-04-30T23:59:59.999Z"),
      },
    };
    const res = handleDateFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });
});

describe("verifyAuth", () => {
  test("Simple verification with correct tokens set", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };

    //token is decoded correctly
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);

    //test function call
    const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

    //assertions
    expect(jwt.verify).toBeCalled();
    expect(simpleAuth).toStrictEqual({ flag: true, cause: "Authorized" });
  });

  test("Simple verification with missing accessToken, an error message is returned", () => {
    const mockReq = { cookies: { accessToken: "", refreshToken: "" } };
    const mockRes = {};
    const decodedToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };

    //test function call
    const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

    //assertions
    expect(jwt.verify).not.toBeCalled();
    expect(simpleAuth).toStrictEqual({
      flag: false,
      cause: "accessToken is missing",
    });
  });

  test("Simple verification with missing refreshToken, an error message is returned", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };

    //test function call
    const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

    //assertions
    expect(jwt.verify).not.toBeCalled();
    expect(simpleAuth).toStrictEqual({
      flag: false,
      cause: "refreshToken is missing",
    });
  });

  test("Simple verification with missing information in accessToken, an error message is returned", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "username",
      email: "user@user.com",
      role: "",
    };
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);
    //test function call
    const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

    //assertions
    expect(jwt.verify).toBeCalledTimes(2);
    expect(simpleAuth).toStrictEqual({
      flag: false,
      cause: "Token is missing information",
    });
  });

  test("Simple verification with missing information in refreshToken, an error message is returned", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedAccessToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "username",
      email: "user@user.com",
      role: "",
    };
    jest
      .spyOn(jwt, "verify")
      .mockReturnValueOnce(decodedAccessToken)
      .mockReturnValueOnce(decodedRefreshToken);
    //test function call
    const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

    //assertions
    expect(jwt.verify).toBeCalledTimes(2);
    expect(simpleAuth).toStrictEqual({
      flag: false,
      cause: "Token is missing information",
    });
  });

  test("Simple verification with missing information in refreshToken, an error message is returned", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedAccessToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "differentUser",
      email: "user@user.com",
      role: "User",
    };
    jest
      .spyOn(jwt, "verify")
      .mockReturnValueOnce(decodedAccessToken)
      .mockReturnValueOnce(decodedRefreshToken);
    //test function call
    const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

    //assertions
    expect(jwt.verify).toBeCalledTimes(2);
    expect(simpleAuth).toStrictEqual({
      flag: false,
      cause: "Mismatched users",
    });
  });

  test("AccessToken has to be refreshed (authType=Simple)", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {
      cookie: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    const decodedAccessToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "differentUser",
      email: "user@user.com",
      role: "User",
    };

    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => {
        throw { name: "TokenExpiredError" };
      })
      .mockReturnValueOnce(decodedRefreshToken)
      .mockReturnValueOnce(decodedAccessToken)

    jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken);

    const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

    //assertions
    expect(simpleAuth).toEqual({ flag: true, cause: "Authorized" });
    expect(jwt.verify).toBeCalledTimes(3);
    expect(mockRes.cookie).toHaveBeenCalled();
    expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
  });

  test("AccessToken has to be refreshed (authType=User) but the user is wrong", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {
      cookie: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    const decodedAccessToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "differentUser",
      email: "user@user.com",
      role: "User",
    };

    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => {
        throw { name: "TokenExpiredError" };
      })
      .mockReturnValueOnce(decodedRefreshToken)
      .mockReturnValueOnce(decodedAccessToken)

    jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken);

    const userAuth = verifyAuth(mockReq, mockRes, { authType: "User", username: "anotherUser" });

    //assertions
    expect(userAuth).toEqual({ flag: false, cause: "Wrong User" });
    expect(jwt.verify).toBeCalledTimes(3);
    expect(mockRes.cookie).toHaveBeenCalled();
    expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
  });

  test("AccessToken has to be refreshed (authType=User) and the user is correct", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {
      cookie: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    const decodedAccessToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };

    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => {
        throw { name: "TokenExpiredError" };
      })
      .mockReturnValueOnce(decodedRefreshToken)
      .mockReturnValueOnce(decodedAccessToken)

    jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken);

    const userAuth = verifyAuth(mockReq, mockRes, { authType: "User", username: "username" });

    //assertions
    expect(userAuth).toEqual({ flag: true, cause: "Correct User" });
    expect(jwt.verify).toBeCalledTimes(3);
    expect(mockRes.cookie).toHaveBeenCalled();
    expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
  });

  test("AccessToken has to be refreshed (authType=Admin) and the user is an admin", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {
      cookie: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    const decodedAccessToken = {
      username: "username",
      email: "admin@user.com",
      role: "Admin",
    };
    const decodedRefreshToken = {
      username: "username",
      email: "admin@user.com",
      role: "Admin",
    };

    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => {
        throw { name: "TokenExpiredError" };
      })
      .mockReturnValueOnce(decodedRefreshToken)
      .mockReturnValueOnce(decodedAccessToken)

    jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken);

    const adminAuth = verifyAuth(mockReq, mockRes, { authType: "Admin" });

    //assertions
    expect(adminAuth).toEqual({ flag: true, cause: "User is Admin" });
    expect(jwt.verify).toBeCalledTimes(3);
    expect(mockRes.cookie).toHaveBeenCalled();
    expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
  });

  test("AccessToken has to be refreshed (authType=Admin) but the user is not an admin", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {
      cookie: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    const decodedAccessToken = {
      username: "username",
      email: "admin@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "username",
      email: "admin@user.com",
      role: "Admin",
    };

    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => {
        throw { name: "TokenExpiredError" };
      })
      .mockReturnValueOnce(decodedRefreshToken)
      .mockReturnValueOnce(decodedAccessToken)

    jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken);

    const adminAuth = verifyAuth(mockReq, mockRes, { authType: "Admin" });

    //assertions
    expect(adminAuth).toEqual({ flag: false, cause: "User is not Admin" });
    expect(jwt.verify).toBeCalledTimes(3);
    expect(mockRes.cookie).toHaveBeenCalled();
    expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
  });

  test("AccessToken has to be refreshed (authType=Group) and the user is part of the group", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {
      cookie: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    const decodedAccessToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };

    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => {
        throw { name: "TokenExpiredError" };
      })
      .mockReturnValueOnce(decodedRefreshToken)
      .mockReturnValueOnce(decodedAccessToken)

    jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken);

    const group = ["user@user.com", "user1@user.com", "user2@user.com"]
    const groupAuth = verifyAuth(mockReq, mockRes, { authType: "Group", emails: group });

    //assertions
    expect(groupAuth).toEqual({ flag: true, cause: "User belongs to Group" });
    expect(jwt.verify).toBeCalledTimes(3);
    expect(mockRes.cookie).toHaveBeenCalled();
    expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
  });

  test("AccessToken has to be refreshed (authType=Group) but the user is not part of the group", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {
      cookie: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    const decodedAccessToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };

    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => {
        throw { name: "TokenExpiredError" };
      })
      .mockReturnValueOnce(decodedRefreshToken)
      .mockReturnValueOnce(decodedAccessToken)

    jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken);

    const group = ["user1@user.com", "user2@user.com"]
    const groupAuth = verifyAuth(mockReq, mockRes, { authType: "Group", emails: group });

    //assertions
    expect(groupAuth).toEqual({ flag: true, cause: "User does not belong to Group" });
    expect(jwt.verify).toBeCalledTimes(3);
    expect(mockRes.cookie).toHaveBeenCalled();
    expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
  });

  test("AccessToken and refreshToken are both expired", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {
      cookie: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    const decodedAccessToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };
    const decodedRefreshToken = {
      username: "username",
      email: "user@user.com",
      role: "User",
    };

    jest
      .spyOn(jwt, "verify")
      .mockImplementation(() => {
        throw { name: "TokenExpiredError" };
      })
    //   .mockReturnValueOnce(decodedRefreshToken)
    //   .mockReturnValueOnce(decodedAccessToken)

    //jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken);

    //const group = ["user1@user.com", "user2@user.com"]
    const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

    //assertions
    expect(simpleAuth).toEqual({ flag: false, cause: "Perform login again" });
    expect(jwt.verify).toBeCalledTimes(2);
  });

  test("User verification with same correct username stored both on verifyAuth call and tokens", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "correct_username",
      email: "user@user.com",
      role: "User",
    };

    //token is decoded correctly
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);

    //test function call
    const userAuth = verifyAuth(mockReq, mockRes, {
      authType: "User",
      username: "correct_username",
    });

    //assertions
    expect(jwt.verify).toBeCalled();
    expect(userAuth).toStrictEqual({ flag: true, cause: "Correct User" });
  });

  test("User verification with wrong username request, an error message is returned", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "not_same_username",
      email: "user@user.com",
      role: "User",
    };

    //token is decoded correctly
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);

    //test function call
    const userAuth = verifyAuth(mockReq, mockRes, {
      authType: "User",
      username: "different_username",
    });

    //assertions
    expect(jwt.verify).toBeCalled();
    expect(userAuth).toStrictEqual({ flag: false, cause: "Wrong User" });
  });

  test("User verification with wrong username request, an error message is returned", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "not_same_username",
      email: "user@user.com",
      role: "User",
    };

    //token is decoded correctly
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);

    //test function call
    const userAuth = verifyAuth(mockReq, mockRes, {
      authType: "User",
      username: "different_username",
    });

    //assertions
    expect(jwt.verify).toBeCalled();
    expect(userAuth).toStrictEqual({ flag: false, cause: "Wrong User" });
  });

  test("Admin verification with user owning admin privileges", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "username",
      email: "user@user.com",
      //user is Admin
      role: "Admin",
    };

    //token is decoded correctly
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);

    //test function call
    const adminAuth = verifyAuth(mockReq, mockRes, { authType: "Admin" });

    //assertions
    expect(jwt.verify).toBeCalled();
    expect(adminAuth).toStrictEqual({ flag: true, cause: "User is Admin" });
  });

  test("Admin verification with user not owning admin privileges, an error message is returned", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "username",
      email: "user@user.com",
      //user is not Admin
      role: "User",
    };

    //token is decoded correctly
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);

    //test function call
    const adminAuth = verifyAuth(mockReq, mockRes, { authType: "Admin" });

    //assertions
    expect(jwt.verify).toBeCalled();
    expect(adminAuth).toStrictEqual({
      flag: false,
      cause: "User is not Admin",
    });
  });

  test("Group verification with correct group set", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "username",
      email: "user@user.com",
      //user is not Admin
      role: "User",
    };

    //emails of users belonging to same group
    const emails = [
      "user4@user.com",
      "user12@user.com",
      "user43@user.com",
      "user@user.com",
    ];

    //token is decoded correctly
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);

    //test function call
    const groupAuth = verifyAuth(mockReq, mockRes, {
      authType: "Group",
      emails: emails,
    });

    //assertions
    expect(jwt.verify).toBeCalled();
    expect(groupAuth).toStrictEqual({
      flag: true,
      cause: "User belongs to Group",
    });
  });

  test("Group verification with wrong group set", () => {
    const mockReq = {
      cookies: { accessToken: "accessToken", refreshToken: "refreshToken" },
    };
    const mockRes = {};
    const decodedToken = {
      username: "username",
      email: "user@user.com",
      //user is not Admin
      role: "User",
    };

    //emails of users -> calling user does not belong to group
    const emails = ["user4@user.com", "user12@user.com", "user43@user.com"];

    //token is decoded correctly
    jest.spyOn(jwt, "verify").mockImplementation(() => decodedToken);

    //test function call
    const groupAuth = verifyAuth(mockReq, mockRes, {
      authType: "Group",
      emails: emails,
    });

    //assertions
    expect(jwt.verify).toBeCalled();
    expect(groupAuth).toEqual({
      flag: false,
      cause: "User does not belong to Group",
    });
  });
});

describe("handleAmountFilterParams", () => {
  test("should get an error because query not a number (passing min and max)", () => {
    const mockReq = { query: { min: "nan", max: "nan" } };
    expect(() => handleAmountFilterParams(mockReq)).toThrow(
      "Amount is not a number"
    );
  });

  test("should get an error because query not a number (passing only min)", () => {
    const mockReq = { query: { min: "nan" } };
    expect(() => handleAmountFilterParams(mockReq)).toThrow(
      "Amount is not a number"
    );
  });

  test("should get an error because query not a number (passing only min)", () => {
    const mockReq = { query: { max: "nan" } };
    expect(() => handleAmountFilterParams(mockReq)).toThrow(
      "Amount is not a number"
    );
  });

  test("should return an empty query to match all", () => {
    const mockReq = { query: { min: "", max: "" } };
    const mockRes = { amount: { $exists: true } };
    const res = handleAmountFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should return query to match from min amount upwards", () => {
    const mockReq = { query: { min: 42, max: "" } };
    const mockRes = { amount: { $gte: 42 } };
    const res = handleAmountFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should return query to match up to max value", () => {
    const mockReq = { query: { min: "", max: 42 } };
    const mockRes = { amount: { $lte: 42 } };
    const res = handleAmountFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should return query to match up to max value", () => {
    const mockReq = { query: { min: "", max: 42 } };
    const mockRes = { amount: { $lte: 42 } };
    const res = handleAmountFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should return query to match from min to max value", () => {
    const mockReq = { query: { min: 3, max: 42 } };
    const mockRes = { amount: { $gte: 3, $lte: 42 } };
    const res = handleAmountFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });

  test("should return query that matches all since min > max", () => {
    const mockReq = { query: { min: "69", max: 42 } };
    const mockRes = { amount: { $exists: true } };
    const res = handleAmountFilterParams(mockReq);
    expect(res).toEqual(mockRes);
  });
});
