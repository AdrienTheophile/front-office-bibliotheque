import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Emprunt, StatutEmprunt } from '../models';
import { Auth } from './auth';

const API_URL = 'http://localhost:8000/api';
const DUREE_EMPRUNT_JOURS = 15;

@Injectable({
  providedIn: 'root'
})
export class EmpruntService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(Auth);

  // Signal pour les emprunts de l'adhérent courant
  private readonly mesEmpruntsSignal = signal<Emprunt[]>([]);

  // Computed: emprunts actifs
  readonly empruntsActifs = computed(() =>
    this.mesEmpruntsSignal().filter((e) => e.statut === StatutEmprunt.EN_COURS || e.statut === StatutEmprunt.EN_RETARD)
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

  /**
   * Charge les emprunts de l'adhérent courant
   */
  chargerMesEmprunts() {
    const adherent = this.authService.adherentActuel();
    if (!adherent) return;

    this.http.get<Emprunt[]>(`${API_URL}/adherents/${adherent.id}/emprunts`).subscribe({
      next: (emprunts) => this.mesEmpruntsSignal.set(emprunts),
      error: (erreur) => console.error('Erreur lors du chargement des emprunts:', erreur)
    });
  }

  /**
   * Récupère les emprunts actifs pour un livre
   * (utilisé pour empêcher les réservations sur les livres empruntés)
   */
  obtenirEmpruntsActifsDuLivre(livreId: number) {
    return this.http.get<Emprunt[]>(`${API_URL}/livres/${livreId}/emprunts-actifs`);
  }

  /**
   * Récupère tous les emprunts (pour les bibliothécaires/responsables)
   */
  obtenirTousLesEmprunts() {
    return this.http.get<Emprunt[]>(`${API_URL}/emprunts`);
  }

  /**
   * Récupère tous les emprunts en retard (pour les bibliothécaires/responsables)
   */
  obtenirEmpruntsEnRetard() {
    return this.http.get<Emprunt[]>(`${API_URL}/emprunts/en-retard`);
  }

  /**
   * Obtient les emprunts actifs (pour les bibliothecaires)
   */
  obtenirEmpruntsActifs() {
    return this.http.get<Emprunt[]>(`${API_URL}/emprunts/actifs`);
  }

  /**
   * Retourne un emprunt
   */
  retournerEmprunt(empruntId: number) {
    const adherent = this.authService.adherentActuel();
    if (!adherent) return;

    const dateRetour = new Date();
    this.http.put(`${API_URL}/emprunts/${empruntId}/retourner`, { dateRetour }).subscribe({
      next: (empruntMisAJour: any) => {
        this.mesEmpruntsSignal.update((courant) =>
          courant.map((e) => (e.id === empruntId ? empruntMisAJour : e))
        );
      },
      error: (erreur) => console.error('Erreur lors du retour de l\'emprunt:', erreur)
    });
  }

  /**
   * Vérifie si un livre peut être emprunté
   * (ne pas emprunter si déjà emprunté par l'adhérent)
   */
  peutEmprinterLivre(livreId: number): boolean {
    return !this.mesEmpruntsSignal().some(
      (e) =>
        e.livre.id === livreId &&
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
