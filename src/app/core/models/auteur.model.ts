import { Livre } from './livre.model';

/**
 * Interface Auteur correspondant à l'API Symfony
 */
export interface Auteur {
  idAut: number;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  dateDeces?: string | null;
  nationalite?: string;
  photo?: string;
  description?: string;
  livres?: Livre[];
}
