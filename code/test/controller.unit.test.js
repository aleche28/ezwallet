import request from "supertest";
import { app } from "../app";
import { categories, transactions } from "../models/model";
import { User, Group } from "../models/User";
import {
  handleAmountFilterParams,
  handleDateFilterParams,
  verifyAuth,
} from "../controllers/utils";
import mongoose, { Model } from "mongoose";
import { verify } from "jsonwebtoken";

jest.mock("../models/model");
jest.mock("../models/User");
jest.mock("../controllers/utils");

beforeEach(() => {
  // categories
  categories.countDocuments.mockClear();
  categories.deleteMany.mockClear();
  categories.find.mockClear();
  categories.findOne.mockClear();
  categories.prototype.save.mockClear();

  // transactions
  transactions.aggregate.mockClear();
  transactions.create.mockClear();
  transactions.deleteOne.mockClear();
  transactions.deleteMany.mockClear();
  transactions.find.mockClear();
  transactions.findById.mockClear();
  transactions.updateMany.mockClear();

  // User
  User.findOne.mockClear();

  // Group
  Group.findOne.mockClear();

  // utils
  verifyAuth.mockClear();
  handleAmountFilterParams.mockClear();
  handleDateFilterParams.mockClear();
});

describe("createCategory", () => {
  test("should create a new category", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const category = {
      type: "food",
      color: "red",
    };

    categories.findOne.mockImplementation((query, callback) => {
      callback(null, null);
    });

    categories.prototype.save.mockResolvedValue(category);

    const res = await request(app)
      .post("/api/categories")
      .send(category)
      .expect(200);

    expect(res.body).toEqual({
      data: category,
    });

    expect(categories.findOne).toHaveBeenCalledWith(
      { type: category.type },
      expect.any(Function)
    );

    expect(categories.prototype.save).toHaveBeenCalledWith();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 401 error if user is not an admin", async () => {
    verifyAuth.mockReturnValue({ flag: false, cause: "Not an admin" });

    const requestBody = {
      type: "food",
      color: "red",
    };

    const res = await request(app)
      .post("/api/categories")
      .send(requestBody)
      .expect(401);

    expect(res.body).toEqual({ error: "Not an admin" });

    expect(categories.findOne).not.toHaveBeenCalled();
    expect(categories.prototype.save).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error for missing attributes", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const requestBody = {
      type: "food",
    };

    const res = await request(app)
      .post("/api/categories")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Missing attributes" });

    expect(categories.findOne).not.toHaveBeenCalled();
    expect(categories.prototype.save).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if attribute values are empty strings", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const requestBody = {
      type: "",
      color: "red",
    };

    const res = await request(app)
      .post("/api/categories")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Empty attributes" });

    expect(categories.findOne).not.toHaveBeenCalled();
    expect(categories.prototype.save).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if category type already exists", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const requestBody = {
      type: "food",
      color: "red",
    };

    const existingCategory = {
      type: "food",
      color: "blue",
    };

    categories.findOne.mockImplementation((query, callback) => {
      callback(null, existingCategory);
    });

    const res = await request(app)
      .post("/api/categories")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Category already exists" });

    expect(categories.findOne).toHaveBeenCalledWith(
      { type: requestBody.type },
      expect.any(Function)
    );

    expect(categories.prototype.save).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });
});

