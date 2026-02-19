import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Emprunt, StatutEmprunt, PaginatedResponse } from '../models';
import { Auth } from './auth';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const API_URL = 'http://localhost:8000/api';
const DUREE_EMPRUNT_JOURS = 15;

@Injectable({
  providedIn: 'root'
})
export class EmpruntService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(Auth);

  // Signaux de données
  private readonly mesEmpruntsSignal = signal<Emprunt[]>([]);
  private readonly chargementSignal = signal(false);
  private readonly erreurSignal = signal<string | null>(null);

  // Computed: emprunts actifs
  readonly empruntsActifs = computed(() =>
    this.mesEmpruntsSignal().filter(
      (e) => e.statut === StatutEmprunt.EN_COURS || e.statut === StatutEmprunt.EN_RETARD
    )
  );

  // Computed: emprunts en retard
  readonly empruntsEnRetard = computed(() =>
    this.mesEmpruntsSignal().filter((e) => e.statut === StatutEmprunt.EN_RETARD)
  );

  // Computed: emprunts à jour
  readonly empruntsAJour = computed(() =>
    this.mesEmpruntsSignal().filter((e) => e.statut === StatutEmprunt.EN_COURS)
  );

  // Computed: emprunts retournés
  readonly empruntsRetournes = computed(() =>
    this.mesEmpruntsSignal().filter((e) => e.statut === StatutEmprunt.RETOURNE)
  );

  // Computed: nombre d'emprunts actifs
  readonly nombreEmpruntsActifs = computed(() => this.empruntsActifs().length);
  readonly chargement = computed(() => this.chargementSignal());
  readonly erreur = computed(() => this.erreurSignal());

  /**
   * Charge les emprunts de l'adhérent courant
   */
  chargerMesEmprunts(): Observable<Emprunt[]> {
    this.chargementSignal.set(true);
    this.erreurSignal.set(null);

    const adherent = this.authService.obtenirAdherent();
    if (!adherent) {
      this.erreurSignal.set('Utilisateur non authentifié');
      this.chargementSignal.set(false);
      return new Observable((observer) => observer.error('Non authentifié'));
    }

    return this.http.get<Emprunt[]>(`${API_URL}/adherents/${adherent.id}/emprunts`).pipe(
      tap({
        next: (emprunts) => {
          this.mesEmpruntsSignal.set(emprunts);
          this.chargementSignal.set(false);
        },
        error: (erreur) => {
          this.erreurSignal.set('Erreur lors du chargement des emprunts');
          this.chargementSignal.set(false);
          console.error('Erreur chargerMesEmprunts:', erreur);
        }
      })
    );
  }

  /**
   * Récupère les emprunts actifs pour un livre
   * (utilisé pour empêcher les réservations sur les livres empruntés)
   */
  obtenirEmpruntsActifsDuLivre(livreId: number): Observable<Emprunt[]> {
    return this.http.get<Emprunt[]>(`${API_URL}/livres/${livreId}/emprunts-actifs`);
  }

  /**
   * Récupère tous les emprunts (pour les bibliothécaires/responsables)
   */
  obtenirTousLesEmprunts(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Emprunt>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Emprunt>>(`${API_URL}/emprunts`, { params });
  }

  /**
   * Récupère tous les emprunts en retard (pour les bibliothécaires/responsables)
   */
  obtenirEmpruntsEnRetard(): Observable<Emprunt[]> {
    return this.http.get<Emprunt[]>(`${API_URL}/emprunts/en-retard`);
  }

  /**
   * Obtient les emprunts actifs (pour les bibliothecaires)
   */
  obtenirEmpruntsActifs(): Observable<Emprunt[]> {
    return this.http.get<Emprunt[]>(`${API_URL}/emprunts/actifs`);
  }

  /**
   * Retourne un emprunt
   */
  retournerEmprunt(empruntId: number): Observable<Emprunt> {
    const adherent = this.authService.obtenirAdherent();
    if (!adherent) {
      return new Observable((observer) => observer.error('Non authentifié'));
    }

    const dateRetour = new Date().toISOString();
    return this.http.put<Emprunt>(`${API_URL}/emprunts/${empruntId}/retourner`, { dateRetour }).pipe(
      tap({
        next: (empruntMisAJour) => {
          this.mesEmpruntsSignal.update((courant) =>
            courant.map((e) => (e.idEmprunt === empruntId ? empruntMisAJour : e))
          );
        },
        error: (erreur) => {
          this.erreurSignal.set('Erreur lors du retour de l\'emprunt');
          console.error('Erreur retournerEmprunt:', erreur);
        }
      })
    );
  }

  /**
   * Crée un emprunt (emprunter un livre)
   */
  emprunterLivre(livreId: number): Observable<Emprunt> {
    const adherent = this.authService.obtenirAdherent();
    if (!adherent) {
      return new Observable((observer) => observer.error('Non authentifié'));
    }

    return this.http.post<Emprunt>(`${API_URL}/adherents/${adherent.id}/emprunts`, { livreId }).pipe(
      tap({
        next: (nouvelEmprunt) => {
          this.mesEmpruntsSignal.update((courant) => [...courant, nouvelEmprunt]);
        },
        error: (erreur) => {
          this.erreurSignal.set('Erreur lors de l\'emprunt du livre');
          console.error('Erreur emprunterLivre:', erreur);
        }
      })
    );
  }

  /**
   * Vérifie si un livre peut être emprunté
   * (ne pas emprunter si déjà emprunté par l'adhérent)
   */
  peutEmprinterLivre(livreId: number): boolean {
    return !this.mesEmpruntsSignal().some(
      (e) =>
        e.livre.idLivre === livreId &&
        (e.statut === StatutEmprunt.EN_COURS || e.statut === StatutEmprunt.EN_RETARD)
    );
  }

  /**
   * Vérifie si un emprunt est en retard
   */
  estEnRetard(emprunt: Emprunt): boolean {
    if (emprunt.statut === StatutEmprunt.RETOURNE) return false;
    const maintenant = new Date();
    return maintenant > new Date(emprunt.dateLimiteRetour);
  }

  /**
   * Calcule les jours restants avant la date limite de retour
   */
  obtenirJoursAvantLimite(emprunt: Emprunt): number {
    const maintenant = new Date();
    const dateLimit = new Date(emprunt.dateLimiteRetour);
    const diffMs = dateLimit.getTime() - maintenant.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
