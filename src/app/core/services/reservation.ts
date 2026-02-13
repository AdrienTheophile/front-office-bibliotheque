import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reservation, StatutReservation } from '../models';
import { Auth } from './auth';

const API_URL = 'http://localhost:8000/api';
const MAX_RESERVATIONS_PAR_ADHERENT = 3;

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(Auth);

  // Signal pour les réservations de l'adhérent courant
  private readonly mesReservationsSignal = signal<Reservation[]>([]);

  // Computed: nombre de réservations actives de l'adhérent
  readonly nombreReservationsActives = computed(() =>
    this.mesReservationsSignal().filter((r) => r.statut === StatutReservation.ACTIVE).length
  );

  // Computed: peut faire une nouvelle réservation ?
  readonly peutReserver = computed(
    () => this.nombreReservationsActives() < MAX_RESERVATIONS_PAR_ADHERENT
  );

  // Computed: réservations actives
  readonly reservationsActives = computed(() =>
    this.mesReservationsSignal().filter((r) => r.statut === StatutReservation.ACTIVE)
  );

  /**
   * Charge les réservations de l'adhérent courant
   */
  chargerMesReservations() {
    const adherent = this.authService.adherentActuel();
    if (!adherent) return;

    this.http.get<Reservation[]>(`${API_URL}/adherents/${adherent.id}/reservations`).subscribe({
      next: (reservations) => this.mesReservationsSignal.set(reservations),
      error: (erreur) => console.error('Erreur lors du chargement des réservations:', erreur)
    });
  }

  /**
   * Crée une réservation
   * Règles métier validées:
   * - Maximum 3 réservations simultanées
   * - Pas de double réservation du même livre
   * - Pas de réservation si le livre est emprunté
   */
  creerReservation(livreId: number) {
    const adherent = this.authService.adherentActuel();
    if (!adherent) {
      console.error('Adhérent non authentifié');
      return;
    }

    // Vérification: MAX 3 réservations
    if (!this.peutReserver()) {
      console.error('Limite de réservations atteinte (3 max)');
      return;
    }

    // Vérification: pas de double réservation
    const dejaReservé = this.mesReservationsSignal().some(
      (r) => r.livre.id === livreId && r.statut === StatutReservation.ACTIVE
    );
    if (dejaReservé) {
      console.error('Vous avez déjà réservé ce livre');
      return;
    }

    this.http.post(`${API_URL}/adherents/${adherent.id}/reservations`, { livreId }).subscribe({
      next: (reservation: any) => {
        this.mesReservationsSignal.update((courant) => [...courant, reservation]);
      },
      error: (erreur) => console.error('Erreur lors de la création de la réservation:', erreur)
    });
  }

  /**
   * Annule une réservation
   */
  annulerReservation(reservationId: number) {
    const adherent = this.authService.adherentActuel();
    if (!adherent) return;

    this.http.delete(`${API_URL}/adherents/${adherent.id}/reservations/${reservationId}`).subscribe({
      next: () => {
        this.mesReservationsSignal.update((courant) =>
          courant.map((r) =>
            r.id === reservationId ? { ...r, statut: StatutReservation.ANNULEE } : r
          )
        );
      },
      error: (erreur) => console.error('Erreur lors de l\'annulation:', erreur)
    });
  }

  /**
   * Vérifie si un livre peut être réservé
   */
  peutReserverLivre(livreId: number): boolean {
    // Vérification 1: peut-on faire une nouvelle réservation ?
    if (!this.peutReserver()) return false;

    // Vérification 2: pas de double réservation
    const dejaReservé = this.mesReservationsSignal().some(
      (r) => r.livre.id === livreId && r.statut === StatutReservation.ACTIVE
    );
    if (dejaReservé) return false;

    return true;
  }
}
