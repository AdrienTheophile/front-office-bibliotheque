import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LivreService, Auth } from '../../../core';
import { AdherentService } from '../../../core/services/adherent';
import { Livre, estDisponible } from '../../../core/models';

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
  estConnecte = this.authService.estAuthentifie;
  estAdherent = this.authService.estAdherent;

  reservationEnCours = signal(false);
  messageReservation = signal<{ type: 'success' | 'error'; texte: string } | null>(null);

  ngOnInit(): void {
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

    this.reservationEnCours.set(true);
    this.messageReservation.set(null);

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
  }
}
