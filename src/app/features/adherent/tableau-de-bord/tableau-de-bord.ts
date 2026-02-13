import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth, EmpruntService, ReservationService } from '../../../core';

@Component({
  selector: 'app-tableau-de-bord',
  imports: [CommonModule, RouterLink],
  templateUrl: './tableau-de-bord.html',
})
export class TableauDeBord {
  private readonly authService = inject(Auth);
  private readonly empruntService = inject(EmpruntService);
  private readonly reservationService = inject(ReservationService);

  adherent = this.authService.adherentActuel;
  empruntsActifs = this.empruntService.empruntsActifs;
  empruntsEnRetard = this.empruntService.empruntsEnRetard;
  reservations = this.reservationService.reservationsActives;
}

