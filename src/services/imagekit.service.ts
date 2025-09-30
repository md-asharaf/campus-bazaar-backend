import envVars from "@/config/envVars";
import ImageKit from "imagekit";
import { logger } from "@/config/logger";
import { db } from "@/config/database";
import { Image } from "@/@types/schema";

const imagekit = new ImageKit({
    publicKey: envVars.IMAGEKIT_PUBLIC_KEY as string,
    privateKey: envVars.IMAGEKIT_PRIVATE_KEY as string,
    urlEndpoint: envVars.IMAGEKIT_API_URL as string,
});

export async function uploadImage(file: Express.Multer.File): Promise<Image> {
    try {
        const uploadedImage = await imagekit.upload({
            file: file.buffer.toString("base64"),
            fileName: file.originalname,
        });
        logger.info(
            `[IMAGEKIT_SERVICE] Image uploaded successfully. File ID: ${uploadedImage.fileId}`,
        );

        const image = await db.image.create({
            data: {
                url: uploadedImage.url,
                id: uploadedImage.fileId,
            },
        });
        return image;
    } catch (error) {
        logger.error(
            "[IMAGEKIT_SERVICE] Error uploading image to ImageKit:",
            error,
        );
        throw new Error("Failed to upload image.");
    }
}

export async function deleteUploadedImage(fileId: string): Promise<void> {
    try {
        if (!fileId) {
            throw new Error("Invalid URL: Unable to extract image ID.");
        }
        await imagekit.deleteFile(fileId);
        await db.image.delete({
            where: {
                id: fileId,
            },
        });
        logger.info(
            `[IMAGEKIT_SERVICE] Image with ID ${fileId} deleted successfully.`,
        );
    } catch (error) {
        logger.error(
            "[IMAGEKIT_SERVICE] Error deleting image from ImageKit:",
            error,
        );
        throw new Error("Failed to delete image.");
    }
}
