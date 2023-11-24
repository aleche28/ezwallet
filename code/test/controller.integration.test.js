import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import { Group, User } from '../models/User';
import jwt from 'jsonwebtoken';
import { getTransactionsByGroup } from '../controllers/controller';

dotenv.config();

afterEach(async () => {
    //removing transactions mock data
    await transactions.deleteMany({});
    await categories.deleteMany({});
});

beforeAll(async () => {
    const dbName = "testingDatabaseController";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    //creating mock user and data
    await User.create({
        username: "test_user",
        email: "test@user.com",
        password: "password",
        role: "User"
    });

    await User.create({
        username: "another_user",
        email: "another@user.com",
        password: "password",
        role: "User"
    });

    const groupUsers = await User.create(
        [
            {
                username: "group_user1",
                email: "group@user1.com",
                password: "password",
                role: "User"
            },
            {
                username: "group_user2",
                email: "group@user2.com",
                password: "password",
                role: "User"

            },
            {
                username: "group_user3",
                email: "group@user3.com",
                password: "password",
                role: "User"

            }
        ]
    );

    const userIds = groupUsers.map(user => user._id);


    await Group.create({
        name: "test_group",
        members: [
            {
                email: "group@user1.com",
                _id: userIds[0]
            },
            {
                email: "group@user2.com",
                _id: userIds[1]
            },
            {
                email: "group@user3.com",
                _id: userIds[2]
            }
        ]
    });
});

afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
});

describe("createCategory", () => {
    test('If a category with same attributes already exists, new category is not created', async () => {
        // already existing category
        const existingCategory = await categories.create({
            type: "new_category",
            color: "#ffffffff"
        });

        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .post('/api/categories')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: "new_category",
                color: "#ffffffff"
            });

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category already exists");
    });

    test('If one among body attributes contains an empty value, new category is not created', async () => {
        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .post('/api/categories')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: "new_category",
                color: ""
            });

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Empty attributes");

        const createdCategory = await categories.findOne({
            type: "new_category",
            color: "#000000"
        });
        expect(createdCategory).toBe(null);
    });

    test('If body does not contain at least one attribute, new category is not created', async () => {
        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .post('/api/categories')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: "new_category",
            });

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Missing attributes");

        const createdCategory = await categories.findOne({
            type: "new_category",
            color: "#000000"
        });
        expect(createdCategory).toBe(null);
    });

    test('Test that a user without admin privileges cannot create a new category', async () => {
        //creating user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .post('/api/categories')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: "new_category",
                color: "#000000"
            });

        //assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not Admin");

        const createdCategory = await categories.findOne({
            type: "new_category",
            color: "#000000"
        });
        expect(createdCategory).toBe(null);
    });

    test('Test that a user with admin privileges can successfully create a new category', async () => {
        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .post('/api/categories')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: "new_category",
                color: "#000000"
            });

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(response.body.data).toEqual({
            type: "new_category",
            color: "#000000"
        });

        const createdCategory = await categories.findOne({
            type: "new_category",
            color: "#000000"
        });

        expect(createdCategory).toEqual(expect.objectContaining({
            type: "new_category",
            color: "#000000"
        }));
    });
});

