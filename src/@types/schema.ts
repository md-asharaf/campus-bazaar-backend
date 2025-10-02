import z from "zod";

// Enums
export const ADMIN_ROLE = z.enum(["SUPER", "SUB"]);
export const VERIFICATION_STATUS = z.enum(["PENDING", "VERIFIED", "REJECTED"]);
export const IMAGE_STATUS = z.enum(["ACTIVE", "INACTIVE"]);

export type AdminRole = z.infer<typeof ADMIN_ROLE>;
export type VerificationStatus = z.infer<typeof VERIFICATION_STATUS>;
export type ImageStatus = z.infer<typeof IMAGE_STATUS>;
export const UserCreateSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1, "Name is required"),
    avatar: z.string().url().optional(),
    registrationNo: z.string().min(1, "Registration number is required"),
    branch: z.string().min(1, "Branch is required"),
    year: z.number().min(1, "Year is required").max(4),
    bio: z.string().min(1, "Bio is required").optional(),
    phone: z.string().min(1, "Phone number is required").optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial().omit({
    email: true,
    registrationNo: true,
});

export const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().max(255).nullable(),
    isVerified: z.boolean().default(false),
    isActive: z.boolean().default(true),
    bio: z.string().max(255).nullable(),
    phone: z.string().nullable(),
    registrationNo: z.string(),
    branch: z.string(),
    year: z.number().int().min(1).max(4),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const AdminCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    role: ADMIN_ROLE,
});

export const AdminSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: ADMIN_ROLE,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const VerificationSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    imageId: z.string(),
    status: VERIFICATION_STATUS,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Verification = z.infer<typeof VerificationSchema>;

export const ImageSchema = z.object({
    id: z.string().uuid(),
    url: z.string().url(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Item Schemas
export const ItemCreateSchema = z.object({
    title: z.string().min(1, "Title is required"),
    price: z.number().positive("Price must be positive"),
    sellerId: z.string().uuid(),
    categoryId: z.string().uuid().optional(),
});

export const ItemUpdateSchema = ItemCreateSchema.partial().omit({
    sellerId: true,
});

export const ItemSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    price: z.number(),
    sellerId: z.string(),
    isVerified: z.boolean().default(false),
    isSold: z.boolean().default(false),
    categoryId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Category Schemas
export const CategoryCreateSchema = z.object({
    name: z.string().min(1, "Category name is required"),
    imageId: z.string().uuid().optional(),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export const CategorySchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    imageId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Wishlist Schemas
export const WishlistCreateSchema = z.object({
    userId: z.string().uuid(),
    itemId: z.string().uuid(),
});

export const WishlistSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    itemId: z.string(),
    createdAt: z.date(),
});

// Feedback Schemas
export const FeedbackCreateSchema = z.object({
    content: z.string().min(1, "Feedback content is required"),
    rating: z.number().int().min(1).max(5),
    userId: z.string().uuid(),
});

export const FeedbackUpdateSchema = FeedbackCreateSchema.partial().omit({
    userId: true,
});

export const FeedbackSchema = z.object({
    id: z.string().uuid(),
    content: z.string(),
    rating: z.number().int(),
    userId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Message Schemas
export const MessageCreateSchema = z.object({
    content: z.string().min(1, "Message content is required"),
    senderId: z.string().uuid(),
    chatId: z.string().uuid(),
});

export const MessageSchema = z.object({
    id: z.string().uuid(),
    content: z.string(),
    senderId: z.string(),
    chatId: z.string(),
    deliveredAt: z.date().nullable(),
    readAt: z.date().nullable(),
    sentAt: z.date(),
});

// Media Schemas
export const MediaCreateSchema = z.object({
    url: z.string().url(),
    messageId: z.string().uuid(),
});

export const MediaSchema = z.object({
    id: z.string().uuid(),
    url: z.string(),
    messageId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Chat Schemas
export const ChatCreateSchema = z.object({
    user1_id: z.string().uuid(),
    user2_id: z.string().uuid(),
});

export const ChatSchema = z.object({
    id: z.string().uuid(),
    user1_id: z.string(),
    user2_id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Image = z.infer<typeof ImageSchema>;

// Type exports for User
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type User = z.infer<typeof UserSchema>;

// Type exports for Admin
export type AdminCreate = z.infer<typeof AdminCreateSchema>;
export type Admin = z.infer<typeof AdminSchema>;

// Type exports for Item
export type ItemCreate = z.infer<typeof ItemCreateSchema>;
export type ItemUpdate = z.infer<typeof ItemUpdateSchema>;
export type Item = z.infer<typeof ItemSchema>;

// Type exports for Category
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
export type Category = z.infer<typeof CategorySchema>;

// Type exports for Wishlist
export type WishlistCreate = z.infer<typeof WishlistCreateSchema>;
export type Wishlist = z.infer<typeof WishlistSchema>;

// Type exports for Feedback
export type FeedbackCreate = z.infer<typeof FeedbackCreateSchema>;
export type FeedbackUpdate = z.infer<typeof FeedbackUpdateSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;

// Type exports for Message
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type Message = z.infer<typeof MessageSchema>;

// Type exports for Media
export type MediaCreate = z.infer<typeof MediaCreateSchema>;
export type Media = z.infer<typeof MediaSchema>;

// Type exports for Chat
export type ChatCreate = z.infer<typeof ChatCreateSchema>;
export type Chat = z.infer<typeof ChatSchema>;
