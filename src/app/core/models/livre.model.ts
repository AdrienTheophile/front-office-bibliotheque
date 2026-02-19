import { Auteur } from './auteur.model';
import { Categorie } from './categorie.model';
import { Emprunt } from './emprunt.model';
import { Reservation } from './reservation.model';

/** Enums pour les énumérations */
export enum Langue {
  FR = 'FR',
  EN = 'EN'
}

/**
 * Interface Livre correspondant à l'API Symfony
 */
export interface Livre {
  idLivre: number;
  titre: string;
  dateSortie: string;
  langue: Langue;
  photoCouverture?: string;
  auteurs: Auteur[];
  categories: Categorie[];
  description?: string;
  emprunts?: Emprunt[];
  reservations?: Reservation;
}

/**
 * Computed: un livre est disponible si aucun emprunt actif
 */
export function estDisponible(livre: Livre): boolean {
  if (!livre.emprunts || livre.emprunts.length === 0) return true;
  return livre.emprunts.every(e => e.dateRetourReel !== null);
}