describe("Update Category", () => {
    test('Update an existing category and verify the update', async () => {
        //mock data
        await categories.create({
            type: "new_category",
            color: "#ffffffff"
        });

        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .patch(`/api/categories/new_category`)
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: 'updated_category',
                color: '#ffffff'
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(response.body.data.message).toBe('Category edited successfully');
        expect(response.body.data.count).toBe(0);


        const updatedCategory = await categories.findOne({
            type: 'updated_category',
            color: '#ffffff'
        });

        expect(updatedCategory).toEqual(expect.objectContaining({
            type: 'updated_category',
            color: '#ffffff'
        }));
    });

    test('Attempt to update a category without authentication and verify that it returns an appropriate error response', async () => {

        //mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        const response = await request(app)
            .patch('/api/categories/test_category1')
            .send({
                type: "test_category1",
                color: '#00000000'
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('accessToken is missing');
        expect(response.body.data).toBe(undefined);

        const updatedCategory = await categories.findOne({
            type: "test_category1",
            color: "#00000000"
        });

        expect(updatedCategory).toEqual(null);
    });

    test('Attempt to update a category with a non-admin user and verify that it returns an appropriate error response', async () => {
        //mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        // creating user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .patch('/api/categories/test_category1')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({ color: '#ffffff' });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('User is not Admin');
        expect(response.body.data).toBe(undefined);

        const updatedCategory = await categories.findOne({
            type: "test_category1",
            color: "#00000000"
        });

        expect(updatedCategory).toEqual(null);
    });

    test('If update is called on a non-existing category, an error message is returned', async () => {
        // mock tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .patch('/api/categories/non_existing_category')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: "new_type",
                color: '#ffffff'
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Category not found');
        expect(response.body.data).toBe(undefined);
    });

    test('If one among body attributes contains an empty value, category is not updated', async () => {
        //mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .patch('/api/categories/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: "new_category",
                color: ""
            });

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Empty attributes");

        const updatedCategory = await categories.findOne({
            type: "new_category",
            color: ""
        });
        expect(updatedCategory).toBe(null);
    });

    test('If body does not contain at least one attribute, category is not updated', async () => {
        //mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .patch('/api/categories/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                type: "new_category",

            });

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Missing attributes");

        const updatedCategory = await categories.findOne({
            type: "new_category"
        });
        expect(updatedCategory).toBe(null);
    });
});


describe("deleteCategory", () => {
    test("If only one category exists, it cannot be deleted", async () => {
        //mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .delete(`/api/categories/`)
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                types: ["test_category1"]
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Cannot delete the only category");
        expect(response.body.data).toBe(undefined);

        const deletedCategory = await categories.findOne({ type: "test_category1" });
        expect(deletedCategory).toEqual(expect.objectContaining(
            {
                type: "test_category1",
                color: "#ffffffff"
            }
        ));
    });

    test("If deletion is requested for all existing categories, only the oldest one is kept and all transactions are moved into it", async () => {
        //mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category3",
            color: "#ffffffff"
        });

        await transactions.create({
            username: 'test_user',
            type: "test_category2",
            amount: 25,
            date: new Date('2023-03-05'),
        });

        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .delete(`/api/categories/`)
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                types: ["test_category1", "test_category2", "test_category3"]
            });

        expect(response.status).toBe(200);
        expect(response.body.data.message).toBe("Categories deleted");
        expect(response.body.data.count).toBe(1);
        expect(response.body.error).toBe(undefined);

        const remainingCategory = await categories.find({});
        expect(remainingCategory.length).toBe(1);
        expect(remainingCategory).toContainEqual(expect.objectContaining(
            {
                type: "test_category1",
                color: "#ffffffff"
            }
        ));

        const movedTransaction = await transactions.findOne({
            username: 'test_user',
            amount: 25,
            date: new Date('2023-03-05')
        });

        expect(movedTransaction.type).toBe("test_category1");
    });

    test("Test if deleting a non-existent category returns an appropriate error", async () => {
        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .delete(`/api/categories/`)
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                types: ["non_existing_category"]
            });

        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("One or more categories not found");
    });

    test('Test if deleting a category removes it from all transactions', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category2',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category3',
            color: '#ffffffff',
        });

        await transactions.create({
            username: 'test_user',
            type: 'test_category1',
            amount: 25,
            date: new Date('2023-03-05'),
        });

        //creating admin user token
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .delete(`/api/categories/`)
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                types: ["test_category1"]
            });

        // assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(response.body.data.message).toBe("Categories deleted");

        const deletedCategory = await categories.findOne({ type: "test_category1" });
        expect(deletedCategory).toBe(null);

        const associatedTransactions = await transactions.find({ type: "test_category1" });
        expect(associatedTransactions.length).toBe(0);

    });

    test('Deleting a category is restricted to admin users', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category2',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category3',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .delete(`/api/categories/`) // Replace `categoryId` with the actual category ID
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                types: ["test_category1", "test_category2"]
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('User is not Admin');
        expect(response.body.data).toBe(undefined);
    });

    test("If categories array contains at least one empty string, an error message is returned", async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category2',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category3',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .delete(`/api/categories/`) // Replace `categoryId` with the actual category ID
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                types: ["test_category1", "test_category2", ""]
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Categories cannot be empty strings');
        expect(response.body.data).toBe(undefined);
    });

    test("If categories array contains at least one non-existing category, an error message is returned", async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category2',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category3',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'Admin',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .delete(`/api/categories/`) // Replace `categoryId` with the actual category ID
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                types: ["test_category1", "test_category2", "non_existing_category"]
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('One or more categories not found');
        expect(response.body.data).toBe(undefined);
    });
});

