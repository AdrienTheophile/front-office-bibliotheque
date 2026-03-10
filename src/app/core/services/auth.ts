import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Adherent, Identifiants, ReponseAuth, RoleUtilisateur } from '../models';
import { tap } from 'rxjs/operators';

// Configuration de l'API
const API_URL = 'http://localhost:8008/api';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly CLE_JWT = 'auth_token';
  private readonly CLE_ADHERENT = 'auth_adherent';

  // Signaux d'authentification
  private readonly adherentActuelSignal = signal<Adherent | null>(this.chargerAdherentDuStockage());
  private readonly tokenSignal = signal<string | null>(this.obtenirTokenDuStockage());
  private readonly chargementSignal = signal(false);
  private readonly erreurSignal = signal<string | null>(null);

  // Computed pour savoir si l'utilisateur est authentifié
  readonly estAuthentifie = computed(() => this.tokenSignal() !== null);
  readonly adherentActuel = computed(() => this.adherentActuelSignal());
  readonly chargement = computed(() => this.chargementSignal());
  readonly erreur = computed(() => this.erreurSignal());

  constructor() {
    this.initialiserDuStockage();
  }

  /**
   * Initialise le service depuis le localStorage
   */
  private initialiserDuStockage(): void {
    const token = this.obtenirTokenDuStockage();
    const adherent = this.chargerAdherentDuStockage();

    if (token && adherent) {
      this.tokenSignal.set(token);
      this.adherentActuelSignal.set(adherent);
    }
  }

  /**
   * Récupère le token du localStorage
   */
  private obtenirTokenDuStockage(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.CLE_JWT);
  }

  /**
   * Charge l'adhérent du localStorage
   */
  private chargerAdherentDuStockage(): Adherent | null {
    if (typeof localStorage === 'undefined') return null;
    const adherentStr = localStorage.getItem(this.CLE_ADHERENT);
    return adherentStr ? JSON.parse(adherentStr) : null;
  }

  /**
   * Sauvegarde le token dans le localStorage
   */
  private sauvegarderTokenAuStockage(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CLE_JWT, token);
    }
  }

  /**
   * Sauvegarde l'adhérent dans le localStorage
   */
  private sauvegarderAdherentAuStockage(adherent: Adherent): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CLE_ADHERENT, JSON.stringify(adherent));
    }
  }

  /**
   * Authentifie un adhérent (connexion)
   */
  seConnecter(identifiants: Identifiants) {
    this.chargementSignal.set(true);
    this.erreurSignal.set(null);

    console.log('🔐 Tentative connexion:', identifiants.email);

    return this.http.post<ReponseAuth>(`${API_URL}/auth/connexion`, identifiants).pipe(
      tap({
        next: (reponse) => {
          console.log('✅ Connexion réussie:', reponse.utilisateur);
          this.tokenSignal.set(reponse.token);
          
          // Déterminer le rôle basé sur les rôles Symfony
          let role = RoleUtilisateur.ADHERENT;
          if (reponse.utilisateur.roles.includes('ROLE_BIBLIO')) {
            role = RoleUtilisateur.BIBLIOTHECAIRE;
          } else if (reponse.utilisateur.roles.includes('ROLE_ADMIN')) {
            role = RoleUtilisateur.RESPONSABLE;
          }
          
          // Créer un objet Adherent à partir de la réponse
          const adherent: Adherent = {
            id: reponse.adherent?.id || 0,
            prenom: reponse.utilisateur.prenom,
            nom: reponse.utilisateur.nom,
            email: reponse.utilisateur.email,
            role: role,
            dateAdhesion: reponse.adherent?.dateAdhesion ? new Date(reponse.adherent.dateAdhesion) : new Date(),
            telephone: undefined,
            adresse: undefined
          };
          
          this.adherentActuelSignal.set(adherent);
          this.sauvegarderTokenAuStockage(reponse.token);
          this.sauvegarderAdherentAuStockage(adherent);
          this.chargementSignal.set(false);
          this.router.navigate(['/tableau-de-bord']);
        },
        error: (erreur) => {
          console.error('❌ Erreur connexion:', erreur);
          let messageErreur = 'Erreur d\'authentification: vérifiez vos identifiants';
          if (erreur.status === 401) {
            messageErreur = 'Email ou mot de passe incorrect';
          } else if (erreur.statusText === 'Unknown Error') {
            messageErreur = 'Impossible de joindre le serveur. Vérifiez que le backend est actif sur http://localhost:8008';
          }
          this.erreurSignal.set(messageErreur);
          this.chargementSignal.set(false);
        }
      })
    );
  }

  /**
   * Inscrit un nouvel adhérent
   */
  inscrire(donneesInscription: any) {
    this.chargementSignal.set(true);
    this.erreurSignal.set(null);

    console.log('📝 Envoi inscription:', donneesInscription);

    return this.http.post<any>(`${API_URL}/auth/inscription`, donneesInscription).pipe(
      tap({
        next: (reponse) => {
          console.log('✅ Inscription réussie:', reponse);
          this.chargementSignal.set(false);
          // Naviguer vers la connexion après un court délai
          setTimeout(() => {
            this.router.navigate(['/connexion']);
          }, 1500);
        },
        error: (erreur) => {
          console.error('❌ Erreur inscription:', erreur);
          let messageErreur = 'Erreur lors de l\'inscription';
          if (erreur.error?.email) {
            messageErreur = erreur.error.email;
          } else if (erreur.error?.error) {
            messageErreur = erreur.error.error;
          } else if (erreur.statusText === 'Unknown Error') {
            messageErreur = 'Impossible de joindre le serveur. Vérifiez que le backend est actif sur http://localhost:8008';
          }
          this.erreurSignal.set(messageErreur);
          this.chargementSignal.set(false);
        }
      })
    );
  }

  /**
   * Déconnexion de l'adhérent
   */
  seDeconnecter(): void {
    this.tokenSignal.set(null);
    this.adherentActuelSignal.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.CLE_JWT);
      localStorage.removeItem(this.CLE_ADHERENT);
    }

    this.router.navigate(['/connexion']);
  }

  /**
   * Récupère le token courant
   */
  obtenirToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Récupère l'adhérent courant
   */
  obtenirAdherent(): Adherent | null {
    return this.adherentActuelSignal();
  }

  /**
   * Vérifie si l'adhérent a un rôle spécifique
   */
  aLeRole(role: string): boolean {
    return this.adherentActuelSignal()?.role === role;
  }

  /**
   * Vérifie si l'adhérent a l'un des rôles spécifiés
   */
  aLunDesRoles(roles: string[]): boolean {
    const adherent = this.adherentActuelSignal();
    return adherent ? roles.includes(adherent.role) : false;
  }

  /**
   * Vérifie si l'adhérent est une bibliothécaire
   */
  estBibliothecaire(): boolean {
    return this.aLeRole('bibliothecaire');
  }

  /**
   * Vérifie si l'adhérent est responsable
   */
  estResponsable(): boolean {
    return this.aLeRole('responsable');
  }

  /**
   * Vérifie si l'adhérent est adhérent simple
   */
  estAdherent(): boolean {
    return this.aLeRole('adherent');
  }
}