describe("updateCategory", () => {
  test("should return a 200 response with updated category and transaction count", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const categoryType = "food";

    const requestBody = {
      type: "drinks",
      color: "blue",
    };

    const existingCategory = new categories({
      type: categoryType,
      color: "red",
    });
    const updatedCategory = new categories(requestBody);

    categories.findOne
      .mockResolvedValueOnce(existingCategory) // category to update exists
      .mockResolvedValueOnce(null); // new "type" doesn't exist yet

    categories.prototype.save.mockResolvedValue(updatedCategory);

    const result = {
      nModified: 0,
    };
    transactions.updateMany.mockResolvedValue(result);

    const res = await request(app)
      .patch(`/api/categories/${categoryType}`)
      .send(requestBody)
      .expect(200);

    expect(res.body).toEqual({
      data: {
        message: "Category edited successfully",
        count: result.nModified,
      },
    });

    expect(categories.findOne).toHaveBeenCalledWith({ type: categoryType });

    expect(categories.prototype.save).toHaveBeenCalled();
    expect(transactions.updateMany).toHaveBeenCalledWith(
      { type: categoryType },
      { $set: { type: updatedCategory.type } }
    );
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if request body does not contain all necessary attributes", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const categoryType = "food";
    const requestBody = {
      type: "drinks",
    };

    const res = await request(app)
      .patch(`/api/categories/${categoryType}`)
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Missing attributes" });

    expect(categories.findOne).not.toHaveBeenCalled();

    expect(categories.prototype.save).not.toHaveBeenCalled();

    expect(transactions.updateMany).not.toHaveBeenCalled();

    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if request body contains empty string attributes", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const categoryType = "food";
    const requestBody = {
      type: "",
      color: "blue",
    };

    const res = await request(app)
      .patch(`/api/categories/${categoryType}`)
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Empty attributes" });

    expect(categories.findOne).not.toHaveBeenCalled();

    expect(categories.prototype.save).not.toHaveBeenCalled();

    expect(transactions.updateMany).not.toHaveBeenCalled();

    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if category does not exist", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const categoryType = "food";
    const requestBody = {
      type: "drinks",
      color: "blue",
    };

    categories.findOne.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/categories/${categoryType}`)
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Category not found" });

    expect(categories.findOne).toHaveBeenCalledWith({ type: categoryType });
    expect(categories.prototype.save).not.toHaveBeenCalled();
    expect(transactions.updateMany).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if new category type already exists", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const categoryType = "food";
    const requestBody = {
      type: "drinks",
      color: "blue",
    };

    const categoryToUpdate = {
      _id: mongoose.Types.ObjectId(),
      type: categoryType,
      color: "red",
    };
    const existingCategory = {
      _id: mongoose.Types.ObjectId(),
      type: requestBody.type,
      color: "green",
    };

    categories.findOne
      .mockResolvedValueOnce(categoryToUpdate)
      .mockResolvedValueOnce(existingCategory);

    const res = await request(app)
      .patch(`/api/categories/${categoryType}`)
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Category already exists" });

    expect(categories.findOne).toHaveBeenCalledWith({ type: requestBody.type });
    expect(categories.prototype.save).not.toHaveBeenCalled();
    expect(transactions.updateMany).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 401 error if user is not an admin", async () => {
    verifyAuth.mockReturnValue({ flag: false, cause: "User is not an admin" });

    const categoryType = "food";
    const requestBody = {
      type: "drinks",
      color: "blue",
    };

    const res = await request(app)
      .patch(`/api/categories/${categoryType}`)
      .send(requestBody)
      .expect(401);

    expect(res.body).toEqual({ error: "User is not an admin" });

    expect(categories.findOne).not.toHaveBeenCalled();
    expect(categories.prototype.save).not.toHaveBeenCalled();
    expect(transactions.updateMany).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });
});

describe("deleteCategory", () => {
  test("should return a 200 status code and delete categories", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const requestBody = {
      types: ["food", "drinks"],
    };

    const categoriesToDelete = [
      { type: "food", createdAt: new Date() },
      { type: "drinks", createdAt: new Date() },
    ];

    const oldestCategories = [
      new categories({ type: "oldest", createdAt: new Date("01/01/2022") }),
      new categories({ type: "notOldest", createdAt: new Date("01/01/2023") }),
    ];

    const totalCategories = 4;
    categories.countDocuments.mockResolvedValue(totalCategories);

    categories.find
      .mockResolvedValueOnce(categoriesToDelete)
      .mockImplementationOnce(() => ({
        sort: () => oldestCategories,
      }));

    categories.deleteMany.mockResolvedValue({});

    transactions.updateMany.mockResolvedValue({ modifiedCount: 6 });

    const res = await request(app)
      .delete("/api/categories")
      .send(requestBody)
      .expect(200);

    expect(res.body).toEqual({
      data: { message: "Categories deleted", count: 6 },
    });

    expect(categories.find).toHaveBeenCalledWith({
      type: { $in: requestBody.types },
    });

    expect(categories.countDocuments).toHaveBeenCalled();

    expect(categories.find).toHaveBeenCalledWith({
      type: { $nin: requestBody.types },
    });

    expect(categories.deleteMany).toHaveBeenCalledWith({
      type: { $in: requestBody.types },
    });

    expect(transactions.updateMany).toHaveBeenCalledWith(
      { type: { $in: requestBody.types } },
      { $set: { type: oldestCategories[0].type } }
    );

    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if the request body does not contain all the necessary attributes", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const requestBody = {};

    const res = await request(app)
      .delete("/api/categories")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Invalid parameters" });

    expect(categories.find).not.toHaveBeenCalled();
    expect(categories.countDocuments).not.toHaveBeenCalled();
    expect(categories.deleteMany).not.toHaveBeenCalled();
    expect(transactions.updateMany).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if there is only one category in the database", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const requestBody = {
      types: ["food"],
    };

    const existingCategories = [{ type: "food", createdAt: new Date() }];

    categories.find.mockResolvedValue(existingCategories);

    categories.countDocuments.mockResolvedValue(1);

    const res = await request(app)
      .delete("/api/categories")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Cannot delete the only category" });

    expect(categories.find).toHaveBeenCalledWith({
      type: { $in: requestBody.types },
    });

    expect(categories.countDocuments).toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(categories.deleteMany).not.toHaveBeenCalled();
    expect(transactions.updateMany).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if at least one type in the array is an empty string", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const requestBody = {
      types: ["food", ""],
    };

    const res = await request(app)
      .delete("/api/categories")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "Categories cannot be empty strings" });

    expect(categories.find).not.toHaveBeenCalled();
    expect(categories.countDocuments).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(categories.deleteMany).not.toHaveBeenCalled();
    expect(transactions.updateMany).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 400 error if at least one type in the array does not represent a category in the database", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const requestBody = {
      types: ["food", "drinks"],
    };

    const existingCategories = [{ type: "food", createdAt: new Date() }];

    categories.find.mockResolvedValue(existingCategories);

    categories.countDocuments.mockResolvedValue(2);

    const res = await request(app)
      .delete("/api/categories")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual({ error: "One or more categories not found" });

    expect(categories.find).toHaveBeenCalledWith({
      type: { $in: requestBody.types },
    });

    expect(categories.countDocuments).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(categories.deleteMany).not.toHaveBeenCalled();
    expect(transactions.updateMany).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 401 error if the user is not an admin", async () => {
    verifyAuth.mockReturnValue({ flag: false, cause: "Not an admin" });

    const requestBody = {
      types: ["food", "drinks"],
    };

    const res = await request(app)
      .delete("/api/categories")
      .send(requestBody)
      .expect(401);

    expect(res.body).toEqual({ error: "Not an admin" });

    expect(categories.find).not.toHaveBeenCalled();
    expect(categories.countDocuments).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(categories.deleteMany).not.toHaveBeenCalled();
    expect(transactions.updateMany).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });
});

describe("getCategories", () => {
  test("should return a list of categories", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const existingCategories = [
      { type: "food", color: "red" },
      { type: "health", color: "green" },
    ];
    categories.find.mockResolvedValue(existingCategories);

    const expectedResponse = {
      data: [
        { type: "food", color: "red" },
        { type: "health", color: "green" },
      ],
    };

    const res = await request(app).get("/api/categories").expect(200);

    expect(res.body).toEqual(expectedResponse);
    expect(categories.find).toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a message if there are no categories", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    categories.find.mockResolvedValue([]);

    const res = await request(app).get("/api/categories").expect(200);

    expect(res.body).toEqual({ data: [] });

    expect(categories.find).toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 401 error if the user is not authenticated", async () => {
    const authResponse = { flag: false, cause: "Not authenticated" };
    verifyAuth.mockReturnValue(authResponse);

    const res = await request(app).get("/api/categories").expect(401);

    expect(res.body).toEqual({ error: authResponse.cause });

    expect(categories.find).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalled();
  });
});

describe("createTransaction", () => {
  test("should create a new transaction for an authenticated user", async () => {
    const requestBody = {
      username: "Mario",
      amount: 100,
      type: "food",
    };
    const requestParams = {
      username: "Mario",
    };

    verifyAuth.mockReturnValue({ flag: true });

    User.findOne.mockResolvedValue({ username: "Mario" });

    categories.findOne.mockResolvedValue({ type: "food" });

    transactions.create.mockResolvedValue({
      _id: "abc123",
      date: "2023-05-19T00:00:00",
      ...requestBody,
    });

    const expectedResponse = {
      data: {
        username: "Mario",
        amount: 100,
        type: "food",
        date: "2023-05-19T00:00:00",
      },
    };

    const res = await request(app)
      .post(`/api/users/${requestParams.username}/transactions`)
      .send(requestBody)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalled();
    expect(categories.findOne).toHaveBeenCalledWith({ type: "food" });
    expect(transactions.create).toHaveBeenCalled();
  });

  test("should return a 401 error if the user is not authenticated", async () => {
    const requestBody = {
      username: "Mario",
      amount: 100,
      type: "food",
    };

    verifyAuth.mockReturnValue({ flag: false, cause: "Not authenticated" });

    const res = await request(app)
      .post("/api/users/Mario/transactions")
      .send(requestBody)
      .expect(401);

    expect(res.body).toEqual({ error: "Not authenticated" });

    expect(verifyAuth).toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.create).not.toHaveBeenCalled();
  });

  test("should return a 400 error if the category does not exist", async () => {
    const requestBody = {
      username: "Mario",
      amount: 100,
      type: "food",
    };

    verifyAuth.mockReturnValue({ flag: true });

    User.findOne.mockResolvedValue({ username: "Mario" });

    categories.findOne.mockResolvedValue(null);

    const expectedResponse = {
      error: "Category not found",
    };

    const res = await request(app)
      .post("/api/users/Mario/transactions")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalled();
    expect(categories.findOne).toHaveBeenCalledWith({ type: "food" });
    expect(transactions.create).not.toHaveBeenCalled();
  });

  test("should return a 400 error if the request body is missing attributes", async () => {
    const requestBody = {
      amount: 100,
      type: "food",
    };

    const expectedResponse = {
      error: "Missing attributes",
    };

    const res = await request(app)
      .post("/api/users/Mario/transactions")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.create).not.toHaveBeenCalled();
  });

  test("should return a 400 error if the request body has empty string parameters", async () => {
    const requestBody = {
      username: "   ",
      amount: 100,
      type: "food",
    };

    const expectedResponse = {
      error: "Empty attributes in the request body",
    };

    const res = await request(app)
      .post("/api/users/Mario/transactions")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.create).not.toHaveBeenCalled();
  });

  test("should return a 400 error if the username in the request body does not match the route parameter", async () => {
    const requestBody = {
      username: "Luigi",
      amount: 100,
      type: "food",
    };
    const requestParams = {
      username: "Mario",
    };

    const expectedResponse = {
      error:
        "Username passed in the request body is not equal to the one passed as a route parameter",
    };

    const res = await request(app)
      .post(`/api/users/${requestParams.username}/transactions`)
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.create).not.toHaveBeenCalled();
  });

  test("should return a 400 error if the username in the request body does not exist", async () => {
    const requestBody = {
      username: "Mario",
      amount: 100,
      type: "food",
    };

    verifyAuth.mockReturnValue({ flag: true });

    User.findOne.mockResolvedValue(null);

    const expectedResponse = {
      error: "User not found",
    };

    const res = await request(app)
      .post("/api/users/Mario/transactions")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.create).not.toHaveBeenCalled();
  });

  test("should return a 400 error if the amount is not a valid number", async () => {
    const requestBody = {
      username: "Mario",
      amount: "invalid type",
      type: "food",
    };

    verifyAuth.mockReturnValue({ flag: true });

    const expectedResponse = {
      error: "Amount is not a number",
    };

    const res = await request(app)
      .post("/api/users/Mario/transactions")
      .send(requestBody)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.create).not.toHaveBeenCalled();
  });

  test("should return a 401 error if the authenticated user is not the same as the user in the route parameter", async () => {
    const requestBody = {
      username: "Mario",
      amount: 100,
      type: "food",
    };

    verifyAuth
      .mockReturnValueOnce({ flag: false, cause: "Unauthorized" })

    const expectedResponse = {
      error: "Unauthorized",
    };

    const res = await request(app)
      .post("/api/users/Mario/transactions")
      .send(requestBody)
      .expect(401);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.create).not.toHaveBeenCalled();
  });
});

describe("getAllTransactions", () => {
  test("should return all transactions with category information", async () => {
    const mockResult = [
      {
        _id: "transaction_id1",
        username: "John",
        amount: 100,
        type: "food",
        categories_info: {
          color: "red",
        },
        date: "2023-05-19T00:00:00",
      },
      {
        _id: "transaction_id2",
        username: "Jane",
        amount: 200,
        type: "health",
        categories_info: {
          color: "green",
        },
        date: "2023-05-20T00:00:00",
      },
    ];

    transactions.aggregate.mockResolvedValueOnce(mockResult);
    verifyAuth.mockReturnValue({ flag: true });

    const expectedResponse = {
      data: [
        {
          username: "John",
          amount: 100,
          type: "food",
          date: "2023-05-19T00:00:00",
          color: "red",
        },
        {
          username: "Jane",
          amount: 200,
          type: "health",
          date: "2023-05-20T00:00:00",
          color: "green",
        },
      ],
    };

    const res = await request(app).get("/api/transactions").expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(transactions.aggregate).toHaveBeenCalledWith([
      {
        $lookup: {
          from: "categories",
          localField: "type",
          foreignField: "type",
          as: "categories_info",
        },
      },
      { $unwind: "$categories_info" },
    ]);
  });

  test("should return an empty response if no transactions found", async () => {
    const mockResult = [];

    transactions.aggregate.mockResolvedValueOnce(mockResult);
    verifyAuth.mockReturnValue({ flag: true });

    const res = await request(app).get("/api/transactions").expect(200);

    expect(res.body).toEqual({ data: [] });

    expect(transactions.aggregate).toHaveBeenCalledWith([
      {
        $lookup: {
          from: "categories",
          localField: "type",
          foreignField: "type",
          as: "categories_info",
        },
      },
      { $unwind: "$categories_info" },
    ]);

    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return a 401 error if the user is not an admin", async () => {
    const authResponse = { flag: false, cause: "Not an admin user" };
    verifyAuth.mockReturnValue(authResponse);

    const expectedResponse = {
      error: authResponse.cause,
    };

    const res = await request(app).get("/api/transactions").expect(401);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalled();
    expect(transactions.aggregate).not.toHaveBeenCalled();
  });
});

describe("getTransactionsByUser", () => {
  test("should return transactions for admin user", async () => {
    const username = "adminUser";
    const mockResult = [
      {
        username: "adminUser",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        categories_info: { color: "red" },
      },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true });
    User.findOne.mockResolvedValueOnce({ username });
    transactions.aggregate.mockResolvedValueOnce(mockResult);

    const expectedResponse =
    {
      data: [
        {
          username: "adminUser",
          type: "food",
          amount: 100,
          date: "2023-05-19T00:00:00",
          color: "red",
        }
      ]
    };

    const res = await request(app)
      .get(`/api/transactions/users/${username}`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(transactions.aggregate).toHaveBeenCalled();
  });

  test("should return transactions for regular user with filters", async () => {
    const username = "regularUser";
    const mockResult = [
      {
        username: "regularUser",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        categories_info: { color: "red" },
      },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true });
    handleAmountFilterParams.mockReturnValue({ amount: { $exists: true } });
    handleDateFilterParams.mockReturnValue({
      date: { $gte: new Date("2023-05-19"), $lte: new Date("2023-05-20") },
    });

    User.findOne.mockResolvedValueOnce({ username });
    transactions.find.mockImplementationOnce(() => ({
      where: () => ({
        where: () => mockResult,
      }),
    }));

    transactions.aggregate.mockResolvedValue(mockResult);

    const expectedResponse = {
      data: [
        {
          username: "regularUser",
          type: "food",
          amount: 100,
          date: "2023-05-19T00:00:00",
          color: "red",
        },
      ],
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions`)
      .query({ from: "2023-05-19", to: "2023-05-20" })
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(transactions.find).toHaveBeenCalled();
    expect(transactions.aggregate).toHaveBeenCalled();
  });

  test("should return an empty response if no transactions found for regular user", async () => {
    const username = "regularUser";
    const mockResult = [];

    verifyAuth.mockReturnValueOnce({ flag: true });
    handleAmountFilterParams.mockReturnValue({ amount: { $exists: true } });
    handleDateFilterParams.mockReturnValue({ date: { $exists: true } });

    User.findOne.mockResolvedValueOnce({ username });
    transactions.find.mockImplementationOnce(() => ({
      where: () => ({
        where: () => mockResult,
      }),
    }));
    transactions.aggregate.mockResolvedValueOnce(mockResult);

    const expectedResponse = {
      data: [],
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
  });

  test("should return 401 error for unauthorized admin user", async () => {
    const username = "adminUser";

    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });

    const expectedResponse = {
      error: "Unauthorized",
    };

    const res = await request(app)
      .get(`/api/transactions/users/${username}`)
      .expect(401);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "Admin",
      }
    );
    expect(User.findOne).not.toHaveBeenCalled();
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 401 error for unauthorized regular user", async () => {
    const username = "regularUser";

    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });

    const expectedResponse = {
      error: "Unauthorized",
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions`)
      .expect(401);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).not.toHaveBeenCalled();
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 400 error if user not found", async () => {
    const username = "nonExistentUser";

    verifyAuth.mockReturnValueOnce({ flag: true });

    User.findOne.mockResolvedValue(null);

    const expectedResponse = {
      error: "User not found",
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions`)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(transactions.find).not.toHaveBeenCalled();
  });
});

