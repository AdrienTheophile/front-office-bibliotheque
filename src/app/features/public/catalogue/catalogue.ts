import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LivreService } from '../../../core/services/book';
import { Livre, Langue } from '../../../core/models';

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
  selectedCategory = signal<number | null>(null);
  selectedLanguage = signal<Langue | null>(null);

  // Accès aux données du service
  livresFiltres = this.livreService.livresFiltres;
  pagination = this.livreService.pagination;
  chargement = this.livreService.chargement;
  erreur = this.livreService.erreur;
  
  // Convertir les Observables en Signals
  categories = toSignal(this.livreService.obtenirCategories());
  auteurs = toSignal(this.livreService.obtenirAuteurs());

  languages = [
    { code: 'FR', label: 'Français' },
    { code: 'EN', label: 'Anglais' }
  ];

  constructor() {
    // Charger les livres au démarrage
    this.livreService.chargerLivres(1, 10).subscribe();

    // Effect pour appliquer les filtres
    effect(() => {
      this.appliquerFiltre();
    });
  }

  /**
   * Applique les filtres courants
   */
  appliquerFiltre(): void {
    this.livreService.appliquerFiltres(
      this.searchTerm() || undefined,
      this.selectedCategory() || undefined,
      this.selectedCategory() || undefined,
      this.selectedLanguage() || undefined
    );
  }

  /**
   * Réinitialise tous les filtres
   */
  reinitialiserFiltres(): void {
    this.searchTerm.set('');
    this.selectedCategory.set(null);
    this.selectedLanguage.set(null);
    this.livreService.reinitialiserFiltres();
  }

  /**
   * Va à une page spécifique
   */
  allerPage(page: number): void {
    this.livreService.chargerLivres(page, 10).subscribe();
  }
}
