import { Livre } from './livre.model';
import { Adherent } from './adherent.model';

export enum StatutEmprunt {
  EN_COURS = 'en_cours',
  EN_RETARD = 'en_retard',
  RETOURNE = 'retourne'
}

export interface Emprunt {
  idEmprunt: number;
  idEmp: number; // Alias pour idEmprunt (obligatoire)
  livre: Livre;
  adherent: Adherent;
  dateEmprunt: string;
  dateLimiteRetour: string;
  dateRetour: string; // Alias pour dateLimiteRetour
  dateRetourReel?: string | null; // Alias pour dateRetourEffective
  dateRetourEffective?: string | null;
  statut: StatutEmprunt;
}
