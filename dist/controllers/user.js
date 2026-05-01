import db from "../libs/db.js";
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await db.user.findMany({
            select: { id: true, name: true, email: true, avatar: true },
        });
        res.json({ ok: true, users });
    }
    catch (error) {
        next(error);
    }
};
// GET /users/profile/:publicId
export const getUserProfileByPublicId = async (req, res, next) => {
    try {
        const { publicId } = req.params;
        if (!publicId) {
            return next({
                statusCode: 400,
                message: "Public ID is required",
            });
        }
        const user = await db.user.findUnique({
            where: { publicId },
            select: {
                id: true,
                name: true,
                email: true,
                storeName: true,
                storeDescription: true,
                verifiedSeller: true,
                avatar: true,
                publicId: true,
                createdAt: true,
                updatedAt: true,
                // User products
                products: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        category: true,
                        subCategory: true,
                        likes: true,
                        seller: {
                            select: { name: true },
                        },
                    },
                },
                // User reviews
                reviews: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        user: {
                            select: {
                                name: true,
                                avatar: true,
                            },
                        },
                        replies: {
                            orderBy: { createdAt: "asc" },
                        },
                        likes: true,
                    },
                },
            },
        });
        if (!user) {
            return next({
                statusCode: 404,
                message: "User not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
//get logged in user profile details
export const getLoggedInUserDetails = async (req, res, next) => {
    const userId = req.user?.id;
    try {
        // check if user is logged in
        if (!userId) {
            const error = new Error('User not logged in');
            error.statusCode = 400;
            throw error;
        }
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                products: {
                    include: {
                        category: true,
                        conversation: true,
                        subCategory: true,
                        likes: true,
                        seller: {
                            select: { name: true },
                        },
                    },
                },
                reviews: {
                    include: {
                        likes: true,
                        replies: true,
                    }
                },
                conversationsAsBuyer: true,
                conversationsAsSeller: true,
                likedProducts: true,
                messages: true,
            },
        });
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
// update user profile
// export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
//   const userId = req.user?.sub;
//   const { name, phone ,storeDescription, storeName, address} = req.body;
//   try {
//     // check if user is logged in
//     if (!userId) {
//       const error = new Error('User not logged in') as CustomError;
//             error.statusCode = 400;
//             throw error;
//     }
//     const user = await db.user.findUnique({
//       where: { id: userId },
//     });
//     if (!user) {
//      const error = new Error('User not found') as CustomError;
//             error.statusCode = 404;
//             throw error;
//     }
//     const updatedUser = await db.user.update({
//       where: { id: userId },
//       data: { name, phone ,storeDescription, storeName, address},
//     });
//     return res.status(200).json({
//       success: true,
//       message: "User profile updated successfully",
//       data: updatedUser,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// update user phone
export const updateUserPhone = async (req, res, next) => {
    const userId = req.user?.id;
    const { phone } = req.body;
    try {
        // check if user is logged in
        if (!userId) {
            const error = new Error('User not logged in');
            error.statusCode = 400;
            throw error;
        }
        const user = await db.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { phone },
        });
        return res.status(200).json({
            success: true,
            message: "User phone updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
};
// update user store
export const updateUserStore = async (req, res, next) => {
    const userId = req.user?.id;
    const { storeName, storeDescription } = req.body;
    console.log(storeName, storeDescription);
    try {
        // check if user is logged in
        if (!userId) {
            const error = new Error('User not logged in');
            error.statusCode = 400;
            throw error;
        }
        const user = await db.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        //check if user is verified seller
        if (!user.verifiedSeller) {
            const error = new Error('User is not a verified seller');
            error.statusCode = 400;
            throw error;
        }
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { storeName, storeDescription },
        });
        return res.status(200).json({
            success: true,
            message: "User store updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
};
// fetch all verified sellers
export const getVerifiedSellers = async (req, res, next) => {
    try {
        const sellers = await db.user.findMany({
            where: {
                verifiedSeller: true,
            },
            select: {
                id: true,
                reviews: true,
                name: true,
                email: true,
                avatar: true,
                storeName: true,
                storeDescription: true,
                lastSeen: true,
                verifiedSeller: true,
                publicId: true,
                createdAt: true,
                products: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        });
        res.json({
            success: true,
            data: sellers
        });
    }
    catch (error) {
        next(error);
    }
};
