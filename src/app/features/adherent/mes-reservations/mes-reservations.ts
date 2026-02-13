import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../../core';

@Component({
  selector: 'app-mes-reservations',
  imports: [CommonModule],
  templateUrl: './mes-reservations.html',
})
export class MesReservations {
  private readonly reservationService = inject(ReservationService);

  reservations = this.reservationService.reservationsActives;
  nombreReservationsActives = this.reservationService.nombreReservationsActives;
  peutReserver = this.reservationService.peutReserver;

  annulerReservation(reservationId: number): void {
    this.reservationService.annulerReservation(reservationId);
  }
}

