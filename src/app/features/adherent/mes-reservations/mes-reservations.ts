import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core';
import { AdherentService } from '../../../core/services/adherent';
import { Reservation } from '../../../core/models';

@Component({
  selector: 'app-mes-reservations',
  imports: [CommonModule],
  templateUrl: './mes-reservations.html',
})
export class MesReservations implements OnInit {
  private readonly adherentService = inject(AdherentService);
  private readonly authService = inject(Auth);

  private readonly JOURS_EXPIRATION = 7;

  chargement = this.adherentService.chargement;
  erreur = this.adherentService.erreur;
  nonAdherent = signal(false);

  // Computed: filtrer les réservations expirées (> 7 jours) et celles dont le livre est emprunté
  reservations = computed(() => {
    const toutes = this.adherentService.reservations();
    const maintenant = new Date();
    return toutes.filter((r: Reservation) => {
      // Filtrer les réservations de plus de 7 jours
      const dateResa = new Date(r.dateResa || r.dateCreation);
      const diffMs = maintenant.getTime() - dateResa.getTime();
      const diffJours = diffMs / (1000 * 60 * 60 * 24);
      if (diffJours > this.JOURS_EXPIRATION) return false;

      return true;
    });
  });

  // Computed: nombre de réservations actives (après filtrage)
  nombreReservations = computed(() => this.reservations().length);

  // Computed: peut-on ajouter une réservation (max 3)
  peutReserver = computed(() => this.nombreReservations() < 3);

  ngOnInit(): void {
    if (!this.authService.estAdherent()) {
      this.nonAdherent.set(true);
      return;
    }
    this.adherentService.obtenirReservations().subscribe();
  }

  annulerReservation(reservationId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this.adherentService.annulerReservation(reservationId).subscribe();
    }
  }
}

