import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { LeaderboardRecord, WordSpeedRecord } from './game/spellingLogic';
import { DifficultyTier, GameModeTier } from './game/wordBank';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot as required by firebase-integration-rpc
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'default_id';
}

export function sanitizeDisplayName(name: string): string {
  const trimmed = name.trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : 'Bee Challenger';
}

export async function signInWithGooglePopup(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { User };

export async function fetchGlobalLeaderboards(): Promise<{
  entries: LeaderboardRecord[];
  wordRecords: WordSpeedRecord[];
}> {
  const entriesPath = 'leaderboard_entries';
  const wordRecordsPath = 'word_records';
  const entries: LeaderboardRecord[] = [];
  const wordRecords: WordSpeedRecord[] = [];

  try {
    const entriesQuery = query(
      collection(db, entriesPath),
      where('wpm', '>=', 0),
      orderBy('wpm', 'desc'),
      limit(100)
    );
    const snap = await getDocs(entriesQuery);
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      entries.push({
        id: docSnap.id,
        userId: String(d.userId || ''),
        displayName: String(d.displayName || 'Challenger'),
        titleBadge: String(d.titleBadge || 'Saffron Speller'),
        wpm: Number(d.wpm || 0),
        peakWpm: Number(d.peakWpm || 0),
        fastestWord: String(d.fastestWord || 'bistro'),
        difficulty: (d.difficulty as GameModeTier) || 'easy',
        score: Number(d.score || 0),
        wordsSpelled: Number(d.wordsSpelled || 1),
        accuracy: Number(d.accuracy || 100),
        playedAtMs: Number(d.playedAtMs || Date.now())
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, entriesPath);
  }

  try {
    const wordQuery = query(
      collection(db, wordRecordsPath),
      where('wpm', '>=', 0),
      orderBy('wpm', 'desc'),
      limit(100)
    );
    const snap = await getDocs(wordQuery);
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      wordRecords.push({
        word: String(d.word || docSnap.id),
        difficulty: (d.difficulty as DifficultyTier) || 'easy',
        wpm: Number(d.wpm || 0),
        userId: String(d.userId || ''),
        displayName: String(d.displayName || 'Challenger'),
        charCount: Number(d.charCount || String(d.word || '').length),
        durationMs: Number(d.durationMs || 1000),
        updatedAtMs: Date.now()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, wordRecordsPath);
  }

  return { entries, wordRecords };
}

export async function syncUserProfileToFirestore(params: {
  userId: string;
  displayName: string;
  titleBadge: string;
  bestWpm: number;
  bestWord: string;
  totalWordsSpelled: number;
  totalScore: number;
}): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== params.userId || !auth.currentUser.emailVerified) {
    return;
  }

  const safeUid = sanitizeId(params.userId);
  const path = `users/${safeUid}`;
  const ref = doc(db, 'users', safeUid);

  const safeDisplayName = sanitizeDisplayName(params.displayName);
  const safeBadge = params.titleBadge.trim().slice(0, 40) || 'Saffron Speller';
  const safeBestWpm = Math.min(450, Math.max(0, Math.round(params.bestWpm)));
  const safeBestWord = (params.bestWord.trim().slice(0, 45) || 'bistro').toLowerCase();
  const safeWords = Math.min(1000000, Math.max(0, Math.round(params.totalWordsSpelled)));
  const safeScore = Math.min(100000000, Math.max(0, Math.round(params.totalScore)));

  try {
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        userId: safeUid,
        displayName: safeDisplayName,
        titleBadge: safeBadge,
        bestWpm: safeBestWpm,
        bestWord: safeBestWord,
        totalWordsSpelled: safeWords,
        totalScore: safeScore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const prev = existing.data();
      await updateDoc(ref, {
        displayName: safeDisplayName,
        titleBadge: safeBadge,
        bestWpm: Math.max(Number(prev.bestWpm || 0), safeBestWpm),
        bestWord: safeBestWpm >= Number(prev.bestWpm || 0) ? safeBestWord : String(prev.bestWord || safeBestWord),
        totalWordsSpelled: Number(prev.totalWordsSpelled || 0) + safeWords,
        totalScore: Number(prev.totalScore || 0) + safeScore,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function submitRunToFirestore(params: {
  entryId: string;
  userId: string;
  displayName: string;
  titleBadge: string;
  wpm: number;
  peakWpm: number;
  fastestWord: string;
  difficulty: GameModeTier;
  score: number;
  wordsSpelled: number;
  accuracy: number;
  playedAtMs: number;
  wordResults: {
    word: string;
    difficulty: DifficultyTier;
    wpm: number;
    durationMs: number;
  }[];
}): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== params.userId || !auth.currentUser.emailVerified) {
    return;
  }

  const safeEntryId = sanitizeId(params.entryId);
  const entryPath = `leaderboard_entries/${safeEntryId}`;

  try {
    await setDoc(doc(db, 'leaderboard_entries', safeEntryId), {
      userId: sanitizeId(params.userId),
      displayName: sanitizeDisplayName(params.displayName),
      titleBadge: params.titleBadge.trim().slice(0, 40) || 'Saffron Speller',
      wpm: Math.min(450, Math.max(0, Math.round(params.wpm))),
      peakWpm: Math.min(450, Math.max(0, Math.round(params.peakWpm))),
      fastestWord: params.fastestWord.trim().slice(0, 45) || 'bistro',
      difficulty: params.difficulty,
      score: Math.min(10000000, Math.max(0, Math.round(params.score))),
      wordsSpelled: Math.min(500, Math.max(1, Math.round(params.wordsSpelled))),
      accuracy: Math.min(100, Math.max(0, Math.round(params.accuracy))),
      playedAtMs: Math.min(2500000000000, Math.max(1700000000000, Math.round(params.playedAtMs))),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, entryPath);
  }

  // Check and update per-word WPM records
  for (const wr of params.wordResults) {
    if (wr.wpm <= 0) continue;
    const wordId = sanitizeId(wr.word.toLowerCase());
    const wordPath = `word_records/${wordId}`;
    const wordRef = doc(db, 'word_records', wordId);

    try {
      const snap = await getDoc(wordRef);
      const safeWpm = Math.min(450, Math.max(1, Math.round(wr.wpm)));
      const safeDuration = Math.min(600000, Math.max(100, Math.round(wr.durationMs)));

      if (!snap.exists()) {
        await setDoc(wordRef, {
          word: wr.word.toLowerCase().slice(0, 45),
          difficulty: wr.difficulty,
          wpm: safeWpm,
          userId: sanitizeId(params.userId),
          displayName: sanitizeDisplayName(params.displayName),
          charCount: wr.word.length,
          durationMs: safeDuration,
          updatedAt: serverTimestamp()
        });
      } else {
        const existingWpm = Number(snap.data().wpm || 0);
        if (safeWpm > existingWpm) {
          await updateDoc(wordRef, {
            wpm: safeWpm,
            userId: sanitizeId(params.userId),
            displayName: sanitizeDisplayName(params.displayName),
            durationMs: safeDuration,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, wordPath);
    }
  }
}
