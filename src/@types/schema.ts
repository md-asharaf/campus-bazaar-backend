import z from "zod";

// Enums
export const ADMIN_ROLE = z.enum(["SUPER", "SUB"]);
export const VERIFICATION_STATUS = z.enum(["PENDING", "VERIFIED", "REJECTED"]);
export const IMAGE_STATUS = z.enum(["ACTIVE", "INACTIVE"]);

export type AdminRole = z.infer<typeof ADMIN_ROLE>;
export type VerificationStatus = z.infer<typeof VERIFICATION_STATUS>;
export type ImageStatus = z.infer<typeof IMAGE_STATUS>;
export const UserCreateSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  avatar: z.string().url("Invalid avatar URL").optional(),
  registrationNo: z.string().min(1, "Registration number is required")
    .max(20, "Registration number is too long")
    .regex(/^[A-Z0-9]+$/, "Registration number should contain only uppercase letters and numbers"),
  branch: z.string().min(1, "Branch is required").max(50, "Branch name is too long"),
  year: z.number().int().min(1, "Year must be at least 1").max(4, "Year cannot exceed 4"),
  bio: z.string().max(500, "Bio is too long").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial().omit({
  email: true,
  registrationNo: true,
}).extend({
  isActive: z.boolean().optional(),
});

// Base schemas without relations
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

export const VerificationCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  imageId: z.string().nonempty("Image ID is required"),
});

export const VerificationUpdateSchema = z.object({
  status: VERIFICATION_STATUS,
});

export const VerificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  imageId: z.string(),
  status: VERIFICATION_STATUS,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ImageCreateSchema = z.object({
  id: z.string(),
  url: z.string().url("Invalid URL format"),
});

export const ImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Item Schemas
export const ItemCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  price: z.number().positive("Price must be positive").max(1000000, "Price is too high"),
  sellerId: z.string().uuid("Invalid seller ID"),
  categoryId: z.string().uuid("Invalid category ID").optional(),
});

export const ItemUpdateSchema = ItemCreateSchema.partial().omit({
  sellerId: true,
}).extend({
  isSold: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
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
  name: z.string().min(1, "Category name is required").max(50, "Category name is too long")
    .regex(/^[a-zA-Z0-9\s&-]+$/, "Category name contains invalid characters"),
  imageId: z.string().nonempty("Image ID is required").optional(),
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
  content: z.string().min(10, "Feedback must be at least 10 characters")
    .max(1000, "Feedback is too long"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  userId: z.string().uuid("Invalid user ID"),
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
  content: z.string().min(1, "Message content is required").max(2000, "Message is too long"),
  senderId: z.string().uuid("Invalid sender ID"),
  chatId: z.string().uuid("Invalid chat ID"),
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
  imageId: z.string(),
  messageId: z.string(),
});

export const MediaSchema = z.object({
  id: z.string().uuid(),
  imageId: z.string(),
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

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  includeRelations: z.boolean().default(false),
});

export const SearchQuerySchema = z.object({
  query: z.string().min(1, "Search query cannot be empty").optional(),
  category: z.string().uuid().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  verified: z.boolean().optional(),
  available: z.boolean().default(true),
}).merge(PaginationSchema);

export const EmailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const PasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character"),
});

export const OTPSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character"),
  name: z.string().min(1, "Name is required"),
  registrationNo: z.string().min(1, "Registration number is required"),
  branch: z.string().min(1, "Branch is required"),
  year: z.number().int().min(1).max(4, "Year must be between 1 and 4"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character"),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character"),
});

// Simplified relational types for API responses
export const MessageWithSenderSchema = MessageSchema.extend({
  sender: UserSchema.pick({ id: true, name: true, avatar: true }),
  media: z.array(MediaSchema).optional(),
  tempId: z.string().optional(), // For optimistic UI updates
});

export const ChatSummarySchema = ChatSchema.extend({
  otherUser: UserSchema.pick({
    id: true,
    name: true,
    avatar: true,
    isActive: true,
    isVerified: true
  }),
  latestMessage: MessageWithSenderSchema.nullable().optional(),
  unreadCount: z.number().default(0),
  type: z.literal('one-to-one').default('one-to-one'),
  participantCount: z.number().default(2),
});

// Schemas with Relations - Define all entities with their complete relationships
export const UserWithRelationsSchema = UserSchema.extend({
  chats1: z.array(z.lazy(() => ChatSchema)).optional(), // Chats where user is user1
  chats2: z.array(z.lazy(() => ChatSchema)).optional(), // Chats where user is user2
  sentMessages: z.array(z.lazy(() => MessageSchema)).optional(),
  items: z.array(z.lazy(() => ItemSchema)).optional(), // Items they're selling
  wishlistItems: z.array(z.lazy(() => WishlistSchema)).optional(),
  feedbacks: z.array(z.lazy(() => FeedbackSchema)).optional(),
  verifications: z.array(z.lazy(() => VerificationSchema)).optional(),
});

