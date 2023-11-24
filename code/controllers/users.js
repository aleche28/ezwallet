import jwt from "jsonwebtoken";
import { Group, User } from "../models/User.js";
import { verifyAuth } from "./utils.js";
import { transactions } from "../models/model.js";
import * as EmailValidator from "email-validator";

/**
 * Return all the users (Access right -> Admin)
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - error 401 is return if user calling getUsers does not own Admin privileges
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
  try {
    const adminAuth = verifyAuth(req, res, {
      authType: "Admin",
    });

    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    const rows = await User.find();
    const users = rows.map((r) => ({
      username: r.username,
      email: r.email,
      role: r.role,
    }));

    res.status(200).json({
      data: users,
      refreshedTokenMessage: res.locals?.refreshedTokenMessage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
    - error 401 is returned if user calling getUser is asking for another user's personal data 
 */
export const getUser = async (req, res) => {
  try {
    // validation
    const { username } = req.params;

    // checking if user is asking for its personal information or, if not, if it owns Admin privileges
    const userAuth = verifyAuth(req, res, {
      authType: "User",
      username: username,
    });

    if (!userAuth.flag) {
      const adminAuth = verifyAuth(req, res, {
        authType: "Admin",
      });
      if (!adminAuth.flag)
        return res.status(401).json({ error: adminAuth.cause });
    }

    const row = await User.findOne({ username: username });
    if (!row) return res.status(400).json({ error: "User not found" });

    const user = { username: row.username, email: row.email, role: row.role };
    res.status(200).json({
      data: user,
      refreshedTokenMessage: res.locals?.refreshedTokenMessage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
  try {
    const simpleAuth = verifyAuth(req, res, {
      authType: "Simple",
    });
    if (!simpleAuth.flag)
      return res.status(401).json({ error: simpleAuth.cause });

    let { name, memberEmails } = req.body;

    // validation
    if (!name || !memberEmails)
      return res.status(400).json({
        error: "Missing name or memberEmails in body content",
      });

    if (!(name = name.trim()))
      return res.status(400).json({
        error: "Invalid name",
      });

    if (!memberEmails.length)
      return res.status(400).json({ error: "memberEmails is empty" });

    // check if group with same name already exists
    const group = await Group.findOne({ name });
    if (group)
      return res.status(400).json({ error: `Group ${name} already exists` });

    const cookie = req.cookies;
    const decodedAccessToken = jwt.verify(
      cookie.accessToken,
      process.env.ACCESS_KEY
    );

    const reqEmail = decodedAccessToken.email;
    if (!reqEmail || !EmailValidator.validate(reqEmail))
      return res.status(400).json({ error: "User's email is not valid" });

    const reqUser = await User.findOne({ email: reqEmail });
    if (!reqUser)
      return res
        .status(400)
        .json({ error: "User making the request does not exist" });

    // check if the user calling the API is already in a group
    const reqUserGroup = await Group.findOne({ "members.email": reqEmail });
    if (reqUserGroup)
      return res
        .status(400)
        .json({ error: "User making the request is already in a group" });

    // remove user's email from list if present (it will be added later on)
    memberEmails = memberEmails.filter((e) => e !== reqEmail);

    const alreadyInGroup = [];
    const membersNotFound = [];
    const groupMembers = [];

    for (let email of memberEmails) {
      // validation
      email = email?.trim();
      if (!email)
        return res.status(400).json({ error: "Empty email in array" });

      if (!EmailValidator.validate(email))
        return res
          .status(400)
          .json({ error: "Found invalid email in the array" });

      const user = await User.findOne({ email: email });
      if (!user) {
        membersNotFound.push(email);
        continue;
      }

      const userGroup = await Group.findOne({ "members.email": email });
      if (userGroup) {
        alreadyInGroup.push(email);
        continue;
      }

      groupMembers.push({ email: email, user: user._id });
    }

    if (groupMembers.length == 0)
      return res
        .status(400)
        .json({ error: "No user can be added to the group" });

    // add the user's email to the list
    groupMembers.push({ email: reqEmail, user: reqUser._id });

    await Group.create({ name, members: groupMembers });

    return res.status(200).json({
      data: {
        group: {
          name,
          members: groupMembers.map((m) => ({ email: m.email })),
        },
        alreadyInGroup,
        membersNotFound,
      },
      refreshedTokenMessage: res.locals?.refreshedTokenMessage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
  try {
    const adminAuth = verifyAuth(req, res, {
      authType: "Admin",
    });
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    let rows = await Group.find();
    let data = rows.map((v) =>
      Object.assign(
        {},
        {
          name: v.name,
          members: v.members.map((m) => ({ email: m.email })),
        }
      )
    );
    res.status(200).json({
      data: data,
      refreshedTokenMessage: res.locals?.refreshedTokenMessage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
  try {
    let { name } = req.params;

    name = name?.trim();

    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.flag) {
      const simpleAuth = verifyAuth(req, res, {
        authType: "Simple",
      });
      if (!simpleAuth.flag)
        return res.status(401).json({ error: simpleAuth.cause });
    }

    // check if the group exists
    const row = await Group.findOne({ name: name });
    if (!row)
      return res.status(400).json({ error: `Group ${name} does not exist` });

    // if the user is not an admin, check that he belongs to the requested group
    if (!adminAuth.flag) {
      const groupAuth = verifyAuth(req, res, {
        authType: "Group",
        emails: row.members.map((r) => r.email),
      });
      if (!groupAuth.flag)
        return res.status(401).json({ error: groupAuth.cause });
    }

    const group = {
      name: row.name,
      members: row.members.map((m) => ({ email: m.email })),
    };
    return res.status(200).json({
      data: { group },
      refreshedTokenMessage: res.locals?.refreshedTokenMessage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
  try {
    let { name } = req.params;
    const { emails } = req.body;

    // validation
    name = name?.trim();

    if (!emails)
      return res.status(400).json({
        error: "Missing 'emails' array in body content",
      });

    if (!emails.length)
      return res.status(400).json({ error: "Array 'emails' is empty" });

    // check if the group exists
    const group = await Group.findOne({ name: name });
    if (!group)
      return res.status(400).json({ error: `Group ${name} does not exist` });

    // check authorization
    const pathname = req.url;
    if (pathname === `/groups/${name}/add`) {
      // API call for normal user: check if he belongs to the group
      const groupAuth = verifyAuth(req, res, {
        authType: "Group",
        emails: group.members.map((m) => m.email),
      });
      if (!groupAuth.flag)
        return res.status(401).json({ error: groupAuth.cause });
    } else if (pathname === `/groups/${name}/insert`) {
      // API call for admin: check if the user who called the API is really an admin
      const adminAuth = verifyAuth(req, res, { authType: "Admin" });
      if (!adminAuth.flag)
        return res.status(401).json({ error: adminAuth.cause });
    } else {
      throw Error("Unknown pathname");
    }

    const alreadyInGroup = [];
    const membersNotFound = [];
    const groupMembers = [...group.members];

    for (let email of emails) {
      // validation
      email = email?.trim();
      if (!email)
        return res.status(400).json({ error: "Empty email in array" });

      if (!EmailValidator.validate(email))
        return res.status(400).json({ error: "Found invalid email in array" });

      const user = await User.findOne({ email: email });
      if (!user) {
        membersNotFound.push(email);
        continue;
      }
      const userGroup = await Group.findOne({ "members.email": email });
      if (userGroup) {
        if (userGroup.name !== name)
          alreadyInGroup.push(email);
        continue;
      }
      groupMembers.push({ email: email, user: user._id });
    }

    if (groupMembers.length == group.members.length)
      return res
        .status(400)
        .json({ error: "No user can be added to the group" });

    const result = await Group.updateOne(
      { name: name },
      { $set: { members: groupMembers } }
    );
    if (result.modifiedCount == 1) {
      return res.status(200).json({
        data: {
          group: {
            name: name,
            members: groupMembers.map((m) => ({ email: m.email})),
          },
          alreadyInGroup,
          membersNotFound,
        },
        refreshedTokenMessage: res.locals?.refreshedTokenMessage,
      });
    } else {
      throw new Error("Group not updated: unexpected error in updateOne");
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove members from a group
  - Request Body Content: An array of strings named `memberEmails` that contains the emails of the members to remove from the group
  - Response `data` Content:   
    An object having  
      - an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),  
      - an array that lists the `notInGroup` members (members whose email is not in the group),  
      - an array that lists the `membersNotFound` (members whose email does not appear in the system)  
  - Optional behavior:
      - error 401 is returned if the group does not exist
      - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
  try {
    const { emails } = req.body; // emails of users to remove from the group
    let { name } = req.params; // group name

    // validation
    name = name?.trim();

    if (!emails)
      return res.status(400).json({
        error: "Missing 'emails' array in body content",
      });

    if (!emails.length)
      return res.status(400).json({ error: "Array 'emails' is empty" });

    // check if the group exists
    const group = await Group.findOne({ name });
    if (!group)
      return res.status(400).json({ error: `Group ${name} does not exist` });

    // check authorization
    const pathname = req.url;
    if (pathname === `/groups/${name}/remove`) {
      // API call for normal user: check if he belongs to the group
      const groupAuth = verifyAuth(req, res, {
        authType: "Group",
        emails: group.members.map((m) => m.email),
      });
      if (!groupAuth.flag)
        return res.status(401).json({ error: groupAuth.cause });
    } else if (pathname === `/groups/${name}/pull`) {
      // API call for admin: check if the user who called the API is really an admin
      const adminAuth = verifyAuth(req, res, { authType: "Admin" });
      if (!adminAuth.flag)
        return res.status(401).json({ error: adminAuth.cause });
    } else {
      throw Error("Unknown pathname");
    }

    if (group.members.length === 1)
      return res
        .status(400)
        .json({ error: "Only one member remaining in the group" });

    const firstMember = group.members[0]; // save first member for future use
    const notInGroup = [];
    const membersNotFound = [];

    for (let email of emails) {
      // validation
      email = email?.trim();
      if (!email)
        return res.status(400).json({ error: "Empty email in array" });

      if (!EmailValidator.validate(email))
        return res.status(400).json({ error: "Found invalid email in array" });

      const user = await User.findOne({ email: email });
      if (!user) {
        membersNotFound.push(email);
        continue;
      }

      const isInGroup = group.members.map((m) => m.email).includes(email);
      if (!isInGroup) notInGroup.push(email);
      else group.members = group.members.filter((m) => m.email !== email);
    }

    if (membersNotFound.length + notInGroup.length === emails.length) {
      res.status(400).json({ error: "No user can be removed from the group" });
      return;
    }

    if (group.members.length == 0) group.members.push(firstMember); // the first original member should stay in the group

    const result = await Group.updateOne(
      { name: group.name },
      { $set: { members: group.members } }
    );
    if (result.modifiedCount == 1) {
      return res.status(200).json({
        data: {
          group: {
            name: group.name,
            members: group.members.map((m) => ({ email: m.email })),
          },
          notInGroup,
          membersNotFound,
        },
        refreshedTokenMessage: res.locals?.refreshedTokenMessage,
      });
    } else {
      throw new Error("Group not updated: unexpected error in updateOne");
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
  try {
    const adminAuth = verifyAuth(req, res, {
      authType: "Admin",
    });
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    // validation
    let { email } = req.body;
    // validation
    email = email?.trim();

    if (!email)
      return res
        .status(400)
        .json({ error: "Undefined or empty 'email' in body content" });

    if (!EmailValidator.validate(email))
      return res.status(400).json({ error: "Invalid 'email' in body content" });

    const user = await User.findOne({ email: email });
    if (!user)
      return res
        .status(400)
        .json({ error: `User with email: ${email} does not exist` });

    // check that the user to be deleted is not an admin
    // this case also covers the one where the user is trying to delete itself
    if (user.role === "Admin")
      return res.status(400).json({ error: "Can't delete an admin account" });

    await User.deleteOne({ email: email });

    // delete all transactions of the user
    const { deletedCount: deletedTransactions } = await transactions.deleteMany(
      { username: user.username }
    );

    // remove user from the group (if user was in a group)
    const group = await Group.findOne({ "members.email": email });
    if (!group)
      return res.status(200).json({
        data: {
          deletedTransactions,
          deletedFromGroup: false,
        },
        refreshedTokenMessage: res.locals?.refreshedTokenMessage,
      });

    if (group.members.length == 1) {
      // last user in the group: delete the group
      await Group.deleteOne({ name: group.name });
      return res.status(200).json({
        data: {
          deletedTransactions,
          deletedFromGroup: true,
        },
        refreshedTokenMessage: res.locals?.refreshedTokenMessage,
      });
    } else {
      const { modifiedCount } = await Group.updateOne(
        { name: group.name },
        {
          name: group.name,
          members: group.members.filter((m) => m.email !== email),
        }
      );
      return res.status(200).json({
        data: {
          deletedTransactions,
          deletedFromGroup: modifiedCount > 0,
        },
        refreshedTokenMessage: res.locals?.refreshedTokenMessage,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
  try {
    const adminAuth = verifyAuth(req, res, {
      authType: "Admin",
    });
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    // validation
    let { name } = req.body;

    // validation
    name = name?.trim();
    if (!name)
      return res.status(400).json({ error: "Invalid name in body content" });

    const result = await Group.deleteOne({ name });
    if (result.deletedCount === 0)
      res.status(400).json({ error: `Group ${name} does not exist` });
    else {
      res.status(200).json({
        data: {
          message: "Group deleted successfully",
        },
        refreshedTokenMessage: res.locals?.refreshedTokenMessage,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
