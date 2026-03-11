import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LivreService, Auth } from '../../../core';
import { AdherentService } from '../../../core/services/adherent';
import { Livre, estDisponible, estReserve, estEmprunte } from '../../../core/models';

@Component({
  selector: 'app-detail-livre',
  imports: [CommonModule, RouterLink],
  templateUrl: './detail-livre.html',
  styleUrl: './detail-livre.css',
})
export class DetailLivre implements OnInit {
  private readonly livreService = inject(LivreService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(Auth);
  private readonly adherentService = inject(AdherentService);

  livre = signal<Livre | null>(null);
  chargement = signal(false);
  erreur = signal<string | null>(null);
  estDisponible = estDisponible;
  estReserve = estReserve;
  estEmprunte = estEmprunte;
  estConnecte = this.authService.estAuthentifie;
  estAdherent = this.authService.estAdherent;
  estBiblioOuAdmin = computed(() => {
    const user = this.authService.adherentActuel();
    if (!user) return false;
    return user.roles?.some((r: string) => r === 'ROLE_BIBLIO' || r === 'ROLE_ADMIN') ?? false;
  });

  /** Vérifie si c'est ma propre réservation */
  estMaReservation = computed(() => {
    const l = this.livre();
    if (!l || !estReserve(l)) return false;
    return this.adherentService.reservations().some(r => r.livre?.idLivre === l.idLivre);
  });

  reservationEnCours = signal(false);
  messageReservation = signal<{ type: 'success' | 'error'; texte: string } | null>(null);

  ngOnInit(): void {
    // Charger les réservations de l'adhérent pour détecter ses propres réservations
    if (this.authService.estAdherent()) {
      this.adherentService.obtenirReservations().subscribe();
    }

    this.route.params.subscribe((params) => {
      const id = +params['id'];
      if (id) {
        this.chargement.set(true);
        this.erreur.set(null);
        this.livreService.obtenirLivreParId(id).subscribe({
          next: (livre) => {
            this.livre.set(livre);
            this.chargement.set(false);
          },
          error: (err) => {
            console.error('Erreur lors du chargement du livre:', err);
            this.erreur.set('Impossible de charger le livre');
            this.chargement.set(false);
          },
        });
      }
    });
  }

  reserverLivre(): void {
    const l = this.livre();
    if (!l) return;

    // Vérifier si le compte est suspendu
    if (this.authService.adherentActuel()?.adherent?.estActif === false) {
      this.messageReservation.set({
        type: 'error',
        texte: 'Votre compte adhérent est suspendu. Vous ne pouvez pas effectuer de réservation.'
      });
      return;
    }

    // Vérifier d'abord le quota de réservations (max 3)
    this.reservationEnCours.set(true);
    this.messageReservation.set(null);

    // Charger les réservations actuelles pour vérifier le quota
    this.adherentService.obtenirReservations().subscribe({
      next: () => {
        const nbReservations = this.adherentService.reservations().length;
        if (nbReservations >= 3) {
          this.messageReservation.set({
            type: 'error',
            texte: 'Vous avez atteint la limite de 3 réservations. Veuillez annuler une réservation existante avant d\'en créer une nouvelle.'
          });
          this.reservationEnCours.set(false);
          return;
        }

        // Vérifier si le livre est disponible
        if (!estDisponible(l)) {
          this.messageReservation.set({
            type: 'error',
            texte: 'Ce livre est actuellement emprunté et ne peut pas être réservé.'
          });
          this.reservationEnCours.set(false);
          return;
        }

        this.adherentService.creerReservation(l.idLivre).subscribe({
          next: (response) => {
            const texte = response?.message || 'Livre réservé avec succès ! Vous pouvez consulter vos réservations dans votre tableau de bord.';
            this.messageReservation.set({ type: 'success', texte });
            this.reservationEnCours.set(false);
          },
          error: (err) => {
            const msg = err?.error?.error || err?.error?.message || err?.message || 'Erreur lors de la réservation';
            this.messageReservation.set({ type: 'error', texte: msg });
            this.reservationEnCours.set(false);
          }
        });
      },
      error: () => {
        // En cas d'erreur de chargement des réservations, tenter quand même
        this.adherentService.creerReservation(l.idLivre).subscribe({
          next: (response) => {
            const texte = response?.message || 'Livre réservé avec succès !';
            this.messageReservation.set({ type: 'success', texte });
            this.reservationEnCours.set(false);
          },
          error: (err) => {
            const msg = err?.error?.error || err?.error?.message || err?.message || 'Erreur lors de la réservation';
            this.messageReservation.set({ type: 'error', texte: msg });
            this.reservationEnCours.set(false);
          }
        });
      }
    });
  }
}
