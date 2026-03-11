import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Adherent, Emprunt, Reservation, StatutEmprunt, StatutReservation } from '../models';

const API_URL = 'https://localhost:8008/api/adherent';

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

@Injectable({
  providedIn: 'root'
})
export class AdherentService {
  private readonly http = inject(HttpClient);

  private readonly profilSignal = signal<ProfilAdherent | null>(null);
  private readonly empruntsSignal = signal<Emprunt[]>([]);
  private readonly reservationsSignal = signal<Reservation[]>([]);
  private readonly loadingEmpruntsSignal = signal(false);
  private readonly loadingReservationsSignal = signal(false);
  private readonly erreurEmpruntsSignal = signal<string | null>(null);
  private readonly erreurReservationsSignal = signal<string | null>(null);

  readonly profil = computed(() => this.profilSignal());
  readonly emprunts = computed(() => this.empruntsSignal());
  readonly empruntsEnCours = computed(() =>
    this.empruntsSignal().filter(e => e.statut === StatutEmprunt.EN_COURS || e.statut === StatutEmprunt.EN_RETARD)
  );
  readonly reservations = computed(() => this.reservationsSignal());
  readonly chargement = computed(() => this.loadingEmpruntsSignal() || this.loadingReservationsSignal());
  readonly erreur = computed(() => this.erreurEmpruntsSignal() || this.erreurReservationsSignal());
  readonly erreurEmprunts = computed(() => this.erreurEmpruntsSignal());
  readonly erreurReservations = computed(() => this.erreurReservationsSignal());

  /**
   * Récupère le profil de l'adhérent connecté
   */
  obtenirProfil(): Observable<ProfilAdherent> {
    this.loadingEmpruntsSignal.set(true);

    return this.http.get<ProfilAdherent>(`${API_URL}/profil`).pipe(
      tap({
        next: (profil) => {
          this.profilSignal.set(profil);
          this.loadingEmpruntsSignal.set(false);
        },
        error: (err) => {
          this.loadingEmpruntsSignal.set(false);
        }
      })
    );
  }

  obtenirEmprunts(): Observable<any> {
    this.loadingEmpruntsSignal.set(true);
    this.erreurEmpruntsSignal.set(null);

    return this.http.get<any>(`${API_URL}/emprunts`).pipe(
      tap({
        next: (reponse) => {
          const emprunts = (reponse.emprunts || []).map((e: any) => this.mapperEmprunt(e));
          this.empruntsSignal.set(emprunts);
          this.loadingEmpruntsSignal.set(false);
        },
        error: (err) => {
          const detail = this.extraireErreur(err);
          this.erreurEmpruntsSignal.set(`Erreur emprunts: ${detail}`);
          this.loadingEmpruntsSignal.set(false);
        }
      })
    );
  }

  obtenirReservations(): Observable<any> {
    this.loadingReservationsSignal.set(true);
    this.erreurReservationsSignal.set(null);

    return this.http.get<any>(`${API_URL}/reservations`).pipe(
      tap({
        next: (reponse) => {
          const reservations = (reponse.reservations || []).map((r: any) => this.mapperReservation(r));
          this.reservationsSignal.set(reservations);
          this.loadingReservationsSignal.set(false);
        },
        error: (err) => {
          const detail = this.extraireErreur(err);
          this.erreurReservationsSignal.set(`Erreur réservations: ${detail}`);
          this.loadingReservationsSignal.set(false);
        }
      })
    );
  }

  creerReservation(livreId: number): Observable<any> {
    return this.http.post<any>(`${API_URL}/reservations`, { livreId }).pipe(
      tap({
        next: () => {
          this.obtenirReservations().subscribe();
        },
        error: (err) => {}
      })
    );
  }

  annulerReservation(reservationId: number): Observable<any> {
    return this.http.delete<any>(`${API_URL}/reservations/${reservationId}`).pipe(
      tap({
        next: () => {
          this.obtenirReservations().subscribe();
        },
        error: (err) => {}
      })
    );
  }

  private mapperEmprunt(e: any): Emprunt {
    return {
      idEmprunt: e.id ?? e.idEmprunt ?? e.idEmp,
      idEmp: e.id ?? e.idEmp ?? e.idEmprunt,
      dateEmprunt: e.dateEmprunt,
      dateLimiteRetour: e.dateRetour ?? e.dateLimiteRetour,
      dateRetour: e.dateRetour ?? e.dateLimiteRetour,
      dateRetourReel: e.dateRetourReel ?? e.dateRetourEffective ?? null,
      dateRetourEffective: e.dateRetourReel ?? e.dateRetourEffective ?? null,
      statut: this.normaliserStatutEmprunt(e.statut) ?? this.calculerStatutEmprunt(e),
      livre: this.mapperLivreSimple(e.livre),
      adherent: e.adherent ?? ({} as any),
    };
  }

  private mapperReservation(r: any): Reservation {
    return {
      idReservation: r.id ?? r.idReservation ?? r.idResa,
      idResa: r.id ?? r.idResa ?? r.idReservation,
      dateCreation: r.dateReservation ?? r.dateResa ?? r.dateCreation,
      dateResa: r.dateReservation ?? r.dateResa ?? r.dateCreation,
      dateExpiration: r.dateExpiration ?? '',
      statut: r.statut ?? StatutReservation.ACTIVE,
      livre: this.mapperLivreSimple(r.livre),
      adherent: r.adherent ?? ({} as any),
    };
  }

  private mapperLivreSimple(livre: any): any {
    if (!livre) return { idLivre: 0, titre: 'Inconnu', auteurs: [], categories: [] };
    return {
      ...livre,
      idLivre: livre.id ?? livre.idLivre,
      auteurs: livre.auteurs ?? [],
      categories: livre.categories ?? [],
    };
  }

  private calculerStatutEmprunt(e: any): StatutEmprunt {
    if (e.dateRetourReel || e.dateRetourEffective) return StatutEmprunt.RETOURNE;
    const dateLimite = e.dateLimiteRetour ?? e.dateRetour;
    if (dateLimite && new Date(dateLimite) < new Date()) return StatutEmprunt.EN_RETARD;
    return StatutEmprunt.EN_COURS;
  }

  private normaliserStatutEmprunt(statut: string | undefined): StatutEmprunt | null {
    if (!statut) return null;
    const s = statut.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s.includes('retourne')) return StatutEmprunt.RETOURNE;
    if (s.includes('retard')) return StatutEmprunt.EN_RETARD;
    if (s.includes('cours')) return StatutEmprunt.EN_COURS;
    if (Object.values(StatutEmprunt).includes(statut as StatutEmprunt)) return statut as StatutEmprunt;
    return null;
  }

  private extraireErreur(err: any): string {
    if (err?.status === 0) return 'Serveur inaccessible (https://localhost:8008)';
    const serverMsg = err?.error?.error || err?.error?.message || err?.error?.detail;
    if (serverMsg) return `[${err.status}] ${serverMsg}`;
    return `HTTP ${err?.status} — ${err?.statusText || 'Erreur inconnue'}`;
  }
}