describe("getTransactionsByUserByCategory", () => {
  test("should return transactions for admin user by category", async () => {
    const username = "adminUser";
    const category = "food";
    const mockResult = [
      {
        username: "adminUser",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        color: "red",
      },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true });
    User.findOne.mockResolvedValueOnce({ username });

    categories.findOne.mockResolvedValueOnce({ type: "food", color: "red" });

    transactions.find.mockResolvedValueOnce(mockResult);

    const expectedResponse = {
      data: [
        {
          username: "adminUser",
          type: "food",
          amount: 100,
          date: "2023-05-19T00:00:00",
          color: "red",
        },
      ],
    };

    const res = await request(app)
      .get(`/api/transactions/users/${username}/category/${category}`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { authType: "Admin" }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(categories.findOne).toHaveBeenCalledWith({ type: category });
    expect(transactions.find).toHaveBeenCalledWith({
      username,
      type: category,
    });
  });

  test("should return transactions for regular user by category", async () => {
    const username = "regularUser";
    const category = "food";
    const mockResult = [
      {
        username: "regularUser",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        color: "red",
      },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true });

    User.findOne.mockResolvedValueOnce({ username });

    categories.findOne.mockResolvedValueOnce({ type: "food", color: "red" });

    transactions.find.mockResolvedValueOnce(mockResult);

    const expectedResponse = {
      data: [
        {
          username: "regularUser",
          type: "food",
          amount: 100,
          date: "2023-05-19T00:00:00",
          color: "red",
        },
      ],
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions/category/${category}`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(categories.findOne).toHaveBeenCalledWith({ type: category });
    expect(transactions.find).toHaveBeenCalledWith({
      username,
      type: category,
    });
  });

  test("should return an empty response if no transactions found for admin user by category", async () => {
    const username = "adminUser";
    const category = "food";
    const mockResult = [];

    verifyAuth.mockReturnValueOnce({ flag: true });

    User.findOne.mockResolvedValueOnce({ username });

    categories.findOne.mockResolvedValueOnce({ type: "food", color: "red" });

    transactions.find.mockResolvedValueOnce(mockResult);

    const expectedResponse = {
      data: [],
    };

    const res = await request(app)
      .get(`/api/transactions/users/${username}/category/${category}`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { authType: "Admin" }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(categories.findOne).toHaveBeenCalledWith({ type: category });
    expect(transactions.find).toHaveBeenCalledWith({
      username,
      type: category,
    });
  });

  test("should return an empty response if no transactions found for regular user by category", async () => {
    const username = "regularUser";
    const category = "food";
    const mockResult = [];

    verifyAuth.mockReturnValueOnce({ flag: true });

    User.findOne.mockResolvedValueOnce({ username });

    categories.findOne.mockResolvedValueOnce({ type: "food", color: "red" });

    transactions.find.mockResolvedValueOnce(mockResult);

    const expectedResponse = {
      data: [],
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions/category/${category}`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(categories.findOne).toHaveBeenCalledWith({ type: category });
    expect(transactions.find).toHaveBeenCalledWith({
      username,
      type: category,
    });
  });

  test("should return 400 error if user not found for admin user", async () => {
    const username = "nonExistentUser";
    const category = "food";

    verifyAuth.mockReturnValueOnce({ flag: true });

    User.findOne.mockResolvedValueOnce(null);

    const expectedResponse = {
      error: "User not found",
    };

    const res = await request(app)
      .get(`/api/transactions/users/${username}/category/${category}`)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { authType: "Admin" }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 400 error if user not found for regular user", async () => {
    const username = "nonExistentUser";
    const category = "food";

    verifyAuth.mockReturnValueOnce({ flag: true });

    User.findOne.mockResolvedValueOnce(null);

    const expectedResponse = {
      error: "User not found",
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions/category/${category}`)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 400 error if category not found for admin user", async () => {
    const username = "adminUser";
    const category = "nonExistentCategory";

    verifyAuth.mockReturnValueOnce({ flag: true });

    User.findOne.mockResolvedValueOnce({ username });

    categories.findOne.mockResolvedValueOnce(null);

    const expectedResponse = {
      error: "Category not found",
    };

    const res = await request(app)
      .get(`/api/transactions/users/${username}/category/${category}`)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { authType: "Admin" }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(categories.findOne).toHaveBeenCalledWith({ type: category });
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 400 error if category not found for regular user", async () => {
    const username = "regularUser";
    const category = "nonExistentCategory";

    verifyAuth.mockReturnValueOnce({ flag: true });

    User.findOne.mockResolvedValueOnce({ username });

    categories.findOne.mockResolvedValueOnce(null);

    const expectedResponse = {
      error: "Category not found",
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions/category/${category}`)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(categories.findOne).toHaveBeenCalledWith({ type: category });
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 401 error for unauthorized admin user", async () => {
    const username = "adminUser";
    const category = "food";

    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });

    const expectedResponse = {
      error: "Unauthorized",
    };

    const res = await request(app)
      .get(`/api/transactions/users/${username}/category/${category}`)
      .expect(401);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { authType: "Admin" }
    );
    expect(User.findOne).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 401 error for unauthorized regular user", async () => {
    const username = "regularUser";
    const category = "food";

    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });

    const expectedResponse = {
      error: "Unauthorized",
    };

    const res = await request(app)
      .get(`/api/users/${username}/transactions/category/${category}`)
      .expect(401);

    expect(res.body).toEqual(expectedResponse);

    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "User",
        username: username,
      }
    );
    expect(User.findOne).not.toHaveBeenCalled();
    expect(categories.findOne).not.toHaveBeenCalled();
    expect(transactions.find).not.toHaveBeenCalled();
  });
});

