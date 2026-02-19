import { Livre } from './livre.model';

export interface Categorie {
  idCat: number;
  nom: string;
  description?: string;
  livres?: Livre[];
}
