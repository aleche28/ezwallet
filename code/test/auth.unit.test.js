import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { login, logout, register, registerAdmin } from '../controllers/auth';
import * as utils from '../controllers/utils';
import bcrypt from "bcryptjs";
import validator from "validator";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../models/User.js");
jest.mock("validator");
jest.mock("../controllers/utils.js");

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
    User.find.mockClear();
    User.findOne.mockClear();
    User.create.mockClear();
    bcrypt.hash.mockClear();
    validator.isEmail.mockClear();
    utils.verifyAuth.mockClear();
    jwt.sign.mockClear();
    //additional `mockClear()` must be placed here
});


describe('register', () => {
    test('If new user does not still exists it is successfully created', async () => {
        //new user to be registered
        const mockReq = {
            body: {
                username: "new_user",
                email: "user@user.com",
                password: "new_user_password"
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        //new user does not already exist
        jest.spyOn(User, "findOne").mockImplementation(() => null);

        //just returning plaintext password
        jest.spyOn(bcrypt, "hash").mockImplementation(() => mockReq.body.password);

        //create() store and returns the new created object
        jest.spyOn(User, "create").mockImplementation(() => mockReq.body);

        //email format is valid for this test
        jest.spyOn(validator, "isEmail").mockImplementation(() => true);

        //test function call
        await register(mockReq, mockRes);

        //assertions
        expect(validator.isEmail).toBeCalledWith(mockReq.body.email);

        expect(User.findOne).toBeCalledWith({ username: mockReq.body.username });
        expect(User.findOne).toBeCalledWith({ email: mockReq.body.email });

        expect(bcrypt.hash).toBeCalledWith(mockReq.body.password, 12);
        expect(User.create).toBeCalledWith(mockReq.body);

        expect(mockRes.status).toBeCalledWith(200);

        expect(mockRes.json).toBeCalledWith({ data: { message: "User added successfully" } });
    });

    test('If body contains an empty parameter an error is returned', async () => {
        //new user to be registered with empty username value
        const mockReq = {
            body: {
                username: "",
                email: "user@user.com",
                password: "new_user_password"
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        //test function call
        await register(mockReq, mockRes);

        //assertions
        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: "Request body parameter cannot be empty string" });
    });

    test('If body does not contain a required parameter, an error is returned', async () => {
        //new user to be registered with missing username parameter
        const mockReq = {
            body: {
                email: "user@user.com",
                password: "new_user_password"
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        //test function call
        await register(mockReq, mockRes);

        //assertions
        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: "Request body does not contain all the necessary attributes" });
    });


    test('If a user with same username exists, an error is returned', async () => {
        //same username
        const mockReq = {
            body: {
                username: "same_username",
                email: "user@user.com",
                password: "new_user_password"
            }
        };

        const mockExistingUserSameUsername = {
            username: "same_username",
            email: "not@same.com",
            password: "new_user_password"
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        //user already registered
        jest.spyOn(User, "findOne").mockImplementation(() => mockExistingUserSameUsername);
        //email format is valid for this test
        jest.spyOn(validator, "isEmail").mockImplementation(() => true);

        //test function call
        await register(mockReq, mockRes);

        //assertions
        expect(validator.isEmail).toBeCalledWith(mockReq.body.email);

        expect(User.findOne).toBeCalledWith({ username: mockReq.body.username });

        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: `User with username: ${mockReq.body.username} already registered` });
    });

});

describe("registerAdmin", () => {
    test('If new admin does not still exists it is successfully created', async () => {
        //new admin to be registered
        const mockReq = {
            body: {
                username: "new_admin",
                email: "newadmin@newadmin.com",
                password: "new_admin_password"
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        const mockCreated = {
            username: "new_admin",
            email: "newadmin@newadmin.com",
            password: "new_admin_password",
            role: "Admin"
        }

        //new admin does not already exist
        jest.spyOn(User, "findOne").mockImplementation(() => null);

        //just returning plaintext password
        jest.spyOn(bcrypt, "hash").mockImplementation(() => mockReq.body.password);

        //create() store and returns the new created object
        jest.spyOn(User, "create").mockImplementation(() => mockCreated);

        //email format is valid for this test
        jest.spyOn(validator, "isEmail").mockImplementation(() => true);

        //test function call
        await registerAdmin(mockReq, mockRes);

        //assertions
        expect(validator.isEmail).toBeCalledWith(mockReq.body.email);

        expect(User.findOne).toBeCalledWith({ username: mockReq.body.username });
        expect(User.findOne).toBeCalledWith({ email: mockReq.body.email });

        expect(bcrypt.hash).toBeCalledWith(mockReq.body.password, 12);
        expect(User.create).toBeCalledWith(mockCreated);

        expect(mockRes.status).toBeCalledWith(200);

        expect(mockRes.json).toBeCalledWith({ data: { message: "Admin added successfully" } });
    });

    test('If body contains an empty parameter an error is returned', async () => {
        //new admin to be registered with empty username value
        const mockReq = {
            body: {
                username: "",
                email: "admin@admin.com",
                password: "new_user_password"
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        //test function call
        await registerAdmin(mockReq, mockRes);

        //assertions
        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: "Request body parameter cannot be empty string" });
    });

    test('If body does not contain a required parameter, an error is returned', async () => {
        //new admin to be registered with missing username parameter
        const mockReq = {
            body: {
                email: "admin@admin.com",
                password: "new_user_password"
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        //test function call
        await registerAdmin(mockReq, mockRes);

        //assertions
        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: "Request body does not contain all the necessary attributes" });
    });

    test('If an Admin with same username exists, an error is returned', async () => {
        //same username
        const mockReq = {
            body: {
                username: "same_username",
                email: "admin@admin.com",
                password: "new_user_password"
            }
        };

        const mockExistingUserSameUsername = {
            username: "same_username",
            email: "not@same.com",
            password: "new_user_password"
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        //user already registered
        jest.spyOn(User, "findOne").mockImplementation(() => mockExistingUserSameUsername);
        //email format is valid for this test
        jest.spyOn(validator, "isEmail").mockImplementation(() => true);

        //test function call
        await registerAdmin(mockReq, mockRes);

        //assertions
        expect(validator.isEmail).toBeCalledWith(mockReq.body.email);

        expect(User.findOne).toBeCalledWith({ username: mockReq.body.username });

        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: `User with username: ${mockReq.body.username} already registered` });
    });
});

describe('login', () => {
    test('If body does not contain a required parameter, an error is returned', async () => {
        //new user to be registered
        const mockReq = {
            body: {
                password: "new_user_password"
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };

        //test function call
        await login(mockReq, mockRes);

        //assertions
        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: "Request body does not contain all the necessary attributes" });
    });

    test('If body contains an empty parameter an error is returned', async () => {
        //new user to be registered
        const mockReq = {
            body: {
                email: "",
                password: "new_user_password"
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { message: jest.fn() }
        };


        //test function call
        await login(mockReq, mockRes);

        //assertions
        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: "Request body parameter cannot be empty string" });
    });

    test('If user is registered, login is successful', async () => {
        const mockReq = {
            body: {
                email: 'test@example.com',
                password: 'password123',
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            locals: {},
        };

        const existingUser = {
            username: "user",
            email: "test@example.com",
            password: "hashed_password",
            role: "User",
            refreshToken: "",
            save: jest.fn()
        }

        const mockToken = "mockToken";

        jest.spyOn(User, "findOne").mockImplementation(() => existingUser);
        jest.spyOn(bcrypt, "compare").mockImplementation(() => true);
        jest.spyOn(validator, "isEmail").mockImplementation(() => true);
        jest.spyOn(jwt, "sign").mockImplementation(() => mockToken)

        //test function call
        await login(mockReq, mockRes);

        // Assertions
        expect(validator.isEmail).toBeCalledWith(mockReq.body.email);
        expect(User.findOne).toBeCalledWith({ email: mockReq.body.email });
        expect(bcrypt.compare).toBeCalledWith(mockReq.body.password, existingUser.password);
        expect(jwt.sign).toBeCalled();
        expect(existingUser.save).toBeCalled();
        expect(mockRes.json).toBeCalledWith({
            data: {
                accessToken: mockToken,
                refreshToken: mockToken,
            },
            message: 'Login successful',
        });
    });
});

describe('logout', () => {
    test('if user was logged in, is successfully logged out', async () => {

        const mockReq = {
            cookies: {
                accessToken: jest.fn(),
                refreshToken: jest.fn()
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            locals: {},
        };

        const user = {
            username: "logged_user",
            email: "logged@user.com",
            password: "hashed_password",
            refreshToken: "mockToken",
            role: "User",
            save: jest.fn()
        };


        //verifyAuth with Simple option successful message
        jest.spyOn(utils, "verifyAuth").mockImplementation(() => ({ flag: true, cause: "Authorized" }));

        //retrieving logged-in user
        jest.spyOn(User, "findOne").mockImplementation(() => user);

        //test function call
        await logout(mockReq, mockRes);

        //assertions
        expect(utils.verifyAuth).toBeCalledWith(mockReq, mockRes, { authType: "Simple" });
        expect(User.findOne).toBeCalledWith({ refreshToken: mockReq.cookies.refreshToken });
        expect(mockRes.status).toBeCalledWith(200);
        expect(mockRes.cookie.accessToken).toBe(undefined);
        expect(mockRes.cookie.refreshToken).toBe(undefined);
        expect(user.refreshToken).toBe(null);
        expect(user.save).toBeCalled();
        expect(mockRes.json).toBeCalledWith({ data: { message: "User logged out" } });

    });

    test('if refreshToken is missing, an error message is returned', async () => {

        const mockReq = {
            cookies: {
                accessToken: jest.fn(),
                refreshToken: null
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            locals: {},
        };

        const user = {
            username: "logged_user",
            email: "logged@user.com",
            password: "hashed_password",
            refreshToken: "mockToken",
            role: "User",
            save: jest.fn()
        };


        //verifyAuth with Simple option successful message
        jest.spyOn(utils, "verifyAuth").mockImplementation(() => ({ flag: false, cause: "refreshToken is missing" }));

        //test function call
        await logout(mockReq, mockRes);

        //assertions
        expect(utils.verifyAuth).toBeCalledWith(mockReq, mockRes, { authType: "Simple" });

        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: "refreshToken is missing" });

    });

    test('if refreshToken in the cookies does not represent a user in the database, an error message is returned', async () => {

        const mockReq = {
            cookies: {
                accessToken: jest.fn(),
                refreshToken: jest.fn()
            }
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            locals: {},
        };

        const user = null;


        //verifyAuth with Simple option successful message
        jest.spyOn(utils, "verifyAuth").mockImplementation(() => ({ flag: true, cause: "Authorized" }));

        //user not found
        jest.spyOn(User, "findOne").mockImplementation(() => user);

        //test function call
        await logout(mockReq, mockRes);

        //assertions
        expect(utils.verifyAuth).toBeCalledWith(mockReq, mockRes, { authType: "Simple" });

        expect(mockRes.status).toBeCalledWith(400);
        expect(mockRes.json).toBeCalledWith({ error: "User not found" });

    });

});