describe("getTransactionsByGroup", () => {
  test("should return transactions for admin route", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", _id: { username: "user1", role: "User" } },
        { email: "user2@email.com", _id: { username: "user2", role: "User" } },
      ],
    };
    const mockTransactions = [
      {
        username: "user1",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        categories_info: { type: "food", color: "red" },
      },
      {
        username: "user2",
        type: "food",
        amount: 200,
        date: "2023-04-19T00:00:00",
        categories_info: { type: "food", color: "red" },
      },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    transactions.aggregate.mockResolvedValueOnce(mockTransactions);

    const expectedTransactions = [
      {
        username: "user1",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        color: "red",
      },
      {
        username: "user2",
        type: "food",
        amount: 200,
        date: "2023-04-19T00:00:00",
        color: "red",
      },
    ];
    const expectedResponse = {
      data: expectedTransactions,
    };

    const res = await request(app)
      .get(`/api/transactions/groups/${groupName}`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(Group.findOne).toHaveBeenCalledWith({ name: groupName });
    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { authType: "Admin" }
    );
    expect(transactions.aggregate).toHaveBeenCalled();
  });

  test("should return transactions for user route", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", _id: { username: "user1", role: "User" } },
        { email: "user2@email.com", _id: { username: "user2", role: "User" } },
      ],
    };
    const mockTransactions = [
      {
        username: "user1",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        categories_info: { type: "food", color: "red" },
      },
      {
        username: "user2",
        type: "food",
        amount: 200,
        date: "2023-04-19T00:00:00",
        categories_info: { type: "food", color: "red" },
      },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    transactions.aggregate.mockResolvedValueOnce(mockTransactions);

    const expectedTransactions = [
      {
        username: "user1",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        color: "red",
      },
      {
        username: "user2",
        type: "food",
        amount: 200,
        date: "2023-04-19T00:00:00",
        color: "red",
      },
    ];
    const expectedResponse = {
      data: expectedTransactions,
    };

    const res = await request(app)
      .get(`/api/groups/${groupName}/transactions`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(Group.findOne).toHaveBeenCalledWith({ name: groupName });
    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "Group",
        emails: mockGroup.members.map((m) => m.email),
      }
    );
    expect(transactions.aggregate).toHaveBeenCalled();
  });

  test("should return an empty data array if no transactions found for admin route", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", _id: { username: "user1", role: "User" } },
        { email: "user2@email.com", _id: { username: "user2", role: "User" } },
      ],
    };

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    transactions.aggregate.mockResolvedValueOnce([]);

    const expectedResponse = {
      data: [],
    };

    const res = await request(app)
      .get(`/api/transactions/groups/${groupName}`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(Group.findOne).toHaveBeenCalledWith({ name: groupName });
    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { authType: "Admin" }
    );
    expect(transactions.aggregate).toHaveBeenCalled();
  });

  test("should return an empty data array if no transactions found for user route", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", _id: { username: "user1", role: "User" } },
        { email: "user2@email.com", _id: { username: "user2", role: "User" } },
      ],
    };

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    transactions.aggregate.mockResolvedValueOnce([]);

    const expectedResponse = {
      data: [],
    };

    const res = await request(app)
      .get(`/api/groups/${groupName}/transactions`)
      .expect(200);

    expect(res.body).toEqual(expectedResponse);

    expect(Group.findOne).toHaveBeenCalledWith({ name: groupName });
    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "Group",
        emails: mockGroup.members.map((m) => m.email),
      }
    );
    expect(transactions.aggregate).toHaveBeenCalled();
  });

  test("should return 400 error if group not found for admin route", async () => {
    const groupName = "nonExistentGroup";

    verifyAuth.mockReturnValueOnce({ flag: true });

    Group.findOne.mockImplementationOnce(() => ({
      populate: () => null,
    }));

    const expectedResponse = {
      error: "Group not found",
    };

    const res = await request(app)
      .get(`/api/transactions/groups/${groupName}`)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(Group.findOne).toHaveBeenCalledWith({ name: groupName });
    expect(verifyAuth).toHaveBeenCalled();
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 400 error if group not found for user route", async () => {
    const groupName = "nonExistentGroup";

    //verifyAuth.mockReturnValueOnce({ flag: true });

    Group.findOne.mockImplementationOnce(() => ({
      populate: () => null,
    }));

    const expectedResponse = {
      error: "Group not found",
    };

    const res = await request(app)
      .get(`/api/groups/${groupName}/transactions`)
      .expect(400);

    expect(res.body).toEqual(expectedResponse);

    expect(Group.findOne).toHaveBeenCalledWith({ name: groupName });
    expect(verifyAuth).not.toHaveBeenCalled();
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 401 error for unauthorized admin user", async () => {
    const groupName = "exampleGroup";

    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });

    const expectedResponse = {
      error: "Unauthorized",
    };

    const res = await request(app)
      .get(`/api/transactions/groups/${groupName}`)
      .expect(401);

    expect(res.body).toEqual(expectedResponse);

    expect(Group.findOne).not.toHaveBeenCalled();
    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { authType: "Admin" }
    );
    expect(transactions.find).not.toHaveBeenCalled();
  });

  test("should return 401 error for unauthorized user route", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", user: { username: "user1", role: "User" } },
        { email: "user2@email.com", user: { username: "user2", role: "User" } },
      ],
    };

    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    transactions.aggregate.mockResolvedValueOnce([]);
    const expectedResponse = {
      error: "Unauthorized",
    };

    const res = await request(app)
      .get(`/api/groups/${groupName}/transactions`)
      .expect(401);

    expect(res.body).toEqual(expectedResponse);

    expect(Group.findOne).toHaveBeenCalledWith({ name: groupName });
    expect(verifyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        authType: "Group",
        emails: mockGroup.members.map((m) => m.email),
      }
    );
    expect(transactions.find).not.toHaveBeenCalled();
  });
});

