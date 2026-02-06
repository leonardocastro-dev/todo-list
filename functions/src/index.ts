import {setGlobalOptions} from "firebase-functions";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

setGlobalOptions({maxInstances: 10});

export const syncUserProfileToMembers = onDocumentUpdated(
  "users/{uid}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    const fieldsToSync: Record<string, string> = {};

    if (before.username !== after.username) {
      fieldsToSync.username = after.username;
    }
    if (before.avatarUrl !== after.avatarUrl) {
      fieldsToSync.avatarUrl = after.avatarUrl;
    }
    if (before.email !== after.email) {
      fieldsToSync.email = after.email;
    }

    if (Object.keys(fieldsToSync).length === 0) return;

    const uid = event.params.uid;

    const workspacesSnap = await db
      .collection("workspaces")
      .where("members", "array-contains", uid)
      .get();

    if (workspacesSnap.empty) return;

    const batch = db.batch();

    for (const ws of workspacesSnap.docs) {
      const memberRef = db.doc(`workspaces/${ws.id}/members/${uid}`);
      batch.update(memberRef, fieldsToSync);
    }

    await batch.commit();
  }
);
