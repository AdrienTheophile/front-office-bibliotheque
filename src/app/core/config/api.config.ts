/**
 * Configuration centralisée pour l'API Symfony
 */

// URL de base de l'API
export const API_CONFIG = {
  // URL de base (remplacez par votre URL réelle en production)
  BASE_URL: 'http://localhost:8000/api',

  // Routes des livres
  LIVRES: '/livres',
  LIVRES_PAR_ID: (id: number) => `/livres/${id}`,
  RECHERCHE_LIVRES: '/recherche',

  // Routes des auteurs
  AUTEURS: '/auteurs',
  AUTEURS_PAR_ID: (id: number) => `/auteurs/${id}`,

  // Routes des catégories
  CATEGORIES: '/categories',
  CATEGORIES_PAR_ID: (id: number) => `/categories/${id}`,

  // Routes d'authentification
  AUTH_CONNEXION: '/auth/connexion',
  AUTH_INSCRIPTION: '/auth/inscription',

  // Routes des emprunts
  EMPRUNTS: '/emprunts',
  EMPRUNTS_PAR_ID: (id: number) => `/emprunts/${id}`,

  // Routes des réservations
  RESERVATIONS: '/reservations',
  RESERVATIONS_PAR_ID: (id: number) => `/reservations/${id}`,

  // Routes des adhérents
  ADHERENTS: '/adherents',
  ADHERENTS_PAR_ID: (id: number) => `/adherents/${id}`,
};

/**
 * Paramètres par défaut de pagination
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 50
};

/**
 * Rôles disponibles
 */
export enum UserRole {
  ADHERENT = 'adherent',
  BIBLIOTHECAIRE = 'bibliothecaire',
  RESPONSABLE = 'responsable'
}

/**
 * Clés du localStorage
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'auth_adherent'
};
