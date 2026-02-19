import { Livre } from './livre.model';
import { Adherent } from './adherent.model';

export enum StatutReservation {
  ACTIVE = 'active',
  EXPIREE = 'expiree',
  CONVERTIE_EN_EMPRUNT = 'convertie_en_emprunt',
  ANNULEE = 'annulee'
}

export interface Reservation {
  idReservation: number;
  idResa: number; // Alias pour idReservation (obligatoire)
  livre: Livre;
  adherent: Adherent;
  dateCreation: string;
  dateResa: string; // Alias pour dateCreation
  dateExpiration: string;
  statut: StatutReservation;
}