describe('getCategories', () => {
    test('A user with the correct authentication tokens can successfully retrieve the list of categories', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        await categories.create({
            type: 'test_category2',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .get('/api/categories')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`);

        expect(response.status).toBe(200);
        expect(response.body.error).toBeUndefined();
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);

        expect(response.body.data).toContainEqual({
            type: 'test_category1',
            color: '#ffffffff',
        });
        expect(response.body.data).toContainEqual({
            type: 'test_category2',
            color: '#ffffffff',
        });
    });

    test('A user without authentication tokens receives an error when trying to retrieve the list of categories', async () => {
        const response = await request(app)
            .get('/api/categories')
            .set('Cookie', `accessToken=;refreshToken=`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('accessToken is missing');
        expect(response.body.data).toBeUndefined();
    });
});


describe('createTransaction', () => {
    test('A user correctly requests to create a new transaction', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );


        const response = await request(app)
            .post('/api/users/test_user/transactions')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                username: 'test_user',
                type: 'test_category1',
                amount: 25.5,
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(response.body.data).toEqual(expect.objectContaining({
            username: 'test_user',
            type: 'test_category1',
            amount: 25.5,
        }));

        const createdTransaction = await transactions.findOne({
            username: 'test_user',
            type: 'test_category1',
            amount: 25.5,
        });

        expect(createdTransaction).toEqual(expect.objectContaining({
            username: 'test_user',
            type: 'test_category1',
            amount: 25.5,
        }));
    });


    test('If body does not contain some attributes, new transaction is not created', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );


        const response = await request(app)
            .post('/api/users/test_user/transactions')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                username: 'test_user',
                amount: 25.5,
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Missing attributes");
        expect(response.body.data).toBe(undefined);

        const createdTransaction = await transactions.findOne({
            username: 'test_user',
            amount: 25.5,
        });

        expect(createdTransaction).toBe(null);
    });


    test('If body contain some attributes with empty value, new transaction is not created', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );


        const response = await request(app)
            .post('/api/users/test_user/transactions')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                username: 'test_user',
                type: "",
                amount: 25.5,
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Empty attributes in the request body");
        expect(response.body.data).toBe(undefined);

        const createdTransaction = await transactions.findOne({
            username: 'test_user',
            amount: 25.5,
        });

        expect(createdTransaction).toBe(null);
    });

    test('If "amount" attribute does not contain a numeric value, new transaction is not created', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );


        const response = await request(app)
            .post('/api/users/test_user/transactions')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                username: 'test_user',
                type: "test_category1",
                amount: "not_a_number",
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Amount is not a number");
        expect(response.body.data).toBe(undefined);

        const createdTransaction = await transactions.findOne({
            username: 'test_user',
            amount: 25.5,
        });

        expect(createdTransaction).toBe(null);
    });

    test('If usernames provided in the request body and route parameters do not match, new transaction is not created', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        // user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );


        const response = await request(app)
            .post('/api/users/another_user/transactions')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                username: 'test_user',
                type: "test_category1",
                amount: 25.5,
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Username passed in the request body is not equal to the one passed as a route parameter");
        expect(response.body.data).toBe(undefined);

        const createdTransaction = await transactions.findOne({
            username: 'test_user',
            amount: 25.5,
        });

        expect(createdTransaction).toBe(null);
    });

    test('If provided category does not exist, new transaction is not created', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        // creating user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .post('/api/users/test_user/transactions')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                username: 'test_user',
                type: 'nonexistent_category',
                amount: 25,
            });

        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe('Category not found');

        const createdTransaction = await transactions.findOne({
            username: 'test_user',
            amount: 25,
        });

        expect(createdTransaction).toBe(null);
    });

    test('If username is requesting to create a transaction for another user, new transaction is not created', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        // creating user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'test_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .post('/api/users/another_user/transactions')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                username: 'another_user',
                type: 'test_category1',
                amount: 25,
                date: new Date('2023-03-05'),
            });

        // assertions
        expect(response.status).toBe(401);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe('Wrong User');
    });

    test('If username is requesting to create a transaction for another user, new transaction is not created', async () => {
        // mock data
        await categories.create({
            type: 'test_category1',
            color: '#ffffffff',
        });

        // creating user tokens
        const accessToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'non_existing_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: 'test@user.com',
                username: 'non_existing_user',
                id: 2,
                role: 'User',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );

        const response = await request(app)
            .post('/api/users/non_existing_user/transactions')
            .set('Cookie', `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                username: 'non_existing_user',
                type: 'test_category1',
                amount: 25,
                date: new Date('2023-03-05'),
            });

        // assertions
        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe('User not found');
    });

});

