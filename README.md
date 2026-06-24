# 🏗️ Integration Hub n8n

Interface centralisée pour interagir avec vos agents et webhooks **n8n**.

- **💬 Chats** — Widget `@n8n/chat` pour discuter avec des assistants IA
- **📋 Formulaires** — Générateur de formulaires HTML qui POST sur vos webhooks n8n

---

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## ⚙️ Configuration

Toute la configuration se fait dans **`src/lib/config.ts`** via le tableau `n8nModules`.

### Types de modules

| Type | Description |
|---|---|
| `"chat"` | Widget `@n8n/chat` — POST sur `webhookUrl` |
| `"webhook"` | Formulaire HTML — POST sur `webhookUrl` |

### Structure d'un module

```ts
{
  id: "mon-module",              // Identifiant unique
  title: "Mon Module",           // Titre affiché
  description: "...",            // Description
  icon: "🚀",                    // Emoji
  type: "webhook",               // "chat" | "webhook"
  enabled: true,                 // Optionnel, true par défaut
  webhookUrl: "https://n8n...", // URL du webhook n8n (POST)
  webhookFields: [ /* ... */ ],  // Champs du formulaire
}
```

### Types de champs disponibles

| Type | Rendu | Propriétés spécifiques |
|---|---|---|
| `text` | Input texte | `placeholder` |
| `email` | Input email (validation native) | `placeholder` |
| `number` | Input nombre | `placeholder` |
| `textarea` | Zone de texte (4 lignes) | `placeholder` |
| `select` | Menu déroulant | `options: [{ label, value }]` |
| **`radio`** | Boutons radio en carte | `options: [{ label, value }]` |
| **`list`** | Liste dynamique (ajout/suppression) | `listType`, `placeholder` |
| `file` | Upload fichier → base64 | `accept`, `multiple` |

### Exemple complet

```ts
{
  id: "webhook-demo",
  title: "Formulaire Démo",
  description: "Tous les types de champs.",
  icon: "🧪",
  type: "webhook",
  webhookUrl: "https://n8n.example.com/webhook/demo",
  webhookFields: [
    // ── Champs simples ──
    { name: "fullName", label: "Nom", type: "text", required: true, placeholder: "Jean Dupont" },
    { name: "email",    label: "Email", type: "email", required: true, placeholder: "jean@exemple.com" },
    { name: "age",      label: "Âge", type: "number", required: true, placeholder: "30" },

    // ── Select ──
    { name: "category", label: "Catégorie", type: "select", required: true, options: [
      { label: "Particulier", value: "individual" },
      { label: "Professionnel", value: "professional" },
    ]},

    // ── Radio ──
    { name: "priority", label: "Priorité", type: "radio", required: true, options: [
      { label: "🔵 Normal", value: "normal" },
      { label: "🟡 Important", value: "important" },
      { label: "🔴 Urgent", value: "urgent" },
    ]},

    // ── Textarea ──
    { name: "comment", label: "Commentaire", type: "textarea", placeholder: "Votre message..." },

    // ── Liste dynamique ──
    { name: "tags", label: "Tags", type: "list", placeholder: "javascript", listType: "text" },

    // ── Fichier (multi) ──
    { name: "attachments", label: "Pièces jointes", type: "file", multiple: true, accept: ".pdf,.jpg,.png" },
  ],
}
```

---

## 📦 Payload JSON envoyé au webhook

### Champs standards

```json
{
  "fullName": "Jean Dupont",
  "email": "jean@exemple.com",
  "age": "30",
  "category": "individual",
  "priority": "important",
  "comment": "Bonjour...",
  "_module": "webhook-demo",
  "_timestamp": "2026-06-24T12:00:00.000Z"
}
```

### Champ `list`

Les listes sont envoyées en tant que **tableau JSON** :

```json
{
  "tags": ["javascript", "react", "node"]
}
```

### Champ `file`

Les fichiers sont lus en **base64** côté client et envoyés en tant que **tableau d'objets** :

```json
{
  "attachments": [
    {
      "filename": "document.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "data": "JVBERi0xLjQK... (base64 pur)"
    }
  ]
}
```

> **Mono-fichier** (`multiple: false`, défaut) : le tableau contient 0 ou 1 élément.
> **Multi-fichier** (`multiple: true`) : le tableau contient N éléments.

---

## 🔧 Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run start` | Démarrage production |
| `npm run lint` | Vérification ESLint |

---

## 🔐 Authentification

L'application supporte l'authentification via :
- Compte admin local (email + mot de passe, hashé avec `bcryptjs`)
- LDAP (via `ldapjs`)

Les routes API d'auth sont sous `/api/auth/*`. La première visite déclenche la page de setup (`/setup`).

---

## 🧱 Stack technique

- **Framework** : [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **UI** : [Tailwind CSS 4](https://tailwindcss.com)
- **Auth** : [next-auth](https://next-auth.js.org) + bcryptjs + jose (JWT)
- **Chat** : Widget `@n8n/chat`
- **Langue** : 🇫🇷 Français
