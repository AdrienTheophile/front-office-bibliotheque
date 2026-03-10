export enum RoleUtilisateur {
  ADHERENT = 'ROLE_ADHERENT',
  BIBLIOTHECAIRE = 'ROLE_BIBLIO',
  RESPONSABLE = 'ROLE_ADMIN'
}

/**
 * Profil utilisateur tel que retourné par GET /api/user/me
 */
export interface Adherent {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  roles: string[];
  adherent?: {
    id: number;
    dateAdhesion: string;
    numTel?: string;
    adressePostale?: string;
    estActif?: boolean;
  } | null;
}

/**
 * Body envoyé à POST /api/login
 */
export interface Identifiants {
  email: string;
  password: string;
}

/**
 * Réponse de Lexik JWT: POST /api/login
 */
export interface ReponseAuth {
  token: string;
}
