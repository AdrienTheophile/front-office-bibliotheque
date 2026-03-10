import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core';
import { AdherentService } from '../../../core/services/adherent';

@Component({
  selector: 'app-mes-reservations',
  imports: [CommonModule],
  templateUrl: './mes-reservations.html',
})
export class MesReservations implements OnInit {
  private readonly adherentService = inject(AdherentService);
  private readonly authService = inject(Auth);

  reservations = this.adherentService.reservations;
  chargement = this.adherentService.chargement;
  erreur = this.adherentService.erreur;
  nonAdherent = signal(false);

  // Computed: nombre de réservations
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

