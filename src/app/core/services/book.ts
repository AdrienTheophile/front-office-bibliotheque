import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Livre,
  PaginatedResponse,
  RechercheLivreParams,
  Langue,
  Categorie,
  Auteur,
} from '../models';
import { Observable } from 'rxjs';
import { tap, shareReplay, map } from 'rxjs/operators';

// Configuration de l'API Symfony
const API_URL = 'https://localhost:8008/api';

@Injectable({
  providedIn: 'root',
})
export class LivreService {
  private readonly http = inject(HttpClient);

  private readonly livresSignal = signal<Livre[]>([]);
  private readonly livrSelectionneSignal = signal<Livre | null>(null);
  private readonly paginationSignal = signal({ page: 1, limit: 10, total: 0, pages: 0 });
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  private auteurCache$: Observable<Auteur[]> | null = null;
  private categorieCache$: Observable<Categorie[]> | null = null;

  private readonly filtreLangueSignal = signal<Langue | null>(null);
  private readonly filtreCategoriIdSignal = signal<number | null>(null);
  private readonly rechercheTitreSignal = signal<string>('');
  private readonly filtreAuteurIdSignal = signal<number | null>(null);
  private readonly filtreDateMinSignal = signal<string | null>(null);
  private readonly filtreDateMaxSignal = signal<string | null>(null);

  // ===== COMPUTED SIGNALS =====
  readonly livresFiltres = computed(() => this.livresSignal());
  readonly livrSelectionne = computed(() => this.livrSelectionneSignal());
  readonly pagination = computed(() => this.paginationSignal());
  readonly chargement = computed(() => this.loadingSignal());
  readonly erreur = computed(() => this.errorSignal());
  chargerLivres(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Livre>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Livre>>(`${API_URL}/livres`, { params }).pipe(
      tap({
        next: (reponse) => {
          this.livresSignal.set(reponse.items);
          this.paginationSignal.set({
            page: reponse.page,
            limit: reponse.limit,
            total: reponse.total,
            pages: reponse.pages,
          });
          this.loadingSignal.set(false);
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors du chargement des livres');
          this.loadingSignal.set(false);
        },
      }),
    );
  }

  /**
   * Recherche avancée de livres
   */
  rechercherLivres(filtres: RechercheLivreParams): Observable<Livre[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    let params = new HttpParams();

    if (filtres.titre) params = params.set('titre', filtres.titre);
    if (filtres.auteur) params = params.set('auteur', filtres.auteur.toString());
    if (filtres.categorie) params = params.set('categorie', filtres.categorie.toString());
    if (filtres.langue) params = params.set('langue', filtres.langue);
    if (filtres.dateMin) params = params.set('dateMin', filtres.dateMin);
    if (filtres.dateMax) params = params.set('dateMax', filtres.dateMax);

    return this.http.get<Livre[]>(`${API_URL}/recherche`, { params }).pipe(
      tap({
        next: (livres) => {
          this.livresSignal.set(livres);
          this.paginationSignal.set({
            page: 1,
            limit: livres.length,
            total: livres.length,
            pages: 1,
          });
          this.loadingSignal.set(false);
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors de la recherche');
          this.loadingSignal.set(false);
        },
      }),
    );
  }

  /**
   * Récupère un livre par ID
   */
  obtenirLivreParId(id: number): Observable<Livre> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Livre>(`${API_URL}/livres/${id}`).pipe(
      tap({
        next: (livre) => this.loadingSignal.set(false),
        error: (erreur) => {
          this.errorSignal.set('Erreur lors de la récupération du livre');
          this.loadingSignal.set(false);
        },
      }),
    );
  }

  /**
   * Sélectionne un livre
   */
  selectionnerLivre(livre: Livre | null): void {
    this.livrSelectionneSignal.set(livre);
  }

  appliquerFiltres(title?: string, auteurId?: number, categorieId?: number, langue?: string, dateMin?: string, dateMax?: string): void {
    if (title !== undefined) this.rechercheTitreSignal.set(title);
    if (auteurId !== undefined) this.filtreAuteurIdSignal.set(auteurId);
    if (categorieId !== undefined) this.filtreCategoriIdSignal.set(categorieId);
    if (dateMin !== undefined) this.filtreDateMinSignal.set(dateMin || null);
    if (dateMax !== undefined) this.filtreDateMaxSignal.set(dateMax || null);
    if (langue !== undefined) {
      this.filtreLangueSignal.set(langue && langue.length > 0 ? (langue as Langue) : null);
    }

    this.executerRechercheAvecFiltres();
  }

  private executerRechercheAvecFiltres(): void {
    const filtres: RechercheLivreParams = {
      page: this.paginationSignal().page,
      limit: this.paginationSignal().limit,
    };

    if (this.rechercheTitreSignal()) filtres.titre = this.rechercheTitreSignal();
    if (this.filtreAuteurIdSignal()) filtres.auteur = this.filtreAuteurIdSignal()!;
    if (this.filtreCategoriIdSignal()) filtres.categorie = this.filtreCategoriIdSignal()!;
    if (this.filtreLangueSignal()) filtres.langue = this.filtreLangueSignal()!;
    if (this.filtreDateMinSignal()) filtres.dateMin = this.filtreDateMinSignal()!;
    if (this.filtreDateMaxSignal()) filtres.dateMax = this.filtreDateMaxSignal()!;

    // S'il y a au moins un filtre actif, utiliser la recherche avancée
    const hasActiveFilters = !!(
      filtres.titre ||
      filtres.auteur ||
      filtres.categorie ||
      filtres.langue ||
      filtres.dateMin ||
      filtres.dateMax
    );

    if (hasActiveFilters) {
      this.rechercherLivres(filtres).subscribe();
    } else {
      this.chargerLivres(1, 20).subscribe();
    }
  }

  reinitialiserFiltres(): void {
    this.rechercheTitreSignal.set('');
    this.filtreAuteurIdSignal.set(null);
    this.filtreCategoriIdSignal.set(null);
    this.filtreLangueSignal.set(null);
    this.filtreDateMinSignal.set(null);
    this.filtreDateMaxSignal.set(null);
    this.paginationSignal.set({ page: 1, limit: 20, total: 0, pages: 0 });
  }

  obtenirFiltres() {
    return {
      titre: this.rechercheTitreSignal(),
      auteur: this.filtreAuteurIdSignal(),
      categorie: this.filtreCategoriIdSignal(),
      langue: this.filtreLangueSignal(),
    };
  }

  obtenirAuteurs(): Observable<Auteur[]> {
    if (!this.auteurCache$) {
      this.auteurCache$ = this.http.get<Auteur[]>(`${API_URL}/auteurs`).pipe(
        shareReplay(1),
        tap({
          error: () => {
            this.auteurCache$ = null;
          },
        }),
      );
    }
    return this.auteurCache$;
  }

  obtenirAuteurParId(id: number): Observable<Auteur> {
    return this.http.get<Auteur>(`${API_URL}/auteurs/${id}`);
  }

  obtenirCategories(): Observable<Categorie[]> {
    if (!this.categorieCache$) {
      this.categorieCache$ = this.http.get<Categorie[]>(`${API_URL}/categories`).pipe(
        shareReplay(1),
        tap({
          error: () => {
            this.categorieCache$ = null;
          },
        }),
      );
    }
    return this.categorieCache$;
  }

  obtenirCategorieParId(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${API_URL}/categories/${id}`);
  }

  invaliderCaches(): void {
    this.auteurCache$ = null;
    this.categorieCache$ = null;
  }
}