describe("getTransactionsByGroupByCategory", () => {
  test("should return 400 if group is not found for admin route", async () => {
    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => null,
    }));

    const response = await request(app)
      .get("/api/transactions/groups/Family/category/food")
      .expect(400);

    expect(response.body).toEqual({ error: "Group not found" });
  });

  test("should return 400 if group is not found for user route", async () => {
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => null,
    }));

    const response = await request(app)
      .get("/api/groups/nonexistentgroup/transactions/category/food")
      .expect(400);

    expect(response.body).toEqual({ error: "Group not found" });
  });

  test("should return 400 if category is not found (admin route)", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", user: { username: "user1", role: "User" } },
        { email: "user2@email.com", user: { username: "user2", role: "User" } },
      ],
    };

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    categories.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get("/api/transactions/groups/Family/category/nonexistentcategory")
      .expect(400);

    expect(response.body).toEqual({ error: "Category not found" });
  });

  test("should return 400 if category is not found (user route)", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", user: { username: "user1", role: "User" } },
        { email: "user2@email.com", user: { username: "user2", role: "User" } },
      ],
    };

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    categories.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get("/api/groups/Family/transactions/category/food")
      .expect(400);

    expect(response.body).toEqual({ error: "Category not found" });
  });

  test("should return 401 if user is not an admin (admin route)", async () => {
    verifyAuth.mockReturnValueOnce({ flag: false, cause: "Not an admin" });

    const response = await request(app)
      .get("/api/transactions/groups/Family/category/food")
      .expect(401);

    expect(response.body).toEqual({ error: "Not an admin" });
  });

  test("should return 401 if user does not belong to the group (user route)", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", user: { username: "user1", role: "User" } },
        { email: "user2@email.com", user: { username: "user2", role: "User" } },
      ],
    };

    verifyAuth.mockReturnValueOnce({
      flag: false,
      cause: "User does not belong to the group",
    });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    categories.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get("/api/groups/Family/transactions/category/food")
      .expect(401);

    expect(response.body).toEqual({
      error: "User does not belong to the group",
    });
  });

  test("should return an empty array if no transactions found (admin route)", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", _id: { username: "user1", role: "User" } },
        { email: "user2@email.com", _id: { username: "user2", role: "User" } },
      ],
    };

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    transactions.find.mockResolvedValueOnce([]);
    categories.findOne.mockResolvedValue({ type: "food", color: "red" });

    const expectedResponse = {
      data: [],
    };

    const response = await request(app)
      .get("/api/transactions/groups/Family/category/food")
      .expect(200);

    expect(response.body).toEqual(expectedResponse);
  });

  test("should return an empty array if no transactions found (user route)", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", _id: { username: "user1", role: "User" } },
        { email: "user2@email.com", _id: { username: "user2", role: "User" } },
      ],
    };

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    transactions.find.mockResolvedValueOnce([]);
    categories.findOne.mockResolvedValue({ type: "food", color: "red" });

    const expectedResponse = {
      data: [],
    };

    const response = await request(app)
      .get("/api/groups/Family/transactions/category/food")
      .expect(200);

    expect(response.body).toEqual(expectedResponse);
  });

  test("should return an array of transactions if transactions found (admin route)", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", _id: { username: "user1", role: "User" } },
        { email: "user2@email.com", _id: { username: "user2", role: "User" } },
      ],
    };
    const mockTransactions = [
      {
        username: "user1",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
      },
      {
        username: "user2",
        type: "food",
        amount: 200,
        date: "2023-04-19T00:00:00",
      },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    categories.findOne.mockResolvedValue({ type: "food", color: "red" });
    transactions.find.mockResolvedValueOnce(mockTransactions);

    const expectedTransactions = [
      {
        username: "user1",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        color: "red",
      },
      {
        username: "user2",
        type: "food",
        amount: 200,
        date: "2023-04-19T00:00:00",
        color: "red",
      },
    ];

    const expectedResponse = {
      data: expectedTransactions,
    };

    const response = await request(app)
      .get("/api/transactions/groups/Family/category/food")
      .expect(200);

    expect(response.body).toEqual(expectedResponse);
  });

  test("should return an array of transactions if transactions found (user route)", async () => {
    const groupName = "Family";
    const mockGroup = {
      name: groupName,
      members: [
        { email: "user1@email.com", _id: { username: "user1", role: "User" } },
        { email: "user2@email.com", _id: { username: "user2", role: "User" } },
      ],
    };
    const mockTransactions = [
      {
        username: "user1",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        color: "red"
      },
      {
        username: "user2",
        type: "food",
        amount: 200,
        date: "2023-04-19T00:00:00",
        color: "red"
      },
    ];

    verifyAuth.mockReturnValueOnce({ flag: true });
    Group.findOne.mockImplementationOnce(() => ({
      populate: () => mockGroup,
    }));
    categories.findOne.mockResolvedValue({ type: "food", color: "red" });
    transactions.find.mockResolvedValueOnce(mockTransactions);

    const expectedTransactions = [
      {
        username: "user1",
        type: "food",
        amount: 100,
        date: "2023-05-19T00:00:00",
        color: "red",
      },
      {
        username: "user2",
        type: "food",
        amount: 200,
        date: "2023-04-19T00:00:00",
        color: "red",
      },
    ];

    const expectedResponse = {
      data: expectedTransactions,
    };

    const response = await request(app)
      .get("/api/groups/Family/transactions/category/food")
      .expect(200);

    expect(response.body).toEqual(expectedResponse);
  });
});

