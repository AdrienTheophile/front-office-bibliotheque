import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Adherent, Identifiants, ReponseAuth } from '../models';
import { tap, switchMap } from 'rxjs/operators';

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

  // Computed
  readonly estAuthentifie = computed(() => this.tokenSignal() !== null);
  readonly adherentActuel = computed(() => this.adherentActuelSignal());
  readonly chargement = computed(() => this.chargementSignal());
  readonly erreur = computed(() => this.erreurSignal());
  readonly estAdherent = computed(() => this.adherentActuelSignal()?.adherent != null);

  constructor() {
    this.initialiserDuStockage();
  }

  private initialiserDuStockage(): void {
    const token = this.obtenirTokenDuStockage();
    const adherent = this.chargerAdherentDuStockage();
    if (token && adherent) {
      this.tokenSignal.set(token);
      this.adherentActuelSignal.set(adherent);
    }
  }

  private obtenirTokenDuStockage(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.CLE_JWT);
  }

  private chargerAdherentDuStockage(): Adherent | null {
    if (typeof localStorage === 'undefined') return null;
    const str = localStorage.getItem(this.CLE_ADHERENT);
    return str ? JSON.parse(str) : null;
  }

  private sauvegarderTokenAuStockage(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CLE_JWT, token);
    }
  }

  private sauvegarderAdherentAuStockage(adherent: Adherent): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CLE_ADHERENT, JSON.stringify(adherent));
    }
  }

  /**
   * Connexion: POST /api/login → { token }
   * Puis: GET /api/user/me → infos utilisateur
   */
  seConnecter(identifiants: Identifiants) {
    this.chargementSignal.set(true);
    this.erreurSignal.set(null);

    return this.http.post<ReponseAuth>(`${API_URL}/login`, identifiants).pipe(
      tap(reponse => {
        // Stocker le token immédiatement pour que l'intercepteur le trouve
        this.tokenSignal.set(reponse.token);
        this.sauvegarderTokenAuStockage(reponse.token);
      }),
      // Enchaîner avec GET /api/user/me pour récupérer le profil
      switchMap(() => this.http.get<Adherent>(`${API_URL}/user/me`)),
      tap({
        next: (utilisateur) => {
          this.adherentActuelSignal.set(utilisateur);
          this.sauvegarderAdherentAuStockage(utilisateur);
          this.chargementSignal.set(false);
          this.router.navigate(['/tableau-de-bord']);
        },
        error: (erreur) => {
          let msg = 'Erreur d\'authentification: vérifiez vos identifiants';
          if (erreur.status === 401) {
            msg = 'Email ou mot de passe incorrect';
          } else if (erreur.status === 0) {
            msg = 'Impossible de joindre le serveur (http://localhost:8008)';
          }
          this.erreurSignal.set(msg);
          this.chargementSignal.set(false);
          // Nettoyer le token si le login a échoué
          this.tokenSignal.set(null);
          localStorage.removeItem(this.CLE_JWT);
        }
      })
    );
  }

  /**
   * Déconnexion
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
   * Vérifie si l'utilisateur a un rôle
   */
  aLeRole(role: string): boolean {
    return this.adherentActuelSignal()?.roles?.includes(role) ?? false;
  }

  /**
   * Vérifie si l'utilisateur a l'un des rôles
   */
  aLunDesRoles(roles: string[]): boolean {
    const user = this.adherentActuelSignal();
    return user ? roles.some(r => user.roles?.includes(r)) : false;
  }

  /**
   * Met à jour le profil via PATCH /api/user/me
   */
  mettreAJourProfil(donnees: Record<string, any>) {
    return this.http.patch<Adherent>(`${API_URL}/user/me`, donnees).pipe(
      tap((utilisateur) => {
        this.adherentActuelSignal.set(utilisateur);
        this.sauvegarderAdherentAuStockage(utilisateur);
      })
    );
  }
}
