import { N8nModule } from "./types";

// =============================================================================
// Configuration des modules n8n
// =============================================================================
//
// DEUX TYPES DE MODULES :
// ───────────────────────
// 1) "chat"     → Widget @n8n/chat (appel POST sur webhookUrl)
// 2) "webhook"  → Formulaire qui POST sur webhookUrl
//
// Pour les modules "chat" :
//   webhookUrl → L'URL du webhook n8n (le widget @n8n/chat POSTe dessus)
//                ⚠️ Le workflow n8n doit être ACTIF !
//                ⚠️ Le Chat Trigger doit avoir "Allowed Origins (CORS)" = votre domaine
//
// Pour les modules "webhook" :
//   webhookUrl     → L'URL du webhook n8n à appeler
//   webhookFields  → La liste des champs du formulaire
//
// TYPES DE CHAMPS DISPONIBLES :
// ─────────────────────────────
// text / email / number / textarea / select / file
// radio  → Boutons radio (utilisez options[])
// list   → Champ dynamique (utilisez listType pour l'input interne)
// file   → Fichier (accept + multiple pour plusieurs fichiers)
// =============================================================================

export const n8nModules: N8nModule[] = [
  // ─── Modules de chat n8n (widget @n8n/chat) ───────────────────────────────
  {
    id: "chat-immobilier",
    title: "Immobilier",
    description: "Assistant dédié aux recherches immobilières.",
    icon: "🏠",
    type: "chat",
    // URL du webhook POST (le widget @n8n/chat envoie les messages ici)
    webhookUrl: "https://votre-n8n.example.com/webhook/votre-workflow-data",
  },
/*  {
    id: "chat-data-analysis",
    title: "Analyse de Données",
    description: "Agent spécialisé dans l'analyse et la visualisation de données.",
    icon: "📊",
    type: "chat",
    webhookUrl: "https://votre-n8n.example.com/webhook/votre-workflow-data",
  },
  {
    id: "chat-documentation",
    title: "Documentation Technique",
    description: "Assistant pour la rédaction et la recherche documentaire.",
    icon: "📝",
    type: "chat",
    webhookUrl: "https://votre-n8n.example.com/webhook/votre-workflow-doc",
  },
  {
    id: "chat-marketing",
    title: "Marketing & SEO",
    description: "Agent spécialisé en marketing digital, SEO et stratégie de contenu.",
    icon: "📈",
    type: "chat",
    webhookUrl: "https://votre-n8n.example.com/webhook/votre-workflow-marketing",
  },*/

  // ─── Modules de formulaire Webhook ─────────────────────────────────────────
  {
    id: "webhook-contact",
    title: "Prospection Linekdin",
    description: "Envoyez un message via webhook n8n pour effectuer la prospection Linkedin",
    icon: "✉️",
    type: "webhook",
    webhookUrl: "https://votre-n8n.example.com/webhook/contact",
    webhookFields: [
      { name: "name", label: "Nom complet", type: "text", required: true, placeholder: "Jean Dupont" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "jean@exemple.com" },
      { name: "subject", label: "Sujet", type: "text", required: true, placeholder: "Sujet de votre message" },
      { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Votre message ici..." },
    ],
  },
  // ─── Démo : tous les types de champs ─────────────────────────────────────
  {
    id: "webhook-demo-complet",
    title: "Formulaire Démo (tous types)",
    description: "Démonstration de tous les types de champs disponibles.",
    icon: "🧪",
    type: "webhook",
    webhookUrl: "https://votre-n8n.example.com/webhook/demo",
    webhookFields: [
      { name: "fullName", label: "Nom complet", type: "text", required: true, placeholder: "Jean Dupont" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "jean@exemple.com" },
      { name: "age", label: "Âge", type: "number", required: true, placeholder: "30" },
      { name: "category", label: "Catégorie", type: "select", required: true, options: [
        { label: "Particulier", value: "individual" },
        { label: "Professionnel", value: "professional" },
        { label: "Association", value: "association" },
        { label: "Autre", value: "other" },
      ]},
      {
        name: "priority",
        label: "Priorité",
        type: "radio",
        required: true,
        options: [
          { label: "\ud83d\udfe2 Normal", value: "normal" },
          { label: "\ud83d\udfe1 Important", value: "important" },
          { label: "\ud83d\udd34 Urgent", value: "urgent" },
        ],
      },
      { name: "comment", label: "Commentaire", type: "textarea", required: false, placeholder: "Votre message détaillé..." },
      {
        name: "tags",
        label: "Tags",
        type: "list",
        required: false,
        placeholder: "ex: javascript",
        listType: "text",
      },
      {
        name: "attachment",
        label: "Pièces jointes",
        type: "file",
        required: false,
        multiple: true,
        accept: ".pdf,.docx,.jpg,.png,.zip",
      },
    ],
  },
/*  {
    id: "webhook-survey",
    title: "Sondage Client",
    description: "Participez à notre sondage client et aidez-nous à nous améliorer.",
    icon: "📋",
    type: "webhook",
    webhookUrl: "https://votre-n8n.example.com/webhook/survey",
    webhookFields: [
      { name: "fullName", label: "Votre nom", type: "text", required: true, placeholder: "Votre nom" },
      { name: "rating", label: "Note (1-5)", type: "number", required: true, placeholder: "5" },
      { name: "feedback", label: "Commentaire", type: "textarea", required: false, placeholder: "Partagez votre expérience..." },
      { name: "category", label: "Catégorie", type: "select", required: true, options: [
        { label: "Service client", value: "customer_service" },
        { label: "Produit", value: "product" },
        { label: "Livraison", value: "delivery" },
        { label: "Autre", value: "other" },
      ]},
    ],
  },
  {
    id: "webhook-lead",
    title: "Génération de Lead",
    description: "Formulaire de capture de leads pour votre CRM via webhook n8n.",
    icon: "🎯",
    type: "webhook",
    webhookUrl: "https://votre-n8n.example.com/webhook/lead",
    webhookFields: [
      { name: "company", label: "Entreprise", type: "text", required: true, placeholder: "Nom de votre entreprise" },
      { name: "contactName", label: "Nom du contact", type: "text", required: true, placeholder: "Votre nom" },
      { name: "email", label: "Email professionnel", type: "email", required: true, placeholder: "contact@entreprise.com" },
      { name: "phone", label: "Téléphone", type: "text", required: false, placeholder: "+33 6 12 34 56 78" },
      { name: "budget", label: "Budget estimé", type: "select", required: true, options: [
        { label: "Moins de 1k€", value: "lt_1k" },
        { label: "1k€ - 5k€", value: "1k_5k" },
        { label: "5k€ - 20k€", value: "5k_20k" },
        { label: "Plus de 20k€", value: "gt_20k" },
      ]},
      { name: "notes", label: "Notes", type: "textarea", required: false, placeholder: "Informations supplémentaires..." },
    ],
  },
  {
    id: "webhook-ticket",
    title: "Création de Ticket",
    description: "Créez un ticket de support directement via webhook n8n.",
    icon: "🎫",
    type: "webhook",
    webhookUrl: "https://votre-n8n.example.com/webhook/ticket",
    webhookFields: [
      { name: "requesterName", label: "Votre nom", type: "text", required: true, placeholder: "Votre nom" },
      { name: "requesterEmail", label: "Votre email", type: "email", required: true, placeholder: "vous@exemple.com" },
      { name: "priority", label: "Priorité", type: "select", required: true, options: [
        { label: "Basse", value: "low" },
        { label: "Moyenne", value: "medium" },
        { label: "Haute", value: "high" },
        { label: "Critique", value: "critical" },
      ]},
      { name: "title", label: "Titre du ticket", type: "text", required: true, placeholder: "Résumé du problème" },
      { name: "description", label: "Description détaillée", type: "textarea", required: true, placeholder: "Décrivez votre problème en détail..." },
    ],
  },
  {
    id: "webhook-lead-express",
    title: "Lead Express",
    description: "Capture rapide de leads avec préférences et destinataires multiples.",
    icon: "⚡",
    type: "webhook",
    webhookUrl: "https://votre-n8n.example.com/webhook/lead-express",
    webhookFields: [
      { name: "contactName", label: "Nom du contact", type: "text", required: true, placeholder: "Votre nom" },
      { name: "email", label: "Email professionnel", type: "email", required: true, placeholder: "contact@entreprise.com" },
      {
        name: "priority",
        label: "Priorité",
        type: "radio",
        required: true,
        options: [
          { label: "\ud83d\udd35 Basse", value: "low" },
          { label: "\ud83d\udfe1 Moyenne", value: "medium" },
          { label: "\ud83d\udd34 Haute", value: "high" },
          { label: "\ud83d\udfe3 Critique", value: "critical" },
        ],
      },
      { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Votre message..." },
      {
        name: "additionalEmails",
        label: "Destinataires supplémentaires",
        type: "list",
        required: false,
        placeholder: "email@exemple.com",
        listType: "email",
      },
      {
        name: "attachment",
        label: "Pièce jointe",
        type: "file",
        required: false,
        accept: ".pdf,.doc,.docx,.jpg,.png",
      },
    ],
  },*/
];

export function getModuleById(id: string): N8nModule | undefined {
  return n8nModules.find((m) => m.id === id);
}

export function getModulesByType(type: "chat" | "webhook"): N8nModule[] {
  return n8nModules.filter((m) => m.type === type && m.enabled !== false);
}
