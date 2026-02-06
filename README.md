
# IdeaSpark - AI App Journal

Inteligentný zápisník vašich nápadov na aplikácie s automatickou generáciou technických blueprintov pomocou Gemini AI.

## ⚠️ Bezpečnostné upozornenie (Firebase)
Ak dostanete upozornenie od Googlu o "Publicly accessible API key", postupujte takto:
1. Choďte do [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Nájdite kľúč `AIzaSyDR...`.
3. V sekcii **API restrictions** nastavte "Restrict key".
4. V sekcii **Application restrictions** vyberte "Websites" a pridajte vašu Vercel doménu.

## Inštalácia
1. `npm install`
2. `npm run dev`

## Deployment
Projekt je pripravený na nasadenie cez Vercel. Nezabudnite pridať `API_KEY` (Gemini) do Environment Variables.
