# Security Specification — Food's Spelling Bee

## 1. Data Invariants
1. **Public Profiles (`users/{userId}`)**:
   - Only an authenticated user whose `request.auth.uid == userId` may create or update their own public profile document.
   - No PII (`email`, `phone`, `address`) is stored in `users/{userId}`; only public game handle (`displayName`), avatar badge (`avatarIcon`), and aggregate career stats (`bestWpm`, `bestWord`, `totalWordsSpelled`, `totalScore`, `updatedAt`, `createdAt`) are stored.
   - All strings have strict `.size()` bounds and `userId` matches `^[a-zA-Z0-9_\-]+$`.
2. **Leaderboard Runs (`leaderboard_entries/{entryId}`)**:
   - Anyone can read (`get`, `list`) leaderboard entries so the global leaderboards (Today, This Week, This Month, This Year, All Time, and Highest WPM by Word) are visible to all players.
   - Creating a leaderboard entry requires `isSignedIn()`, verified email (`request.auth.token.email_verified == true`), `incoming().userId == request.auth.uid`, valid schema bounds (`wpm >= 0 && wpm <= 450`, `word.size() >= 2 && word.size() <= 45`, `displayName.size() >= 1 && displayName.size() <= 40`), and `incoming().createdAt == request.time`.
   - Leaderboard entries are immutable once recorded (`allow update, delete: if false;`).
3. **Word Speed Records (`word_records/{wordId}`)**:
   - Stores the all-time highest WPM achieved on a specific word (`word`, `difficulty`, `wpm`, `userId`, `displayName`, `charCount`, `durationMs`, `updatedAt`).
   - Creating or updating a word record requires `isSignedIn()`, `request.auth.token.email_verified == true`, `incoming().userId == request.auth.uid`, valid schema bounds, and on update, `incoming().wpm > existing().wpm` and `incoming().word == existing().word`.

## 2. The "Dirty Dozen" Payloads (Rejected with PERMISSION_DENIED)
1. **Identity Spoofing on Leaderboard Entry**: Authenticated user `uid_A` submits a `leaderboard_entries` document with `userId: "uid_B"`.
2. **Shadow Field Injection on Profile**: User submits `users/{uid}` with an undeclared field `{"isAdmin": true}`.
3. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to write to `leaderboard_entries/{id}`.
4. **Denial-of-Wallet Oversized String**: User submits `displayName` with 5,000 characters to `users/{uid}`.
5. **Client Timestamp Forgery**: User submits a past or future timestamp in `createdAt` instead of `request.time` on `leaderboard_entries` creation.
6. **Impossible WPM Value Poisoning**: User submits `wpm: 999999` or `wpm: -50` (outside `[0, 450]`) to `leaderboard_entries`.
7. **Immutable Field Tampering**: User attempts to `update` an existing `leaderboard_entries/{entryId}` document to inflate their score.
8. **Word Record Downgrade Attack**: User attempts to overwrite `word_records/{wordId}` with a lower `wpm` than `resource.data.wpm`.
9. **Word Record Cross-Word Mutation**: User attempts to change `word` on `word_records/{wordId}` during an update.
10. **Path Variable ID Poisoning**: User attempts to create a document with an invalid ID containing spaces or special characters.
11. **PII Injection on Public Profile**: User attempts to add an `email` or `phoneNumber` key to `users/{uid}`.
12. **Unauthorized Deletion**: User attempts to `delete` a `word_records/{wordId}` or `leaderboard_entries/{entryId}` document.