describe("deleteTransaction", () => {
  test("should return 400 if Transaction _id is missing in the request body", async () => {
    verifyAuth.mockReturnValueOnce({ flag: true });
    User.findOne.mockResolvedValueOnce({ username: "Mario" });

    const response = await request(app)
      .delete("/api/users/Mario/transactions")
      .send({})
      .expect(400);

    expect(response.body).toEqual({
      error: "Request body does not contain Transaction _id",
    });
  });

  test("should return 400 if Transaction _id is empty in the request body", async () => {
    verifyAuth.mockReturnValueOnce({ flag: true });
    User.findOne.mockResolvedValueOnce({ username: "Mario" });

    const response = await request(app)
      .delete("/api/users/Mario/transactions")
      .send({ _id: "   " })
      .expect(400);

    expect(response.body).toEqual({ error: "Transaction _id cannot be empty" });
  });

  test("should return 400 if user is not found", async () => {
    verifyAuth.mockReturnValueOnce({ flag: true });
    User.findOne.mockResolvedValueOnce(null);

    const response = await request(app)
      .delete("/api/users/Mario/transactions")
      .send({ _id: "6hjkohgfc8nvu786" })
      .expect(400);

    expect(response.body).toEqual({ error: "User not found" });
  });

  test("should return 400 if transaction is not found", async () => {
    verifyAuth.mockReturnValueOnce({ flag: true });
    User.findOne.mockResolvedValueOnce({ username: "Mario" });
    transactions.findById.mockResolvedValue(null);

    const response = await request(app)
      .delete("/api/users/Mario/transactions")
      .send({ _id: "6hjkohgfc8nvu786" })
      .expect(400);

    expect(response.body).toEqual({
      error: "Transaction with _id: 6hjkohgfc8nvu786 not found",
    });
  });

  test("should return 400 if transaction belongs to a different user", async () => {
    verifyAuth.mockReturnValueOnce({ flag: true });
    User.findOne.mockResolvedValueOnce({ username: "Mario" });
    transactions.findById.mockResolvedValue({ username: "differentUser" });

    const response = await request(app)
      .delete("/api/users/Mario/transactions")
      .send({ _id: "6hjkohgfc8nvu786" })
      .expect(400);

    expect(response.body).toEqual({
      error: "The transaction belongs to a different user",
    });
  });

  test("should delete the transaction and return success message if authorized", async () => {
    verifyAuth.mockReturnValueOnce({ flag: true });
    User.findOne.mockResolvedValueOnce({ username: "Mario" });
    transactions.findById.mockResolvedValue({ _id: "6hjkohgfc8nvu786", username: "Mario" });
    transactions.deleteOne.mockResolvedValue(null);

    const response = await request(app)
      .delete("/api/users/Mario/transactions")
      .send({ _id: "6hjkohgfc8nvu786" })
      .expect(200);

    expect(transactions.deleteOne).toHaveBeenCalledWith({
      _id: "6hjkohgfc8nvu786",
    });

    expect(response.body).toEqual({
      data: { message: "Transaction deleted" },
    });
  });

  test("should return 401 if not authorized", async () => {
    verifyAuth.mockReturnValue({ flag: false, cause: "Not authorized" });

    const response = await request(app)
      .delete("/api/users/Mario/transactions")
      .send({ _id: "6hjkohgfc8nvu786" })
      .expect(401);

    expect(response.body).toEqual({ error: "Not authorized" });
  });
});

