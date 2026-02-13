import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LivreService } from '../../../core';
import { Livre, Categorielivre, Langue } from '../../../core/models';

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
  selectedCategory = signal<Categorielivre | ''>('');
  selectedLanguage = signal<Langue | ''>('');

  // Accès aux données du service
  livresFiltres = this.livreService.livresFiltres;
  categories = Object.values(Categorielivre);
  languages = Object.values(Langue);

  constructor() {
    // Charger les livres au démarrage
    this.livreService.chargerLivres();

    // Effect pour mettre à jour le filtre de recherche
    effect(() => {
      this.livreService.definirRecherche(this.searchTerm());
    });

    // Effect pour mettre à jour le filtre de catégorie
    effect(() => {
      if (this.selectedCategory()) {
        this.livreService.definirFiltreCategorie(this.selectedCategory() as Categorielivre);
      }
    });

    // Effect pour mettre à jour le filtre de langue
    effect(() => {
      if (this.selectedLanguage()) {
        this.livreService.definirFiltreLangue(this.selectedLanguage() as Langue);
      }
    });
  }

  reinitialiserFiltres(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('');
    this.selectedLanguage.set('');
    this.livreService.reinitialiserFiltres();
  }

  selectLivre(livre: Livre): void {
    this.livreService.selectionnerLivre(livre.id);
  }
}
