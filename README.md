
# IdeaSpark - AI App Journal

## Vercel Deployment (Krok za krokom)

1. Pushnite kód na GitHub.
2. Na [Vercel dashboarde](https://vercel.com/new) importujte tento repozitár.
3. V sekcii **Environment Variables** pridajte:
   - `API_KEY`: Váš Gemini API kľúč.
   - `VITE_FIREBASE_API_KEY`: `AIzaSyDRBlzUzEJfX_kHgZPw2jjj-bj3Z5AtyWQ`
4. Kliknite na **Deploy**.

### Riešenie problémov
Ak dostanete chybu `Failed to load file differences` pri synchronizácii s GitHubom, skúste počkať pár minút alebo použiť tlačidlo "Force Push", ak je k dispozícii.
