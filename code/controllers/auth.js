import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { verifyAuth } from "./utils.js";
import validator from "validator";

/**
 * - Request Parameters: None
- Request Body Content: An object having attributes `username`, `email` and `password`
  - Example: `{username: "Mario", email: "mario.red@email.com", password: "securePass"}`
- Response `data` Content: A message confirming successful insertion
  - Example: `res.status(200).json({data: {message: "User added successfully"}})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the parameters in the request body is an empty string
- Returns a 400 error if the email in the request body is not in a valid email format
- Returns a 400 error if the username in the request body identifies an already existing user
- Returns a 400 error if the email in the request body identifies an already existing user
 */
export const register = async (req, res) => {
    try {

        if (!req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")) {
            return res.status(400).json({ error: "Request body does not contain all the necessary attributes" });
        }

        const email = req.body.email.trim();
        const password = req.body.password.trim();
        const username = req.body.username.trim();

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Request body parameter cannot be empty string" });
        }

        const isEmailValid = validator.isEmail(email);

        if (!isEmailValid) {
            return res.status(400).json({ error: "Provided email is not in a valid email format" });
        }

        let existingUser = await User.findOne({ username: username });

        if (existingUser)
            return res.status(400).json({ error: `User with username: ${username} already registered` });

        existingUser = await User.findOne({ email: email });

        if (existingUser)
            return res.status(400).json({ error: `User with email: ${email} already registered` });

        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
            username,
            email,
            password: hashedPassword,
        });

        res.locals.message = "User added successfully";
        res.status(200).json({ data: { message: res.locals.message } });

    } catch (err) {
        return res.status(500).json({ error: err });
    }
};

/** 
- Request Parameters: None
- Request Body Content: An object having attributes `username`, `email` and `password`
  - Example: `{username: "admin", email: "admin@email.com", password: "securePass"}`
- Response `data` Content: A message confirming successful insertion
  - Example: `res.status(200).json({data: {message: "User added successfully"}})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the parameters in the request body is an empty string
- Returns a 400 error if the email in the request body is not in a valid email format
- Returns a 400 error if the username in the request body identifies an already existing user
- Returns a 400 error if the email in the request body identifies an already existing user
 * 
 */
export const registerAdmin = async (req, res) => {
    try {

        if (!req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")) {
            return res.status(400).json({ error: "Request body does not contain all the necessary attributes" });
        }

        const email = req.body.email.trim();
        const password = req.body.password.trim();
        const username = req.body.username.trim();

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Request body parameter cannot be empty string" });
        }

        const isEmailValid = validator.isEmail(email);

        if (!isEmailValid) {
            return res.status(400).json({ error: "Provided email is not in a valid email format" });
        }

        let existingUser = await User.findOne({ username: username });

        if (existingUser)
            return res.status(400).json({ error: `User with username: ${username} already registered` });

        existingUser = await User.findOne({ email: email });

        if (existingUser)
            return res.status(400).json({ error: `User with email: ${email} already registered` });

        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
            username,
            email,
            password: hashedPassword,
            role: "Admin",
        });

        res.locals.message = "Admin added successfully";
        res.status(200).json({ data: { message: res.locals.message } });

    } catch (err) {
        return res.status(500).json({ error: err });
    }
};

/**
 - Request Parameters: None
- Request Body Content: An object having attributes `email` and `password`
  - Example: `{email: "mario.red@email.com", password: "securePass"}`
- Response `data` Content: An object with the created accessToken and refreshToken
  - Example: `res.status(200).json({data: {accessToken: accessToken, refreshToken: refreshToken}})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the parameters in the request body is an empty string
- Returns a 400 error if the email in the request body is not in a valid email format
- Returns a 400 error if the email in the request body does not identify a user in the database
- Returns a 400 error if the supplied password does not match with the one in the database
*/
export const login = async (req, res) => {

    if (!req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")) {
        return res.status(400).json({ error: "Request body does not contain all the necessary attributes" });
    }

    const email = req.body.email.trim();
    const password = req.body.password.trim();


    if (!email || !password) {
        return res.status(400).json({ error: "Request body parameter cannot be empty string" });
    }

    const isEmailValid = validator.isEmail(email);

    if (!isEmailValid) {
        return res.status(400).json({ error: "Provided email is not in a valid email format" });
    }

    const existingUser = await User.findOne({ email: email });

    if (!existingUser)
        return res.status(400).json({ error: "please you need to register" });

    try {

        const match = await bcrypt.compare(password, existingUser.password);

        if (!match)
            return res.status(400).json({ error: "wrong credentials" });

        //CREATE ACCESSTOKEN
        const accessToken = jwt.sign(
            {
                email: existingUser.email,
                id: existingUser.id,
                username: existingUser.username,
                role: existingUser.role,
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        //CREATE REFRESH TOKEN
        const refreshToken = jwt.sign(
            {
                email: existingUser.email,
                id: existingUser.id,
                username: existingUser.username,
                role: existingUser.role,
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        //SAVE REFRESH TOKEN TO DB
        existingUser.refreshToken = refreshToken;
        await existingUser.save();

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            domain: "localhost",
            path: "/api",
            maxAge: 60 * 60 * 1000,
            sameSite: "none",
            secure: true,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            domain: "localhost",
            path: "/api",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true,
        });

        res.locals.message = "Login successful";
        res.status(200).json({ data: { accessToken: accessToken, refreshToken: refreshToken }, message: res.locals.message });

    } catch (error) {
        return res.status(500).json({ error: error });
    }
};

/**
 * - Request Parameters: None
- Request Body Content: None
- Response `data` Content: A message confirming successful logout
  - Example: `res.status(200).json({data: {message: "User logged out"}})`
- Returns a 400 error if the request does not have a refresh token in the cookies
- Returns a 400 error if the refresh token in the request's cookies does not represent a user in the database
 */
export const logout = async (req, res) => {
    const simpleAuth = verifyAuth(req, res, { authType: "Simple" });

    if (!simpleAuth.flag && simpleAuth.cause === "refreshToken is missing") {
        return res.status(400).json({ error: simpleAuth.cause });
    }

    const refreshToken = req.cookies.refreshToken;

    const user = await User.findOne({ refreshToken: refreshToken });

    if (!user) return res.status(400).json({ error: "User not found" });

    try {

        user.refreshToken = null;

        res.cookie("accessToken", "", {
            httpOnly: true,
            path: "/api",
            maxAge: 0,
            sameSite: "none",
            secure: true,
        });

        res.cookie("refreshToken", "", {
            httpOnly: true,
            path: "/api",
            maxAge: 0,
            sameSite: "none",
            secure: true,
        });

        await user.save();

        res.locals.message = "User logged out";
        res.status(200).json({ data: { message: res.locals.message } });

    } catch (error) {
        return res.status(500).json({ error: error });
    }
};
