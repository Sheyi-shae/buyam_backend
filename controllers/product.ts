
// create a new product

import { NextFunction, Request, Response } from "express";
import { CustomError } from "../middleware/error-middleware.js";
import slugify from "../libs/slugify.js";
import db from "../libs/db.js";
import requestIp from 'request-ip';


export const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const {  
        name,       
        price,      
        avatar,   
        condition,
        negotiable,
      state,
        sellerPublicId,
        city,
        description,
        sellerId,
        categoryId,
        subCategoryId } = req.body;

    try {
        //slugify name

        const slug = slugify(name, { lower: true, strict: true });
        const userId = req.user?.id;
          if (!userId) {
        const error = new Error('User not authenticated') as CustomError;
        error.statusCode = 401;
        throw error;
        }

        const urlSlug = `${slug}-${userId}`
     

        // check if product exists for same user
        const existingProduct = await db.product.findFirst({
        where: { slug:urlSlug, sellerId: userId }
        });
        if (existingProduct) {
        const error = new Error('Item already exists in you catalog') as CustomError;
        error.statusCode = 400;
        throw error;
        }
        //check if subcategory exists
        const subCategory = await db.subCategory.findUnique({
            where: { id: Number(subCategoryId) }
        });
        if (!subCategory) {
            const error = new Error('Subcategory not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        
        // create product
        const product = await db.product.create({
          data: {
            name,
            price: parseFloat(price),
            sellerPublicId,
            description,
            slug: urlSlug,
            avatar,
            sellerId,
            categoryId: Number(categoryId),
            subCategoryId: Number(subCategoryId),
            condition, negotiable: Boolean(negotiable),
            state, city
          } 
                });
         return res.status(201).json({
            success: true,
            message: 'product posted successfully',
            data:product
        });
    } catch (error) {
        next(error);
    }
}

// get all products
export const getAllProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const products = await db.product.findMany({
            include: {
                seller: true,
                category: true,
                subCategory: true
            }
        });
        if (!products) {
            const error = new Error('No products found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({
            success: true,
            message: 'products fetched successfully',
            data: products
        });
    } catch (error) {
        next(error);
    }
}
// get product by slug
export const getProductBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { slug } = req.params;
    try {
        const product = await db.product.findUnique({
            where: { slug },
            include: {
                seller: {
                    include: {
                        reviews: true,
                        
                    }
                },
                category: true,
              subCategory: true,
              likes: true,
              reviews: true,
             
                
            }
        });
        if (!product) {
            const error = new Error('Product not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({
            success: true,
            message: 'product fetched successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
}
//delete product by slug
export const deleteProductBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
  const { slug } = req.params;
  const userId=req.user?.id
    try {
        const product = await db.product.findUnique({
            where: { slug }
        });
        if (!product) {
            const error = new Error('Product not found') as CustomError;
            error.statusCode = 404;
            throw error;
      }
      if (product.sellerId !== userId) {
         const error = new Error('Action not permitted') as CustomError;
            error.statusCode = 403;
            throw error;
        
      }
        await db.product.delete({
            where: { slug }
        });
        return res.status(200).json({
            success: true,
            message: 'product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

// update product by slug
export const updateProductBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { slug } = req.params;
    try {
         const {  
        name,       
        price,      
        avatar,    
        tags,     
        description,
        sellerId,
        categoryId,
            subCategoryId } = req.body;
        //slugify name
        const newSlug = slugify(name, { lower: true, strict: true });
        //check if product exists
        const product = await db.product.findUnique({
            where: { slug }
        });
        if (!product) {
            const error = new Error('Product not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        //check if new slug already exists
        const existingProduct = await db.product.findUnique({
            where: { slug: newSlug }
        });
        if (existingProduct) {
            const error = new Error('Item already exists') as CustomError;
            error.statusCode = 400;
            throw error;
        }
        // update product
        const updatedProduct = await db.product.update({
            where: { slug },
            data: { name, price, avatar,  description, sellerId, categoryId, subCategoryId, slug: newSlug }
        });
        return res.status(200).json({
            success: true,
            message: 'product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        next(error);
    }
}


export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search = "",
      state,
      city,
      page = "1",
      limit = "10",
      suggestions,
    } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};

    // 1. Apply search only if search string exists
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // 2. Apply state filter (AND)
    if (state) {
      where.state = { contains: state as string, mode: "insensitive" };
    }

    // 3. Apply city filter (AND)
    if (city) {
      where.city = { contains: city as string, mode: "insensitive" };
    }

    // 4. Suggestions mode (top 5 name matches)
    if (suggestions === "true") {
  const results = await db.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug:true,
      subCategory: {
        select: { name: true,slug:true },
      },
    },
    take: 5,
    orderBy: { name: "asc" },
  });

  // Transform results
  const formatted = results.map((item) => ({
    id: item.id,
    slug:item.slug,
    name: item.name,
    subcategoryName: item.subCategory.name,
    subcategorySlug:item.subCategory.slug,
  }));

  return res.status(200).json({
    success: true,
    data: formatted,
  });
}


    // 5. Full paginated search
    const total = await db.product.count({ where });

    const products = await db.product.findMany({
      where,
      include: { subCategory: true, category: true ,likes:true },
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};


// Fetch products inside a subcategory with search, suggestions, pagination
export const getProductsBySubCategorySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const {
      search = "",
      suggestions,
      manual,
      page = "1",
      limit = "10",
      state,
      city,
    } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // 1. Ensure subcategory exists
    const subCategory = await db.subCategory.findUnique({
      where: { slug },
    });

    if (!subCategory) {
      const error = new Error("Subcategory not found") as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // 2. Build dynamic WHERE clause
    const where: any = {
      subCategoryId: subCategory.id,
    };

    // --- Suggestions mode (FAST, NAME ONLY) ---
    if (suggestions === "true") {
      if (search) {
        where.name = { contains: search as string, mode: "insensitive" };
      }

      const result = await db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          subCategory: { select: { name: true } },
        },
        take: 5,
        orderBy: { name: "asc" },
      });

      return res.json({
        success: true,
        data: result,
      });
    }

    // // --- Full Manual Search (deep search: name + description) ---
    // if (manual === "true" && search) {
    //   where.OR = [
    //     { name: { contains: search as string, mode: "insensitive" } },
    //     { description: { contains: search as string, mode: "insensitive" } },
    //   ];
    // }

    // --- Normal shallow search (only name) ---
    if (search) {
      where.name = { contains: search as string, mode: "insensitive" };
    }

    // Optional filters (only when user explicitly selects them)
    if (state) {
      where.state = { contains: state as string, mode: "insensitive" };
    }
    if (city) {
      where.city = { contains: city as string, mode: "insensitive" };
    }

    // 3. Pagination + Full fetch
    const total = await db.product.count({ where });

    const products = await db.product.findMany({
      where,
      include: {
        subCategory: true,
        category: true,
        seller: true,
        likes: true,
      },
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
    });

    return res.json({
      success: true,
      message: "Products fetched successfully",
      data: products,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};


// increment product views


export const trackProductView = async (req: Request, res: Response,next:NextFunction) => {
  const { slug } = req.params;
  const ip = requestIp.getClientIp(req) || "unknown";
  const userId = req?.user?.id|| null;

  try {
    // Check product exists
    const product = await db.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if this IP/user has viewed in the last 24 hours
    const existingView = await db.productView.findFirst({
      where: {
        productId:product.id,
        OR: [
          { ipAddress: ip },
          { userId }
        ],
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingView) return res.status(204).end();

    // Create view record
    await db.productView.create({
      data: {
        productId: product.id,
        ipAddress: ip,
        userId,
      },
    });

    // Increment counter
    await db.product.update({
      where: { id: product.id },
      data: { views: { increment: 1 } },
    });

    return res.status(204).end();
  } catch (error) {
    next(error)
    console.error(error)
  }
};


// mark product as sold
export const updateProductStatusBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
  const { slug } = req.params;
  const userId = req.user?.id
  console.log("user id", userId)
    try {
      const { isSold } = req.body;
      console.log("is sold?", isSold, )
        //check if product exists
        const product = await db.product.findUnique({
            where: { slug }
        });
        if (!product) {
            const error = new Error('Product not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
      //check if logged in user is the owner of the product
      
      if (product.sellerId !== userId) {
         const error = new Error('Action not permitted') as CustomError;
            error.statusCode = 403;
            throw error;
        
      }
       
        // update product
        const updatedProduct = await db.product.update({
            where: { slug },
            data: {isSold }
        });
      console.log("new item status", updatedProduct)
        return res.status(200).json({
            success: true,
            message: `Item successfully marked  ${isSold ? 'sold' : 'active'}`,
            data: updatedProduct
        });
    } catch (error) {
        next(error);
    }
}

