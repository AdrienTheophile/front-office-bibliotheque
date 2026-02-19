import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Livre, PaginatedResponse, RechercheLivreParams, Langue, Categorie, Auteur } from '../models';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

// Configuration de l'API
const API_URL = 'http://localhost:8000/api';

@Injectable({
  providedIn: 'root'
})
export class LivreService {
  private readonly http = inject(HttpClient);

  // ===== SIGNAUX DE DONNÉES =====
  private readonly livresSignal = signal<Livre[]>([]);
  private readonly livrSelectionneSignal = signal<Livre | null>(null);
  private readonly paginationSignal = signal({ page: 1, limit: 10, total: 0, pages: 0 });
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Caches pour auteurs et catégories
  private auteurCache$: Observable<Auteur[]> | null = null;
  private categorieCache$: Observable<Categorie[]> | null = null;

  // ===== SIGNAUX DE FILTRAGE =====
  private readonly filtreLangueSignal = signal<Langue | null>(null);
  private readonly filtreCategoriIdSignal = signal<number | null>(null);
  private readonly rechercheTitreSignal = signal<string>('');
  private readonly filtreAuteurIdSignal = signal<number | null>(null);

  // ===== COMPUTED SIGNALS =====
  readonly livresFiltres = computed(() => this.livresSignal());
  readonly livrSelectionne = computed(() => this.livrSelectionneSignal());
  readonly pagination = computed(() => this.paginationSignal());
  readonly chargement = computed(() => this.loadingSignal());
  readonly erreur = computed(() => this.errorSignal());

  /**
   * Récupère les livres avec pagination
   */
  chargerLivres(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Livre>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Livre>>(`${API_URL}/livres`, { params }).pipe(
      tap({
        next: (reponse) => {
          this.livresSignal.set(reponse.items);
          this.paginationSignal.set({
            page: reponse.page,
            limit: reponse.limit,
            total: reponse.total,
            pages: reponse.pages
          });
          this.loadingSignal.set(false);
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors du chargement des livres');
          this.loadingSignal.set(false);
          console.error('Erreur chargerLivres:', erreur);
        }
      })
    );
  }

  /**
   * Recherche avancée de livres
   */
  rechercherLivres(filtres: RechercheLivreParams): Observable<PaginatedResponse<Livre>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    let params = new HttpParams();

    // Ajout des paramètres de recherche
    if (filtres.titre) params = params.set('titre', filtres.titre);
    if (filtres.auteur) params = params.set('auteur', filtres.auteur.toString());
    if (filtres.categorie) params = params.set('categorie', filtres.categorie.toString());
    if (filtres.langue) params = params.set('langue', filtres.langue);
    if (filtres.dateMin) params = params.set('dateMin', filtres.dateMin);
    if (filtres.dateMax) params = params.set('dateMax', filtres.dateMax);

    // Pagination
    params = params.set('page', (filtres.page || 1).toString());
    params = params.set('limit', (filtres.limit || 10).toString());

