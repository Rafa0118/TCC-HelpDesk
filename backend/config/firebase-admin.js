const fs = require("node:fs");
const path = require("node:path");
const admin = require("firebase-admin");

function assertFirebaseProject(serviceAccount, expectedProjectId) {
  if (serviceAccount.type !== "service_account" ||
      typeof serviceAccount.project_id !== "string" ||
      !serviceAccount.project_id) {
    const error = new Error("The Firebase service account is missing its project metadata.");
    error.code = "FIREBASE_SERVICE_ACCOUNT_INVALID";
    throw error;
  }

  if (expectedProjectId && serviceAccount.project_id !== expectedProjectId) {
    const error = new Error("The Firebase service account belongs to a different project.");
    error.code = "FIREBASE_PROJECT_MISMATCH";
    throw error;
  }
}

function initializeFirebaseAdmin(expectedProjectId = process.env.FIREBASE_PROJECT_ID) {
  if (admin.apps.length) {
    const configuredProjectId = admin.app().options.projectId;
    if (expectedProjectId && configuredProjectId !== expectedProjectId) {
      const error = new Error("Firebase Admin is already initialized for a different project.");
      error.code = "FIREBASE_PROJECT_MISMATCH";
      throw error;
    }
    return admin.auth();
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.join(__dirname, "..", "serviceAccountKey.json");

  let credential;
  let projectId = expectedProjectId;
  if (fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
    assertFirebaseProject(serviceAccount, expectedProjectId);
    projectId = projectId || serviceAccount.project_id;
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.K_SERVICE) {
    credential = admin.credential.applicationDefault();
  } else {
    throw new Error(
      "Firebase credentials are missing. Add backend/serviceAccountKey.json or configure Application Default Credentials."
    );
  }

  admin.initializeApp({ credential, projectId });
  return admin.auth();
}

module.exports = { initializeFirebaseAdmin, assertFirebaseProject };