describe("getAllTransactions", () => {
    test("Returns all transactions from the transactions collection when called without any filters", async () => {
      const transaction1 = {
        username: "test_user",
        type: "test_category1",
        amount: 25,
        date: new Date("2023-03-05"),
      };
      const transaction2 = {
        username: "test_user",
        type: "test_category2",
        amount: 10,
        date: new Date("2023-02-01"),
      };
  
      await transactions.create(transaction1);
      await transactions.create(transaction2);
  
      await categories.create({ type: "test_category1", color: "red" });
      await categories.create({ type: "test_category2", color: "blue" });
  
      // Creating user tokens
      const accessToken = jwt.sign(
        {
          email: "test@user.com",
          username: "test_user",
          id: 2,
          role: "Admin",
        },
        process.env.ACCESS_KEY,
        { expiresIn: "1h" }
      );
  
      const refreshToken = jwt.sign(
        {
          email: "test@user.com",
          username: "test_user",
          id: 2,
          role: "Admin",
        },
        process.env.ACCESS_KEY,
        { expiresIn: "7d" }
      );
  
      const response = await request(app)
        .get("/api/transactions")
        .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);
  
      // Assertions
      expect(response.status).toBe(200);
  
      expect(response.body.error).toBe(undefined);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
  
      expect(response.body.data).toEqual([
        { ...transaction1, color: "red", date: transaction1.date.toISOString() },
        { ...transaction2, color: "blue", date: transaction2.date.toISOString() },
      ]);
    });
  
    test("Returns an empty array if there are no transactions in the transactions collection", async () => {
      // Creating user tokens
      const accessToken = jwt.sign(
        {
          email: "test@user.com",
          username: "test_user",
          id: 2,
          role: "Admin",
        },
        process.env.ACCESS_KEY,
        { expiresIn: "1h" }
      );
  
      const refreshToken = jwt.sign(
        {
          email: "test@user.com",
          username: "test_user",
          id: 2,
          role: "Admin",
        },
        process.env.ACCESS_KEY,
        { expiresIn: "7d" }
      );
  
      const response = await request(app)
        .get("/api/transactions")
        .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);
  
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.error).toBe(undefined);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  
    test("Returns error 401 if the user is not an admin", async () => {
      // Creating user tokens
      const accessToken = jwt.sign(
        {
          email: "test@user.com",
          username: "test_user",
          id: 2,
          role: "User",
        },
        process.env.ACCESS_KEY,
        { expiresIn: "1h" }
      );
  
      const refreshToken = jwt.sign(
        {
          email: "test@user.com",
          username: "test_user",
          id: 2,
          role: "User",
        },
        process.env.ACCESS_KEY,
        { expiresIn: "7d" }
      );
  
      const response = await request(app)
        .get("/api/transactions")
        .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);
  
      // Assertions
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

describe("getTransactionsByUser", () => {
    test('A regular user correctly requests access to its personal transactions', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);

        expect(response.body.data).toContainEqual({
            username: "test_user",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01").toISOString(),
            color: "#ffffffff"

        }, {
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString(),
            color: '#00000000'
        });
    });

    test('A regular user requests access to another user personal transactions, an error message is returned', async () => {
        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/not_test_user/transactions')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Wrong User");
        expect(response.body.data).toBe(undefined);
    });

    test('A regular user correctly requests access to its personal transactions, filtered by type (i.e. category name)', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions?type=test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);

        expect(response.body.data).toContainEqual({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString(),
            color: '#00000000'
        });
    });

    test('A regular user correctly requests access to its personal transactions, filtered by date', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions?date=2023-03-05')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);

        expect(response.body.data).toContainEqual({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString(),
            color: "#00000000"
        });
    });

    test('A regular user correctly requests access to its personal transactions, filtered by date range', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 10,
            date: new Date("2023-03-10")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions?from=2023-03-10&upTo=2023-03-11')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);

        expect(response.body.data).toContainEqual({
            username: "test_user",
            type: "test_category1",
            amount: 10,
            date: new Date("2023-03-10").toISOString(),
            color: '#00000000'
        }, {
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11").toISOString(),
            color: '#ffffffff'
        });
    });

    test('A regular user correctly requests access to its personal transactions, filtered by "minimum" date', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 10,
            date: new Date("2023-03-10")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions?from=2023-03-04')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(3);

        expect(response.body.data).toContainEqual({
            username: "test_user",
            type: "test_category1",
            amount: 10,
            date: new Date("2023-03-10").toISOString(),
            color: '#00000000'
        }, {
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11").toISOString(),
            color: '#ffffffff'
        }, {
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString(),
            color: '#00000000'
        });
    });

    test('A regular user correctly requests access to its personal transactions, filtered by minimum amount', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 10,
            date: new Date("2023-03-10")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions?min=11')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);

        expect(response.body.data).toContainEqual({
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11").toISOString(),
            color: '#ffffffff'
        }, {
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString(),
            color: '#00000000'
        });
    });

    test('A regular user correctly requests access to its personal transactions, filtered by amount range', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 10,
            date: new Date("2023-03-10")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions?min=20&max=30')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);

        expect(response.body.data).toContainEqual({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString(),
            color: '#00000000'
        });
    });

    test('An Admin correctly requests access to another user personal transactions', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 10,
            date: new Date("2023-03-10")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11")
        });

        //creating Admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/users/test_user')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(3);

        expect(response.body.data).toContainEqual({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString(),
            color: '#00000000'
        }, {
            username: "test_user",
            type: "test_category1",
            amount: 10,
            date: new Date("2023-03-10"),
            color: '#00000000'
        }, {
            username: "test_user",
            type: "test_category2",
            amount: 14,
            date: new Date("2023-03-11"),
            color: '#ffffffff'
        });
    });

    test('A regular user requests access to another user personal transactions by calling Admin-exclusive route, an error message is returned', async () => {
        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/users/another_user')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);


        //assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not Admin");
        expect(response.body.data).toBe(undefined);
    });


    test('An Admin correctly requests access to transactions of a non-existing user, an error message is returned', async () => {
        //creating Admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/users/non_existing_user')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("User not found");
        expect(response.body.data).toBe(undefined);
    });
});

describe("getTransactionsByUserByCategory", () => {
    test('A regular user correctly requests access to its personal transactions under a given category', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);

        expect(response.body.data).toContainEqual(expect.objectContaining({
            username: "test_user",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02").toISOString()
        }, {
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString()
        }));
    });

    test('A regular user requests access to transactions under a non-existing category, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        // mock transactions
        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/test_user/transactions/category/non_existing_category')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category not found");
        expect(response.body.data).toBe(undefined);
    });

    test('A regular user requests access to another user personal transactions under a given category, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/users/another_user/transactions/category/test_category2')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Wrong User");
        expect(response.body.data).toBe(undefined);
    });

    test('A regular user requests access to another user personal transactions, under a given category, by calling Admin-exclusive route, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/users/another_user/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not Admin");
        expect(response.body.data).toBe(undefined);
    });

    test('An Admin requests access to a non-existing user transactions under a given category, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        //creating Admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/users/non_existing_user/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("User not found");
        expect(response.body.data).toBe(undefined);
    });

    test('An Admin requests access to an existing user transactions under a non-existing category, an error message is returned', async () => {
        //creating Admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/users/another_user/category/non_existing_category')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);


        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category not found");
        expect(response.body.data).toBe(undefined);
    });

    test('An Admin correctly requests access to a user transactions under a given category', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating mock data
        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02")
        });

        await transactions.create({
            username: "test_user",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });
        //creating Admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/users/test_user/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);


        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);

        expect(response.body.data).toContainEqual(expect.objectContaining({
            username: "test_user",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02").toISOString()
        }, {
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05").toISOString()
        }));
    });
});

