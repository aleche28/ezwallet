import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt from "jsonwebtoken";
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import { transactions } from '../models/model';
import { request } from 'express';

dotenv.config();











describe("handleDateFilterParams", () => {

    test("should get an error because of wrong format", () => {
        const mockReq = { query: { date: "wrong_format", from: "", upTo: "" } };
        expect (() => handleDateFilterParams(mockReq)).toThrowError("Invalid date format");


    });

    test("should get an error because wrong combination of paramenters", () => {
        const mockReq = { query: { date: "2023-04-30", from: "2023-04-30", upTo: "" } };
        expect (() => handleDateFilterParams(mockReq)).toThrowError("Invalid combination");
    });

    test("should get an empty request to match all", () => {
        const mockReq = { query: { date: "", from: "", upTo: "" } };
        const mockRes = { date: {$exists: true} };
        const res = handleDateFilterParams(mockReq);
        expect(res).toEqual(mockRes);
    });

    test("should get a query to match a single day", () => {
        const mockReq = { query: { date: "2023-04-30"} };
        const mockRes = { date: { $gte: new Date("2023-04-30T00:00:00.000Z"), $lte: new Date("2023-04-30T23:59:59.999Z")} };
        const res = handleDateFilterParams(mockReq);
        expect(res).toEqual(mockRes);
    });

    test("should get a query to match from a date onwards", () => {
        const mockReq = { query: { date: "", from: "2023-04-30", upTo: "" } };
        const mockRes = { date: { $gte: new Date("2023-04-30T00:00:00.000Z") } };
        const res = handleDateFilterParams(mockReq);
        expect(res).toEqual(mockRes)
    });

    test("should get a query to match up to a certain date", () => {
        const mockReq = { query: { date: "", from: "", upTo: "2023-04-30" } };
        const mockRes = { date: { $lte: new Date("2023-04-30T23:59:59.999Z") } };
        const res = handleDateFilterParams(mockReq);
        expect(res).toEqual(mockRes)
    });

    test("should get a query to match from a date up to another", () => {
        const mockReq = { query: { date: "", from: "2023-01-30", upTo: "2023-04-30" } };
        const mockRes = { date: { $gte: new Date("2023-01-30T00:00:00.000Z"), $lte: new Date("2023-04-30T23:59:59.999Z") } };
        const res = handleDateFilterParams(mockReq);
        expect(res).toEqual(mockRes)
    });
})



