import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LivreService } from '../../../core/services/book';
import { Livre, Langue, estDisponible } from '../../../core/models';

@Component({
  selector: 'app-catalogue',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.css',
})
export class Catalogue {
  private readonly livreService = inject(LivreService);

  // Signals pour les filtres
  searchTerm = signal('');
  selectedAuteur = signal<number | null>(null);
  selectedCategory = signal<number | null>(null);
  selectedLanguage = signal<string>(''); // Changé de Langue | null à string

  // Accès aux données du service
  livresFiltres = this.livreService.livresFiltres;
  pagination = this.livreService.pagination;
  chargement = this.livreService.chargement;
  erreur = this.livreService.erreur;
  
  // Convertir les Observables en Signals
  categories = toSignal(this.livreService.obtenirCategories());
  auteurs = toSignal(this.livreService.obtenirAuteurs());

  languages = [
    { code: 'Français', label: 'Français' },
    { code: 'English', label: 'Anglais' }
  ];

  // Fonction pour vérifier la disponibilité
  estDisponible = estDisponible;

  constructor() {
    // Charger les livres au démarrage
    this.livreService.chargerLivres(1, 10).subscribe();
  }

  /**
   * Lance la recherche avec les filtres actuels
   */
  lancerRecherche(): void {
    console.log('🔍 Lancer recherche avec filtres:', {
      searchTerm: this.searchTerm(),
      selectedAuteur: this.selectedAuteur(),
      selectedCategory: this.selectedCategory(),
      selectedLanguage: this.selectedLanguage()
    });
    
    this.livreService.appliquerFiltres(
      this.searchTerm() || undefined,
      this.selectedAuteur() || undefined,
      this.selectedCategory() || undefined,
      this.selectedLanguage() || undefined  // Passe la string directement ('' ou 'FR' ou 'EN')
    );
  }

  /**
   * Réinitialise tous les filtres
   */
  reinitialiserFiltres(): void {
    this.searchTerm.set('');
    this.selectedAuteur.set(null);
    this.selectedCategory.set(null);
    this.selectedLanguage.set('');
    this.livreService.reinitialiserFiltres();
  }

  /**
   * Va à une page spécifique
   */
  allerPage(page: number): void {
    this.livreService.chargerLivres(page, 10).subscribe();
  }
}