describe("deleteTransactions", () => {
  test("should return 401 if user is not an admin", async () => {
    verifyAuth.mockReturnValue({ flag: false, cause: "Not an admin" });

    const response = await request(app)
      .delete("/api/transactions")
      .send({ _ids: ["6hjkohgfc8nvu786"] })
      .expect(401);

    expect(response.body).toEqual({ error: "Not an admin" });
    expect(verifyAuth).toHaveBeenCalled();
  });

  test("should return 400 if request body is missing attributes", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const response = await request(app)
      .delete("/api/transactions")
      .send({})
      .expect(400);

    expect(response.body).toEqual({ error: "Request body does not contain Transaction _ids" });
    expect(transactions.deleteMany).not.toHaveBeenCalled();
  });

  test("should return 400 if at least one id in the array is empty", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const response = await request(app)
      .delete("/api/transactions")
      .send({ _ids: ["6hjkohgfc8nvu786", "   "] })
      .expect(400);

    expect(response.body).toEqual({ error: "Found empty string in array of ids" });
    expect(transactions.deleteMany).not.toHaveBeenCalled();
  });

  test("should return 400 if the array of _id is empty", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    const response = await request(app)
      .delete("/api/transactions")
      .send({ _ids: [] })
      .expect(400);

    expect(response.body).toEqual({ error: "Array of _id is empty" });
    expect(transactions.deleteMany).not.toHaveBeenCalled();
  });

  test("should return 400 if at least one id does not represent a transaction", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    transactions.find.mockResolvedValue([]);

    const response = await request(app)
      .delete("/api/transactions")
      .send({ _ids: ["6hjkohgfc8nvu786", "9gtyumjkl2n4e567"] })
      .expect(400);

    expect(response.body).toEqual({
      error: "Transaction _ids contains invalid transaction identifier",
    });
    expect(transactions.deleteMany).not.toHaveBeenCalled();
  });

  test("should delete the transactions and return success message if authorized", async () => {
    verifyAuth.mockReturnValue({ flag: true });

    transactions.find.mockResolvedValue(["6hjkohgfc8nvu786", "9gtyumjkl2n4e567"])
    transactions.deleteMany.mockResolvedValue({ deletedCount: 2 });

    const response = await request(app)
      .delete("/api/transactions")
      .send({ _ids: ["6hjkohgfc8nvu786", "9gtyumjkl2n4e567"] })
      .expect(200);

    expect(transactions.deleteMany).toHaveBeenCalledWith({
      _id: { $in: ["6hjkohgfc8nvu786", "9gtyumjkl2n4e567"] },
    });
    expect(response.body).toEqual({
      data: { message: "Transactions deleted" },
    });
  });
});