describe("verifyAuth", () => {
    test('Simple verification is correct if tokens are valid', () => {
        //creating tokens with valid information before calling verifyAuth
        const accessToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = {
            cookies: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        };

        const mockRes = {};

        const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

        expect(simpleAuth.flag).toBe(true);
        expect(simpleAuth.cause).toBe("Authorized");

    });

    test('If accessToken expired but refreshToken is still valid, a new accessToken is generated and then user authentication is performed', () => {
        //creating tokens
        const accessTokenExpired = jwt.sign({
            email: "user@user.com",
            username: "user",
            role: "User"
        },
            process.env.ACCESS_KEY,
            { expiresIn: '0s' })

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = { cookies: { accessToken: accessTokenExpired, refreshToken: refreshToken } };
        //The inner working of the cookie function is as follows: the response object's cookieArgs object values are set
        const cookieMock = (name, value, options) => {
            mockRes.cookieArgs = { name, value, options };
        };
        //In this case the response object must have a "cookie" function that sets the needed values, as well as a "locals" object where the message must be set 
        const mockRes = {
            cookie: cookieMock,
            locals: {},
        };

        const userAuth = verifyAuth(mockReq, mockRes, { authType: "User", username: "user" });
        
        expect(mockRes.cookieArgs).toEqual({
            name: 'accessToken', //The cookie arguments must have the name set to "accessToken" (value updated)
            value: expect.any(String), //The actual value is unpredictable (jwt string), so it must exist
            options: { //The same options as during creation
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        });
        //The response object must have a field that contains the message, with the name being either "message" or "refreshedTokenMessage"
        const message = mockRes.locals.refreshedTokenMessage ? true : mockRes.locals.message ? true : false
        expect(message).toBe(true);
        expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
        expect(userAuth.flag).toBe(true);
        expect(userAuth.cause).toBe("Correct User");
    });

    test('If accessToken expired but refreshToken is still valid, a new accessToken is generated and then Admin authentication is performed', () => {
        //creating tokens
        const accessTokenExpired = jwt.sign({
            email: "user@user.com",
            username: "user",
            role: "User"
        },
            process.env.ACCESS_KEY,
            { expiresIn: '0s' })

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = { cookies: { accessToken: accessTokenExpired, refreshToken: refreshToken } };
        //The inner working of the cookie function is as follows: the response object's cookieArgs object values are set
        const cookieMock = (name, value, options) => {
            mockRes.cookieArgs = { name, value, options };
        };
        //In this case the response object must have a "cookie" function that sets the needed values, as well as a "locals" object where the message must be set 
        const mockRes = {
            cookie: cookieMock,
            locals: {},
        };
        const adminAuth = verifyAuth(mockReq, mockRes, { authType: "Admin" });
        
        expect(mockRes.cookieArgs).toEqual({
            name: 'accessToken', //The cookie arguments must have the name set to "accessToken" (value updated)
            value: expect.any(String), //The actual value is unpredictable (jwt string), so it must exist
            options: { //The same options as during creation
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        });
        //The response object must have a field that contains the message, with the name being either "message" or "refreshedTokenMessage"
        const message = mockRes.locals.refreshedTokenMessage ? true : mockRes.locals.message ? true : false
        expect(message).toBe(true);
        expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
        expect(adminAuth.flag).toBe(false);
        expect(adminAuth.cause).toBe("User is not Admin");
    });

    test('If accessToken expired but refreshToken is still valid, a new accessToken is generated and then Group authentication is performed', () => {
        //creating tokens
        const accessTokenExpired = jwt.sign({
            email: "user@user.com",
            username: "user",
            role: "User"
        },
            process.env.ACCESS_KEY,
            { expiresIn: '0s' })

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockEmails = ["user@user.com", "fake@fake.com", "test@test.com"]

        const mockReq = { cookies: { accessToken: accessTokenExpired, refreshToken: refreshToken } };
        //The inner working of the cookie function is as follows: the response object's cookieArgs object values are set
        const cookieMock = (name, value, options) => {
            mockRes.cookieArgs = { name, value, options };
        };
        //In this case the response object must have a "cookie" function that sets the needed values, as well as a "locals" object where the message must be set 
        const mockRes = {
            cookie: cookieMock,
            locals: {},
        };
        const groupAuth = verifyAuth(mockReq, mockRes, { authType: "Group", emails: mockEmails });
        
        expect(mockRes.cookieArgs).toEqual({
            name: 'accessToken', //The cookie arguments must have the name set to "accessToken" (value updated)
            value: expect.any(String), //The actual value is unpredictable (jwt string), so it must exist
            options: { //The same options as during creation
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        });
        //The response object must have a field that contains the message, with the name being either "message" or "refreshedTokenMessage"
        const message = mockRes.locals.refreshedTokenMessage ? true : mockRes.locals.message ? true : false
        expect(message).toBe(true);
        expect(mockRes.locals.refreshedTokenMessage).toBe("Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls");
        expect(groupAuth.flag).toBe(true);
        expect(groupAuth.cause).toBe("User belongs to Group");
    });

    test('If one among accessToken, refreshToken is missing, Simple verification fails', () => {
        //creating only refreshToken
        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = {
            cookies: {
                //empty accessToken
                accessToken: "",
                refreshToken: refreshToken
            }
        };

        const mockRes = {};

        const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

        expect(simpleAuth.flag).toBe(false);
        expect(simpleAuth.cause).toBe("accessToken is missing");

    });

    test('If token is missing some parameter, Simple verification fails', () => {
        //creating accessToken without email parameter
        const accessToken = jwt.sign(
            {
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = {
            cookies: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        };

        const mockRes = {};

        const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

        expect(simpleAuth.flag).toBe(false);
        expect(simpleAuth.cause).toBe("Token is missing information");

    });


    test('If tokens contain (at least) one different value, Simple verification fails', () => {
        //creating tokens with different values
        const accessToken = jwt.sign(
            {
                email: "different@email.com",
                username: "different_user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = {
            cookies: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        };

        const mockRes = {};

        const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Simple" });

        expect(simpleAuth.flag).toBe(false);
        expect(simpleAuth.cause).toBe("Mismatched users");

    });


    test('If provided username matches with the one stored inside the two (valid) tokens, User verification is correct', () => {
        //creating valid tokens 
        const accessToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = {
            cookies: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        };

        const mockRes = {};

        const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "User", username: "user" });

        expect(simpleAuth.flag).toBe(true);
        expect(simpleAuth.cause).toBe("Correct User");

    });

    test('If provided username does not match with the one stored inside the two (valid) tokens, User verification fails', () => {
        //creating valid tokens 
        const accessToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = {
            cookies: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        };

        const mockRes = {};

        const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "User", username: "another_user" });

        expect(simpleAuth.flag).toBe(false);
        expect(simpleAuth.cause).toBe("Wrong User");

    });

    test('If email value stored inside the two tokens is contained in the provided array, Group verification is successful', () => {
        //creating valid tokens 
        const accessToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = {
            cookies: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        };

        const mockRes = {};
        const emails = ["user1@user1.com", "user@user.com", "user12@user12.com"]

        const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Group", emails: emails });

        expect(simpleAuth.flag).toBe(true);
        expect(simpleAuth.cause).toBe("User belongs to Group");

    });

    test('If email value stored inside the two tokens is not contained in the provided array, Group verification fails', () => {
        //creating valid tokens 
        const accessToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 1,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const mockReq = {
            cookies: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        };

        const mockRes = {};
        const emails = ["user1@user1.com", "user23@user23.com", "user12@user12.com"]

        const simpleAuth = verifyAuth(mockReq, mockRes, { authType: "Group", emails: emails });

        expect(simpleAuth.flag).toBe(false);
        expect(simpleAuth.cause).toBe("User does not belong to Group");

    });

});




describe("handleAmountFilterParams", () => {

    test("should get an error because query not a number", () => {
        const mockReq = { query: { min: "nan", max: "nan" } };
        expect(() => handleAmountFilterParams(mockReq)).toThrow("Amount is not a number");
    });

    test("should return an empty query to match all", () => {
        const mockReq = { query: { min: "", max: "" } };
        const mockRes = { amount: {$exists: true} };
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
        const mockRes = { amount: {$exists: true} };
        const res = handleAmountFilterParams(mockReq);
        expect(res).toEqual(mockRes);
    });
})
