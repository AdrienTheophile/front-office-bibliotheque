import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Adherent, Identifiants, ReponseAuth } from '../models';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

// Configuration de l'API
const API_URL = 'https://localhost:8008/api';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly CLE_JWT = 'auth_token';
  private readonly CLE_ADHERENT = 'auth_adherent';

  private readonly adherentActuelSignal = signal<Adherent | null>(this.chargerAdherentDuStockage());
  private readonly tokenSignal = signal<string | null>(this.obtenirTokenDuStockage());
  private readonly chargementSignal = signal(false);
  private readonly erreurSignal = signal<string | null>(null);

  readonly estAuthentifie = computed(() => this.tokenSignal() !== null);
  readonly adherentActuel = computed(() => this.adherentActuelSignal());
  readonly chargement = computed(() => this.chargementSignal());
  readonly erreur = computed(() => this.erreurSignal());
  readonly estAdherent = computed(() => this.adherentActuelSignal()?.adherent != null);
  readonly estSuspendu = computed(() => this.adherentActuelSignal()?.adherent?.estActif === false);

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
   * Connexion : POST /api/login puis GET /api/user/me
   */
  seConnecter(identifiants: Identifiants) {
    this.chargementSignal.set(true);
    this.erreurSignal.set(null);

    return this.http.post<ReponseAuth>(`${API_URL}/login`, identifiants).pipe(
      tap(reponse => {
        this.tokenSignal.set(reponse.token);
        this.sauvegarderTokenAuStockage(reponse.token);
      }),
      switchMap(() => this.http.get<Adherent>(`${API_URL}/user/me`)),
      tap((utilisateur) => {
        if (utilisateur.adherent && utilisateur.adherent.estActif === false) {
          throw new Error('ACCOUNT_SUSPENDED');
        }
      }),
      tap((utilisateur) => {
        this.adherentActuelSignal.set(utilisateur);
        this.sauvegarderAdherentAuStockage(utilisateur);
        this.chargementSignal.set(false);
        this.router.navigate(['/tableau-de-bord']);
      }),
      catchError((erreur) => {
        let msg = 'Erreur d\'authentification: vérifiez vos identifiants';
        if (erreur.message === 'ACCOUNT_SUSPENDED') {
          msg = 'Votre compte adhérent est suspendu. Veuillez contacter la bibliothèque pour réactiver votre compte.';
        } else if (erreur.status === 401) {
          msg = 'Email ou mot de passe incorrect';
        } else if (erreur.status === 0) {
          msg = 'Impossible de joindre le serveur (https://localhost:8008)';
        }
        this.erreurSignal.set(msg);
        this.chargementSignal.set(false);
        this.tokenSignal.set(null);
        localStorage.removeItem(this.CLE_JWT);
        return throwError(() => new Error(msg));
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
   * Mise à jour du profil (PATCH /api/user/me)
   */
  mettreAJourProfil(donnees: Record<string, any>): Observable<any> {
    return this.http.patch<any>(`${API_URL}/user/me`, donnees);
  }

  /**
   * Rafraîchit le profil depuis le serveur
   */
  rafraichirProfil(): Observable<Adherent> {
    return this.http.get<Adherent>(`${API_URL}/user/me`).pipe(
      tap((utilisateur) => {
        this.adherentActuelSignal.set(utilisateur);
        this.sauvegarderAdherentAuStockage(utilisateur);
      })
    );
  }
}
