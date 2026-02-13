import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Livre, Categorielivre, Langue } from '../models';

const API_URL = 'http://localhost:8000/api';

@Injectable({
  providedIn: 'root'
})
export class LivreService {
  private readonly http = inject(HttpClient);

  // Signal pour la liste des livres
  private readonly livresSignal = signal<Livre[]>([]);

  // Signal pour le livre actuellement sélectionné
  private readonly livrSelectionneSignal = signal<Livre | null>(null);

  // Signal pour le filtre de catégorie
  private readonly filtreCategoriSignal = signal<Categorielivre | null>(null);

  // Signal pour le filtre de langue
  private readonly filtreLangueSignal = signal<Langue | null>(null);

  // Signal pour la recherche textuelle
  private readonly recherchSignal = signal<string>('');

  // Computed: livres filtrés selon les critères
  readonly livresFiltres = computed(() => {
    const livres = this.livresSignal();
    const categorie = this.filtreCategoriSignal();
    const langue = this.filtreLangueSignal();
    const recherche = this.recherchSignal().toLowerCase();

    return livres.filter((livre) => {
      const correspondCategorie = !categorie || livre.categorie === categorie;
      const correspondLangue = !langue || livre.langue === langue;
      const correspondRecherche =
        !recherche ||
        livre.titre.toLowerCase().includes(recherche) ||
        livre.auteur.nom.toLowerCase().includes(recherche);

      return correspondCategorie && correspondLangue && correspondRecherche;
    });
  });

  // Computed: nombre de livres filtrés
  readonly nombreLivresFiltres = computed(() => this.livresFiltres().length);

  /**
   * Récupère tous les livres
   */
  chargerLivres() {
    this.http.get<Livre[]>(`${API_URL}/livres`).subscribe({
      next: (livres) => this.livresSignal.set(livres),
      error: (erreur) => console.error('Erreur lors du chargement des livres:', erreur)
    });
  }

  /**
   * Récupère un livre par ID
   */
  obtenirLivreParId(id: number) {
    return this.http.get<Livre>(`${API_URL}/livres/${id}`);
  }

  /**
   * Sélectionne un livre
   */
  selectionnerLivre(id: number): void {
    const livre = this.livresSignal().find((l) => l.id === id) || null;
    this.livrSelectionneSignal.set(livre);
  }

  /**
   * Définit le filtre de catégorie
   */
  definirFiltreCategorie(categorie: Categorielivre | null): void {
    this.filtreCategoriSignal.set(categorie);
  }

  /**
   * Définit le filtre de langue
   */
  definirFiltreLangue(langue: Langue | null): void {
    this.filtreLangueSignal.set(langue);
  }

  /**
   * Définit la recherche textuelle
   */
  definirRecherche(recherche: string): void {
    this.recherchSignal.set(recherche);
  }

  /**
   * Récupère tous les filtres actuels
   */
  obtenirFiltres() {
    return {
      categorie: this.filtreCategoriSignal(),
      langue: this.filtreLangueSignal(),
      recherche: this.recherchSignal()
    };
  }

  /**
   * Réinitialise tous les filtres
   */
  reinitialiserFiltres(): void {
    this.filtreCategoriSignal.set(null);
    this.filtreLangueSignal.set(null);
    this.recherchSignal.set('');
  }
}
