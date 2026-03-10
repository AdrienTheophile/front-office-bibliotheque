export enum RoleUtilisateur {
  ADHERENT = 'adherent',
  BIBLIOTHECAIRE = 'bibliothecaire',
  RESPONSABLE = 'responsable'
}

export interface Adherent {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  dateAdhesion: Date;
  telephone?: string;
  adresse?: string;
}

export interface Identifiants {
  email: string;
  motDePasse: string;
}

export interface ReponseAuth {
  token: string;
  utilisateur: {
    email: string;
    nom: string;
    prenom: string;
    roles: string[];
  };
  adherent: Adherent | null;
}
