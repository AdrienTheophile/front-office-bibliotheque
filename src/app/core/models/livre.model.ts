import { Auteur } from './auteur.model';

export enum Categorielivre {
  SF = 'SF',
  DYSTOPIE = 'Dystopie',
  JEUNESSE = 'Jeunesse',
  ROMAN = 'Roman',
  ESSAI = 'Essai',
  INFORMATIQUE = 'Informatique'
}

export enum Langue {
  FR = 'FR',
  EN = 'EN'
}

export enum StatutLivre {
  DISPONIBLE = 'disponible',
  EMPRUNTE = 'emprunte',
  RESERVE = 'reserve'
}

export interface Livre {
  id: number;
  titre: string;
  auteur: Auteur;
  annee: number;
  langue: Langue;
  categorie: Categorielivre;
  description?: string;
  statut: StatutLivre;
  nombreExemplaires: number;
}
