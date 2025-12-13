const axios = require("axios");
const { v2: cloudinary } = require("cloudinary");

const {
    TELEGRAM_BOT_TOKEN,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER,
} = require("../config");

// Cache uploads so the same Telegram file_id is not re-uploaded repeatedly
const uploadCache = new Map();
const MAX_IMAGES = 4;

const isCloudinaryConfigured =
    Boolean(CLOUDINARY_CLOUD_NAME) &&
    Boolean(CLOUDINARY_API_KEY) &&
    Boolean(CLOUDINARY_API_SECRET) &&
    Boolean(CLOUDINARY_FOLDER);

let cloudinaryWarned = false;
if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
    });
}

const buildTelegramFileUrl = (filePath) =>
    `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

const ensureCloudinary = () => {
    if (isCloudinaryConfigured) return;
    if (!cloudinaryWarned) {
        console.warn(
            "WARN: Cloudinary credentials are not set. Skipping image uploads to CDN."
        );
        cloudinaryWarned = true;
    }
    throw new Error("Cloudinary configuration missing");
};

const uploadStreamToCloudinary = (
    stream,
    { folder = CLOUDINARY_FOLDER } = {}
) =>
    new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                overwrite: false,
            },
            (err, result) => {
                if (err) return reject(err);
                if (!result?.secure_url) {
                    return reject(
                        new Error("Cloudinary upload returned no URL")
                    );
                }
                resolve(result.secure_url);
            }
        );

        stream.on("error", reject);
        stream.pipe(upload);
    });

async function telegramFileIdToPublicUrl(telegramClient, fileId, options = {}) {
    ensureCloudinary();

    if (!telegramClient?.getFile) {
        throw new Error("Telegram client missing getFile");
    }
    if (!fileId) {
        throw new Error("fileId is required");
    }

    if (uploadCache.has(fileId)) {
        return uploadCache.get(fileId);
    }

    const uploadPromise = (async () => {
        const file = await telegramClient.getFile(fileId);
        if (!file?.file_path) {
            throw new Error("Telegram getFile did not return file_path");
        }

        const tgUrl = buildTelegramFileUrl(file.file_path);
        const tgResp = await axios.get(tgUrl, {
            responseType: "stream",
            timeout: options.downloadTimeoutMs || 20000,
        });

        return uploadStreamToCloudinary(tgResp.data, options);
    })();

    uploadCache.set(fileId, uploadPromise);

    return uploadPromise.catch((err) => {
        uploadCache.delete(fileId);
        throw err;
    });
}

async function buildPublicPhotoUrls(
    telegramClient,
    fileIds = [],
    options = {}
) {
    if (!Array.isArray(fileIds) || fileIds.length === 0) return [];

    const limit = Math.min(options.limit ?? MAX_IMAGES, MAX_IMAGES);
    const uniqueIds = [...new Set(fileIds.filter(Boolean))].slice(0, limit);
    const urls = [];

    for (const fileId of uniqueIds) {
        try {
            const url = await telegramFileIdToPublicUrl(
                telegramClient,
                fileId,
                options
            );
            if (url) urls.push(url);
        } catch (err) {
            console.error(
                "❌ CDN upload failed:",
                err && err.stack ? err.stack : err
            );
        }
    }

    return urls;
}

module.exports = {
    buildPublicPhotoUrls,
    telegramFileIdToPublicUrl,
};