describe("getTransactionsByGroup", () => {
    test('A regular user correctly requests access to its belonging group transactions', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating mock data
        await transactions.create({
            username: "group_user2",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "group_user3",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02")
        });

        await transactions.create({
            username: "group_user1",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });
        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "group@user1.com",
                username: "group_user1",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "group@user1.com",
                username: "group_user1",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/groups/test_group/transactions')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(3);

        expect(response.body.data).toContainEqual(expect.objectContaining(
            {
                username: "group_user2",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05").toISOString(),
                color: "#00000000"
            },
            {
                username: "group_user3",
                type: "test_category1",
                amount: 30,
                date: new Date("2023-02-02").toISOString(),
                color: "#00000000"
            },
            {
                username: "group_user3",
                type: "test_category1",
                amount: 30,
                date: new Date("2023-02-02").toISOString(),
                color: "#00000000"
            }
        ));
    });

    test('A regular user requests access to transactions of a group it does not belong to, an error message is returned', async () => {
        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "notingroup@user.com",
                username: "not_in_group_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "notingroup@user.com",
                username: "not_in_group_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/groups/test_group/transactions')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User does not belong to Group");
        expect(response.body.data).toBe(undefined);
    });

    test('A regular user requests access to transactions of a non-existing group, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/groups/not_existing_group/transactions')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Group not found");
        expect(response.body.data).toBe(undefined);
    });

    test('An Admin correctly access not-belonging group transactions', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating mock data
        await transactions.create({
            username: "group_user2",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "group_user3",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02")
        });

        await transactions.create({
            username: "group_user1",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/groups/test_group')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(3);

        expect(response.body.data).toContainEqual(expect.objectContaining(
            {
                username: "group_user2",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05").toISOString(),
                color: "#00000000"
            },
            {
                username: "group_user3",
                type: "test_category1",
                amount: 30,
                date: new Date("2023-02-02").toISOString(),
                color: "#00000000"
            },
            {
                username: "group_user3",
                type: "test_category1",
                amount: 30,
                date: new Date("2023-02-02").toISOString(),
                color: "#00000000"
            }
        ));
    });
});

