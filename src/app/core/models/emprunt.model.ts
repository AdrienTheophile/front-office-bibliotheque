import { Livre } from './livre.model';
import { Adherent } from './adherent.model';

export enum StatutEmprunt {
  EN_COURS = 'en_cours',
  EN_RETARD = 'en_retard',
  RETOURNE = 'retourne'
}

/**
 * Modèle pour un Emprunt
 * Règles métier:
 * - Durée maximale: 15 jours
 * - Après J+15, l'emprunt est marqué "en retard"
 * - Ne peut pas réserver un livre déjà emprunté
 */
export interface Emprunt {
  id: number;
  livre: Livre;
  adherent: Adherent;
  dateEmprunt: Date;
  dateLimiteRetour: Date; // dateEmprunt + 15 jours
  dateRetourEffective?: Date; // undefined si non retourné
  statut: StatutEmprunt;
}
