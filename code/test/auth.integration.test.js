import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

afterEach(async () => {
  await User.deleteMany({});
});

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('register', () => {
  test('register a valid new user', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        username: 'new_user',
        email: 'email@example.com',
        password: 'password'
      });

    expect(response.status).toBe(200);
    expect(response.body.error).toBe(undefined);
    expect(response.body.data.message).toBe('User added successfully');

    const newRegistered = await User.findOne({
      username: 'new_user',
      email: 'email@example.com',
    });

    expect(newRegistered).toEqual(expect.objectContaining({
      username: 'new_user',
      email: 'email@example.com',
    }));
  });

  test('attempt to register a user previously registered,an error message is returned', async () => {
    //previously registered
    const registeredUser = await User.create({
      username: 'new_user',
      email: 'email@example.com',
      password: 'password'
    });

    const response = await request(app)
      .post('/api/register')
      .send({
        //same user 
        username: 'new_user',
        email: 'email@example.com',
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("User with username: new_user already registered");
  });

  test('register request body is missing parameters, an error message is returned', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        //username parameter is not set
        email: 'email@example.com',
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("Request body does not contain all the necessary attributes");

    const newRegistered = await User.findOne({
      email: 'email@example.com',
    });

    expect(newRegistered).toEqual(null);
  });

  test('register request body contains empty parameter, an error message is returned', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        //password parameter is set but contains empty value
        username: 'username',
        email: 'email@example.com',
        password: ''
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("Request body parameter cannot be empty string");

    const newRegistered = await User.findOne({
      email: 'email@example.com',
      username: 'username'
    });

    expect(newRegistered).toEqual(null);
  });

  test('register request body contains email with invalid format, an error message is returned', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        //email is not valid
        username: 'username',
        email: 'not_a_valid_email',
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("Provided email is not in a valid email format");

    const newRegistered = await User.findOne({
      email: 'not_a_valid_email',
      username: 'username'
    });

    expect(newRegistered).toEqual(null);
  });

  test('attempt to register a user with email already in use by a registered user, an error message is returned', async () => {
    //previously registered
    const registeredUser = await User.create({
      username: 'new_user',
      email: 'email@example.com',
      password: 'password'
    });

    const response = await request(app)
      .post('/api/register')
      .send({
        //same email
        username: 'user',
        email: 'email@example.com',
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("User with email: email@example.com already registered");
  });
});

describe("registerAdmin", () => {
  test('A new Admin is created when correct parameters are passed and corresponding user does not exist yet', async () => {
    //creating tokens before calling registerAdmin
    const accessToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );

    const response = await request(app)
      .post('/api/admin')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        username: 'new_admin',
        email: 'newadmin@newadmin.com',
        password: 'newadmin'
      });

    expect(response.status).toBe(200);
    expect(response.body.error).toBe(undefined);
    expect(response.body.data.message).toBe("Admin added successfully");

    const newRegistered = await User.findOne({
      username: 'new_admin',
      email: 'newadmin@newadmin.com',
    });

    expect(newRegistered).toEqual(expect.objectContaining({
      username: 'new_admin',
      email: 'newadmin@newadmin.com',
    }));
  });

  test('New admin is created also when function is called by a normal user', async () => {
    //creating tokens before calling registerAdmin
    const accessToken = jwt.sign(
      {
        email: "not@admin.com",
        username: "not_admin",
        id: 2,
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "not@admin.com",
        username: "not_admin",
        id: 2,
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );


    const response = await request(app)
      .post('/api/admin')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        username: 'another_admin',
        email: 'anotheradmin@anotheradmin.com',
        password: 'anotheradmin'
      });

    expect(response.status).toBe(200);
    expect(response.body.error).toBe(undefined);
    expect(response.body.data.message).toBe("Admin added successfully");

    const newRegistered = await User.findOne({
      username: 'another_admin',
      email: 'anotheradmin@anotheradmin.com',
    });

    expect(newRegistered).toEqual(expect.objectContaining({
      username: 'another_admin',
      email: 'anotheradmin@anotheradmin.com',
    }));
  });

  test('A new Admin is not created when new Admin information is missing', async () => {
    //creating tokens before calling registerAdmin
    const accessToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );

    const response = await request(app)
      .post('/api/admin')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        //missing email
        username: 'new_admin',
        password: 'newadmin'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("Request body does not contain all the necessary attributes");

    const newRegistered = await User.findOne({
      username: 'anothenew_adminr_admin',
    });

    expect(newRegistered).toBe(null);

  });

  test('A new Admin is not created when new Admin information contains empty values', async () => {
    //creating Admin tokens before calling registerAdmin
    const accessToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );

    const response = await request(app)
      .post('/api/admin')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        //password is empty
        username: 'new_admin',
        email: "new@admin.com",
        password: ''
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("Request body parameter cannot be empty string");

    const newRegistered = await User.findOne({
      username: 'new_admin',
      email: "new@admin.com"
    });

    expect(newRegistered).toBe(null);
  });

  test('A new admin cannot be created if a user with same username alredy exists', async () => {
    //mock existing user
    const existingUser = await User.create({
      //providing username of the previously registered user
      username: 'new_user',
      email: "mock@mock.com",
      password: 'password'
    });

    //creating Admin tokens before calling registerAdmin
    const accessToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );


    const response = await request(app)
      .post('/api/admin')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        //providing username of the previously registered user
        username: 'new_user',
        email: "mock@mock.com",
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("User with username: new_user already registered");
  });


  test('A new admin cannot be created if a user with same email alredy exists', async () => {
    //mock existing user
    const existingUser = await User.create({
      //providing username of the previously registered user
      username: 'new_user',
      email: "email@example.com",
      password: 'password'
    });
    //creating Admin tokens before calling registerAdmin
    const accessToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );

    const response = await request(app)
      .post('/api/admin')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        // providing email of the previously registered user
        username: 'another_random_user',
        email: "email@example.com",
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("User with email: email@example.com already registered");
  });


  test('A new admin cannot be created if a email is not in a valid format', async () => {
    //creating Admin tokens before calling registerAdmin
    const accessToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "admin@admin.com",
        username: "admin",
        id: 1,
        role: "Admin",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );

    const response = await request(app)
      .post('/api/admin')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
      .send({
        username: 'another_random_user',
        email: "not_a_valid_email",
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("Provided email is not in a valid email format");

    const newRegistered = await User.findOne({
      username: 'another_random_user',
      email: "not_a_valid_email"
    });

    expect(newRegistered).toBe(null);
  });
});


