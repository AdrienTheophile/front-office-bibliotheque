import { Livre } from './livre.model';
import { Adherent } from './adherent.model';

export enum StatutReservation {
  ACTIVE = 'active',
  EXPIREE = 'expiree',
  CONVERTIE_EN_EMPRUNT = 'convertie_en_emprunt',
  ANNULEE = 'annulee'
}

/**
 * Modèle pour une Réservation
 * Règles métier:
 * - Maximum 3 réservations simultanées par adhérent
 * - Une réservation expire après 7 jours
 * - Ne peut pas réserver un livre déjà réservé par un autre adhérent
 * - Ne peut pas réserver un livre actuellement emprunté
 */
export interface Reservation {
  id: number;
  livre: Livre;
  adherent: Adherent;
  dateCreation: Date;
  dateExpiration: Date; // dateCreation + 7 jours
  statut: StatutReservation;
}
