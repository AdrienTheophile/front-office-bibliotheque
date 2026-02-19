import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Adherent, Identifiants, ReponseAuth } from '../models';
import { tap } from 'rxjs/operators';

// Configuration de l'API
const API_URL = 'http://localhost:8000/api';

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

    return this.http.post<ReponseAuth>(`${API_URL}/auth/connexion`, identifiants).pipe(
      tap({
        next: (reponse) => {
          this.tokenSignal.set(reponse.token);
          this.adherentActuelSignal.set(reponse.adherent);
          this.sauvegarderTokenAuStockage(reponse.token);
          this.sauvegarderAdherentAuStockage(reponse.adherent);
          this.chargementSignal.set(false);
          this.router.navigate(['/tableau-de-bord']);
        },
        error: (erreur) => {
          this.erreurSignal.set('Erreur d\'authentification: vérifiez vos identifiants');
          this.chargementSignal.set(false);
          console.error('Erreur d\'authentification:', erreur);
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

    return this.http.post<Adherent>(`${API_URL}/auth/inscription`, donneesInscription).pipe(
      tap({
        next: (adherent) => {
          this.chargementSignal.set(false);
          this.router.navigate(['/connexion']);
        },
        error: (erreur) => {
          this.erreurSignal.set('Erreur d\'inscription');
          this.chargementSignal.set(false);
          console.error('Erreur d\'inscription:', erreur);
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
