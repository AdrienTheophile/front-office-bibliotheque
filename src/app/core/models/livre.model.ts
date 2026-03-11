import { Auteur } from './auteur.model';
import { Categorie } from './categorie.model';
import { Emprunt } from './emprunt.model';
import { Reservation } from './reservation.model';

/** Enums pour les énumérations */
export enum Langue {
  Français = 'Français',
  English = 'English',
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
  synopsis?: string;
  disponible?: boolean;
  reserve?: boolean;
  emprunts?: Emprunt[];
  reservations?: Reservation;
}

/**
 * Un livre est disponible s'il n'est ni emprunté ni réservé.
 */
export function estDisponible(livre: Livre): boolean {
  if (livre.disponible !== undefined && livre.disponible !== null) {
    return livre.disponible && !estReserve(livre);
  }
  if (!livre.emprunts || livre.emprunts.length === 0) return !estReserve(livre);
  const pasEmprunte = livre.emprunts.every(
    (e) => e.dateRetourReel != null && e.dateRetourReel !== undefined,
  );
  return pasEmprunte && !estReserve(livre);
}

/**
 * Un livre est réservé si l'API retourne reserve=true.
 */
export function estReserve(livre: Livre): boolean {
  return livre.reserve === true;
}

/**
 * Un livre est emprunté (non disponible ET pas juste réservé).
 */
export function estEmprunte(livre: Livre): boolean {
  if (livre.disponible !== undefined && livre.disponible !== null) {
    return !livre.disponible;
  }
  if (!livre.emprunts || livre.emprunts.length === 0) return false;
  return livre.emprunts.some((e) => e.dateRetourReel == null);
}
