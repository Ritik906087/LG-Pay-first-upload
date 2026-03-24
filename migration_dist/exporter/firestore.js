"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamFirestoreCollection = streamFirestoreCollection;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const promises_1 = require("stream/promises");
const stream_1 = require("stream");
const sql_generator_1 = require("./sql-generator");
const BATCH_SIZE = 300; // As requested
try {
    const serviceAccountPath = path_1.default.join(__dirname, '../serviceAccountKey.json');
    if (!fs_extra_1.default.existsSync(serviceAccountPath)) {
        throw new Error('Firebase service account key not found at migration/serviceAccountKey.json. Please follow the setup instructions in README.md.');
    }
    const serviceAccount = fs_extra_1.default.readJSONSync(serviceAccountPath);
    if (firebase_admin_1.default.apps.length === 0) {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
    }
}
catch (error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("Failed to initialize Firebase Admin SDK.");
    console.error(error);
    console.error("Please ensure the service account key is correctly placed and configured.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    process.exit(1);
}
const db = firebase_admin_1.default.firestore();
async function streamFirestoreCollection(config, outputDir, log) {
    let query = config.isSubcollection
        ? db.collectionGroup(config.collectionId)
        : db.collection(config.collectionId);
    let lastDoc = null;
    let batchIndex = 1;
    let totalDocsProcessed = 0;
    let hasMore = true;
    while (hasMore) {
        log(`  - Processing batch ${batchIndex}...`);
        let currentQuery = query.orderBy(firebase_admin_1.default.firestore.FieldPath.documentId()).limit(BATCH_SIZE);
        if (lastDoc) {
            currentQuery = currentQuery.startAfter(lastDoc);
        }
        const snapshot = await currentQuery.get();
        const docs = snapshot.docs;
        if (docs.length === 0) {
            hasMore = false;
            continue;
        }
        const filePath = path_1.default.join(outputDir, `${config.tableName}_batch_${batchIndex}.sql`);
        const fileStream = fs_extra_1.default.createWriteStream(filePath);
        const sqlTransform = (0, sql_generator_1.createSqlInsertTransform)(config.tableName, config.transform);
        // Create a Readable stream from the documents array
        const docStream = stream_1.Readable.from(docs.map(doc => doc.data()));
        // Use pipeline for robust stream handling
        await (0, promises_1.pipeline)(docStream, sqlTransform, fileStream);
        totalDocsProcessed += docs.length;
        log(`    ...wrote ${docs.length} documents to ${path_1.default.basename(filePath)} (Total: ${totalDocsProcessed})`);
        lastDoc = docs[docs.length - 1];
        batchIndex++;
        if (docs.length < BATCH_SIZE) {
            hasMore = false;
        }
    }
    if (totalDocsProcessed === 0) {
        log(`  - No documents found in collection ${config.collectionId}.`);
    }
}