    return this.http.get<PaginatedResponse<Livre>>(`${API_URL}/recherche`, { params }).pipe(
      tap({
        next: (reponse) => {
          this.livresSignal.set(reponse.items);
          this.paginationSignal.set({
            page: reponse.page,
            limit: reponse.limit,
            total: reponse.total,
            pages: reponse.pages
          });
          this.loadingSignal.set(false);
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors de la recherche');
          this.loadingSignal.set(false);
          console.error('Erreur rechercherLivres:', erreur);
        }
      })
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
          console.error('Erreur obtenirLivreParId:', erreur);
        }
      })
    );
  }

  /**
   * Sélectionne un livre
   */
  selectionnerLivre(livre: Livre | null): void {
    this.livrSelectionneSignal.set(livre);
  }

  // ===== GESTION DES FILTRES =====

  /**
   * Met à jour les filtres et déclenche une nouvelle recherche
   */
  appliquerFiltres(title?: string, auteurId?: number, categorieId?: number, langue?: Langue): void {
    if (title !== undefined) this.rechercheTitreSignal.set(title);
    if (auteurId !== undefined) this.filtreAuteurIdSignal.set(auteurId);
    if (categorieId !== undefined) this.filtreCategoriIdSignal.set(categorieId);
    if (langue !== undefined) this.filtreLangueSignal.set(langue);

    // Déclenche la recherche avec les filtres actuels
    this.executerRechercheAvecFiltres();
  }

  /**
   * Exécute la recherche à partir des filtres actuels
   */
  private executerRechercheAvecFiltres(): void {
    const filtres: RechercheLivreParams = {
      page: this.paginationSignal().page,
      limit: this.paginationSignal().limit
    };

    if (this.rechercheTitreSignal()) filtres.titre = this.rechercheTitreSignal();
    if (this.filtreAuteurIdSignal()) filtres.auteur = this.filtreAuteurIdSignal()!;
    if (this.filtreCategoriIdSignal()) filtres.categorie = this.filtreCategoriIdSignal()!;
    if (this.filtreLangueSignal()) filtres.langue = this.filtreLangueSignal() ?? undefined;

    // Si au moins un filtre est actif, utiliser la recherche avancée
    if (
      filtres.titre ||
      filtres.auteur ||
      filtres.categorie ||
      filtres.langue
    ) {
      this.rechercherLivres(filtres).subscribe();
    } else {
      // Sinon, charger tous les livres
      this.chargerLivres(filtres.page || 1, filtres.limit || 10).subscribe();
    }
  }

  /**
   * Réinitialise tous les filtres
   */
  reinitialiserFiltres(): void {
    this.rechercheTitreSignal.set('');
    this.filtreAuteurIdSignal.set(null);
    this.filtreCategoriIdSignal.set(null);
    this.filtreLangueSignal.set(null);
    this.paginationSignal.set({ page: 1, limit: 10, total: 0, pages: 0 });
    this.chargerLivres(1, 10).subscribe();
  }

  /**
   * Récupère les filtres actuels
   */
  obtenirFiltres() {
    return {
      titre: this.rechercheTitreSignal(),
      auteur: this.filtreAuteurIdSignal(),
      categorie: this.filtreCategoriIdSignal(),
      langue: this.filtreLangueSignal()
    };
  }

  /**
   * Récupère tous les auteurs (avec cache)
   */
  obtenirAuteurs(): Observable<Auteur[]> {
    if (!this.auteurCache$) {
      this.auteurCache$ = this.http.get<Auteur[]>(`${API_URL}/auteurs`).pipe(
        shareReplay(1),
        tap({
          error: (erreur) => {
            console.error('Erreur obtenirAuteurs:', erreur);
            this.auteurCache$ = null; // Réinitialise le cache en cas d'erreur
          }
        })
      );
    }
    return this.auteurCache$;
  }

  /**
   * Récupère un auteur par ID
   */
  obtenirAuteurParId(id: number): Observable<Auteur> {
    return this.http.get<Auteur>(`${API_URL}/auteurs/${id}`);
  }

  /**
   * Récupère toutes les catégories (avec cache)
   */
  obtenirCategories(): Observable<Categorie[]> {
    if (!this.categorieCache$) {
      this.categorieCache$ = this.http.get<Categorie[]>(`${API_URL}/categories`).pipe(
        shareReplay(1),
        tap({
          error: (erreur) => {
            console.error('Erreur obtenirCategories:', erreur);
            this.categorieCache$ = null; // Réinitialise le cache en cas d'erreur
          }
        })
      );
    }
    return this.categorieCache$;
  }

  /**
   * Récupère une catégorie par ID
   */
  obtenirCategorieParId(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${API_URL}/categories/${id}`);
  }

  /**
   * Invalide les caches (utile après une mise à jour)
   */
  invaliderCaches(): void {
    this.auteurCache$ = null;
    this.categorieCache$ = null;
  }
}
