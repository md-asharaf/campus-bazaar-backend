import z from "zod";
export const ADMIN_ROLE = z.enum(["SUPER", "SUB"]);
export const VERIFICATION_STATUS = z.enum(["PENDING", "VERIFIED", "REJECTED"]);
export type VerificationStatus = z.infer<typeof VERIFICATION_STATUS>;
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

export type Image = z.infer<typeof ImageSchema>;

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type User = z.infer<typeof UserSchema>;

export type AdminCreate = z.infer<typeof AdminCreateSchema>;
export type Admin = z.infer<typeof AdminSchema>;
