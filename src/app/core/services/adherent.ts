import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Adherent, Emprunt, Reservation } from '../models';

// Configuration de l'API Symfony
const API_URL = 'http://localhost:8008/api/adherent';

export interface ProfilAdherent {
  id: number;
  dateAdhesion: string;
  dateNaissance: string;
  adressePostale: string;
  telephone: string;
  photo?: string;
  utilisateur: {
    email: string;
    nom: string;
    prenom: string;
  };
}

export interface EmpruntResponse {
  emprunts: Emprunt[];
  total: number;
}

export interface ReservationResponse {
  reservations: Reservation[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdherentService {
  private readonly http = inject(HttpClient);

  // ===== SIGNAUX DE DONNÉES =====
  private readonly profilSignal = signal<ProfilAdherent | null>(null);
  private readonly empruntsSignal = signal<Emprunt[]>([]);
  private readonly reservationsSignal = signal<Reservation[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // ===== COMPUTED SIGNALS =====
  readonly profil = computed(() => this.profilSignal());
  readonly emprunts = computed(() => this.empruntsSignal());
  readonly reservations = computed(() => this.reservationsSignal());
  readonly chargement = computed(() => this.loadingSignal());
  readonly erreur = computed(() => this.errorSignal());

  /**
   * Récupère le profil de l'adhérent connecté
   */
  obtenirProfil(): Observable<ProfilAdherent> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<ProfilAdherent>(`${API_URL}/profil`).pipe(
      tap({
        next: (profil) => {
          this.profilSignal.set(profil);
          this.loadingSignal.set(false);
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors du chargement du profil');
          this.loadingSignal.set(false);
          console.error('Erreur obtenirProfil:', erreur);
        }
      })
    );
  }

  /**
   * Récupère les emprunts de l'adhérent connecté
   */
  obtenirEmprunts(): Observable<EmpruntResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<EmpruntResponse>(`${API_URL}/emprunts`).pipe(
      tap({
        next: (reponse) => {
          this.empruntsSignal.set(reponse.emprunts);
          this.loadingSignal.set(false);
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors du chargement des emprunts');
          this.loadingSignal.set(false);
          console.error('Erreur obtenirEmprunts:', erreur);
        }
      })
    );
  }

  /**
   * Récupère les réservations de l'adhérent connecté
   */
  obtenirReservations(): Observable<ReservationResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<ReservationResponse>(`${API_URL}/reservations`).pipe(
      tap({
        next: (reponse) => {
          this.reservationsSignal.set(reponse.reservations);
          this.loadingSignal.set(false);
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors du chargement des réservations');
          this.loadingSignal.set(false);
          console.error('Erreur obtenirReservations:', erreur);
        }
      })
    );
  }

  /**
   * Crée une nouvelle réservation
   */
  creerReservation(livreId: number): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<any>(`${API_URL}/reservations`, { livreId }).pipe(
      tap({
        next: () => {
          this.loadingSignal.set(false);
          // Rafraîchir la liste des réservations
          this.obtenirReservations().subscribe();
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors de la création de la réservation');
          this.loadingSignal.set(false);
          console.error('Erreur creerReservation:', erreur);
        }
      })
    );
  }

  /**
   * Annule une réservation
   */
  annulerReservation(reservationId: number): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<any>(`${API_URL}/reservations/${reservationId}`).pipe(
      tap({
        next: () => {
          this.loadingSignal.set(false);
          // Rafraîchir la liste des réservations
          this.obtenirReservations().subscribe();
        },
        error: (erreur) => {
          this.errorSignal.set('Erreur lors de l\'annulation de la réservation');
          this.loadingSignal.set(false);
          console.error('Erreur annulerReservation:', erreur);
        }
      })
    );
  }

  /**
   * Invalide les données du profil (utile lors de mise à jour)
   */
  invaliderDonnees(): void {
    this.profilSignal.set(null);
    this.empruntsSignal.set([]);
    this.reservationsSignal.set([]);
  }
}
