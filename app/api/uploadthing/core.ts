import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    imageUploader: f({ image: { maxFileSize: "4MB" } })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("file url", file.url);
            return { uploadedBy: "system" };
        }),

    fileUploader: f({ blob: { maxFileSize: "16MB" } })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("file url", file.url);
            return { uploadedBy: "system" };
        }),

    bookUploader: f({ blob: { maxFileSize: "64MB" } })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("book uploaded", file.url);
            return { uploadedBy: "system" };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
