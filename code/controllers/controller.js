import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import {
  handleDateFilterParams,
  handleAmountFilterParams,
  verifyAuth,
} from "./utils.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = (req, res) => {
  try {
    // Check if the user is an admin
    const adminAuth = isAdminUser(req, res);
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    if (!req.body.hasOwnProperty("type") || !req.body.hasOwnProperty("color")) {
      return res.status(400).json({ error: "Missing attributes" });
    }

    let { type, color } = req.body;

    // Check if the necessary attributes are present
    type = type?.trim();
    color = color?.trim();

    if (!type || !color) {
      return res.status(400).json({ error: "Empty attributes" });
    }

    // Check if the category type already exists in the database
    categories.findOne({ type }, (err, existingCategory) => {
      if (err) {
        throw err;
      }

      if (existingCategory) {
        return res.status(400).json({ error: "Category already exists" });
      }

      // Create a new category instance
      const newCategory = new categories({ type, color });

      // Save the new category to the database
      newCategory
        .save()
        .then((savedCategory) => {
          res.status(200).json({
            data: { type: savedCategory.type, color: savedCategory.color },
            refreshedTokenMessage: res.locals?.refreshedTokenMessage,
          });
        })
        .catch((err) => {
          throw err;
        });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 401 returned if the specified category does not exist
    - error 401 is returned if new parameters have invalid values
 */

export const updateCategory = async (req, res) => {
  try {
    // Check if the user is an admin
    const adminAuth = isAdminUser(req, res);

    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    if (!req.body.hasOwnProperty("type") || !req.body.hasOwnProperty("color")) {
      return res.status(400).json({ error: "Missing attributes" });
    }

    let { type, color } = req.body;

    // Check if the necessary attributes are present
    type = type?.trim();
    color = color?.trim();

    if (!type || !color) {
      return res.status(400).json({ error: "Empty attributes" });
    }

    const category = await categories.findOne({ type: req.params.type });

    // Check if the category exists in the database
    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }

    // Check if the new category type already exists in the database
    const existingCategory = await categories.findOne({ type });

    if (
      existingCategory &&
      existingCategory._id.toString() !== category._id.toString()
    ) {
      return res.status(400).json({ error: "Category already exists" });
    }

    // Update the category with the new values
    category.type = type;
    category.color = color;

    // Save the updated category
    const updatedCategory = await category.save();

    // Find transactions with the old category type and update them with the new type
    const result = await transactions.updateMany(
      { type: req.params.type },
      { $set: { type: updatedCategory.type } }
    );

    const updateCount = result.modifiedCount || 0;

    res.locals.message = "Category edited successfully";
    res.status(200).json({
      data: { message: res.locals.message, count: updateCount },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
  try {
    // Check if the user is an admin
    const adminAuth = isAdminUser(req, res);
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    let { types } = req.body;

    // Check if the necessary attributes are present
    if (!Array.isArray(types)) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    // Check if the array of types is empty
    if (types.length === 0) {
      return res.status(400).json({ error: "No categories provided" });
    }

    // Check if any type in the array is an empty string
    if (types.some((type) => type.trim() === "")) {
      return res
        .status(400)
        .json({ error: "Categories cannot be empty strings" });
    }

    const categoriesToDelete = await categories.find({ type: { $in: types } });

    // Check if all types in the array represent categories in the database
    if (categoriesToDelete.length !== types.length) {
      return res
        .status(400)
        .json({ error: "One or more categories not found" });
    }

    const totCategories = await categories.countDocuments();

    // Check if there is only one category in the database
    if (totCategories === 1) {
      return res.status(400).json({ error: "Cannot delete the only category" });
    }

    let oldestCategory;

    if (totCategories > types.length) {
      // Find the oldest category that is NOT in the delete list
      oldestCategory = (
        await categories.find({ type: { $nin: types } }).sort({ createdAt: 1 })
      )[0];
    } else {
      // Find the oldest category
      oldestCategory = (await categories.find({}).sort({ createdAt: 1 }))[0];

      // remove oldest category from the ones to delete
      types = types.filter((t) => t !== oldestCategory.type);
    }

    // Delete the categories
    await categories.deleteMany({ type: { $in: types } });

    // update all the transactions from old to new category type
    const updateResult = await transactions.updateMany(
      { type: { $in: types } },
      { $set: { type: oldestCategory.type } }
    );

    res.locals.message = "Categories deleted";
    res.status(200).json({
      data: {
        message: res.locals.message,
        count: updateResult.modifiedCount,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/** 
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
  try {
    const simpleAuth = verifyAuth(req, res, { authType: "Simple" });

    if (!simpleAuth.flag) {
      return res.status(401).json({ error: simpleAuth.cause });
    }

    const data = await categories.find({});

    const filter = data.map((v) => ({ type: v.type, color: v.color }));

    res.status(200).json({
      data: filter,
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
  try {
    if (!req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("amount") || !req.body.hasOwnProperty("type")) {
      return res.status(400).json({ error: "Missing attributes" });
    }

    let { username, amount, type } = req.body;
    const paramsUsername = req.params.username;

    username = username?.trim();
    type = type?.trim();

    if (!username || !amount || !type) {
      return res
        .status(400)
        .json({ error: "Empty attributes in the request body" });
    }

    if (isNaN(amount))
      return res.status(400).json({ error: "Amount is not a number" });

    if (username !== paramsUsername)
      return res.status(400).json({
        error:
          "Username passed in the request body is not equal to the one passed as a route parameter",
      });

    const userAuth = verifyAuth(req, res, {
      authType: "User",
      username: paramsUsername,
    });

    if (!userAuth.flag) {
      return res.status(401).json({ error: userAuth.cause });
    }

    // Check if user exists
    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ error: "User not found" });

    // Check if category type exists
    const category = await categories.findOne({ type });
    if (!category) return res.status(400).json({ error: "Category not found" });

    const newTransaction = await transactions.create({
      username,
      amount,
      type,
    });

    res.json({
      data: {
        username: newTransaction.username,
        amount: newTransaction.amount,
        type: newTransaction.type,
        date: newTransaction.date,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
  try {
    // Check if the user is an admin
    const adminAuth = isAdminUser(req, res);
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    const result = await transactions.aggregate([
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

    const data = result.map((v) => ({
      username: v.username,
      amount: v.amount,
      type: v.type,
      date: v.date,
      color: v.categories_info.color,
    }));

    return res.status(200).json({
      data,
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * - Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario/transactions` (user route)
  - Example: `/api/transactions/users/Mario` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username`
- Can be filtered by date and amount if the necessary query parameters are present and if the route is `/api/users/:username/transactions`
 */
export const getTransactionsByUser = async (req, res) => {
  try {
    const username = req.params.username;
    // Distinction between route accessed by Admins or Regular users for functions that can be called by both
    // and different behaviors and access rights
    if (req.url.indexOf("/transactions/users/") >= 0) {
      const adminAuth = isAdminUser(req, res);

      if (!adminAuth.flag) {
        return res.status(401).json({ error: adminAuth.cause });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      // no filtering for admin route as specified in API.md v2
      const result = await transactions.aggregate([
        { $match: { username: username } },
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

      const data = result.map((v) => ({
        username: v.username,
        type: v.type,
        amount: v.amount,
        date: v.date,
        color: v.categories_info.color,
      }));

      res.status(200).json({
        data: data,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    } else {
      //user route
      const userAuth = verifyAuth(req, res, {
        authType: "User",
        username: username,
      });

      if (!userAuth.flag) {
        return res.status(401).json({ error: userAuth.cause });
      }

      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ error: "User not found" });

      let query = transactions.find({ username });

      const { type } = req.query;

      if (type) {
        query = query.where("type").equals(type);
      }

      //amount filter
      try {
        const amountFilters = handleAmountFilterParams(req);
        query = query.where(amountFilters);
      } catch (error) {
        if (query._conditions.amount) {
          delete query._conditions.amount;
        }
      }

      //date filter
      try {
        const dateFilters = handleDateFilterParams(req);
        query = query.where(dateFilters);
      } catch (error) {
        if (query._conditions.date) {
          delete query._conditions.date;
        }
      }

      const resTransactions = await query;

      const result = await transactions.aggregate([
        { $match: { _id: { $in: resTransactions.map((t) => t._id) } } },
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

      const data = result.map((v) => ({
        username: v.username,
        type: v.type,
        amount: v.amount,
        date: v.date,
        color: v.categories_info.color,
      }));

      res.status(200).json({
        data: data,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const isAdminUser = (req, res) => {
  return verifyAuth(req, res, { authType: "Admin" });
};

/**
 * - The behavior defined below applies only for the specified route
- Request Parameters: A string equal to the `username` of the involved user, a string equal to the requested `category`
  - Example: `/api/users/Mario/transactions/category/food` (user route)
  - Example: `/api/transactions/users/Mario/category/food` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 400 error if the category passed as a route parameter does not represent a category in the database
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions/category/:category`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username/category/:category`
 */
export const getTransactionsByUserByCategory = async (req, res) => {
  try {
    const { username, category } = req.params;
    // Distinction between route accessed by Admins or Regular users for functions that can be called by both
    // and different behaviors and access rights
    if (req.url.indexOf("/transactions/users/") >= 0) {
      const adminAuth = isAdminUser(req, res);
      if (!adminAuth.flag) {
        return res.status(401).json({ error: adminAuth.cause });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const categoryObj = await categories.findOne({ type: category });
      if (!categoryObj) {
        return res.status(400).json({ error: "Category not found" });
      }

      const result = await transactions.find({
        username: username,
        type: category,
      });

      const data = result.map((v) => ({
        username: v.username,
        type: v.type,
        amount: v.amount,
        date: v.date,
        color: categoryObj.color,
      }));

      res.status(200).json({
        data: data,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    } else {
      //user route
      const userAuth = verifyAuth(req, res, {
        authType: "User",
        username: username,
      });

      if (!userAuth.flag) {
        return res.status(401).json({ error: userAuth.cause });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const categoryObj = await categories.findOne({ type: category });
      if (!categoryObj) {
        return res.status(400).json({ error: "Category not found" });
      }

      const result = await transactions.find({
        username: username,
        type: category,
      });

      const data = result.map((v) => ({
        username: v.username,
        type: v.type,
        amount: v.amount,
        date: v.date,
        color: categoryObj.color,
      }));

      res.status(200).json({
        data: data,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * - Request Parameters: A string equal to the `name` of the requested group
  - Example: `/api/groups/Family/transactions` (user route)
  - Example: `/api/transactions/groups/Family` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
- Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name`
 */
export const getTransactionsByGroup = async (req, res) => {
  try {
    const { name } = req.params;

    //admin route
    if (req.url.indexOf("/transactions/groups/") >= 0) {
      const adminAuth = isAdminUser(req, res);

      if (!adminAuth.flag) {
        return res.status(401).json({ error: adminAuth.cause });
      }

      const group = await Group.findOne({ name: name }).populate({
        path: "members",
        populate: {
          path: "_id",
          model: "User",
        },
      });

      if (!group) {
        return res.status(400).json({ error: "Group not found" });
      }

      const memberUsernames = group.members.map(
        (member) => member._id.username
      );

      const result = await transactions.aggregate([
        { $match: { username: { $in: memberUsernames } } },
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

      const data = result.map((v) => ({
        username: v.username,
        amount: v.amount,
        type: v.type,
        date: v.date,
        color: v.categories_info.color,
      }));

      return res.status(200).json({
        data: data,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    } else {
      //user route

      const group = await Group.findOne({ name: name }).populate({
        path: "members",
        populate: {
          path: "_id",
          model: "User",
        },
      });

      if (!group) {
        return res.status(400).json({ error: "Group not found" });
      }

      const groupEmails = group.members.map((m) => m.email);

      const groupAuth = verifyAuth(req, res, {
        authType: "Group",
        emails: groupEmails,
      });

      if (!groupAuth.flag) {
        return res.status(401).json({ error: groupAuth.cause });
      }

      const memberUsernames = group.members.map(
        (member) => member._id.username
      );

      const result = await transactions.aggregate([
        { $match: { username: { $in: memberUsernames } } },
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

      const data = result.map((v) => ({
        username: v.username,
        amount: v.amount,
        type: v.type,
        date: v.date,
        color: v.categories_info.color,
      }));

      return res.status(200).json({
        data: data,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * - Request Parameters: A string equal to the `name` of the requested group, a string equal to the requested `category`
  - Example: `/api/groups/Family/transactions/category/food` (user route)
  - Example: `/api/transactions/groups/Family/category/food` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
- Returns a 400 error if the category passed as a route parameter does not represent a category in the database
- Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions/category/:category`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name/category/:category`
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
  try {
    const { name, category } = req.params;

    //admin route
    if (req.url.indexOf("/transactions/groups/") >= 0) {
      const adminAuth = isAdminUser(req, res);

      if (!adminAuth.flag) {
        return res.status(401).json({ error: adminAuth.cause });
      }

      const group = await Group.findOne({ name: name }).populate({
        path: "members",
        populate: {
          path: "_id",
          model: "User",
        },
      });

      if (!group) {
        return res.status(400).json({ error: "Group not found" });
      }

      const categoryObj = await categories.findOne({ type: category });

      if (!categoryObj) {
        return res.status(400).json({ error: "Category not found" });
      }

      const memberUsernames = group.members.map(
        (member) => member._id.username
      );

      const result = await transactions.find({
        username: { $in: memberUsernames },
        type: category,
      });

      const data = result.map((v) => ({
        username: v.username,
        type: v.type,
        amount: v.amount,
        date: v.date,
        color: categoryObj.color,
      }));

      res.status(200).json({
        data: data,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    } else {
      //user route

      const group = await Group.findOne({ name: name }).populate({
        path: "members",
        populate: {
          path: "_id",
          model: "User",
        },
      });

      if (!group) {
        return res.status(400).json({ error: "Group not found" });
      }

      const groupEmails = group.members.map((m) => m.email);

      const groupAuth = verifyAuth(req, res, {
        authType: "Group",
        emails: groupEmails,
      });

      if (!groupAuth.flag) {
        return res.status(401).json({ error: groupAuth.cause });
      }

      const categoryObj = await categories.findOne({ type: category });

      if (!categoryObj) {
        return res.status(400).json({ error: "Category not found" });
      }

      const memberUsernames = group.members.map(
        (member) => member._id.username
      );

      const result = await transactions.find({
        username: { $in: memberUsernames },
        type: category,
      });

      const data = result.map((v) => ({
        username: v.username,
        type: v.type,
        amount: v.amount,
        date: v.date,
        color: categoryObj.color,
      }));

      res.status(200).json({
        data: data,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * - Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario/transactions`
- Request Body Content: The `_id` of the transaction to be deleted
  - Example: `{_id: "6hjkohgfc8nvu786"}`
- Response `data` Content: A string indicating successful deletion of the transaction
  - Example: `res.status(200).json({data: {message: "Transaction deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the `_id` in the request body is an empty string
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 400 error if the `_id` in the request body does not represent a transaction in the database
- Returns a 400 error if the `_id` in the request body represents a transaction made by a different user than the one in the route
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User)
 */
export const deleteTransaction = async (req, res) => {
  try {
    const { username } = req.params;

    const adminAuth = isAdminUser(req, res);

    if (!adminAuth.flag) {
      const userAuth = verifyAuth(req, res, {
        authType: "User",
        username: username,
      });

      if (!userAuth.flag)
        return res.status(401).json({ error: userAuth.cause });
    }
    const userExists = await User.findOne({ username: username });

    if (!userExists) return res.status(400).json({ error: "User not found" });

    if (!req.body.hasOwnProperty("_id")) {
      return res
        .status(400)
        .json({ error: "Request body does not contain Transaction _id" });
    }

    const _id = req.body._id.trim();

    if (!_id) {
      return res.status(400).json({ error: "Transaction _id cannot be empty" });
    }

    let transaction;
    try {
      transaction = await transactions.findById(_id);

      if (!transaction) {
        return res
          .status(400)
          .json({ error: `Transaction with _id: ${_id} not found` });
      }
    } catch (CastError) {
      return res
        .status(400)
        .json({ error: `Cast error: _id provided is not a valid ObjectId` });
    }

    if (transaction.username !== username)
      return res
        .status(400)
        .json({ error: "The transaction belongs to a different user" });

    await transactions.deleteOne({ _id: _id });

    res.locals.message = "Transaction deleted";
    return res.status(200).json({
      data: { message: res.locals.message },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * - Request Parameters: None
- Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Example: `{_ids: ["6hjkohgfc8nvu786"]}`
- Response `data` Content: A message confirming successful deletion
  - Example: `res.status(200).json({data: {message: "Transactions deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- In case any of the following errors apply then no transaction is deleted
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the ids in the array is an empty string
- Returns a 400 error if at least one of the ids in the array does not represent a transaction in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
export const deleteTransactions = async (req, res) => {
  try {
    const adminAuth = isAdminUser(req, res);

    if (!adminAuth.flag) {
      return res.status(401).json({ error: adminAuth.cause });
    }

    if (!req.body.hasOwnProperty("_ids")) {
      return res
        .status(400)
        .json({ error: "Request body does not contain Transaction _ids" });
    }

    let { _ids } = req.body;

    if (_ids.length === 0)
      return res.status(400).json({ error: "Array of _id is empty" });

    for (let i = 0; i < _ids.length; i++) {
      _ids[i] = _ids[i]?.trim();
      if (!_ids[i])
        return res
          .status(400)
          .json({ error: "Found empty string in array of ids" });
    }

    const transactionsToBeDeleted = await transactions.find({
      _id: { $in: _ids },
    });

    if (transactionsToBeDeleted.length < _ids.length) {
      return res.status(400).json({
        error: "Transaction _ids contains invalid transaction identifier",
      });
    }

    await transactions.deleteMany({ _id: { $in: _ids } });

    res.locals.message = "Transactions deleted";
    return res.status(200).json({
      data: { message: res.locals.message },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
