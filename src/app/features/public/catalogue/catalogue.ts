import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LivreService, Auth } from '../../../core';
import { AdherentService } from '../../../core/services/adherent';
import { Livre, Langue, estDisponible, estReserve, estEmprunte } from '../../../core/models';

@Component({
  selector: 'app-catalogue',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.css',
})
export class Catalogue implements OnInit {
  private readonly livreService = inject(LivreService);
  private readonly authService = inject(Auth);
  private readonly adherentService = inject(AdherentService);

  // IDs des livres réservés par l'adhérent connecté
  private mesLivresReservesIds = computed(() => {
    return new Set(this.adherentService.reservations().map(r => r.livre?.idLivre).filter(Boolean));
  });

  // Signals pour les filtres
  searchTerm = signal('');
  selectedAuteur = signal<number | null>(null);
  selectedCategory = signal<number | null>(null);
  selectedLanguage = signal<string>(''); // Changé de Langue | null à string
  dateMin = signal<string>('');
  dateMax = signal<string>('');
  isFiltersOpen = signal(false); // État du panneau de filtres

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
    { code: 'English', label: 'Anglais' },
  ];

  // Fonctions pour vérifier la disponibilité
  estDisponible = estDisponible;
  estReserve = estReserve;
  estEmprunte = estEmprunte;

  /** Vérifie si le livre est réservé par l'adhérent connecté */
  estMaReservation(livre: Livre): boolean {
    return this.mesLivresReservesIds().has(livre.idLivre);
  }

  private readonly PAGE_SIZE = 20;

  constructor() {
    // Réinitialiser les filtres du service pour repartir proprement
    this.livreService.reinitialiserFiltres();
    this.livreService.chargerLivres(1, this.PAGE_SIZE).subscribe();
  }

  ngOnInit(): void {
    // Charger les réservations de l'adhérent connecté pour les comparer
    if (this.authService.estAdherent()) {
      this.adherentService.obtenirReservations().subscribe();
    }
  }

  /**
   * Lance la recherche avec les filtres actuels
   */
  lancerRecherche(): void {
    this.livreService.appliquerFiltres(
      this.searchTerm() || undefined,
      this.selectedAuteur() || undefined,
      this.selectedCategory() || undefined,
      this.selectedLanguage() || undefined,
      this.dateMin() || undefined,
      this.dateMax() || undefined,
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
    this.dateMin.set('');
    this.dateMax.set('');
    this.livreService.reinitialiserFiltres();
    this.livreService.chargerLivres(1, this.PAGE_SIZE).subscribe();
  }

  /**
   * Alterne l'affichage des filtres
   */
  toggleFilters(): void {
    this.isFiltersOpen.update((v) => !v);
  }

  /**
   * Va à une page spécifique
   */
  allerPage(page: number): void {
    this.livreService.chargerLivres(page, this.PAGE_SIZE).subscribe();
  }
}
