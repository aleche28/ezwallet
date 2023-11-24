import jwt from "jsonwebtoken";


/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {
  const { date, from, upTo } = req.query;

  const date_from = from + "T00:00:00.000Z";
  const date_to = upTo + "T23:59:59.999Z";
  const date_start = date + "T00:00:00.000Z";
  const date_end = date + "T23:59:59.999Z";

  //check if date_js is in the format dateFormat
  //regex to match format of date with dateFormat
  const regex = new RegExp(
    "^(19|20)\\d\\d[-](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])$"
  );

  if (date && (from || upTo)) {
    //invalid combination of parameters
    throw Error("Invalid combination");
  }
  if (!date && !from && !upTo) {
    //empty request
    return { date: { $exists: true } }; //match all dates?
  }

  if (date) {
    if (!regex.test(date)) {
      throw Error("Invalid date format");
    }
    // return in object the query for getting the transactions in that specific date
    return { date: { $gte: new Date(date_start), $lte: new Date(date_end)} };
  }

  if (!date && from && !upTo) {
    // return object to query dates greater than
    if (!regex.test(from)) {
      throw Error('Invalid " from " date format');
    }
    return { date: { $gte: new Date(date_from)} };
  }

  if (!date && !from && upTo) {
    if (!regex.test(upTo)) {
      throw Error('Invalid "upTo" date format');
    }
    return { date: { $lte: new Date(date_to) } };
  }

  if (!date && from && upTo) {
    if (!regex.test(from)) {
      throw Error('Invalid " from " date format');
    }
    if (!regex.test(upTo)) {
      throw Error('Invalid "upTo" date format');
    }
    return { date: { $gte: new Date(date_from), $lte: new Date(date_to) } };
  }
};






/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */

/* use cases:
 *   const simpleAuth = verifyAuth(req, res, {authType: "Simple"}) -> checks if user is authenticated
 *   const userAuth = verifyAuth(req, res, {authType: "User", username: req.params.username}) -> check permissions based on user's username attribute
 *   const adminAuth = verifyAuth(req, res, {authType: "Admin"}) -> check if user owns Admin privileges
 *   const groupAuth = verifyAuth(req, res, {authType: "Group", emails: <array of emails>}) -> check if user belongs to a group and is so authorized to perform group-related functions
 */
export const verifyAuth = (req, res, info) => {
  // authType = Simple checks
  const cookie = req.cookies;

  if (!cookie.accessToken) {
    return { flag: false, cause: "accessToken is missing" };
  }

  if (!cookie.refreshToken) {
    return { flag: false, cause: "refreshToken is missing" };
  }

  try {
    const decodedAccessToken = jwt.verify(
      cookie.accessToken,
      process.env.ACCESS_KEY
    );
    const decodedRefreshToken = jwt.verify(
      cookie.refreshToken,
      process.env.ACCESS_KEY
    );
    if (
      !decodedAccessToken.username ||
      !decodedAccessToken.email ||
      !decodedAccessToken.role
    ) {
      return { flag: false, cause: "Token is missing information" };
    }
    if (
      !decodedRefreshToken.username ||
      !decodedRefreshToken.email ||
      !decodedRefreshToken.role
    ) {
      return { flag: false, cause: "Token is missing information" };
    }
    if (
      decodedAccessToken.username !== decodedRefreshToken.username ||
      decodedAccessToken.email !== decodedRefreshToken.email ||
      decodedAccessToken.role !== decodedRefreshToken.role
    ) {
      return { flag: false, cause: "Mismatched users" };
    }

    // Simple verification only checks if user is authenticated and cookies correctness
    // (i.e. only previous checks)
    if (info.authType === "Simple") {

      return { flag: true, cause: "Authorized" };

    } else if (info.authType === "User") {

      if (
        info.username !== decodedAccessToken.username ||
        info.username !== decodedRefreshToken.username
      ) {
        return { flag: false, cause: "Wrong User" };
      }

      return { flag: true, cause: "Correct User" };

    } else if (info.authType === "Admin") {

      if (
        decodedAccessToken.role !== "Admin" ||
        decodedRefreshToken.role !== "Admin"
      ) {
        return { flag: false, cause: "User is not Admin" };
      }

      return { flag: true, cause: "User is Admin" };

    } else if (info.authType === "Group") {

      for (const thisEmail of info.emails) {
        if (
          decodedAccessToken.email === thisEmail &&
          decodedRefreshToken.email === thisEmail
        ) {
          return { flag: true, cause: "User belongs to Group" };
        }
      }

      return { flag: false, cause: "User does not belong to Group" };
    }
  } catch (err) {

    if (err.name === "TokenExpiredError") {
      try {

        const refreshToken = jwt.verify(
          cookie.refreshToken,
          process.env.ACCESS_KEY
        );

        const newAccessToken = jwt.sign(
          {
            username: refreshToken.username,
            email: refreshToken.email,
            id: refreshToken.id,
            role: refreshToken.role,
          },
          process.env.ACCESS_KEY,
          { expiresIn: "1h" }
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          path: "/api",
          maxAge: 60 * 60 * 1000,
          sameSite: "none",
          secure: true,
        });

        res.locals.refreshedTokenMessage =
          "Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls";

        const newDecodedAccessToken = jwt.verify(
          newAccessToken,
          process.env.ACCESS_KEY
        );
        
        // Simple verification only checks if user is authenticated and cookies correctness
        // (i.e. only previous checks)
        if (info.authType === "Simple") {
          return { flag: true, cause: "Authorized" };

        } else if (info.authType === "User") {

          if (
            info.username !== newDecodedAccessToken.username ||
            info.username !== refreshToken.username
          ) {
            return { flag: false, cause: "Wrong User" };
          }

          return { flag: true, cause: "Correct User" };

        } else if (info.authType === "Admin") {

          if (
            newDecodedAccessToken.role !== "Admin" ||
            refreshToken.role !== "Admin"
          ) {
            return { flag: false, cause: "User is not Admin" };
          }

          return { flag: true, cause: "User is Admin" };

        } else if (info.authType === "Group") {

          for (const thisEmail of info.emails) {
            if (
              newDecodedAccessToken.email === thisEmail &&
              refreshToken.email === thisEmail
            ) {
              return { flag: true, cause: "User belongs to Group" };
            }
          }

          return { flag: true, cause: "User does not belong to Group" };
        }

      } catch (err) {

        if (err.name === "TokenExpiredError") {
          return { flag: false, cause: "Perform login again" };

        } else {
          return { flag: false, cause: err.name };
        }
      }
    } else {
      return { flag: false, cause: err.name };
    }
  }
};




/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {
  const { min, max } = req.query;
  
  if (!min && !max) {
    //empty request
    return { amount: { $exists: true } };
  }

  if (min && !max) {
    if (isNaN(min)) {
      throw Error("Amount is not a number");
    }
    // return object to query dates greater than
    return { amount: { $gte: min } };
  }

  if (!min && max) {
    if (isNaN(max)) {
      throw Error("Amount is not a number");
    }
    return { amount: { $lte: max } };
  }

  if (min && max) {
    if (isNaN(min) || isNaN(max)) {
      throw Error("Amount is not a number");
    }
    if (Number(min) > Number(max)) {
      return { amount: { $exists: true } };
    } else {
      return { amount: { $gte: min, $lte: max } };
    }
  }
};
