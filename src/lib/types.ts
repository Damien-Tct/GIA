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
