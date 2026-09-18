require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");

const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const uploadsDir = path.join(process.cwd(), "public", "uploads", "book_images");

async function main() {
    console.log("Starting upload cleanup...\n");

    // ---------------------------------------------------------
    // 1. Get ALL BukuImage records
    // ---------------------------------------------------------

    const images = await prisma.bukuImage.findMany({
        select: {
            id: true,
            imagePath: true, // Change this if your field has another name
            isKept: true,
        },
    });

    console.log(`Found ${images.length} BukuImage records.`);

    // ---------------------------------------------------------
    // 2. Delete files belonging to isKept = false
    // ---------------------------------------------------------

    const unkeptImages = images.filter((image) => !image.isKept);

    let deletedUnkeptFiles = 0;
    let deletedUnkeptRecords = 0;

    for (const image of unkeptImages) {
        if (!image.imagePath) {
            console.log(`BukuImage ${image.id} has no image path. Skipping.`);
            continue;
        }

        const fileName = path.basename(image.imagePath);
        const filePath = path.join(uploadsDir, fileName);

        try {
            await fs.unlink(filePath);

            console.log(`[UNKEPT] Deleted file: ${fileName}`);
            deletedUnkeptFiles++;
        } catch (error) {
            if (error.code === "ENOENT") {
                console.log(`[UNKEPT] File already missing: ${fileName}`);
            } else {
                console.error(`[UNKEPT] Failed to delete ${fileName}:`, error);
                continue;
            }
        }

        await prisma.bukuImage.delete({
            where: {
                id: image.id,
            },
        });

        deletedUnkeptRecords++;
    }

    // ---------------------------------------------------------
    // 3. Build a Set of files that ARE referenced by BukuImage
    // ---------------------------------------------------------

    const remainingImages = await prisma.bukuImage.findMany({
        select: {
            imagePath: true,
        },
    });

    const referencedFiles = new Set(
        remainingImages
            .filter((image) => image.imagePath)
            .map((image) => path.basename(image.imagePath))
    );

    console.log(
        `\n${referencedFiles.size} files are currently referenced by BukuImage.`
    );

    // ---------------------------------------------------------
    // 4. Scan public/uploads
    // ---------------------------------------------------------

    let files;

    try {
        files = await fs.readdir(uploadsDir, {
            withFileTypes: true,
        });
    } catch (error) {
        if (error.code === "ENOENT") {
            console.log("public/uploads does not exist. Nothing to clean.");
            return;
        }

        throw error;
    }

    // ---------------------------------------------------------
    // 5. Delete orphaned files
    // ---------------------------------------------------------

    let deletedOrphanFiles = 0;

    for (const file of files) {
        // Ignore directories
        if (!file.isFile()) {
            continue;
        }

        const fileName = file.name;

        if (!referencedFiles.has(fileName)) {
            const filePath = path.join(uploadsDir, fileName);

            try {
                await fs.unlink(filePath);

                console.log(`[ORPHAN] Deleted file: ${fileName}`);
                deletedOrphanFiles++;
            } catch (error) {
                console.error(`[ORPHAN] Failed to delete ${fileName}:`, error);
            }
        }
    }

    // ---------------------------------------------------------
    // Summary
    // ---------------------------------------------------------

    console.log("\n================================");
    console.log("Upload cleanup complete!");
    console.log("================================");
    console.log(`Unkept files deleted:   ${deletedUnkeptFiles}`);
    console.log(`Unkept DB records:      ${deletedUnkeptRecords}`);
    console.log(`Orphan files deleted:   ${deletedOrphanFiles}`);
    console.log("================================");
}

main()
    .catch((error) => {
        console.error("\nError cleaning uploads:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });