/**
 * Interface pour les réponses paginées de l'API
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  pages: number;
  page: number;
  limit: number;
}

/**
 * Interface pour les paramètres de pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Interface pour la recherche avancée
 */
export interface RechercheLivreParams {
  titre?: string;
  auteur?: number;
  categorie?: number;
  langue?: string;
  dateMin?: string;
  dateMax?: string;
  page?: number;
  limit?: number;
}
