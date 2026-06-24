export interface N8nModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "chat" | "webhook";
  /** URL du webhook n8n (POST) */
  webhookUrl?: string;
  /** Champs du formulaire (uniquement pour type: "webhook") */
  webhookFields?: WebhookField[];
  /** Activer/désactiver l'affichage du module (true par défaut) */
  enabled?: boolean;
  /** Message personnalisé après soumission réussie */
  successMessage?: string;
}

export interface WebhookField {
  name: string;
  label: string;
  type: "text" | "textarea" | "email" | "number" | "select" | "file" | "radio" | "list";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  /** Type du champ à l'intérieur d'une liste (text par défaut) */
  listType?: "text" | "email" | "number" | "url";
  /** Accept filter pour les champs file (ex: ".pdf,.jpg,.png") */
  accept?: string;
  /** Permet la sélection de plusieurs fichiers (file uniquement) */
  multiple?: boolean;
  /** Nom du groupe pour le fieldset (regroupe visuellement les champs) */
  group?: string;
  /** Afficher ce champ seulement si un autre champ a une valeur spécifique */
  showIf?: { field: string; value: string };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface WebhookResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
}

export interface SubmissionLog {
  id: string;
  moduleId: string;
  moduleTitle: string;
  timestamp: string;
  success: boolean;
  payload: Record<string, unknown>;
  response?: unknown;
  error?: string;
}

export interface ThemeConfig {
  primaryColor: string;
  logo: string;
  appTitle: string;
  footer: string;
}
