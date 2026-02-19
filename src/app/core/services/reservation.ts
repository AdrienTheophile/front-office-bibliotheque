import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reservation, StatutReservation } from '../models';
import { Auth } from './auth';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const API_URL = 'http://localhost:8000/api';
const MAX_RESERVATIONS_PAR_ADHERENT = 3;

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(Auth);

  // Signaux de données
  private readonly mesReservationsSignal = signal<Reservation[]>([]);
  private readonly chargementSignal = signal(false);
  private readonly erreurSignal = signal<string | null>(null);

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

  readonly chargement = computed(() => this.chargementSignal());
  readonly erreur = computed(() => this.erreurSignal());

  /**
   * Charge les réservations de l'adhérent courant
   */
  chargerMesReservations(): Observable<Reservation[]> {
    this.chargementSignal.set(true);
    this.erreurSignal.set(null);

    const adherent = this.authService.obtenirAdherent();
    if (!adherent) {
      this.erreurSignal.set('Utilisateur non authentifié');
      this.chargementSignal.set(false);
      return new Observable((observer) => observer.error('Non authentifié'));
    }

    return this.http.get<Reservation[]>(`${API_URL}/adherents/${adherent.id}/reservations`).pipe(
      tap({
        next: (reservations) => {
          this.mesReservationsSignal.set(reservations);
          this.chargementSignal.set(false);
        },
        error: (erreur) => {
          this.erreurSignal.set('Erreur lors du chargement des réservations');
          this.chargementSignal.set(false);
          console.error('Erreur chargerMesReservations:', erreur);
        }
      })
    );
  }

  /**
   * Crée une réservation
   * Règles métier validées:
   * - Maximum 3 réservations simultanées
   * - Pas de double réservation du même livre
   * - Pas de réservation si le livre est emprunté
   */
  creerReservation(livreId: number): Observable<Reservation> {
    const adherent = this.authService.obtenirAdherent();
    if (!adherent) {
      return new Observable((observer) => observer.error('Non authentifié'));
    }

    // Vérification: MAX 3 réservations
    if (!this.peutReserver()) {
      return new Observable((observer) => observer.error('Limite de réservations atteinte (3 max)'));
    }

    // Vérification: pas de double réservation
    const dejaReservé = this.mesReservationsSignal().some(
      (r) => r.livre.idLivre === livreId && r.statut === StatutReservation.ACTIVE
    );
    if (dejaReservé) {
      return new Observable((observer) => observer.error('Vous avez déjà réservé ce livre'));
    }

    return this.http.post<Reservation>(`${API_URL}/adherents/${adherent.id}/reservations`, { livreId }).pipe(
      tap({
        next: (reservation) => {
          this.mesReservationsSignal.update((courant) => [...courant, reservation]);
        },
        error: (erreur) => {
          this.erreurSignal.set('Erreur lors de la création de la réservation');
          console.error('Erreur creerReservation:', erreur);
        }
      })
    );
  }

  /**
   * Annule une réservation
   */
  annulerReservation(reservationId: number): Observable<void> {
    const adherent = this.authService.obtenirAdherent();
    if (!adherent) {
      return new Observable((observer) => observer.error('Non authentifié'));
    }

    return this.http.delete<void>(`${API_URL}/adherents/${adherent.id}/reservations/${reservationId}`).pipe(
      tap({
        next: () => {
          this.mesReservationsSignal.update((courant) =>
            courant.map((r) =>
              r.idReservation === reservationId ? { ...r, statut: StatutReservation.ANNULEE } : r
            )
          );
        },
        error: (erreur) => {
          this.erreurSignal.set('Erreur lors de l\'annulation de la réservation');
          console.error('Erreur annulerReservation:', erreur);
        }
      })
    );
  }

  /**
   * Vérifie si un livre peut être réservé
   */
  peutReserverLivre(livreId: number): boolean {
    // Vérification 1: peut-on faire une nouvelle réservation ?
    if (!this.peutReserver()) return false;

    // Vérification 2: pas de double réservation
    const dejaReservé = this.mesReservationsSignal().some(
      (r) => r.livre.idLivre === livreId && r.statut === StatutReservation.ACTIVE
    );
    if (dejaReservé) return false;

    return true;
  }

  /**
   * Récupère toutes les réservations (pour les administrateurs)
   */
  obtenirToutesLesReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${API_URL}/reservations`);
  }

  /**
   * Récupère les réservations d'un livre spécifique
   */
  obtenirReservationsDuLivre(livreId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${API_URL}/livres/${livreId}/reservations`);
  }
}