describe("getTransactionsByGroupByCategory", () => {
    test('A regular user correctly requests access to its belonging group transactions, under a given category', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#00000000"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating mock data
        await transactions.create({
            username: "group_user2",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "group_user3",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02")
        });

        await transactions.create({
            username: "group_user1",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });
        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "group@user1.com",
                username: "group_user1",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "group@user1.com",
                username: "group_user1",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/groups/test_group/transactions/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);

        expect(response.body.data).toContainEqual(expect.objectContaining(
            {
                username: "group_user2",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05").toISOString(),
                color: "#00000000"
            },
            {
                username: "group_user3",
                type: "test_category1",
                amount: 30,
                date: new Date("2023-02-02").toISOString(),
                color: "#00000000"
            }
        ));
    });

    test('A regular user requests access to transactions, under a given category, of a group it does not belong to, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "notingroup@user.com",
                username: "not_in_group_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "notingroup@user.com",
                username: "not_in_group_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/groups/test_group/transactions/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User does not belong to Group");
        expect(response.body.data).toBe(undefined);
    });

    test('A regular user requests access to transactions of a non-existing group, an error message is returned', async () => {
        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/groups/non_existing_group/transactions/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Group not found");
        expect(response.body.data).toBe(undefined);
    });

    test('A regular user requests access to transactions of its group, under a non-existing category, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "group@user1.com",
                username: "group_user1",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "group@user1.com",
                username: "group_user1",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/groups/test_group/transactions/category/non_existing_category')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category not found");
        expect(response.body.data).toBe(undefined);
    });

    test('An Admin correctly access not-belonging group transactions filtered by a given category', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating mock data
        await transactions.create({
            username: "group_user2",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        await transactions.create({
            username: "group_user3",
            type: "test_category1",
            amount: 30,
            date: new Date("2023-02-02")
        });

        await transactions.create({
            username: "group_user1",
            type: "test_category2",
            amount: 10,
            date: new Date("2023-02-01")
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/groups/test_group/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);

        expect(response.body.data).toContainEqual(expect.objectContaining(
            {
                username: "group_user2",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05").toISOString()
            },
            {
                username: "group_user3",
                type: "test_category1",
                amount: 30,
                date: new Date("2023-02-02").toISOString()
            }
        ));
    });

    test('A regular user request not-belonging group transactions filtered by a given category from admin-exclusive route, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "user@user.com",
                username: "user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .get('/api/transactions/groups/test_group/category/test_category1')
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`);

        //assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not Admin");

        expect(response.body.data).toBe(undefined);

    });
});

describe("deleteTransaction", () => {
    test('A regular user correctly requests to delete one of its transactions', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            {
                username: "test_user",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05")
            }
        );

        const transactionId = toBeDeleted._id;

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/users/test_user/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                _id: transactionId
            });

        //assertion
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(response.body.data.message).toBe("Transaction deleted");

        const isFound = await transactions.findOne({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        });

        expect(isFound).toBe(null);
    });


    test('A regular user requests to delete another user personal transaction, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            {
                username: "another_user",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05")
            }
        );

        const transactionId = toBeDeleted._id;

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/users/another_user/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                _id: transactionId
            });

        //assertion
        expect(response.status).toBe(401);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("Wrong User");

        const isFound = await transactions.findOne({
            username: "another_user",
            type: "test_category1",
            amount: 25,
        });

        expect(isFound).toEqual(expect.objectContaining({
            username: "another_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        }));
    });

    test('Transaction _id cannot be omitted in the request body, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            {
                username: "test_user",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05")
            }
        );

        const transactionId = toBeDeleted._id;

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/users/test_user/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({});

        //assertion
        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("Request body does not contain Transaction _id");

        const isFound = await transactions.findOne({
            username: "test_user",
            type: "test_category1",
            amount: 25,
        });

        expect(isFound).toEqual(expect.objectContaining({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        }));

    });

    test('Transaction _id in the request body cannot be an empty string, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            {
                username: "test_user",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05")
            }
        );

        const transactionId = toBeDeleted._id;
        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/users/test_user/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                _id: ""
            });

        //assertion
        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("Transaction _id cannot be empty");

        const isFound = await transactions.findOne({
            username: "test_user",
            type: "test_category1",
            amount: 25,
        });

        expect(isFound).toEqual(expect.objectContaining({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        }));
    });

    test('_id in the request body must identify a valid transaction, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            {
                username: "test_user",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05")
            }
        );

        const transactionId = toBeDeleted._id;

        //creating user tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/users/test_user/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                _id: "not_a_valid_id"
            });

        //assertion
        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("Cast error: _id provided is not a valid ObjectId");

        const isFound = await transactions.findOne({
            username: "test_user",
            type: "test_category1",
            amount: 25,
        });

        expect(isFound).toEqual(expect.objectContaining({
            username: "test_user",
            type: "test_category1",
            amount: 25,
            date: new Date("2023-03-05")
        }));
    });

    test('An Admin correctly requests to delete a user personal transaction', async () => {//create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            {
                username: "test_user",
                type: "test_category1",
                amount: 25,
                date: new Date("2023-03-05")
            }
        );

        const transactionId = toBeDeleted._id;

        //creating admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/users/test_user/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                _id: transactionId
            });

        //assertion
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(response.body.data.message).toBe("Transaction deleted");

        const isFound = await transactions.findOne({
            username: "test_user",
            type: "test_category1",
            amount: 25,
        });

        expect(isFound).toBe(null);
    });
});

describe("deleteTransactions", () => {
    test('An Admin correctly requests to delete a set of transactions', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            [
                {
                    username: "test_user",
                    type: "test_category1",
                    amount: 25,
                    date: new Date("2023-03-05")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 5,
                    date: new Date("2023-02-01")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 15,
                    date: new Date("2023-01-07")
                }
            ]
        );

        const transactionIds = toBeDeleted.map(transaction => transaction._id);

        //creating admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                _ids: transactionIds
            });

        //assertions
        expect(response.status).toBe(200);
        expect(response.body.error).toBe(undefined);
        expect(response.body.data.message).toBe("Transactions deleted");

        const isFound = await transactions.find({ $or: toBeDeleted });

        expect(isFound).toEqual([]);
        expect(isFound.length).toBe(0);
    });

    test('If the _ids array contains an empty _id value, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            [
                {
                    username: "test_user",
                    type: "test_category1",
                    amount: 25,
                    date: new Date("2023-03-05")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 5,
                    date: new Date("2023-02-01")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 15,
                    date: new Date("2023-01-07")
                }
            ]
        );

        const transactionIds = toBeDeleted.map(transaction => transaction._id);

        //adding an empty _id
        transactionIds.push("");

        //creating admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                _ids: transactionIds
            });

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("Found empty string in array of ids");

        const isFound = await transactions.find({ $or: toBeDeleted });
        expect(isFound.length).toBe(3);
    });

    test('If the _ids parameter is not set in the request body, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            [
                {
                    username: "test_user",
                    type: "test_category1",
                    amount: 25,
                    date: new Date("2023-03-05")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 5,
                    date: new Date("2023-02-01")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 15,
                    date: new Date("2023-01-07")
                }
            ]
        );
        //creating admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({});

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("Request body does not contain Transaction _ids");

        const isFound = await transactions.find({ $or: toBeDeleted });
        expect(isFound.length).toBe(3);
    });


    test('If the _ids array contains a valid format _id value not representing an existing transaction, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            [
                {
                    username: "test_user",
                    type: "test_category1",
                    amount: 25,
                    date: new Date("2023-03-05")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 5,
                    date: new Date("2023-02-01")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 15,
                    date: new Date("2023-01-07")
                }
            ]
        );

        const transactionIds = toBeDeleted.map(transaction => transaction._id);

        //adding a valid format _id not representing an existing transaction
        transactionIds.push("60bca345c285e8577818c5a2");

        //creating admin tokens
        const accessToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "admin@admin.com",
                username: "admin",
                id: 2,
                role: "Admin",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                _ids: transactionIds
            });

        //assertions
        expect(response.status).toBe(400);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("Transaction _ids contains invalid transaction identifier");

        const isFound = await transactions.find({ $or: toBeDeleted });
        expect(isFound.length).toBe(3);
    });

    test('If deleteTransactions is called by a regular user, an error message is returned', async () => {
        //create mock data
        await categories.create({
            type: "test_category1",
            color: "#ffffffff"
        });

        await categories.create({
            type: "test_category2",
            color: "#ffffffff"
        });

        //create mock data
        const toBeDeleted = await transactions.create(
            [
                {
                    username: "test_user",
                    type: "test_category1",
                    amount: 25,
                    date: new Date("2023-03-05")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 5,
                    date: new Date("2023-02-01")
                },
                {
                    username: "test_user",
                    type: "test_category2",
                    amount: 15,
                    date: new Date("2023-01-07")
                }
            ]
        );

        //creating admin tokens
        const accessToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            {
                email: "test@user.com",
                username: "test_user",
                id: 2,
                role: "User",
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );

        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${accessToken};refreshToken=${refreshToken}`)
            .send({
                //it does not matter what is passed because authorization check is first operation performed
                _ids: []
            });

        //assertions
        expect(response.status).toBe(401);
        expect(response.body.data).toBe(undefined);
        expect(response.body.error).toBe("User is not Admin");

        const isFound = await transactions.find({ $or: toBeDeleted });
        expect(isFound.length).toBe(3);
    });
});
