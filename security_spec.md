# Security Specification: Playlists Database Architecture

This document outlines the security properties and validation constraints for the Spotify-style playlist saving feature.

## 1. Data Invariants

*   **Document ID**: Must be a unique, uppercase alphanumeric character string of length 6 (e.g., `AB12CD` or `Z9XY8W`).
*   **Immutability**: To prevent unauthorized tampering, overwriting, or hijacking of other users' playlists, playlist documents are **append-only (create-once)**. Once a save code is written to Firestore, it cannot be modified or deleted. To "update" a playlist, the application exports it as a new save code (versioned sharing, similar to JSFiddle or Pastebin).
*   **Required Fields**: A playlist document must strictly contain the fields:
    *   `id` (string matching the Document Path ID)
    *   `name` (string, 1 to 100 characters)
    *   `songs` (array/list of songs, max size of 200 items to avoid Denial-of-Wallet and document size limits)
    *   `createdAt` (rules-enforced `request.time` timestamp)

## 2. Song Schema Details
Every item inside the `songs` list must contain:
*   `id` (string, max 50 chars)
*   `title` (string, max 150 chars)
*   `artist` (string, max 100 chars)
*   `duration` (number, representing total seconds)
*   `thumbnail` (string, max 500 chars)
*   `url` (string, max 500 chars)
*   `source` (string, either 'youtube' or 'custom')

---

## 3. The "Dirty Dozen" Payloads (Attacks to Deny)

We will guard against the following 12 malicious write/read payloads:

1.  **Ghost Field (Shadow Update)**: Creating/updating a playlist with unmapped fields like `isAdminOrVerified: true`.
2.  **ID poisoning**: Constructing a document ID with 10KB of junk characters (Denial of Wallet).
3.  **Invalid ID Match**: Writing a document where the nested `id` field does not match the Document ID.
4.  ** Tampering / Overwrite**: Attempting to coordinate an `update` or `delete` on an existing save code.
5.  **Size Abuse (Name)**: Setting the playlist `name` to a 10MB malicious buffer block.
6.  **Missing Required Fields**: Creating a playlist document missing the `songs` list or the `createdAt` timestamp.
7.  **Blanket Public Scraping**: Issuing unbounded list queries to scan all user playlists without specifying a search code.
8.  **Future Timestamps**: Forging `createdAt` as a year 2999 timestamp rather than `request.time`.
9.  **Song List Overflow**: Uploading an array containing 10,000 songs inside a single document.
10. **Typing Poisoning**: Inserting boolean or mapping data directly where an array of `songs` is expected.
11. **Empty Song Structure**: Supplying empty string titles, or infinite-length thumbnail URLs exceeding limits.
12. **Malformed Save Code Format**: Requesting a save code document that contains non-alphanumeric or lower-case characters.

---

## 4. Test Policy (Rules Definition)

We will implement this secure contract directly in `DRAFT_firestore.rules`.
Since there are no user account authentications requested for this simple share code functionality, any browser client can write a new playlist code or read a playlist code. However, they cannot list, modify, or delete any codes. This guarantees perfect safety from scraping and hijacking!