export const ItemWithRelationsSchema = ItemSchema.extend({
  seller: z.lazy(() => UserSchema).optional(),
  category: z.lazy(() => CategorySchema).optional(),
  wishlistedBy: z.array(z.lazy(() => WishlistSchema)).optional(),
});

export const CategoryWithRelationsSchema = CategorySchema.extend({
  items: z.array(z.lazy(() => ItemSchema)).optional(),
  image: z.lazy(() => ImageSchema).optional(),
});

export const WishlistWithRelationsSchema = WishlistSchema.extend({
  user: z.lazy(() => UserSchema).optional(),
  item: z.lazy(() => ItemSchema).optional(),
});

export const FeedbackWithRelationsSchema = FeedbackSchema.extend({
  user: z.lazy(() => UserSchema).optional(),
});

export const VerificationWithRelationsSchema = VerificationSchema.extend({
  user: z.lazy(() => UserSchema).optional(),
  image: z.lazy(() => ImageSchema).optional(),
});

export const AdminWithRelationsSchema = AdminSchema.extend({
  // Admins might have processed verifications in the future
  processedVerifications: z.array(z.lazy(() => VerificationSchema)).optional(),
});

export const MessageWithRelationsSchema = MessageSchema.extend({
  sender: z.lazy(() => UserSchema).optional(),
  chat: z.lazy(() => ChatSchema).optional(),
  media: z.array(z.lazy(() => MediaSchema)).optional(),
});

export const MediaWithRelationsSchema = MediaSchema.extend({
  message: z.lazy(() => MessageSchema).optional(),
});

export const ChatWithRelationsSchema = ChatSchema.extend({
  user1: z.lazy(() => UserSchema).optional(),
  user2: z.lazy(() => UserSchema).optional(),
  messages: z.array(z.lazy(() => MessageSchema)).optional(),
  latestMessage: z.lazy(() => MessageSchema).nullable().optional(),
  unreadCount: z.number().optional(),
});

// Main type exports - use the relation schemas as the primary types
export type User = z.infer<typeof UserWithRelationsSchema>;
export type Item = z.infer<typeof ItemWithRelationsSchema>;
export type Category = z.infer<typeof CategoryWithRelationsSchema>;
export type Wishlist = z.infer<typeof WishlistWithRelationsSchema>;
export type Feedback = z.infer<typeof FeedbackWithRelationsSchema>;
export type Verification = z.infer<typeof VerificationWithRelationsSchema>;
export type Admin = z.infer<typeof AdminWithRelationsSchema>;
export type Message = z.infer<typeof MessageWithRelationsSchema>;
export type Media = z.infer<typeof MediaWithRelationsSchema>;
export type Chat = z.infer<typeof ChatWithRelationsSchema>;
export type Image = z.infer<typeof ImageSchema>;

// Legacy/simplified relational types for specific use cases
export type MessageWithSender = z.infer<typeof MessageWithSenderSchema>;
export type ChatSummary = z.infer<typeof ChatSummarySchema>;

// ================================
// ALL TYPE EXPORTS
// ================================

// Create/Update types for entities
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type AdminCreate = z.infer<typeof AdminCreateSchema>;
export type ItemCreate = z.infer<typeof ItemCreateSchema>;
export type ItemUpdate = z.infer<typeof ItemUpdateSchema>;
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
export type WishlistCreate = z.infer<typeof WishlistCreateSchema>;
export type FeedbackCreate = z.infer<typeof FeedbackCreateSchema>;
export type FeedbackUpdate = z.infer<typeof FeedbackUpdateSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type MediaCreate = z.infer<typeof MediaCreateSchema>;
export type ChatCreate = z.infer<typeof ChatCreateSchema>;
export type VerificationCreate = z.infer<typeof VerificationCreateSchema>;
export type VerificationUpdate = z.infer<typeof VerificationUpdateSchema>;
export type ImageCreate = z.infer<typeof ImageCreateSchema>;

// Authentication types
export type LoginType = z.infer<typeof LoginSchema>;
export type RegisterType = z.infer<typeof RegisterSchema>;
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;
export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;

// Response types
// export type APIResponseType = z.infer<typeof APIResponseSchema>;
// export type PaginatedResponseType = z.infer<typeof PaginatedResponseSchema>;

// Common utility types
// export type PaginationType = z.infer<typeof PaginationSchema>;
export type SearchQueryType = z.infer<typeof SearchQuerySchema>;
// export type IdParamType = z.infer<typeof IdParamSchema>;
export type EmailType = z.infer<typeof EmailSchema>;
export type PasswordType = z.infer<typeof PasswordSchema>;
export type OTPType = z.infer<typeof OTPSchema>;