describe('login', () => {
  test('if user is registered and request is valid, user is logged in', async () => {
    //mock registered user
    const hashedPassword = await bcrypt.hash("password", 12);

    const registeredUser = await User.create({
      username: 'username',
      email: 'email@example.com',
      password: hashedPassword
    });

    const response = await request(app)
      .post('/api/login')
      .send({
        //login with user previously registered
        email: 'email@example.com',
        password: 'password'
      });

    expect(response.status).toBe(200);
    expect(response.body.error).toBe(undefined);
    expect(typeof response.body.data.accessToken).toBe('string');
    expect(typeof response.body.data.refreshToken).toBe('string');
    expect(response.body.message).toBe("Login successful");

    expect(response.body.data.accessToken).toEqual(expect.any(String)); //The actual value is unpredictable (jwt string), so it must exist
    expect(response.body.data.refreshToken).toEqual(expect.any(String)); //The actual value is unpredictable (jwt string), so it must exist
  });

  test('if user is registered but request is not valid, login fails', async () => {
    //mock registered user
    const hashedPassword = await bcrypt.hash("password", 12);

    const registeredUser = await User.create({
      username: 'username',
      email: 'email@example.com',
      password: hashedPassword
    });

    const response = await request(app)
      .post('/api/login')
      .send({
        //login with user previously registered, providing wrong password
        email: 'email@example.com',
        password: 'wrong_password'
      });

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("wrong credentials");
  });

  test('if user is not registered, login fails', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        //login with user not previously registered
        email: 'not@registered.com',
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(undefined);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("please you need to register");
  });

  test('if email is not in a valid format, login fails', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        //login with user not previously registered
        email: 'not_valid_format',
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(undefined);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("Provided email is not in a valid email format");
  });
});



describe('logout', () => {
  test('if user is logged in, it is successfully logged out', async () => {
    //mock registered user
    const hashedPassword = await bcrypt.hash("password", 12);

    const registeredUser = await User.create({
      username: 'new_user',
      email: 'email@example.com',
      password: hashedPassword
    });
    //creating tokens based on previously registered user information
    const accessToken = jwt.sign(
      {
        email: "email@example.com",
        username: "new_user",
        id: 1,
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "email@example.com",
        username: "new_user",
        id: 1,
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );

    // updating mock user with the mock refreshToken above in order to be
    // retrieved in the database during logout
    await User.updateOne({ username: "new_user" }, { refreshToken: refreshToken });

    const response = await request(app)
      .get('/api/logout')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body.error).toBe(undefined);
    expect(response.body.data.message).toBe("User logged out");

    const loggedOutUser = await User.findOne({
      email: "email@example.com",
      username: "new_user"
    });

    expect(loggedOutUser.refreshToken).toBe(null);
  });

  test('if user is not logged in (missing refreshToken), logout fails', async () => {
    //mock registered user
    const hashedPassword = await bcrypt.hash("password", 12);

    const registeredUser = await User.create({
      username: 'new_user',
      email: 'email@example.com',
      password: hashedPassword
    });

    //creating tokens based on previously registered user information
    const accessToken = jwt.sign(
      {
        email: "email@example.com",
        username: "new_user",
        id: 1,
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    //missing refreshToken
    const refreshToken = "";

    // updating mock user with the mock refreshToken above
    await User.updateOne({ username: "new_user" }, { refreshToken: refreshToken });

    const response = await request(app)
      .get('/api/logout')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("refreshToken is missing");

    const loggedOutUser = await User.findOne({
      email: "email@example.com",
      username: "new_user"
    });

    expect(loggedOutUser.refreshToken).toBe("");
  });


  test('if user is not registered, logout fails', async () => {
    //creating tokens based on information of a non existing user
    const accessToken = jwt.sign(
      {
        email: "not@registered.com",
        username: "not_registered",
        id: 1,
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        email: "not@registered.com",
        username: "not_registered",
        id: 1,
        role: "Regular",
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );

    const response = await request(app)
      .get('/api/logout')
      .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

    expect(response.status).toBe(400);
    expect(response.body.data).toBe(undefined);
    expect(response.body.error).toBe("User not found");
  });
});
